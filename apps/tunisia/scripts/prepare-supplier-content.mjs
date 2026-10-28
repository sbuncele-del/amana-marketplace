// Convert captured, public supplier-page content into reviewable catalogue batches.
// Input excludes prices/costs: those continue to come from the authenticated API.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const input=process.argv[2];
if(!input)throw new Error('Usage: node scripts/prepare-supplier-content.mjs captured-content.json');
const legacy=JSON.parse(fs.readFileSync(path.join(root,'data/shipper-content.json'),'utf8'));
const legacyIds=new Set(legacy.map(x=>x.sourceProductId));
const manifestPath=path.join(root,'data/shipper-content-batches.json');
const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):[];
const records=new Map(previous.flatMap(p=>JSON.parse(fs.readFileSync(path.join(root,'data',p),'utf8'))).map(x=>[x.sourceProductId,x]));
const rules=[
 ['kitchen dining',/cuisine|kitchen|cuisson|cook|café|cafe|vaisselle|poêle|marmite|tasse|mug|gourde|découper|légume|salade|moulin|épice|couteau|tacos|couvert|chantilly|hamburger|pâtisserie|كوب|مطبخ|قهوة/i],
 ['living decor',/canapé|sofa|fauteuil|décor|cheminée|vase|rideau|living|مزهري|ديكور|أريكة/i],
 ['bedroom bedding',/couette|oreiller|drap|literie|bedding|pillow|bedroom|matelas|سرير|وساد/i],
 ['bathroom',/toilette|douche|bain|bathroom|bath |حمام|استحمام/i],
 ['care beauty hair skincare',/visage|soin|beauté|cheveu|coiffure|tondeuse|rasoir|épilat|parfum|makeup|skin|hair|face |manucure|maquillage|sourcil|savon|شعر|بشرة|وجه|حلاق/i],
 ['lighting',/lampe|lamp |éclairage|projecteur|veilleuse|torche|مصباح|إضاءة/i],
 ['play',/jouet|jeux|jeu |toy|games|puzzle|peluche|لعب|لعبة/i],
 ['baby',/bébé|bebe|baby|poussette|tire-lait|allaitement|biberon|طفل|رضيع|رضاعة/i],
 ['outdoor',/camping|jardin|garden|barbecue|pêche|piscine|vélo|tricycle|ballon|football|outdoor|plage|solaire|parapluie|حديقة|تخييم|دراجة/i],
 ['organisation',/rangement|storage|organis|étagère|shelf|boîte|box |placard|armoire|رف|تنظيم|تخزين/i],
 ['cleaning laundry',/lavage|nettoy|balai|aspirateur|washing|machine à laver|lessive|laver|linge|غسيل|تنظيف|مكنسة/i],
 ['school office',/bureau|office|ordinateur|étude|study|school|scolaire|cartable|stylo|papeterie|clavier|مكتب|مدرسة|قلم/i],
 ['audio',/audio|earbud|bluetooth|headphone|haut-parleur|écouteur|casque|سماعة/i],
 ['wearables',/montre|watch|bracelet|ساعة/i],
];
for(const src of JSON.parse(fs.readFileSync(input,'utf8'))){
 const url=new URL(src.sourceUrl);const id=url.pathname.match(/^\/products\/([a-zA-Z0-9-]+)$/)?.[1];
 if(url.origin!=='https://app.shipper.market'||!id)throw new Error('Invalid supplier source');
 if(legacyIds.has(id))continue;
 if(!src.sourceName?.trim())throw new Error('Missing supplier product name');
 const images=[...new Set(src.images)].filter(s=>typeof s==='string'&&s.startsWith('https://cdn.shipper.network/'));
 if(!images.length)throw new Error('Missing supplier product images');
 const name=src.sourceName.trim(),body=(src.description||'').trim();
 const title={en:name,fr:name,ar:name};
 const description=body?{en:body,fr:body,ar:body}:{en:'Additional supplier details are not provided.',fr:'Le fournisseur ne fournit pas de détails supplémentaires.',ar:'لم يقدّم المورّد تفاصيل إضافية.'};
 const keywords=name+' '+body;
 const category=rules.filter(([,r])=>r.test(keywords)).map(([key])=>key).join(' ')||'accessories';
 const prefix=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65).replace(/-$/,'')||'product';
 const old=records.get(id);
 records.set(id,{sourceName:name,sourceUrl:src.sourceUrl,sourceProductId:id,slug:old?.slug||`${prefix}-${id.slice(0,8)}`,category,title,description,images,originalSupplierCopy:Boolean(body)});
}
const all=[...records.values()].sort((a,b)=>a.sourceProductId.localeCompare(b.sourceProductId));
const groups=[];let group=[];
for(const row of all){if(group.length&&Buffer.byteLength(JSON.stringify([...group,row]))>60000){groups.push(group);group=[];}group.push(row);}if(group.length)groups.push(group);
const batchDir=path.join(root,'data/shipper-batches');fs.mkdirSync(batchDir,{recursive:true});
const paths=groups.map((rows,i)=>{const name=`shipper-batches/${String(i+1).padStart(3,'0')}.json`;fs.writeFileSync(path.join(root,'data',name),JSON.stringify(rows,null,2)+'\n');return name;});
for(const old of previous)if(!paths.includes(old))fs.unlinkSync(path.join(root,'data',old));
fs.writeFileSync(manifestPath,JSON.stringify(paths,null,2)+'\n');
fs.writeFileSync(path.join(root,'data/shipper-content-index.ts'),"import legacy from './shipper-content.json';\n"+paths.map((p,i)=>`import batch${i} from './${p}';`).join('\n')+'\nexport default [...legacy,'+paths.map((_,i)=>`...batch${i}`).join(',')+'];\n');
console.log(JSON.stringify({legacy:legacy.length,newContent:all.length,total:legacy.length+all.length,batches:paths.length}));
