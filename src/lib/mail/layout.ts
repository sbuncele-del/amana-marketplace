import {siteUrl} from '@/lib/site';

export const brand = {
  name: 'Plentovo',
  tagline: 'Good things. Plenty of choice.',
  red: '#DA292B',
  ink: '#171B20',
  address: 'Plentovo · African Shelf, 116 Limpopo Avenue, Doringkloof, Centurion, 0157, South Africa',
};

export function esc(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3a3f46;">${text}</p>`;
}

export function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td style="border-radius:8px;background:${brand.red};"><a href="${esc(href)}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;
}

/** Table-based, inline-styled shell that renders consistently in Gmail, Outlook and Apple Mail. */
export function layout({preheader = '', content, unsubscribeUrl}: {preheader?: string; content: string; unsubscribeUrl?: string}) {
  const footerLinks = unsubscribeUrl
    ? `You are receiving this because you subscribed at plentovo.com. <a href="${esc(unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>`
    : `This is a service message about your Plentovo activity.`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><style>@media only screen and (max-width:480px){.product-column{display:block!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;}.email-product-image{height:200px!important;}}</style><title>${brand.name}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f4f5;">${esc(preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:#ffffff;padding:26px 32px 22px;border-bottom:1px solid #eceef0;"><a href="${siteUrl}" aria-label="Plentovo home"><img src="${siteUrl}/brand/plentovo-email.png" alt="Plentovo" width="240" height="54" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></a><div style="margin-top:12px;font-size:12px;color:#6b7280;">${brand.tagline}</div></td></tr>
<tr><td style="padding:36px 32px 20px;">${content}</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #eceef0;font-size:12px;line-height:1.6;color:#6b7280;">${footerLinks}<br>${esc(brand.address)}</td></tr>
</table></td></tr></table></body></html>`;
}

export function toText(html: string) {
  return html
    .replace(/<(style|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => `${label.replace(/<[^>]+>/g, '').trim()} (${href})`)
    .replace(/<\/(p|tr|h\d|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&zwnj;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
