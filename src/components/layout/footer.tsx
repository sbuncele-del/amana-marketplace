import {SharedFooter} from '../../../packages/storefront/footer';
import {business} from '@/lib/business';
import {CookiePreferences} from '@/components/consent-analytics';
import {BrandLogo} from '@/components/brand-logo';
import departments from '@/data/departments.json';
import {socialLinks} from '@/lib/site';
import {ozowConfig} from '@/lib/ozow';

export function Footer() {
  return (
    <>
      {ozowConfig() && (
        <section aria-label="Official payment partner" className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-sm">
            <h2 className="font-semibold text-[#171B20]">Official payment partner</h2>
            <a href="https://ozow.com/pay-by-bank" className="font-bold text-[#171B20] underline decoration-gray-400 underline-offset-4 hover:decoration-current">Ozow</a>
            <span className="text-gray-600">Pay by Bank at checkout</span>
          </div>
        </section>
      )}
      <SharedFooter
        business={business}
        logo={<BrandLogo light className="h-auto w-44"/>}
        cookies={<CookiePreferences/>}
        departments={departments}
        socialLinks={socialLinks}
      />
    </>
  );
}
