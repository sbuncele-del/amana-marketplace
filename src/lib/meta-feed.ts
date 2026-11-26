// Meta Commerce Manager catalogue feed (Facebook Shops, Instagram, Marketplace): CSV, one row per product.
// Shares row rules, restricted-item filter and verified availability with the Google feed.
import type {CatalogueProduct} from './catalogue';
import {feedRows} from './merchant-feed';
const columns=['id','title','description','availability','condition','price','link','image_link','additional_image_link','brand','google_product_category','product_type'];
const csv=(value:string)=>{const v=value.replace(/[\r\n]+/g,' ').trim();return /[",]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
export function buildMetaFeed(products:CatalogueProduct[]){
 const rows=feedRows(products).map(r=>[r.id,r.title,r.description,r.inStock?'in stock':'out of stock','new',r.price,r.link,r.image,r.extra.join(','),'Plentovo',r.googleCategory,r.category]);
 return {csv:[columns,...rows].map(row=>row.map(csv).join(',')).join('\n')+'\n',count:rows.length};
}
