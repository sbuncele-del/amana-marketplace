import Link from 'next/link';
import Image from 'next/image';

export type CatalogueCardData = {id:string;slug:string;name:string;images:string[];price:number;currency:string;supplierAvailable:boolean;priceOnRequest?:boolean;category:{name:string;slug:string}};
export function SharedCatalogueCard({product,list=false,href,price,stockText}:{product:CatalogueCardData;list?:boolean;href:string;price:string;stockText:string}) {
 return <Link href={href} className={`group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-red-600/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-red-700 ${list?'flex':'flex flex-col'}`}>
  <div className={`relative bg-white ${list?'w-28 shrink-0 sm:w-44':'aspect-square'}`}>
   {product.images[0] && <Image unoptimized src={product.images[0]} alt={product.name} fill sizes={list?'176px':'(max-width:640px) 50vw, (max-width:1024px) 33vw, 20vw'} className="object-contain p-3 transition duration-300 group-hover:scale-105"/>}
  </div>
  <div className="flex flex-1 flex-col p-3 sm:p-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{product.category.name}</p><h3 className="min-h-10 text-sm font-medium leading-5 line-clamp-2 group-hover:text-red-700">{product.name}</h3><p className="mt-3 text-lg font-extrabold tracking-tight sm:text-xl">{price}</p><p className={`mt-2 flex items-center gap-1.5 text-xs ${product.supplierAvailable?'text-emerald-700':'text-gray-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${product.supplierAvailable?'bg-emerald-600':'bg-gray-400'}`}/>{stockText}</p></div>
 </Link>;
}
