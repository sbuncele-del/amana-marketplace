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
        <div className="flex flex-wrap items-end justify-start gap-x-12 gap-y-5 border-t border-white/10 pt-6 sm:col-span-2 lg:col-span-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Get the Plentovo app</h2>
            <a href="https://appgallery.huawei.com/#/app/C119680975" className="inline-flex min-h-11 items-center rounded-lg bg-white px-3 py-2 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://consumer.huawei.com/dam/content/dam/huawei-cbg-site/common/mkt/pdp/business/tablets/matepad-c7/en-img/icon/appgallery-2x.png" alt="Download on HUAWEI AppGallery" className="h-9 w-auto max-w-full object-contain"/>
            </a>
          </div>
          {ozowConfig() && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Official payment partner</h2>
              <a href="https://ozow.com/pay-by-bank" className="inline-flex min-h-13 items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#171B20] hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://eu-images.contentstack.com/v3/assets/blt7dacf616844cf077/bltee045a1fbc3608c4/67996de9f9a080222f9e5fd8/Ozow-Logo.jpg?width=240" alt="Ozow" className="h-8 w-auto max-w-24 object-contain"/>
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}
