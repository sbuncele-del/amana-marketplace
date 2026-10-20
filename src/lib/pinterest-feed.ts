import type {CatalogueProduct} from './catalogue';
import {siteUrl} from './site';

const columns = ['id','title','description','link','image_link','price','availability','item_group_id','condition','product_type','google_product_category'];
const restricted = /\b(?:vape|vaping|tobacco|nicotine|cigarette|cbd|cannabis|sex|sexual|dildo|vibrator|aphrodisiac|supplement|weight loss|slimming|fat burner|weapon|ammunition|crossbow|slingshot)\b/i;
const plain = (value:string) => value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const cell = (value:string) => '"'+value.replace(/"/g,'""')+'"';

// Category IDs verified against Google's published English product taxonomy.
// Match the product function first; use its department only as a fallback.
const googleCategoryRules: [RegExp,string][] = [
 [/\bkey\s*chains?\b/i,"175"], // Apparel & Accessories > Handbag & Wallet Accessories > Keychains
 [/blood pressure/i,"495"], // Health & Beauty > Health Care > Biometric Monitors > Blood Pressure Monitors
 [/\bair.?fryer|deep fryer/i,"738"], // Home & Garden > Kitchen & Dining > Kitchen Appliances > Deep Fryers
 [/\b(?:security|surveillance|cctv|wi.?fi).*camera/i,"362"], // Cameras & Optics > Cameras > Surveillance Cameras
 [/\b(?:safe|safes)\b/i,"3819"], // Home & Garden > Business & Home Security > Security Safes
 [/\bwardrobe|armoire/i,"4063"], // Furniture > Cabinets & Storage > Armoires & Wardrobes
 [/\b(?:bed frame|bedframe|bunk bed)\b/i,"505764"], // Furniture > Beds & Accessories > Beds & Bed Frames
 [/\b(?:office|dining|folding|camping|gaming|bar|recliner|accent)?\s*chairs?\b|\bbar ?stools?\b/i,"443"], // Furniture > Chairs
 [/\bsofa|\bcouch/i,"460"], // Furniture > Sofas
 [/\b(?:coffee|dining|picnic|bedside|side|console|folding) tables?\b/i,"6392"], // Furniture > Tables
 [/\bcurtain|\bdrape/i,"2882"], // Home & Garden > Decor > Window Treatments > Curtains & Drapes
 [/\btowels?\b/i,"4077"], // Home & Garden > Linens & Bedding > Towels
 [/\bduvet|\bpillow|\bblanket|\bcomforter|\bbed.?sheet/i,"569"], // Home & Garden > Linens & Bedding > Bedding
 [/\brugs?\b|\bcarpet/i,"598"], // Home & Garden > Decor > Rugs
 [/\bmirrors?\b/i,"595"], // Home & Garden > Decor > Mirrors
 [/\bclocks?\b/i,"3890"], // Home & Garden > Decor > Clocks
 [/\blight bulbs?\b|\bled bulbs?\b/i,"2425"], // Home & Garden > Lighting > Light Bulbs
 [/\blamps?\b/i,"4636"], // Home & Garden > Lighting > Lamps
 [/\b(?:solar|sensor|ceiling|wall|led|fairy|string).*light/i,"594"], // Home & Garden > Lighting
 [/\bheadphones?\b|\bearbuds?\b|\bearphones?\b/i,"543626"], // Electronics > Audio > Audio Components > Headphones & Headsets > Headphones
 [/\bspeakers?\b|\bsoundbar/i,"249"], // Electronics > Audio > Audio Components > Speakers
 [/\bphone case|\biphone.*case/i,"2353"], // Electronics > Communications > Telephony > Mobile Phone Accessories > Mobile Phone Cases
 [/\b(?:smart ?watch|wristwatch|watches)\b/i,"201"], // Apparel & Accessories > Jewelry > Watches
 [/\bsolar panels?\b/i,"4714"], // Hardware > Power & Electrical Supplies > Solar Panels
 [/\bgenerator/i,"1218"], // Hardware > Power & Electrical Supplies > Generators
 [/\bextension (?:cord|cable|lead)/i,"4789"], // Hardware > Power & Electrical Supplies > Extension Cords
 [/\bpower strip|surge protect/i,"3160"], // Electronics > Electronics Accessories > Power > Power Strips & Surge Suppressors
 [/\b(?:rechargeable|lithium|alkaline|aa|aaa).*batter/i,"276"], // Electronics > Electronics Accessories > Power > Batteries
 [/\bhair dryer|\bhairdryer/i,"490"], // Health & Beauty > Personal Care > Hair Care > Hair Styling Tools > Hair Dryers
 [/\bhair clipper|\b(?:beard|hair).*trimmer/i,"533"], // Health & Beauty > Personal Care > Shaving & Grooming > Hair Clippers & Trimmers
 [/\bcurling iron|\bhair straightener|\bflat iron/i,"6019"], // Health & Beauty > Personal Care > Hair Care > Hair Styling Tools
 [/\bperfume|\bcologne|\bfragrance/i,"479"], // Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne
 [/\b(?:face|facial|skin).*?(?:serum|cream|cleanser|mask)|\bsunscreen/i,"567"], // Health & Beauty > Personal Care > Cosmetics > Skin Care
 [/\bladders?\b/i,"6928"], // Hardware > Tools > Ladders & Scaffolding > Ladders
 [/\btrampoline/i,"1738"], // Toys & Games > Outdoor Play Equipment > Trampolines
 [/\bswimming pool/i,"2810"], // Home & Garden > Pool & Spa > Swimming Pools
 [/\b(?:baby|infant|toddler).*?(?:toy|rattle|play.?mat)/i,"2847"], // Baby & Toddler > Baby Toys & Activity Equipment
 [/\bboard game/i,"1246"], // Toys & Games > Games > Board Games
 [/\bdolls?\b/i,"1257"], // Toys & Games > Toys > Dolls, Playsets & Toy Figures > Dolls
 [/\btoys?\b|\bplayset/i,"1253"], // Toys & Games > Toys
 [/\bbackpacks?\b/i,"100"], // Luggage & Bags > Backpacks
 [/\bhandbags?\b/i,"3032"], // Apparel & Accessories > Handbags, Wallets & Cases > Handbags
 [/\bwallet/i,"2668"], // Apparel & Accessories > Handbags, Wallets & Cases > Wallets & Money Clips
 [/\b(?:sneakers?|sandals?|slippers?|shoes|boots)\b/i,"187"], // Apparel & Accessories > Shoes
 [/\blunch ?box|\blunch bag/i,"669"], // Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Lunch Boxes & Totes
 [/\bwater bottle|\bflask/i,"3809"], // Home & Garden > Kitchen & Dining > Food & Beverage Carriers > Water Bottles
 [/\bfood.*container|\bairtight.*container/i,"667"], // Home & Garden > Kitchen & Dining > Food Storage > Food Storage Containers
 [/\b(?:frying|sauce|stock|cooking).*?(?:pan|pot)|\bcookware/i,"654"], // Home & Garden > Kitchen & Dining > Cookware & Bakeware > Cookware
 [/\b(?:vegetable|food).*?(?:cutter|chopper|slicer)|\bgrater|\bpeeler/i,"668"], // Home & Garden > Kitchen & Dining > Kitchen Tools & Utensils
 [/\bblender|\bfood mixer/i,"505666"], // Home & Garden > Kitchen & Dining > Kitchen Appliances > Food Mixers & Blenders
 [/\b(?:electric|cordless).*kettle/i,"751"], // Home & Garden > Kitchen & Dining > Kitchen Appliances > Electric Kettles
 [/\b(?:drinking glasses|mugs?|tumblers?|wine glasses)\b/i,"674"], // Home & Garden > Kitchen & Dining > Tableware > Drinkware
 [/\b(?:storage|shoe).*?(?:rack|organizer|organiser|box)|\b(?:organizer|organiser)\b/i,"636"], // Home & Garden > Household Supplies > Storage & Organization
 [/\b(?:desk|pedestal|standing|portable).*fan\b/i,"608"], // Home & Garden > Household Appliances > Climate Control Appliances > Fans
 [/\b(?:dog|cat|pet).*?(?:toy|bed|bowl|collar|leash|carrier|groom)/i,"2"], // Animals & Pet Supplies > Pet Supplies
];
const departmentGoogleCategories:Record<string,string> = {
 "home-living": "536",
 "electronics": "222",
 "electrical-accessories": "127",
 "kitchen-dining": "638",
 "health-beauty": "469",
 "diy-hardware": "632",
 "furniture": "436",
 "toys-kids-baby": "1239",
 "tools": "1167",
 "stationery-office-supplies": "922",
 "garden-outdoor": "689",
 "storage-organisation": "636",
 "home-decor-gifts": "696",
 "lighting-lamps": "594",
 "bed-bath": "4171",
 "cleaning-laundry": "630",
 "clothing-accessories": "166",
 "outdoor-solar-lighting": "594",
 "outdoor-activities": "1011",
 "fitness-exercise": "990",
 "car-care-tools": "5613",
 "garden-care": "689",
 "camping-braai-picnic": "1013",
 "backup-power": "275",
 "security": "359",
 "measuring-tools-scales": "1305",
 "hardware": "632",
 "car-electronics-accessories": "5613",
 "sports-accessories": "988",
 "affordable-wardrobes": "4063",
 "air-fryers": "738",
 "ladders": "6928"
};
export function googleProductCategory(product:Pick<CatalogueProduct,'name'|'category'>) {
 return googleCategoryRules.find(([pattern])=>pattern.test(product.name))?.[1]
  ?? departmentGoogleCategories[product.category.slug] ?? '536';
}

// One representative offer per product, matching the variant selected on arrival.
// Do not publish supplier cost, invented brands, ratings, or missing stock as available.
export function buildPinterestFeed(products:CatalogueProduct[]) {
 const rows:string[][]=[];
 for(const product of products) {
  if(restricted.test(product.name))continue;
  const variant=product.variants.find(v=>v.supplierAvailable)||product.variants[0];
  if(!variant||!Number.isFinite(variant.price)||variant.price<=0)continue;
  const title=plain(product.name).slice(0,500);
  const description=plain(product.description||product.details||product.name).slice(0,10000);
  const imageSource=variant.image||product.images[0];
  if(!imageSource)continue;
  let image:URL;
  try {image=new URL(imageSource,siteUrl);}catch {continue;}
  if(!['https:','http:'].includes(image.protocol)||!title||!description)continue;
  const link=new URL('/product/'+encodeURIComponent(product.slug),siteUrl);
  if(link.href.length>511||image.href.length>2000)continue;
  rows.push([product.id.slice(0,127),title,description,link.href,image.href,variant.price.toFixed(2)+' ZAR',variant.supplierAvailable?'in stock':'out of stock',product.id.slice(0,127),'new',product.category.name,googleProductCategory(product)]);
 }
 return {csv:[columns.map(cell).join(','),...rows.map(row=>row.map(cell).join(','))].join('\r\n')+'\r\n',count:rows.length};
}
