import 'server-only';
import {siteUrl} from '@/lib/site';

export async function sendSupportPush(reference: string) {
  const token = process.env.PUSHOVER_SUPPORT_APP_TOKEN;
  const user = process.env.PUSHOVER_SUPPORT_USER_KEY;
  if (!token || !user) return;

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: new URLSearchParams({
      token,
      user,
      title: 'Plentovo South Africa · Support',
      message: 'New support case ' + reference,
      url: new URL('/operations/back-office/support', siteUrl).href,
      url_title: 'Open Support log',
    }),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error('Support push rejected (' + response.status + ')');
}
