export type MarketCartLine={id:string;quantity:number};
// Information pages have no catalogue payload. Absence of catalogue data must never empty a saved cart.
export function restoreMarketCart(raw:string,products?:readonly {id:string;stock:number}[]):MarketCartLine[]{
 try{const value:unknown=JSON.parse(raw);if(!Array.isArray(value))return [];
 const stock=products?.length?new Map(products.map(p=>[p.id,p.stock])):null;
 const lines=new Map<string,number>();
 for(const item of value){if(!item||typeof item.id!=='string'||!item.id||!Number.isInteger(item.quantity)||item.quantity<1)continue;const limit=stock?stock.get(item.id)??0:99;const quantity=Math.min(99,limit,(lines.get(item.id)||0)+item.quantity);if(quantity>0)lines.set(item.id,quantity);}
 return [...lines].map(([id,quantity])=>({id,quantity}));
 }catch{return [];}
}
