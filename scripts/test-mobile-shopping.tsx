import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {MobileShoppingFeed,mobileShoppingCopy} from '../packages/storefront/mobile-shopping';
import {SharedCatalogueCard} from '../packages/storefront/catalogue-card';
for(const locale of ['en','fr','ar'] as const){
 const html=renderToStaticMarkup(<MobileShoppingFeed locale={locale} categories={[{slug:'electronics',name:'Electronics'}]} load={async()=>{throw new Error('The server must not start a mobile request');}} renderProduct={()=>null}/>);
 assert.equal((html.match(/class="mobile-product-skeleton"/g)||[]).length,6,'A cold mobile visit shows product placeholders, not an empty-result message');
 assert.ok(html.includes(mobileShoppingCopy[locale].loading));
 assert.ok(html.includes('aria-pressed="true"'));
 assert.ok(!html.includes(mobileShoppingCopy[locale].empty));
}
const p={id:'test',slug:'test',name:'A product',images:[],price:20,currency:'TND',supplierAvailable:false,category:{name:'Electronics',slug:'electronics'}};
const card=renderToStaticMarkup(<SharedCatalogueCard product={p} href="/ar/product/test" price="20 د.ت" stockText="غير متوفر"/>);
assert.ok(card.includes('/ar/product/test'));
assert.ok(card.includes('غير متوفر'),'Real unavailable stock remains visible');
assert.ok(!card.includes('In stock'));
console.log('Mobile cold-load, multilingual controls and truthful stock checks passed.');
