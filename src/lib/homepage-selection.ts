type Item={slug:string;price:number;supplierAvailable:boolean};
export type HomepagePlan={key:string;handles:string[];maxPrice?:number};
// Parallel reads with deterministic merchandising priority and no repeated supplier request.
export async function selectHomepageRows<T extends Item>(plans:HomepagePlan[],read:(slug:string,timeoutMs:number)=>Promise<T|null>,{budgetMs=6500,rowLimit=6}={}){
 const deadline=Date.now()+budgetMs,checked=new Map<string,Promise<T|null>>();
 const rows=await Promise.all(plans.map(async plan=>{
  const candidates=[...new Set(plan.handles)].slice(0,60),products:T[]=[];
  for(let offset=0;offset<candidates.length&&products.length<rowLimit*2&&Date.now()<deadline;offset+=6){
   const batch=await Promise.all(candidates.slice(offset,offset+6).map(slug=>{
    let pending=checked.get(slug);
    if(!pending){pending=read(slug,Math.max(1,Math.min(4500,deadline-Date.now())));checked.set(slug,pending);}
    return pending;
   }));
   for(const product of batch)if(product&&product.supplierAvailable&&product.price>0&&product.price<(plan.maxPrice??Infinity))products.push(product);
  }
  return products;
 }));
 const used=new Set<string>();
 return Object.fromEntries(plans.map((plan,i)=>[plan.key,rows[i].filter(p=>!used.has(p.slug)).slice(0,rowLimit).map(p=>{used.add(p.slug);return p;})])) as Record<string,T[]>;
}
