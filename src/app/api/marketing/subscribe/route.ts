import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
import {mailConfigured} from '@/lib/mail/send';
import {requestSubscription} from '@/lib/mail/subscribers';

const schema = z.object({email: z.string().trim().toLowerCase().email().max(254), consent: z.literal(true), source: z.string().max(40).optional(), website: z.string().max(0).optional()});

// POST /api/marketing/subscribe — double opt-in sign-up. The reply never reveals whether an address is already on the list.
export async function POST(request: NextRequest) {
  try {
    if (!sameRequestOrigin(request)) return NextResponse.json({error: 'Please use the sign-up form.'}, {status: 403});
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({error: 'Please enter a valid email address and tick the consent box.'}, {status: 400});
    // Hidden "website" field is filled only by bots: pretend success.
    if (parsed.data.website) return NextResponse.json({success: true});
    if (!mailConfigured()) return NextResponse.json({error: 'Sign-up is not available right now. Please try again soon.'}, {status: 503});
    await limitPublicRequest(request, 'newsletter');
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    await requestSubscription(parsed.data.email, parsed.data.source || 'popup', ip);
    return NextResponse.json({success: true}, {headers: {'Cache-Control': 'no-store'}});
  } catch (e) {
    if (e instanceof Error && e.message === 'RATE_LIMIT') return NextResponse.json({error: 'Please wait a little before trying again.'}, {status: 429});
    console.error('[subscribe]', e);
    return NextResponse.json({error: 'We could not complete your sign-up. Please try again shortly.'}, {status: 503});
  }
}
