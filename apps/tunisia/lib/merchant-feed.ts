// Google Merchant Center product feed (RSS 2.0 + g: namespace), French pages. One entry per product group, like the Pinterest feed.
import {groupProducts} from './product-groups';
import {primaryDepartment} from './catalogue-browse';
import type {StoreProduct} from './catalogue';
const plain=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const esc=(s:string)=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
// Google's taxonomy accepts the full text path, which avoids guessing numeric ids.
const googleCategory:Record<string,string>={
 'kitchen-dining':'Home & Garden > Kitchen & Dining','health-beauty':'Health & Beauty','electronics':'Electronics','toys-kids-baby':'Toys & Games',
 'furniture':'Furniture','storage-organisation':'Home & Garden > Household Supplies > Storage & Organization','bed-bath':'Home & Garden > Linens & Bedding',
 'cleaning-laundry':'Home & Garden > Household Supplies','lighting-lamps':'Home & Garden > Lighting','tools':'Hardware > Tools','garden-outdoor':'Home & Garden > Lawn & Garden',
 'fitness-exercise':'Sporting Goods > Exercise & Fitness','car-care-tools':'Vehicles & Parts','stationery-office-supplies':'Office Supplies',
 'clothing-accessories':'Apparel & Accessories','home-decor-gifts':'Home & Garden > Decor','home-living':'Home & Garden',
};
// Products Google Shopping restricts or prohibits; they are left out rather than risking account warnings.
const restricted=/\b(vape|vapoteuse|tabac|nicotine|cannabis|cbd|weapon|arme|ammunition|aphrodisiaque|erection|libido|viagra|poppers|slimming|minceur|amincissant|supplement|complement)\b/i;
export function buildMerchantFeed(products:StoreProduct[]){
 const items:string[]=[];
 for(const group of groupProducts(products.filter(p=>p.active))){
  const p=group.variants.find(v=>v.stock>0)||group.variants[0];
  const title=plain(p.groupTitle?.fr||p.title.fr).slice(0,150);
  const slug=p.groupSlug||p.slug;
  if(!title||restricted.test(title)||!/^[a-z0-9-]+$/.test(slug))continue;
  if(!Number.isSafeInteger(group.priceMillimes)||group.priceMillimes<=0)continue;
  let image:URL;try{image=new URL(p.image);}catch{continue;}
  if(image.protocol!=='https:'||image.href.length>2000)continue;
  const link='https://plentovo.com/tunisia/fr/product/'+slug;
  if(link.length>2000||('tn-'+group.id).length>50)continue;
  const description=plain(p.description?.fr||'').slice(0,5000)||title;
  const department=primaryDepartment(group);
  const extra=(p.images||[]).filter(u=>u!==p.image&&u.startsWith('https://')).slice(0,10);
  items.push('<item>'
   +'<g:id>'+esc('tn-'+group.id)+'</g:id><g:title>'+esc(title)+'</g:title><g:description>'+esc(description)+'</g:description>'
   +'<g:link>'+esc(link)+'</g:link><g:image_link>'+esc(image.href)+'</g:image_link>'+extra.map(u=>'<g:additional_image_link>'+esc(u)+'</g:additional_image_link>').join('')
   +'<g:availability>'+(group.stock>0?'in_stock':'out_of_stock')+'</g:availability><g:price>'+(group.priceMillimes/1000).toFixed(3)+' TND</g:price>'
   +'<g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>'
   +'<g:google_product_category>'+esc(googleCategory[department]||'Home & Garden')+'</g:google_product_category><g:product_type>'+esc(department)+'</g:product_type>'
   +'</item>');
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Plentovo Tunisie</title><link>https://plentovo.com/tunisia/fr</link><description>Catalogue Plentovo Tunisie</description>'+items.join('')+'</channel></rss>';
 return {xml,count:items.length};
}
