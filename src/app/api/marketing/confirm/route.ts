import {NextRequest, NextResponse} from 'next/server';
import {confirmSubscription} from '@/lib/mail/subscribers';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const result = token.length >= 16 ? await confirmSubscription(token).catch(() => 'invalid' as const) : 'invalid';
  return NextResponse.redirect(new URL(`/newsletter?s=${result}`, request.nextUrl.origin), 303);
}
