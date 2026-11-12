import {timingSafeEqual} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {ensureExperienceSchema} from '@/lib/experience/store';
import {sendOrderEmail} from '@/lib/mail/order-updates';

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({error: 'Scheduler not configured'}, {status: 503});
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from('Bearer ' + secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  }
  try {
    await ensureExperienceSchema();
    let processed = 0;
    while (processed < 15 && await sendOrderEmail()) processed++;
    return NextResponse.json({processed}, {headers: {'Cache-Control': 'no-store'}});
  } catch {
    return NextResponse.json({error: 'Order email processing failed'}, {status: 503});
  }
}
