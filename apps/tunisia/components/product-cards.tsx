import {SharedCatalogueCard} from '../../../packages/storefront/catalogue-card';
import {money,type Locale} from '@/lib/catalogue';
import {storefrontTranslator} from '@/lib/storefront-locale';
import type {ProductGroup} from '@/lib/product-groups';
export function ProductCard({group,locale}:{group:ProductGroup;locale:Locale}){const t=storefrontTranslator(locale);return <SharedCatalogueCard href={`/${locale}/product/${group.slug}`} product={{id:group.id,slug:group.slug,name:group.title[locale],images:[group.image],price:group.priceMillimes,currency:'TND',supplierAvailable:group.stock>0,category:{name:group.category,slug:group.category}}} price={money(group.priceMillimes,locale)} stockText={t(group.stock?'In stock':'Currently unavailable')}/>;}
export function ProductCards({groups,locale}:{groups:ProductGroup[];locale:Locale;onAdd?:(id:string)=>void}){return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{groups.map(group=><ProductCard key={group.id} group={group} locale={locale}/>)}</div>;}
