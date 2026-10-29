export const siteUrl = 'https://plentovo.com';
export const publicPages = ['', '/browse', '/collections', '/about', '/contact', '/shipping-faq', '/returns', '/terms', '/privacy', '/cookies', '/sitemap-page', '/connect'];
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\u003c');

export {sharedSocialLinks} from '../../packages/storefront/social';
import {countrySocialLinks} from '../../packages/storefront/social';
export const socialLinks=countrySocialLinks('ZA');
