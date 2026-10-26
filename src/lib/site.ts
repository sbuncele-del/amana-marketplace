export const siteUrl = 'https://plentovo.com';
export const publicPages = ['', '/browse', '/collections', '/about', '/contact', '/shipping-faq', '/returns', '/terms', '/privacy', '/cookies', '/sitemap-page'];
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\u003c');

// Account URLs supplied for the storefront; add Instagram only after its exact URL is confirmed.
export const socialLinks=[{name:'Facebook',href:'https://www.facebook.com/plentovo'},{name:'YouTube',href:'https://www.youtube.com/@plentovo'},{name:'TikTok',href:'https://www.tiktok.com/@plentovo'},{name:'Pinterest',href:'https://www.pinterest.com/plentovo/'}];
