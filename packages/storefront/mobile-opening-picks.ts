type PickDetails={title:string;category:string;available:boolean;image?:string;price:number};

const care=/\b(?:skincare|skin care|make[ -]?up|cosmetic|vanity mirror|perfume|fragrance|manicure|hair ?brush|hair dryer|straightener|parfum|miroir maquillage|seche[ -]cheveux|brosse soufflante|lisseur)\b|عطر|مكياج|مجفف الشعر|العناية بالبشرة/i;
const style=/\b(?:jewellery|jewelry|earrings|handbag|tote bag|crossbody|sac (?:a main|bandouliere|femme)|bijou[xs]?|boucles d.oreilles)\b|حقيبة يد|مجوهرات|أقراط/i;
const home=/\b(?:organis[ez]er|storage basket|makeup storage|spice rack|drawer divider|table lamp|food storage|lunch box|chopping board|cutting board|colander|measuring cups?|organisateur|panier de rangement|boite de rangement|lampe de table)\b|منظم|سلة تخزين|مصباح طاولة/i;
const hydration=/\b(?:tumblers?|travel mugs?|water bottles?|drink bottles?|sports bottles?|flasks?|gourdes?|mugs? isothermes?|bouteilles? (?:d.eau|isothermes?))\b|زجاجة ماء|قارورة ماء|كوب حراري/i;

const clinical=/\b(?:blood[ -]pressure|sphygmomanometer|tensiometre|tension arterielle|oximeter|oxymetre|glucometer|glucometre|blood glucose|nebulizer|nebuliser|nebuliseur)\b|ضغط الدم|قياس السكر|مقياس التأكسج/i;

type Theme='home'|'care'|'style';
const opening:Theme[]=['home','care','style','home','care','style','home','care'];

// Give the opening rows to recognisable everyday uses. Keep specialist and
// hydration products in the feed, after the rest of this page's assortment.
export function mobileOpeningPicks<T>(products:T[],details:(product:T)=>PickDetails,budget:number):T[]{
 const entries=products.map((product,index)=>{
  const p=details(product);
  const name=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const deferred=clinical.test(name)||hydration.test(name);
  const theme:Theme|undefined=style.test(name)?'style':home.test(name)?'home':care.test(name)?'care':undefined;
  const eligible=p.available&&!!p.image&&Number.isFinite(p.price)&&p.price>0;
  return {product,index,deferred,theme,eligible,withinBudget:p.price<=budget};
 });
 const candidates=entries.filter(p=>p.eligible&&p.theme&&!p.deferred)
  .sort((a,b)=>Number(b.withinBudget)-Number(a.withinBudget)||a.index-b.index);

 const selected=new Set<number>();
 for(const theme of opening){
  const next=candidates.find(p=>p.theme===theme&&!selected.has(p.index))
   ??candidates.find(p=>!selected.has(p.index));
  if(!next)break;
  selected.add(next.index);
 }
 const remaining=entries.filter(p=>!selected.has(p.index));
 return [
  ...Array.from(selected,index=>products[index]),
  ...remaining.filter(p=>!p.deferred).map(p=>p.product),
  ...remaining.filter(p=>p.deferred).map(p=>p.product),
 ];
}
