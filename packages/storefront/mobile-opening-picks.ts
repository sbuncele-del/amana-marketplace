type PickDetails={title:string;category:string;available:boolean;image?:string;price:number};
const selfCare=/\b(?:skincare|skin care|makeup|cosmetic|vanity|perfume|fragrance|manicure|hair brush|hairbrush|hair dryer|straightener|trousse de maquillage|parfum|soins|seche.cheveux)\b|عطر|مكياج|مجفف الشعر|العناية بالبشرة/i;
const everyday=/\b(?:tumbler|travel mug|water bottle|jewellery|jewelry|handbag|tote bag|organiser|organizer|jewellery box|sac a main|gourde|bijou[xs]?|organisateur)\b|حقيبة يد|منظم|زجاجة ماء|مجوهرات/i;

// Curate two opening cards from the loaded catalogue. No customer profiling, synthetic products or extra requests.
export function mobileOpeningPicks<T>(products:T[],details:(product:T)=>PickDetails,budget:number):T[]{
 const ranked=products.map((product,index)=>{
  const p=details(product);
  const name=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const theme=selfCare.test(name)?'care':everyday.test(name)?'everyday':p.category==='health-beauty'?'care':['home-living','storage-organisation','home-decor-gifts','clothing-accessories'].includes(p.category)?'everyday':null;
  const score=(selfCare.test(name)||everyday.test(name)?4:0)+(p.price<=budget?2:0);
  return {index,theme,score,eligible:!!(p.available&&p.image&&Number.isFinite(p.price)&&p.price>0)};
 }).filter(p=>p.eligible&&p.theme).sort((a,b)=>b.score-a.score||a.index-b.index);
 const first=ranked[0],second=ranked.find(p=>p.theme!==first?.theme)??ranked[1];
 const picks=[first,second].filter(p=>p!==undefined).map(p=>p.index);
 if(!picks.length)return products;
 const selected=new Set(picks);
 return [...picks.map(i=>products[i]),...products.filter((_,i)=>!selected.has(i))];
}
