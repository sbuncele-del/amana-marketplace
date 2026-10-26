export type MissionProduct = {slug:string; name:string; price:number; images:string[]; supplierAvailable?:boolean};
export type MissionGroup = {id:string; title:string; description:string; match:RegExp; exclude?:RegExp};
export type ShoppingMission = {slug:string; title:string; shortTitle:string; description:string; image:string; imageAlt:string; groups:MissionGroup[]; checklist:string[]};
export const shoppingMissions:ShoppingMission[] = [
 {slug:'small-space-living',shortTitle:'Make more room at home',title:'Make room for better living.',description:'Storage, organisation and thoughtful furniture. Find a useful starting point for the space you have.',image:'/brand/plentovo-living.webp',imageAlt:'A warm living room with a sofa, table and plants',groups:[
  {id:'kitchen',title:'Clear the kitchen counters',description:'Give utensils, ingredients and everyday kitchen essentials a place.',match:/\b(spice rack\b|dish rack\b|kitchen.*(?:rack\b|organi[sz]\w*|storage)|food.*container|utensil.*holder)/i},
  {id:'bedroom',title:'Bring order to the bedroom',description:'Explore wardrobe, shoe and under-bed organisation.',match:/\b(shoe.*(?:rack\b|storage)|wardrobe.*organi[sz]\w*|under.?bed.*storage|clothes.*(?:rack\b|organi[sz]\w*)|drawer.*organi[sz]\w*)/i},
  {id:'living',title:'Choose furniture with a purpose',description:'Compare shelves, side tables and storage furniture for your room.',match:/\b(storage ottoman|storage bench|side table|nesting table|bookshelf\b|bookcase|shoe cabinet)/i},
  {id:'bathroom',title:'Keep daily essentials together',description:'Look for shelves and organisers suited to your bathroom layout.',match:/\b(bathroom.*(?:rack\b|shelf\b|shelves|organi[sz]\w*|storage)|shower.*(?:caddy|rack\b|shelf)|toiletry.*organi[sz]\w*)/i}
 ],checklist:['Measure your available floor space, doorways and clearance before choosing furniture.','Check product dimensions and installation requirements on the product page. Ask us if a measurement is missing.','Choose storage around the things you use most, rather than filling every available corner.']},
 {slug:'kitchen-made-easier',shortTitle:'Make everyday cooking easier',title:'A little more ease in the kitchen.',description:'Find useful tools for preparing, cooking and keeping things organised. Start with what would make your day easier.',image:'/brand/categories/cookware-v1.webp',imageAlt:'A selection of cookware',groups:[
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
 ],checklist:['Check whether the listed materials and specifications suit outdoor use.','Measure the space and consider storage when furniture is not in use.','Read lighting power, charging and weather-resistance specifications before choosing.']},
 {"slug":"bathroom","shortTitle":"Refresh your bathroom","title":"Make the everyday feel a little better.","description":"Find a place for daily essentials, refresh your bathroom and make your routine easier.","image":"/brand/categories/personal-care-v1.webp","imageAlt":"Refresh your bathroom inspiration",groups:[
  {id:"storage",title:"Give everything a place",description:"Shelves, caddies and organisers for bathroom essentials.",match:/\b(bathroom.*(?:rack\b|shelf\b|shelves|organi[sz]\w*|storage|cabinet)|shower.*(?:caddy|rack\b|shelf\b))/i},
  {id:"basin",title:"Tidy up around the basin",description:"Keep the things you reach for within easy reach.",match:/\b(soap dispenser|soap dish|toothbrush holder|toothpaste dispenser|bathroom.*(?:cup|tumbler))/i},
  {id:"comfort",title:"Add some everyday comfort",description:"Explore mats, towels and useful finishing touches.",match:/\b(bath mat|bathroom mat|bath towel|bath sheet|towel.*(?:rail|rack\b|holder))/i},
  {id:"routine",title:"Simplify your routine",description:"Mirrors and accessories for your daily routine.",match:/\b(vanity mirror|makeup mirror|bathroom mirror|shower head|shower curtain)/i}
 ],checklist:["Measure the area around your basin, shower and doors before choosing storage.","Check installation instructions and whether fittings suit your walls.","Read materials, care instructions and product dimensions before buying."]},
 {"slug":"bedroom","shortTitle":"Make your bedroom your own","title":"More room to rest and recharge.","description":"Explore bedding, bedside furniture and organisation for a bedroom that works around you.","image":"/brand/categories/bedding-v1.webp","imageAlt":"Make your bedroom your own inspiration",groups:[
  {id:"bedding",title:"Start with the bed",description:"Compare bedding and covers for your bed size.",match:/\b(duvet|bedding|bed sheet|pillowcase|comforter|mattress protector)/i},
  {id:"bedside",title:"Keep things close by",description:"Find useful bedside tables, lights and small essentials.",match:/\b(bedside|nightstand|night stand|bedside lamp)/i},
  {id:"wardrobe",title:"Bring order to your clothes",description:"Give shoes, clothes and accessories an organised place.",match:/\b(wardrobe|shoe.*(?:rack\b|storage|cabinet)|clothes.*(?:rack\b|organi[sz]\w*)|drawer.*organi[sz]\w*)/i},
  {id:"finish",title:"Make it feel like you",description:"Explore cushions, throws and bedroom finishing touches.",match:/\b(throw blanket|decorative cushion|cushion cover|bedroom.*(?:mirror|rug)|full.length mirror)/i}
 ],checklist:["Confirm bed size, linen dimensions and what is included in each set.","Measure bedside space and leave room for drawers and doors to open.","Check fabric composition and washing instructions against your preferences."]},
 {"slug":"dining-room","shortTitle":"Bring everyone to the table","title":"Good things happen around a table.","description":"Find dining furniture, tableware and serving essentials for everyday meals and shared occasions.","image":"/brand/categories/cookware-v1.webp","imageAlt":"Bring everyone to the table inspiration",groups:[
  {id:"furniture",title:"Find your place at the table",description:"Compare dining tables, chairs and counter seating.",match:/\b(dining (?:table|chair|set)|counter stool|bar stool|breakfast.*(?:table|stool))/i},
  {id:"tableware",title:"Set the table your way",description:"Explore plates, bowls and cutlery for your meals.",match:/\b(dinner set|dinnerware|dining plate|dinner plate|cutlery|ceramic bowl|salad bowl)/i},
  {id:"serve",title:"Make serving easier",description:"Find trays, platters and useful serving pieces.",match:/\b(serving (?:tray|platter|bowl|dish)|cake stand|salad server)/i},
  {id:"drinks",title:"Pour something good",description:"Compare glasses, carafes and drinkware.",match:/\b(wine glass|drinking glass|glass tumbler|carafe|glass jug|champagne glass|water pitcher)/i}
 ],checklist:["Measure your dining area and allow room for chairs to pull out.","Check seat heights against your table or counter height.","Confirm the number of pieces, capacity and care requirements of tableware sets."]},
 {"slug":"living-room","shortTitle":"Make yourself at home","title":"A living room for real life.","description":"Explore sofas, tables, lighting and finishing touches around the way you use your living room.","image":"/brand/categories/furniture-v1.webp","imageAlt":"Make yourself at home inspiration",groups:[
  {id:"seating",title:"Find your favourite seat",description:"Compare couches, sofas and lounge seating.",match:/\b(couch|sofa|armchair|lounge chair|recliner)/i},
  {id:"tables",title:"Give the everyday a place",description:"Explore coffee tables, side tables and consoles.",match:/\b(coffee table|side table|console table|nesting table)/i},
  {id:"storage",title:"Keep the room in order",description:"Find storage for books, media and everyday essentials.",match:/\b(tv stand|tv cabinet|media cabinet|bookshelf|bookcase|storage ottoman)/i},
  {id:"finishing",title:"Bring the room together",description:"Explore lighting, rugs and decorative touches.",match:/\b(floor lamp|table lamp|area rug|living room rug|throw blanket|decorative cushion)/i}
 ],checklist:["Measure the room, doorways and access route before choosing large furniture.","Check seating dimensions, materials and assembly requirements in the listing.","Ask us to confirm missing specifications before making a decision."]},
 {"slug":"home-office","shortTitle":"Make space for your best work","title":"A workspace that works for you.","description":"Find furniture, organisation and useful accessories for working or studying at home.","image":"/brand/categories/kids-school-v1.webp","imageAlt":"Make space for your best work inspiration",groups:[
  {id:"workspace",title:"Start with your workspace",description:"Explore desks and office seating.",match:/\b(office chair|computer desk|writing desk|study desk|office desk|desk chair)/i},
  {id:"order",title:"Clear a little thinking space",description:"Find holders and organisers for your desk.",match:/\b(desk organi[sz]\w*|stationery.*(?:holder|organi[sz]\w*)|file.*(?:holder|rack\b|organi[sz]\w*)|monitor stand|cable organi[sz]\w*)/i},
  {id:"light",title:"Light up the task",description:"Explore lighting and useful desk accessories.",match:/\b(desk lamp|reading lamp|book stand|laptop stand|laptop table)/i},
  {id:"accessories",title:"Add useful workday tools",description:"Compare computer and writing accessories.",match:/\b(computer mouse|wireless mouse|mouse pad|keyboard|notebook|whiteboard)/i}
 ],checklist:["Measure desk height, legroom and available floor space.","Check device compatibility and connection requirements for accessories.","Compare chair dimensions and adjustment details rather than relying on appearance."]},
 {"slug":"cleaning","shortTitle":"Make cleaning feel simpler","title":"Useful help for a fresh start.","description":"Find tools for floors, surfaces and everyday cleaning jobs around the home.","image":"/brand/categories/organisation-v1.webp","imageAlt":"Make cleaning feel simpler inspiration",groups:[
  {id:"floors",title:"Take care of the floors",description:"Explore mops, brooms and cleaning tools.",match:/\b(mop\b|broom|dustpan|floor scrubber|floor cleaner)/i},
  {id:"surfaces",title:"Reach the everyday mess",description:"Find brushes and tools for household surfaces.",match:/\b(cleaning brush|scrub brush|microfibre.*cloth|microfiber.*cloth|cleaning cloth|duster)/i},
  {id:"windows",title:"Get into awkward places",description:"Explore tools for windows, glass and corners.",match:/\b(window clean|glass clean|squeegee|crevice.*brush|gap.*brush)/i},
  {id:"tidy",title:"Keep cleaning essentials together",description:"Find bins, holders and useful storage.",match:/\b(dustbin|rubbish bin|trash can|waste bin|cleaning.*(?:caddy|storage)|mop.*holder|broom.*holder)/i}
 ],checklist:["Check that cleaning tools are suitable for the surfaces in your home.","Read power, charging and maintenance details for electrical tools.","Confirm capacities, dimensions and replacement-part requirements."]},
 {"slug":"laundry","shortTitle":"Take the fuss out of laundry","title":"A little more ease on laundry day.","description":"Explore sorting, drying, garment care and storage for your laundry routine.","image":"/brand/categories/organisation-v1.webp","imageAlt":"Take the fuss out of laundry inspiration",groups:[
  {id:"sort",title:"Sort before you start",description:"Find laundry baskets and sorting essentials.",match:/\b(laundry basket|laundry hamper|laundry sorter|laundry bag|wash bag)/i},
  {id:"dry",title:"Make room for drying",description:"Compare clothes airers and drying racks.",match:/\b(drying rack|clothes airer|clothes.*dry|washing line|clothesline|laundry.*rack\b)/i,exclude:/\b(dish|kitchen|bottle)\b/i},
  {id:"care",title:"Look after your clothes",description:"Explore garment-care tools and accessories.",match:/\b(garment steamer|steam iron|ironing board|lint remover|fabric shaver|lint roller)/i},
  {id:"put-away",title:"Put clean clothes in order",description:"Find hangers and wardrobe organisation.",match:/\b(clothes hanger|coat hanger|trouser hanger|wardrobe.*organi[sz]\w*|clothing.*storage|underwear.*organi[sz]\w*)/i}
 ],checklist:["Measure drying and storage space, including folded dimensions.","Check fabric suitability and instructions for garment-care tools.","Confirm capacity and power requirements before choosing appliances."]},
 {"slug":"kids-play","shortTitle":"Make room for play","title":"Big ideas. Little adventures.","description":"Explore creative play, puzzles, games and outdoor fun around your child's interests.","image":"/brand/categories/toys-games-v1.webp","imageAlt":"Make room for play inspiration",groups:[
  {id:"create",title:"Make something of their own",description:"Explore building and creative activities.",match:/\b(building block|construction.*toy|drawing.*(?:set|board)|art set|craft.*kit|magnetic.*tile)/i},
  {id:"think",title:"Give curious minds a challenge",description:"Find puzzles and learning activities.",match:/\b(puzzle|educational toy|learning.*(?:toy|board)|alphabet.*toy|counting.*toy)/i},
  {id:"together",title:"Bring everyone into the game",description:"Explore games to share.",match:/\b(board game|card game|table.*game|chess|domino|family.*game)/i},
  {id:"move",title:"Make space for adventure",description:"Explore active and outdoor play.",match:/\b(kids.*(?:scooter|tent|ball)|children.*(?:scooter|tent)|play tent|water gun|bubble.*(?:gun|machine)|flying saucer.*toy)/i}
 ],checklist:["Check the manufacturer's age guidance and small-parts warnings.","Choose activities around the child's interests and available play space.","Read supervision, assembly and power requirements in the product details."]},
 {"slug":"baby-essentials","shortTitle":"Find your everyday baby essentials","title":"Useful things for little routines.","description":"Explore feeding accessories, changing essentials and organisation for life with a baby.","image":"/brand/categories/baby-essentials-v1.webp","imageAlt":"Find your everyday baby essentials inspiration",groups:[
  {id:"feeding",title:"Prepare for feeding time",description:"Compare feeding accessories and everyday utensils.",match:/\b(baby.*(?:bottle|feeding|bowl|spoon|bib)|silicone bib|feeding bottle|bottle.*drying rack)/i},
  {id:"changing",title:"Keep changing essentials close",description:"Find changing and nappy organisation accessories.",match:/\b(nappy.*(?:bag|organi[sz]\w*|caddy)|diaper.*(?:bag|organi[sz]\w*|caddy)|changing mat|changing pad)/i},
  {id:"bath",title:"Make bath-time preparations",description:"Explore baby bath and care accessories.",match:/\b(baby.*(?:bath|towel|grooming|nail)|infant.*bath)/i},
  {id:"outings",title:"Pack for a little outing",description:"Find bags and accessories for days away from home.",match:/\b(baby bag|nappy bag|diaper bag|stroller.*organi[sz]\w*|pram.*organi[sz]\w*)/i}
 ],checklist:["Confirm age suitability, materials and care instructions before choosing.","Follow manufacturer safety guidance and use products only as intended.","Ask us to clarify missing specifications; product suggestions are not safety endorsements."]},
 {"slug":"beauty-routine","shortTitle":"Make time for everyday care","title":"A little care, your way.","description":"Find grooming tools, beauty organisation and useful accessories for your own routine.","image":"/brand/categories/personal-care-v1.webp","imageAlt":"Make time for everyday care inspiration",groups:[
  {id:"hair",title:"Find your hair-care tools",description:"Compare styling and grooming accessories.",match:/\b(hair.*(?:brush|dryer|straightener|curler|trimmer)|hair clipper|barber.*clipper)/i},
  {id:"groom",title:"Keep everyday grooming simple",description:"Explore grooming and nail-care tools.",match:/\b(beard trimmer|electric shaver|grooming kit|manicure|pedicure|nail clipper|nail file)/i},
  {id:"organise",title:"Give your routine a place",description:"Find beauty and cosmetic organisation.",match:/\b(makeup.*(?:organi[sz]\w*|bag|case)|cosmetic.*(?:organi[sz]\w*|bag|case)|jewellery.*organi[sz]\w*|jewelry.*organi[sz]\w*)/i},
  {id:"mirror",title:"See the details",description:"Compare mirrors and beauty accessories.",match:/\b(makeup mirror|vanity mirror|cosmetic mirror|makeup brush|beauty sponge)/i}
 ],checklist:["Check tool materials, cleaning requirements and suitability for your intended use.","Confirm power, charging and plug details for electrical products.","Read product specifications; appearance alone does not establish performance."]},
 {"slug":"fitness-at-home","shortTitle":"Move more at home","title":"Make a little room to move.","description":"Explore simple exercise equipment around your space, preferences and routine.","image":"/brand/categories/outdoor-play-v1.webp","imageAlt":"Move more at home inspiration",groups:[
  {id:"stretch",title:"Make space to stretch",description:"Find mats and stretching accessories.",match:/\b(yoga mat|exercise mat|yoga block|yoga strap|stretch.*band)/i},
  {id:"strength",title:"Build your equipment gradually",description:"Compare weights and resistance tools.",match:/\b(dumbbell|kettlebell|resistance band|weight plate|push.up board)/i},
  {id:"move",title:"Keep your routine moving",description:"Explore skipping and home exercise accessories.",match:/\b(skipping rope|jump rope|exercise bike|stepper|aerobic step)/i},
  {id:"recover",title:"Make time to unwind",description:"Explore rollers and massage accessories.",match:/\b(foam roller|massage ball|massage roller|massage gun)/i}
 ],checklist:["Check equipment dimensions, stated capacity and assembly requirements.","Choose equipment suited to your experience and available space.","Follow manufacturer instructions; seek qualified advice where appropriate for your health."]},
 {"slug":"travel-essentials","shortTitle":"Pack for your next journey","title":"A little more organised, wherever you go.","description":"Find packing, luggage and comfort accessories around your next trip.","image":"/brand/categories/organisation-v1.webp","imageAlt":"Pack for your next journey inspiration",groups:[
  {id:"pack",title:"Give your packing some order",description:"Explore cubes, bags and travel organisers.",match:/\b(packing cube|travel organi[sz]\w*|luggage organi[sz]\w*|travel.*toiletry|toiletry bag)/i},
  {id:"bags",title:"Choose what carries your day",description:"Compare travel bags, backpacks and luggage.",match:/\b(travel bag|duffel|duffle|suitcase|luggage set|travel backpack)/i},
  {id:"comfort",title:"Make the journey more comfortable",description:"Find pillows and small travel accessories.",match:/\b(travel pillow|neck pillow|travel blanket|sleep mask|eye mask)/i},
  {id:"practical",title:"Keep small essentials together",description:"Explore holders, tags and useful travel tools.",match:/\b(passport holder|passport cover|luggage tag|luggage scale|travel wallet|travel adapter)/i}
 ],checklist:["Check bag dimensions and your carrier's current baggage allowance separately.","Confirm adapter compatibility with your devices and destination.","Compare capacity, materials and care instructions before choosing."]}
];
export function getShoppingMission(slug:string){return shoppingMissions.find(m=>m.slug===slug);}
export function missionCandidates<T extends MissionProduct>(mission:ShoppingMission,items:T[],group?:string,priority:string[]=[],maxPrice?:number){
 const order=new Map(priority.map((slug,index)=>[slug,index]));
 const groups=mission.groups.filter(g=>!group||g.id===group);
 return groups.map(g=>({group:g,products:items.filter(p=>p.images.length>0&&mission.groups.find(candidate=>candidate.match.test(p.name)&&!candidate.exclude?.test(p.name))?.id===g.id).sort((a,b)=>(maxPrice?Number(a.price>maxPrice)-Number(b.price>maxPrice):0)||(order.get(a.slug)??priority.length)-(order.get(b.slug)??priority.length)||Number(b.supplierAvailable===true)-Number(a.supplierAvailable===true)||a.slug.localeCompare(b.slug))}));
}
export function missionBudget(value:unknown):number|undefined{
 const n=typeof value==='string'?Number(value):NaN;
 return Number.isFinite(n)&&n>0?Math.min(n,1000000):undefined;
}

export function missionPage(value:unknown):number{
 const n=typeof value==='string'?Number(value):1;
 return Number.isFinite(n)?Math.max(1,Math.min(10000,Math.floor(n)||1)):1;
}
export function missionWindow<T>(pools:{products:T[]}[],page:number,perGroup=12){
 const totalPages=Math.max(1,...pools.map(p=>Math.ceil(p.products.length/perGroup)));
 return {totalPages,hasNext:page<totalPages,products:pools.flatMap(p=>p.products.slice((page-1)*perGroup,page*perGroup))};
}
export function missionSection(slug:string){
 if(['kitchen-made-easier','bathroom','bedroom','dining-room','living-room','home-office'].includes(slug))return 'Shop by room';
 if(['outdoor-living','travel-essentials'].includes(slug))return 'Out and about';
 return 'Everyday life';
}
