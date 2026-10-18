import type {CatalogueProduct} from './catalogue';
import {siteUrl} from './site';

const columns = ['id','title','description','link','image_link','price','availability','item_group_id','condition','product_type'];
const restricted = /\b(?:vape|vaping|tobacco|nicotine|cigarette|cbd|cannabis|sex|sexual|dildo|vibrator|aphrodisiac|supplement|weight loss|slimming|fat burner|weapon|ammunition|crossbow|slingshot)\b/i;
const plain = (value:string) => value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const cell = (value:string) => '"'+value.replace(/"/g,'""')+'"';

// One representative offer per product, matching the variant selected on arrival.
// Do not publish supplier cost, invented brands, ratings, or missing stock as available.
export function buildPinterestFeed(products:CatalogueProduct[]) {
 const rows:string[][]=[];
 for(const product of products) {
  if(restricted.test(product.name))continue;
  const variant=product.variants.find(v=>v.supplierAvailable)||product.variants[0];
  if(!variant||!Number.isFinite(variant.price)||variant.price<=0)continue;
  const title=plain(product.name).slice(0,500);
  const description=plain(product.description||product.details||product.name).slice(0,10000);
  const imageSource=variant.image||product.images[0];
  if(!imageSource)continue;
  let image:URL;
  try {image=new URL(imageSource,siteUrl);}catch {continue;}
  if(!['https:','http:'].includes(image.protocol)||!title||!description)continue;
  const link=new URL('/product/'+encodeURIComponent(product.slug),siteUrl);
  if(link.href.length>511||image.href.length>2000)continue;
  rows.push([product.id.slice(0,127),title,description,link.href,image.href,variant.price.toFixed(2)+' ZAR',variant.supplierAvailable?'in stock':'out of stock',product.id.slice(0,127),'new',product.category.name]);
 }
 return {csv:[columns.map(cell).join(','),...rows.map(row=>row.map(cell).join(','))].join('\r\n')+'\r\n',count:rows.length};
}
