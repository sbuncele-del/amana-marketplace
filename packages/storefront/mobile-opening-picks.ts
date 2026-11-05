type PickDetails={title:string;category:string;available:boolean;image?:string;price:number};

const care=/\b(?:skincare|skin care|make[ -]?up|cosmetic|vanity mirror|perfume|fragrance|manicure|hair ?brush|hair dryer|straightener|parfum|miroir maquillage|seche[ -]cheveux|brosse soufflante|lisseur)\b|عطر|مكياج|مجفف الشعر|العناية بالبشرة/i;
const style=/\b(?:jewellery|jewelry|earrings|handbag|tote bag|crossbody|sac (?:a main|bandouliere|femme)|bijou[xs]?|boucles d.oreilles)\b|حقيبة يد|مجوهرات|أقراط/i;
const home=/\b(?:organis[ez]er|storage basket|makeup storage|spice rack|drawer divider|table lamp|organisateur|panier de rangement|boite de rangement|lampe de table)\b|منظم|سلة تخزين|مصباح طاولة/i;
const hydration=/\b(?:tumblers?|travel mugs?|water bottles?|drink bottles?|sports bottles?|flasks?|gourdes?|mugs? isothermes?|bouteilles? (?:d.eau|isothermes?))\b|زجاجة ماء|قارورة ماء|كوب حراري/i;

type Theme='care'|'style'|'home'|'other';
const homeDepartments=['home-living','storage-organisation','home-decor-gifts','kitchen-dining','bed-bath'];
const opening:Theme[]=['care','style','home','care','style','home','other','other'];

// Merchandise the first four rows from the existing page. Seasonal products
// remain in the feed; the campaign artwork has its own placement.
export function mobileOpeningPicks<T>(products:T[],details:(product:T)=>PickDetails,budget:number):T[]{
 const candidates=products.flatMap((product,index)=>{
  const p=details(product);
  const name=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(!p.available||!p.image||!Number.isFinite(p.price)||p.price<=0||hydration.test(name))return [];
  const exact:Theme|undefined=style.test(name)?'style':care.test(name)?'care':home.test(name)?'home':undefined;
  const theme:Theme=exact??(p.category==='clothing-accessories'?'style':homeDepartments.includes(p.category)?'home':'other');
  return [{index,theme,score:(exact?4:0)+(p.price<=budget?2:0)}];
 }).sort((a,b)=>b.score-a.score||a.index-b.index);

 const selected=new Set<number>();
 let previous:Theme|undefined;
 for(const theme of opening){
  const next=candidates.find(p=>p.theme===theme&&!selected.has(p.index))
   ??candidates.find(p=>p.theme!==previous&&!selected.has(p.index))
   ??candidates.find(p=>!selected.has(p.index));
  if(!next)break;
  selected.add(next.index);
  previous=next.theme;
 }
 return [...Array.from(selected,index=>products[index]),...products.filter((_,index)=>!selected.has(index))];
}
