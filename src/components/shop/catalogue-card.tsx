import {SharedCatalogueCard,type CatalogueCardData} from '../../../packages/storefront/catalogue-card';
import {formatCurrency} from '@/lib/utils';
export type {CatalogueCardData};
export function CatalogueCard({product,list=false}:{product:CatalogueCardData;list?:boolean}){return <SharedCatalogueCard product={product} list={list} href={`/product/${product.slug}`} price={product.priceOnRequest?'Price on request':formatCurrency(product.price,product.currency)} stockText={product.supplierAvailable?'In stock':'Currently unavailable'}/>;}
