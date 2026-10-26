export type MissionProduct = {slug:string; name:string; price:number; images:string[]};
export type MissionGroup = {id:string; title:string; description:string; match:RegExp};
export type ShoppingMission = {slug:string; title:string; shortTitle:string; description:string; image:string; imageAlt:string; groups:MissionGroup[]; checklist:string[]};
export const shoppingMissions:ShoppingMission[] = [
 {slug:'small-space-living',shortTitle:'Make more room at home',title:'Make room for better living.',description:'Storage, organi[sz]\w*ation and thoughtful furniture. Find a useful starting point for the space you have.',image:'/brand/plentovo-living.webp',imageAlt:'A warm living room with a sofa, table and plants',groups:[
  {id:'kitchen',title:'Clear the kitchen counters',description:'Give utensils, ingredients and everyday kitchen essentials a place.',match:/\b(spice rack\b|dish rack\b|kitchen.*(?:rack\b|organi[sz]\w*|storage)|food.*container|utensil.*holder)/i},
  {id:'bedroom',title:'Bring order to the bedroom',description:'Explore wardrobe, shoe and under-bed organi[sz]\w*ation.',match:/\b(shoe.*(?:rack\b|storage)|wardrobe.*organi[sz]\w*|under.?bed.*storage|clothes.*(?:rack\b|organi[sz]\w*)|drawer.*organi[sz]\w*)/i},
  {id:'living',title:'Choose furniture with a purpose',description:'Compare shelves, side tables and storage furniture for your room.',match:/\b(storage ottoman|storage bench|side table|nesting table|bookshelf\b|bookcase|shoe cabinet)/i},
  {id:'bathroom',title:'Keep daily essentials together',description:'Look for shelves and organi[sz]\w*ers suited to your bathroom layout.',match:/\b(bathroom.*(?:rack\b|shelf\b|shelves|organi[sz]\w*|storage)|shower.*(?:caddy|rack\b|shelf)|toiletry.*organi[sz]\w*)/i}
 ],checklist:['Measure your available floor space, doorways and clearance before choosing furniture.','Check product dimensions and installation requirements on the product page. Ask us if a measurement is missing.','Choose storage around the things you use most, rather than filling every available corner.']},
 {slug:'kitchen-made-easier',shortTitle:'Make everyday cooking easier',title:'A little more ease in the kitchen.',description:'Find useful tools for preparing, cooking and keeping things organi[sz]\w*ed. Start with what would make your day easier.',image:'/brand/categories/cookware-v1.webp',imageAlt:'A selection of cookware',groups:[
  {id:'prepare',title:'Prepare with less fuss',description:'Explore preparation tools for the meals you make.',match:/\b(chopper|vegetable cutter|peeler|chopping board|cutting board|grater|colander)/i},
  {id:'cook',title:'Find your cooking essentials',description:'Compare cookware and utensils for everyday meals.',match:/\b(frying pan|saucepan|cookware|spatula|cooking utensil|stock pot)/i},
  {id:'store',title:'Keep ingredients in order',description:'Containers, racks and holders for your kitchen.',match:/\b(food.*container|spice rack\b|kitchen.*organi[sz]\w*|utensil.*holder|dish rack\b)/i},
  {id:'coffee',title:'Make time for a cup',description:'Explore mugs and useful coffee accessories.',match:/\b(coffee mug|coffee cup|coffee.*(?:grinder|frother|filter)|milk frother|teapot|ceramic mug)/i}
 ],checklist:['Check capacity and dimensions against the portions and cupboard space you need.','Confirm cookware material and hob compatibility in the product details.','Choose tools for your usual meals; extra pieces are useful only when you will use them.']},
 {slug:'outdoor-living',shortTitle:'Enjoy more time outside',title:'Make good days outside.',description:'Find practical starting points for the garden, an outdoor meal or a day away. Choose the occasion that fits.',image:'/brand/categories/furniture-v1.webp',imageAlt:'Furniture inspiration',groups:[
  {id:'light',title:'Light up the evening',description:'Explore outdoor lighting and compare its stated specifications.',match:/\b(outdoor.*(?:light|lamp)|solar.*(?:light|lamp)|garden.*light|string light)/i},
  {id:'gather',title:'Make space to gather',description:'Compare seating and tables for your outdoor setting.',match:/\b(patio.*(?:chair|table|set)|outdoor.*(?:chair|table|bench)|camping chair|folding.*(?:chair|table))/i},
  {id:'picnic',title:'Pack for a day out',description:'Find picnic and cooler essentials for your plans.',match:/\b(picnic|cooler bag|cooler box|camping.*(?:cook|utensil)|braai.*(?:tool|utensil|grid))/i},
  {id:'garden',title:'Give the garden some care',description:'Explore watering and simple gardening tools.',match:/\b(garden hose|hose pipe|watering can|pruning|garden.*tool|plant pot|planter)/i}
 ],checklist:['Check whether the listed materials and specifications suit outdoor use.','Measure the space and consider storage when furniture is not in use.','Read lighting power, charging and weather-resistance specifications before choosing.']}
];
export function getShoppingMission(slug:string){return shoppingMissions.find(m=>m.slug===slug);}
export function missionCandidates<T extends MissionProduct>(mission:ShoppingMission,items:T[],group?:string,priority:string[]=[]){
 const order=new Map(priority.map((slug,index)=>[slug,index]));
 const groups=mission.groups.filter(g=>!group||g.id===group);
 return groups.map(g=>({group:g,products:items.filter(p=>p.images.length>0&&g.match.test(p.name)).sort((a,b)=>(order.get(a.slug)??priority.length)-(order.get(b.slug)??priority.length)||a.slug.localeCompare(b.slug))}));
}
export function missionBudget(value:unknown):number|undefined{
 const n=typeof value==='string'?Number(value):NaN;
 return Number.isFinite(n)&&n>0?Math.min(n,1000000):undefined;
}
