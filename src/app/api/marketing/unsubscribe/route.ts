import {NextRequest, NextResponse} from 'next/server';
import {unsubscribe} from '@/lib/mail/subscribers';

// POST handles both the page's form button and mail clients' RFC 8058 one-click request (token in the query string).
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const token = String(request.nextUrl.searchParams.get('token') || form?.get('token') || '');
  const oneClick = form?.get('List-Unsubscribe') === 'One-Click';
  const ok = token.length >= 16 && (await unsubscribe(token).catch(() => false));
  if (oneClick) return NextResponse.json({ok}, {status: ok ? 200 : 404});
  return NextResponse.redirect(new URL(`/newsletter?s=${ok ? 'unsubscribed' : 'invalid'}`, request.nextUrl.origin), 303);
}
