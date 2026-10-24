type SearchProduct = {name:string;description:string;category:{name:string}};
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const seating=new Set(['couch','couches','sofa','sofas']);
export function catalogueSearch<T extends SearchProduct>(products:T[],query:string):T[]{
 const phrase=normalize(query);if(!phrase)return products;
 const tokens=phrase.split(' ');
 function matches(text:string){const words=normalize(text).split(' ');return tokens.every(t=>seating.has(t)?words.some(w=>seating.has(w)):words.some(w=>w.includes(t)));}
 return products.map((product,index)=>({product,index,score:normalize(product.name)===phrase?4:matches(product.name)?3:matches(product.category.name)?2:matches(product.description)?1:0})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).map(p=>p.product);
}
