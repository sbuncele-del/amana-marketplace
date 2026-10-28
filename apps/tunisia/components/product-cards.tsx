import Link from 'next/link';
import {money,type Locale} from '@/lib/catalogue';
import {copy} from '@/lib/storefront-copy';
import type {ProductGroup} from '@/lib/product-groups';
export function ProductCards({groups,locale,onAdd}:{groups:ProductGroup[];locale:Locale;onAdd:(id:string)=>void}){
 return <div className="products">{groups.map(group=>{
  const href=`/${locale}/product/${group.slug}`,multiple=group.variants.length>1;
  const prices=new Set(group.variants.filter(p=>p.stock>0).map(p=>p.priceMillimes));
  return <article className="product-card" key={group.id}>
   <Link prefetch={false} href={href}><img src={group.image} alt={group.title[locale]} loading="lazy"/><h3>{group.title[locale]}</h3></Link>
   <strong dir="auto">{prices.size>1?copy.from[locale]+' ':''}{money(group.priceMillimes,locale)}</strong>
   <span className={group.stock?'stock':'stock out'}>{group.stock?copy.inStock[locale]:locale==='fr'?'Épuisé':locale==='ar'?'نفد المخزون':'Out of stock'}</span>
   {multiple?<Link prefetch={false} className="option-link" href={href}>{copy.options[locale]} ({group.variants.length})</Link>:<button onClick={()=>onAdd(group.variants[0].id)} disabled={!group.stock}>{locale==='fr'?'Ajouter au panier':locale==='ar'?'أضف إلى السلة':'Add to cart'}</button>}
  </article>;
 })}</div>;
}
