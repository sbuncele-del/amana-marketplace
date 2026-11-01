import {getCatalogueSnapshot,getCatalogueProduct} from '@/lib/catalogue';
export type ChatProduct={image?:string;name:string;href:string;price:number;hasOptions:boolean};
type Message={role:'user'|'assistant';content:string};
const stop=new Set('a an the i im am my me you your we our is are was were be been to for of in on at with and or it this that these those please can could would will want need looking find help buy get show some something one ones other another any have has do does how what which much under below less than budget rand zar r name called hello hi hey thanks thank mum mom dad mother father daughter son wife husband partner friend birthday present gift delivery shipping order return refund about also only from not more than up practical useful nice good great best affordable cheap reliable durable simple recommendation recommend options option choose choosing suitable need needs use everyday'.split(' '));
// Words customers use for things the catalogue names differently. Phrases are tested against product names only.
const concepts:{ask:RegExp;names:RegExp}[]=[
 {ask:/\b(bedding|linen|bedlinen|bed linen|sheets?)\b/,names:/\b(pillow|pillowcase|duvet|comforter|quilt|blanket|mattress|bed ?sheet|sheet set|fitted sheet|bed ?linen)/i},
 {ask:/\b(cookware|pots?|pans?)\b/,names:/\b(pan|pot|skillet|wok|saucepan|casserole|cookware)\b/i},
 {ask:/\b(cutlery|flatware)\b/,names:/\b(knife|knives|fork|spoon|cutlery)\b/i},
 {ask:/\b(skincare|skin care)\b/,names:/\b(serum|cream|moisturi[sz]er|cleanser|sunscreen|toner|face)\b/i},
 {ask:/\b(toys?|playthings?)\b/,names:/\b(toy|doll|puzzle|blocks|plush)\b/i},
];
export async function catalogueContext(messages:Message[],pathname?:string){
 const latest=messages.filter(m=>m.role==='user').at(-1)?.content||'';
 if(/refund|return|order status|business address|where.*order/i.test(latest))return {data:[],products:[],budget:null,noMatch:false,searchedFor:[]};
 const query=messages.filter(m=>m.role==='user').slice(-4).map(m=>m.content).join(' ').toLowerCase().replace(/airfryers?/g,'air fryer');
 const words=[...new Set((query.match(/[a-z][a-z0-9-]+/g)||[]).filter(w=>w.length>2&&!stop.has(w)).map(w=>w.length>4&&!w.endsWith('ss')?w.replace(/s$/,''):w))];
 const budgetMatches=[...query.matchAll(/(?:under|below|budget(?:\s+is)?|up to|less than)\s*(?:of\s*)?r?\s*(\d[\d,]*(?:\.\d+)?)/gi)];
 const budget=budgetMatches.length?Number(budgetMatches.at(-1)![1].replace(/,/g,'')):null;
 const currentSlug=pathname?.match(/^\/product\/([a-z0-9-]+)$/)?.[1];
 const wanted=concepts.filter(c=>c.ask.test(query));
 const storageAsked=/storage|vacuum|organi[sz]|bag/.test(query);
 const kettleWanted=/\bkettles?\b/.test(query);
 const partsWanted=/\b(part|parts|replacement|element|cord|plug|repair|accessor)/.test(query);
 const coldKettleWanted=/cold.water|sports|stovetop|camping/.test(query);
 const ranked=(await getCatalogueSnapshot()).filter(p=>{
  if(kettleWanted&&!/\bkettles?\b/i.test(p.name))return false;
  if(kettleWanted&&!partsWanted&&/element|cord|plug|heater|replacement/i.test(p.name))return false;
  if(kettleWanted&&!coldKettleWanted&&/cold.water|sports.kettle|kettlebell/i.test(p.name))return false;
  return true;
 }).map(p=>{const name=p.name.toLowerCase();
  const hit=words.reduce((sum,w)=>sum+(new RegExp('\\b'+w+'s?\\b').test(name)?3:0),0);
  const synonym=wanted.reduce((sum,c)=>sum+(c.names.test(p.name)?2:0),0);
  const accessory=(!storageAsked&&/\b(vacuum|storage)\b/.test(name)?3:0)+(wanted.length&&!/travel|neck/.test(query)&&/\b(travel|neck)\b/.test(name)?3:0);
  const extra=(hit||synonym)?words.reduce((sum,w)=>sum+(p.category.name.toLowerCase().includes(w)?1:0)+(new RegExp('\\b'+w+'s?\\b').test((p.description||'').toLowerCase())?1:0),0):0;
  return {p,score:hit+synonym-accessory+Math.min(extra,2),named:hit+synonym};})
  .filter(({p,score,named})=>named>0&&score>=2&&(!budget||p.price<=budget))
  .sort((a,b)=>b.score-a.score||a.p.price-b.p.price).slice(0,5).map(({p})=>p.slug);
 const slugs=[...new Set([...(currentSlug?[currentSlug]:[]),...ranked])].slice(0,5);
 const checked=await Promise.all(slugs.map(slug=>getCatalogueProduct(slug)));
 const data=checked.filter(p=>p!==null).map(p=>({
  image:p!.images[0],name:p!.name,href:'/product/'+p!.slug,priceFrom:p!.price,currency:'ZAR',available:p!.supplierAvailable,
  description:p!.description.slice(0,600),
  variants:p!.variants.slice(0,12).map(v=>({option:v.title,price:v.price,available:v.supplierAvailable})),
 }));
 const products:ChatProduct[]=data.filter(p=>p.available&&(!budget||p.priceFrom<=budget)).slice(0,3).map(p=>({image:p.image,name:p.name,href:p.href,price:p.priceFrom,hasOptions:p.variants.length>1}));
 const referenceData=data.filter(p=>products.some(card=>card.href===p.href)||p.href==='/product/'+currentSlug);
 // Said plainly so the assistant tells the customer instead of guessing at something close.
 const noMatch=words.length>0&&!ranked.length&&!currentSlug;
 return {data:referenceData,products,budget,noMatch,searchedFor:noMatch?words.slice(0,6):[]};
}
