import type {ReactNode} from 'react';
import {SharedCatalogueCard,type CatalogueCardData} from '../../../packages/storefront/catalogue-card';
import {formatCurrency} from '@/lib/utils';
export type {CatalogueCardData};
export function CatalogueCard({product,list=false,favorite}:{product:CatalogueCardData;list?:boolean;favorite?:ReactNode}){return <SharedCatalogueCard favorite={favorite} product={product} list={list} href={`/product/${product.slug}`} price={product.priceOnRequest?'Price on request':formatCurrency(product.price,product.currency)} stockText={product.supplierAvailable?'In stock':'Currently unavailable'}/>;}
