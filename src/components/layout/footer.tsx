import {SharedFooter} from '../../../packages/storefront/footer';
import {business} from '@/lib/business';
import {CookiePreferences} from '@/components/consent-analytics';
import {BrandLogo} from '@/components/brand-logo';
import departments from '@/data/departments.json';
import {socialLinks} from '@/lib/site';
import {ozowConfig} from '@/lib/ozow';

export function Footer() {
  return (
    <SharedFooter
      business={business}
      logo={<BrandLogo light className="h-auto w-44"/>}
      cookies={<CookiePreferences/>}
      departments={departments}
      socialLinks={socialLinks}
      storefrontLinks={
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-t border-white/10 pt-6 sm:col-span-2 lg:col-span-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Get the Plentovo app</h2>
            <a href="https://appgallery.huawei.com/#/app/C119680975" className="inline-flex min-h-11 items-center gap-2.5 rounded-lg border border-white/25 bg-white/5 px-3 text-sm font-medium hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://consumer.huawei.com/dam/content/dam/huawei-cbg-site/common/mkt/pdp/business/tablets/matepad-c7/en-img/icon/appgallery-2x.png" alt="" width="26" height="26" className="size-[26px] object-contain"/>
              Download on HUAWEI AppGallery
            </a>
          </div>
          {ozowConfig() && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Official payment partner</h2>
              <a href="https://ozow.com/pay-by-bank" className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://hub.ozow.com/assets/brand/payment-methods/pay-via-ozow-bank.png" alt="Pay by Bank via Ozow" width="1324" height="160" className="h-auto w-48"/>
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}
