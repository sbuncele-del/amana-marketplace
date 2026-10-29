import {SharedCatalogueCard} from '../../../packages/storefront/catalogue-card';
import {primaryDepartment} from '@/lib/catalogue-browse';
import {storefrontDepartments} from '../../../packages/storefront/departments';
import {money,type Locale} from '@/lib/catalogue';
import {storefrontTranslator} from '@/lib/storefront-locale';
import type {ProductGroup} from '@/lib/product-groups';
export function ProductCard({group,locale,list=false}:{group:ProductGroup;locale:Locale;list?:boolean}){const t=storefrontTranslator(locale);return <SharedCatalogueCard list={list} href={`/${locale}/product/${group.slug}`} product={{id:group.id,slug:group.slug,name:group.title[locale],images:[group.image],price:group.priceMillimes,currency:'TND',supplierAvailable:group.stock>0,category:{name:t(storefrontDepartments.find(d=>d.slug===primaryDepartment(group))?.name||'Home & Living'),slug:primaryDepartment(group)}}} price={money(group.priceMillimes,locale)} stockText={t(group.stock?'In stock':'Currently unavailable')}/>;}
export function ProductCards({groups,locale}:{groups:ProductGroup[];locale:Locale;onAdd?:(id:string)=>void}){return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{groups.map(group=><ProductCard key={group.id} group={group} locale={locale}/>)}</div>;}

