type FeedProduct={id:string;slug:string;groupId?:string;groupSlug?:string;groupTitle?:{fr:string};title:{fr:string};description?:{fr?:string};category:string;image:string;priceMillimes:number;stock:number;active:boolean};
const columns=['id','title','description','link','image_link','price','availability','product_type','google_product_category'];
const plain=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const cell=(s:string)=>'"'+s.replace(/"/g,'""')+'"';
const categories:[RegExp,string][]=[[/kitchen|cuisine|dining/i,'638'],[/beauty|beaute|care|skin|hair/i,'469'],[/electronic|audio/i,'222'],[/toy|jouet|kids|enfant|baby|bebe/i,'1239'],[/furniture|meuble/i,'436'],[/lighting|lamp/i,'594'],[/fashion|clothing|accessor/i,'166'],[/garden|outdoor|jardin/i,'689'],[/office|school|stationery/i,'922'],[/tool|hardware/i,'632']];
export function buildTunisiaPinterestFeed(products:FeedProduct[]){
 const groups=new Map<string,FeedProduct[]>();
 for(const p of products){if(!p.active)continue;const key=p.groupId||p.id;const group=groups.get(key)||[];group.push(p);groups.set(key,group);}
 const rows:string[][]=[];
 for(const [id,variants] of groups){
  // Same default choice as the group landing page; never invent a variant query.
  const p=variants.find(v=>v.stock>0)||variants[0];
  const title=plain(p.groupTitle?.fr||p.title.fr).slice(0,500);
  if(/\b(vape|tabac|nicotine|cannabis|cbd|weapon|ammunition|aphrodisiaque|slimming|supplement)\b/i.test(title))continue;
  if(!Number.isSafeInteger(p.priceMillimes)||p.priceMillimes<=0||!Number.isSafeInteger(p.stock)||p.stock<0||!title)continue;
  if(!/^[a-z0-9-]+$/.test(p.groupSlug||p.slug))continue;
  let image:URL;try{image=new URL(p.image);}catch{continue;}
  if(image.protocol!=='https:'||image.href.length>2000)continue;
  const link='https://plentovo.com/tunisia/fr/product/'+(p.groupSlug||p.slug);
  if(link.length>511||('tn-'+id).length>127)continue;
  const description=plain(p.description?.fr||title).slice(0,10000)||title;
  const category=categories.find(([pattern])=>pattern.test(p.category))?.[1]||'';
  rows.push(['tn-'+id,title,description,link,image.href,(p.priceMillimes/1000).toFixed(3)+' TND',p.stock>0?'in stock':'out of stock',plain(p.category),category]);
 }
 return {csv:[columns,...rows].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n',count:rows.length};
}
