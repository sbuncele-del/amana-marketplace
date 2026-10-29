import type {ProductGroup} from './product-groups';
const normal=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const departmentAliases:Record<string,string>={kitchen:'kitchen-dining',home:'home-living',living:'furniture',bedroom:'bed-bath',dining:'kitchen-dining',care:'health-beauty',hair:'health-beauty',fragrances:'health-beauty',bathroom:'bed-bath',kids:'toys-kids-baby',play:'toys-kids-baby',baby:'toys-kids-baby',school:'stationery-office-supplies',organisation:'storage-organisation',decor:'home-decor-gifts',outdoor:'garden-outdoor',lighting:'lighting-lamps',audio:'electronics',wearables:'electronics',cleaning:'cleaning-laundry',laundry:'cleaning-laundry',fitness:'fitness-exercise',travel:'clothing-accessories',tools:'tools',automotive:'car-care-tools',fashion:'clothing-accessories'};
const rules:[string,RegExp][]=[
 ['kitchen-dining',/mug|cuisine|kitchen|couteau|couteaux|hachoir|cuisson|poele|casserole|couvert|vaisselle|tasse|coffee|cafe|micro.onde|passoire|ustensile|lunch|therm[oè]|cafetiere|theiere|verre|plat |bouteille|gourde/],
 ['toys-kids-baby',/jouet|toy|puzzle|peluche|poupee|bebe|baby|biberon|enfant|kids|jeu |jeux|playmat/],
 ['health-beauty',/serum|creme|skin|beaute|beauty|cheveu|hair|shampo|brosse.*dent|tooth|rasoir|tondeuse|maquillage|make.?up|ongle|parfum|massage|epil|coiff|savon|soap/],
 ['electronics',/bluetooth|ecouteur|casque|headphone|earbud|smartwatch|montre|chargeur|charger|power.?bank|camera|projecteur|telephone|speaker|haut.parleur|usb|ordinateur|mouse/],
 ['furniture',/canape|fauteuil|chaise|sofa|meuble|table basse|bureau |tabouret/],
 ['storage-organisation',/rangement|organis|etagere|storage|rack|shelf|placard|panier/],
 ['bed-bath',/drap|literie|oreiller|pillow|bedding|duvet|serviette|towel|douche|shower/],
 ['cleaning-laundry',/nettoy|menage|balai|lavage|cleaning|linge|lessive|laundry|aspirateur/],
 ['lighting-lamps',/lampe|eclairage|lighting|lamp\b|veilleuse/],
 ['tools',/outil|tool|perceuse|tournevis|bricolage|pince |reparation/],
 ['garden-outdoor',/jardin|garden|camping|outdoor|arros|barbecue|picnic/],
 ['fitness-exercise',/fitness|sport|exercise|musculation|halter|yoga/],
 ['car-care-tools',/voiture|automotive|auto |car /],
 ['stationery-office-supplies',/scolaire|ecole|stylo|cahier|papeterie|stationery|office/],
 ['clothing-accessories',/vetement|bijou|lunette|sac |bag\b|fashion|bracelet/],
 ['home-decor-gifts',/vase|decor|cadre|horloge|gift|cadeau/]
];
export function primaryDepartment(group:Pick<ProductGroup,'title'|'category'>){
 const title=normal(Object.values(group.title).join(' '));
 return rules.find(([,pattern])=>pattern.test(title))?.[0]||rules.find(([,pattern])=>pattern.test(normal(group.category)))?.[0]||'home-living';
}
export function belongsToDepartment(group:Pick<ProductGroup,'title'|'category'>,department:string){
 const target=departmentAliases[department]||department,primary=primaryDepartment(group);
 if(target===primary)return true;
 if(target==='home-living')return ['home-living','furniture','bed-bath','storage-organisation','home-decor-gifts','lighting-lamps'].includes(primary);
 if(target==='diy-hardware')return ['tools','hardware'].includes(primary);
 const extra:Record<string,RegExp>={'air-fryers':/air.?fryer|friteuse/,'backup-power':/power.?bank|batterie|generateur|backup/,'security':/camera|securite|security|alarme|cadenas/,'outdoor-solar-lighting':/solaire|solar/,'camping-braai-picnic':/camping|barbecue|picnic|pique.nique/,'garden-care':/jardin|garden|arros/,'measuring-tools-scales':/mesur|balance|scale|measure/,'car-electronics-accessories':/voiture|automotive/,'sports-accessories':/sport|fitness/,'affordable-wardrobes':/armoire|wardrobe/,'ladders':/echelle|ladder/,'outdoor-activities':/outdoor|exterieur|camping/,'electrical-accessories':/electri|prise|rallonge|cable/};
 return !!extra[target]?.test(normal(Object.values(group.title).join(' ')));
}
export function browseGroups(groups:ProductGroup[],filters:{category:string;search:string;available:boolean;min:string;max:string;sort:string}){
 const term=normal(filters.search.trim());
 const validBound=(value:string)=>value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0;
 const result=groups.filter(g=>(!filters.category||belongsToDepartment(g,filters.category))&&(!term||normal(Object.values(g.title).join(' ')).includes(term))&&(!filters.available||g.stock>0)&&(!validBound(filters.min)||g.priceMillimes>=Number(filters.min)*1000)&&(!validBound(filters.max)||g.priceMillimes<=Number(filters.max)*1000));
 if(filters.sort==='price-low')result.sort((a,b)=>a.priceMillimes-b.priceMillimes||a.id.localeCompare(b.id));
 if(filters.sort==='price-high')result.sort((a,b)=>b.priceMillimes-a.priceMillimes||a.id.localeCompare(b.id));
 return result;
}
