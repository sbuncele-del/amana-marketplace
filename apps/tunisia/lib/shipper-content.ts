import type {SupplierContent} from './shipper-normalise';
export type AccountBinding={retailerProductId:string;sourceProductId:string;variantLabels?:Record<string,string|undefined>};
export function bindAccountContent(content:SupplierContent[],bindings:AccountBinding[]):SupplierContent[]{
 const bySource=new Map<string,AccountBinding[]>();
 for(const binding of bindings)bySource.set(binding.sourceProductId,[...(bySource.get(binding.sourceProductId)||[]),binding]);
 return content.map(item=>{const matches=bySource.get(item.sourceProductId)||[];return {...item,retailerProductIds:matches.map(b=>b.retailerProductId),variantLabels:Object.assign({},...matches.map(b=>b.variantLabels||{}))};});
}
