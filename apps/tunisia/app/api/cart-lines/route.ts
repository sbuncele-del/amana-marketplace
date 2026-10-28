import {parseIds} from '@/lib/import/auth';
import {getCards} from '@/lib/catalogue-source';
export const dynamic = 'force-dynamic';
// Current public price and stock for the items in a visitor's cart (public fields only).
export async function GET(request: Request) {
 const ids = parseIds(new URL(request.url).searchParams.get('ids'));
 if (!ids) return Response.json({error: 'Invalid ids'}, {status: 400});
 return Response.json(await getCards(ids), {headers: {'Cache-Control': 'no-store'}});
}
