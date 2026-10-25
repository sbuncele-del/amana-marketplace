/** Content-based recommendations. No sales or customer-behaviour claims. */
export type RecommendationItem = {slug:string;name:string;price:number;category:{slug:string}};
const stop=new Set('with for and the your from piece set pack inch mini portable electric modern multifunction multifunctional design new home'.split(' '));
function terms(name:string){return new Set(name.toLowerCase().replace(/couches|couch|sofas/g,'sofa').replace(/mugs/g,'mug').split(/[^a-z]+/).filter(w=>w.length>2&&!stop.has(w)));}
// Product-type relationships, never fixed product lists or compatibility promises.
const relationships:[RegExp,RegExp][]=[
 [/\b(coffee|mug|teapot|tea)\b/i,/\b(coffee|mug|teapot|tea|coaster|milk frother|kettle)\b/i],
 [/\b(sofa|couch|armchair)\b/i,/\b(side table|coffee table|throw|cushion|rug)\b/i],
 [/\b(bed|mattress)\b/i,/\b(pillow|duvet|bedside|bed sheet|blanket)\b/i],
 [/\b(desk|office chair)\b/i,/\b(desk lamp|desk organiser|monitor stand|office chair)\b/i],
 [/\b(pot|pan|cookware)\b/i,/\b(utensil|spatula|trivet|oven glove)\b/i],
];
export function rankRecommendations<T extends RecommendationItem>(viewed:RecommendationItem,items:T[]){
 const source=terms(viewed.name);const related=relationships.find(([trigger])=>trigger.test(viewed.name))?.[1];
 const scored=items.filter(p=>p.slug!==viewed.slug).map(p=>{
  const shared=[...terms(p.name)].filter(w=>source.has(w)).length;
  const same=p.category.slug===viewed.category.slug;
  const proximity=1/(1+Math.abs(Math.log(Math.max(p.price,1)/Math.max(viewed.price,1))));
  return {p,shared,score:shared*10+(same?3:0)+proximity};
 });
 const similar=scored.filter(x=>x.shared>0).sort((a,b)=>b.score-a.score||a.p.slug.localeCompare(b.p.slug)).map(x=>x.p);
 const complements=related?scored.filter(x=>related.test(x.p.name)&&x.shared===0).sort((a,b)=>b.score-a.score||a.p.slug.localeCompare(b.p.slug)).map(x=>x.p):[];
 return {similar,complements};
}
