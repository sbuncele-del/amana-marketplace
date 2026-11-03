// Google Merchant Center product feed for South Africa: tab-delimited text, one row per product (the variant a shopper lands on).
// Shares the verified Google category rules and the restricted-item filter with the Pinterest feed.
import type {CatalogueProduct} from './catalogue';
import {googleProductCategory,restricted} from './pinterest-feed';
import {siteUrl} from './site';
const columns=['id','title','description','link','image_link','additional_image_link','availability','price','condition','identifier_exists','product_type','google_product_category'];
const plain=(value:string)=>value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const cell=(value:string)=>value.replace(/[\t\r\n]+/g,' ').trim();
export function buildMerchantFeed(products:CatalogueProduct[]){
 const rows:string[][]=[];
 for(const product of products){
  if(restricted.test(product.name))continue;
  const variant=product.variants.find(v=>v.supplierAvailable)||product.variants[0];
  if(!variant||!Number.isFinite(variant.price)||variant.price<=0)continue;
  const title=plain(product.name).slice(0,150),description=plain(product.description||product.details||product.name).slice(0,5000);
  const imageSource=variant.image||product.images[0];
  if(!imageSource||!title||!description)continue;
  let image:URL;try{image=new URL(imageSource,siteUrl);}catch{continue;}
  if(image.protocol!=='https:'||image.href.length>2000)continue;
  const link=new URL('/product/'+encodeURIComponent(product.slug),siteUrl);
  if(link.href.length>2000||product.id.length>50)continue;
  // An unmapped category skips the product instead of failing the whole feed.
  const category=googleProductCategory(product);
  if(!category)continue;
  const extra=product.images.filter(src=>src!==imageSource).map(src=>{try{const u=new URL(src,siteUrl);return u.protocol==='https:'?u.href:'';}catch{return '';}}).filter(Boolean).slice(0,10);
  rows.push([product.id,title,description,link.href,image.href,extra.join(','),variant.supplierAvailable?'in_stock':'out_of_stock',variant.price.toFixed(2)+' ZAR','new','no',product.category.name,category]);
 }
 return {tsv:[columns,...rows].map(row=>row.map(cell).join('\t')).join('\n')+'\n',count:rows.length};
}
