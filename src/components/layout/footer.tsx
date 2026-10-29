import {SharedFooter} from '../../../packages/storefront/footer';
import {business} from '@/lib/business';
import {CookiePreferences} from '@/components/consent-analytics';
import {BrandLogo} from '@/components/brand-logo';
import departments from '@/data/departments.json';
import {socialLinks} from '@/lib/site';
export function Footer(){return <SharedFooter business={business} logo={<BrandLogo light className="h-auto w-44"/>} cookies={<CookiePreferences/>} departments={departments} socialLinks={socialLinks}/>;}
