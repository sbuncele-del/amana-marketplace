import {createHash} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {assertAccess, canManage, ExperienceError, operator} from '@/lib/experience/access';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {event, experiencePool, insertRecord, transaction} from '@/lib/experience/store';
import {eftBankDetails} from '@/lib/eft';
import {quoteAction, quoteDate, quoteTeam} from '@/lib/back-office-quote';

const headers = {'Cache-Control': 'private, no-store'};

export async function GET(request: NextRequest) {
  try {
    const actor = await operator();
    const id = request.nextUrl.searchParams.get('paymentFor');
    const row = (await experiencePool().query(
      "SELECT team_id,reference,data FROM experience_records WHERE id=$1 AND kind='ORDER' AND status='CONFIRMED' AND data->>'paymentMethod'='EFT' AND data ? 'quotePricing'",
      [id],
    )).rows[0];
    if (!row) throw new ExperienceError(404, 'Awaiting-payment quote order not found.');
    if (!canManage(actor, row.team_id)) throw new ExperienceError(403, 'A team lead must access the payment instructions.');
    const bank = eftBankDetails();
    if (!bank) throw new ExperienceError(503, 'EFT details are unavailable. Contact Accounts for payment instructions.');
    const amount = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'})
      .format((row.data.subtotalCents + row.data.shippingCents) / 100);
    const instructions = [
      `Plentovo order ${row.reference}`, `Amount: ${amount}`, `Beneficiary reference: ${row.reference}`,
      `Bank: ${bank.bank}`, `Account holder: ${bank.holder}`, `Account type: ${bank.type}`,
      `Account number: ${bank.accountNumber}`, `Branch code: ${bank.branchCode}`,
      'Email proof of payment to accounts@plentovo.com with the order reference.',
    ].join('\n');
    return NextResponse.json({instructions}, {headers});
  } catch (error) {
    if (error instanceof ExperienceError) return NextResponse.json({error: error.message}, {headers, status: error.status});
    return NextResponse.json({error: 'Payment instructions are temporarily unavailable.'}, {headers, status: 503});
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!sameRequestOrigin(request)) throw new ExperienceError(403, 'Submit from Back Office.');
    const actor = await operator();
    const parsed = quoteAction.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new ExperienceError(400, 'Check the customer, line items or quote amounts.');
    const body = parsed.data;
    const result = await transaction(async client => {
      if (body.action === 'create') {
        assertAccess(actor, quoteTeam);
        const key = createHash('sha256').update(`quote:${actor.id}:${body.requestKey}`).digest('hex');
        const hash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
        const prior = (await client.query(
          'SELECT r.id,r.reference,k.request_hash FROM experience_request_keys k JOIN experience_records r ON r.id=k.record_id WHERE k.key=$1',
          [key],
        )).rows[0];
        if (prior) {
          if (prior.request_hash !== hash) throw new ExperienceError(409, 'This enquiry was already saved. Refresh the quote list.');
          return {id: prior.id, reference: prior.reference};
        }
        const record = await insertRecord(client, {
          kind: 'ORDER', status: 'ENQUIRY', teamId: quoteTeam, ownerId: actor.id,
          data: {
            customerName: body.customerName, email: body.email, phone: body.phone, city: body.city,
            items: body.items, deliveryTerms: body.deliveryTerms, enquiryNote: body.note,
            shippingCents: null, country: 'ZA', currency: 'ZAR', source: 'BACK_OFFICE_QUOTE',
          },
        });
        await client.query('INSERT INTO experience_request_keys(key,request_hash,record_id) VALUES($1,$2,$3)', [key, hash, record.id]);
        await event(client, record.id, actor.id, 'ENQUIRY_RECEIVED', 'Enquiry entered in Back Office.');
        return {id: record.id, reference: record.reference};
      }

      const row = (await client.query(
        "SELECT * FROM experience_records WHERE id=$1 AND kind='ORDER' AND coalesce(data->>'country','ZA')='ZA' FOR UPDATE",
        [body.id],
      )).rows[0];
      if (!row) throw new ExperienceError(404, 'Quote not found.');
      if (!canManage(actor, row.team_id)) throw new ExperienceError(403, 'A team lead must price or accept this quote.');
      if (row.version !== body.version) throw new ExperienceError(409, 'This quote changed. Reopen it before saving.');
      const data = {...row.data};
      let status: string;
      let eventNote: string;
      if (body.action === 'price') {
        if (!['ENQUIRY', 'QUOTED'].includes(row.status)) throw new ExperienceError(409, 'This quote is already closed.');
        if (body.expiry < quoteDate()) throw new ExperienceError(400, 'Choose today or a future expiry date.');
        if (!Array.isArray(data.items) || data.items.length !== body.prices.length) throw new ExperienceError(409, 'The quote lines changed. Reopen the quote.');
        let subtotal = 0;
        let supplierCost = 0;
        data.items = data.items.map((item: {quantity: number}, index: number) => {
          const price = body.prices[index];
          subtotal += item.quantity * price.unitPriceCents;
          supplierCost += item.quantity * price.unitCostCents;
          return {...item, unitPriceCents: price.unitPriceCents};
        });
        data.subtotalCents = subtotal;
        data.shippingCents = body.shippingCents;
        data.deliveryTerms = body.deliveryTerms;
        data.quotePricing = {
          supplier: body.supplier, supplierOffer: body.supplierOffer, freightProvider: body.freightProvider,
          freightOffer: body.freightOffer, freightCostCents: body.freightCostCents, expiry: body.expiry,
          unitCosts: body.prices.map(price => price.unitCostCents),
          marginCents: subtotal + body.shippingCents - supplierCost - body.freightCostCents,
        };
        status = 'QUOTED';
        eventNote = 'Quote pricing and delivery terms saved.';
      } else {
        if (row.status !== 'QUOTED' || !data.quotePricing) throw new ExperienceError(409, 'Save the quote pricing before recording acceptance.');
        if (data.quotePricing.expiry < quoteDate()) throw new ExperienceError(409, 'This quote has expired. Update the pricing and expiry first.');
        status = 'CONFIRMED';
        data.paymentMethod = 'EFT';
        eventNote = body.note;
      }
      await client.query(
        'UPDATE experience_records SET status=$2,data=$3,due_at=NULL,version=version+1,updated_at=now() WHERE id=$1',
        [body.id, status, JSON.stringify(data)],
      );
      await event(client, body.id, actor.id, body.action === 'accept' ? 'QUOTE_ACCEPTED' : 'QUOTE_PRICED', eventNote, {from: row.status, to: status});
      return {id: body.id, reference: row.reference};
    });
    return NextResponse.json(result, {headers});
  } catch (error) {
    if (error instanceof ExperienceError) return NextResponse.json({error: error.message}, {headers, status: error.status});
    console.error('Quote save failed', {code: (error as {code?: string})?.code});
    return NextResponse.json({error: 'Could not save the quote. Try again.'}, {headers, status: 503});
  }
}
