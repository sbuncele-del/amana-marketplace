const DAY=86400000;
// Shopper intent matches product names only. Accessories do not inherit appliance demand.
export const intents=[
 ['cooler box',/cooler.box/i,/fridge|electric|12.?24v/i,'Ready for a day out','Pack the cold. Take the day.',9],
 ['camping chair',/\b(camping|outdoor).*\b(chair|recliner)\b|\bfolding (camping |outdoor )?(lounge |reclining )?chair\b|\bchair\b.*camping/i,/baby|feeding|high.chair|toilet/i,'Ready for a day out','Your favourite spot deserves a proper seat.',9],
 ['shoe rack',/shoe.*(rack|organis|storage)|rack.*shoe/i,/toy|keychain/i,'Make room for more','Give your doorway its floor back.',7],
 ['storage box',/storage.*(box|container)|box.*storage/i,/makeup|cosmetic|jewell|jewelr|toy|building.block/i,'Make room for more','Less searching. More living.',6],
 ['laundry basket',/laundry.*(basket|hamper)|(basket|hamper).*laundry/i,/toy/i,'Make room for more','Give laundry a place of its own.',6],
 ['side table',/side.table|bedside.table|end.table/i,/playpen|toy/i,'Make room for more','Keep your everyday within reach.',6],
 ['air fryer',/air.?fryer|airfryer/i,/liner|paper|rack|mat|silicone|accessor|basket|tray|pad/i,'Small upgrades. Good days','Make more of mealtimes.',6],
 ['vegetable chopper',/vegetable.chopper|chopper.*vegetable/i,/blade.only|replacement/i,'Small upgrades. Good days','Make light work of meal prep.',6],
 ['food processor',/food.processor/i,/blade.only|replacement/i,'Small upgrades. Good days','A little help before dinner.',6],
 ['spin mop',/spin.mop|mop.*bucket/i,/replacement|head.only/i,'Small upgrades. Good days','Make room for an easier clean-up.',6],
 ['spray mop',/spray.mop/i,/replacement|head.only/i,'Small upgrades. Good days','Make room for an easier clean-up.',6],
 ['portable fan',/handheld.*fan|personal.*fan|mini.*fan|portable.*fan/i,/heater|ceiling|car.radiator/i,'Ready for a day out','A little breeze for your day.',8],
 ['hair dryer',/hair.dryer|hairdryer/i,/holder|stand|case/i,'Small upgrades. Good days','Make a little time for yourself.',6],
 ['hot air brush',/hot.air.brush|hair.dryer.brush/i,/holder|stand/i,'Small upgrades. Good days','Make a little time for yourself.',6],
 ['makeup organiser',/makeup.*organi[sz]|cosmetic.*organi[sz]/i,/table|vanity/i,'Make room for more','Find your favourites. Get on with your day.',6],
 ['makeup organizer',/makeup.*organi[sz]|cosmetic.*organi[sz]/i,/table|vanity/i,'Make room for more','Find your favourites. Get on with your day.',6],
 ['power bank',/power.bank/i,/ups|router|solar.generator/i,'Small upgrades. Good days','Keep a little power in reserve.',7],
 ['wireless earbuds',/wireless.*earbud|bluetooth.*earbud/i,/case.only|cover|replacement/i,'Small upgrades. Good days','Your everyday, with its own soundtrack.',6],
 ['bluetooth speaker',/bluetooth.*speaker|wireless.*speaker/i,/mount|holder/i,'Small upgrades. Good days','Bring your soundtrack along.',7],
 ['smart watch',/smart.watch|smartwatch/i,/strap|band|charger|screen.protector/i,'Small upgrades. Good days','A useful companion for your routine.',6],
 ['building blocks',/building.block/i,/table|storage|drawing/i,'More room for play','What will you build together?',8],
 ['baby high chair',/high.chair|highchair/i,/toy|doll/i,'More room for everyday','A place at the table.',6],
 ['bubble machine',/bubble.*(machine|blaster)|(machine|blaster).*bubble/i,/refill|solution/i,'More room for play','Make room for a little wonder.',8],
 ['picnic blanket',/picnic.*(blanket|mat)/i,/basket|table/i,'Ready for a day out','Same lunch. Better view.',9],
];
function termSummary(record,term){return record?.summaries?.find(s=>s.term===term);}
function observedPoints(record,term){return (record?.series||[]).filter(p=>!p.partial&&p.values?.some(v=>v.term===term&&typeof v.index==='number'&&v.index>0)).length;}
export function rankDemand(products,records,now=Date.now(),limit=50){
 const fresh=records.filter(r=>r.geography==='ZA'&&r.status==='retrieved'&&Date.parse(r.observedAt)<=now&&now-Date.parse(r.observedAt)<=7*DAY);
 const signals=[];
 for(const [term,include,exclude,lane,angle,season] of intents){
  const pick=(window,type='web')=>fresh.filter(r=>r.window===window&&r.searchType===type&&termSummary(r,term)?.status==='observed').sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)||String(a.batch).localeCompare(String(b.batch)))[0];
  const month=pick('30d'),quarter=pick('90d'),year=pick('12m'),week=pick('7d'),shopping=pick('30d','shopping');
  if(!month||!quarter||!year||observedPoints(month,term)<5||observedPoints(quarter,term)<8||observedPoints(year,term)<8)continue;
  const m=termSummary(month,term),q=termSummary(quarter,term),w=termSummary(week,term);
  // A recent reversal, broad decline or a sparse single spike cannot lead the opening selection.
  if((w&&(w.changePercent??0)<-15)||(m.changePercent??0)<-15||(q.changePercent??0)<-15)continue;
  const anchor=termSummary(month,'air fryer')?.recentMean||0;
  const ratio=anchor>0?m.recentMean/anchor:0;
  const shoppingSupported=observedPoints(shopping,term)>=5;
  const demand=Math.min(30,Math.round(8+Math.min(8,ratio*16)+((m.changePercent??0)>10?5:2)+((q.changePercent??0)>10?4:2)+(shoppingSupported?5:0)));
  const creative=12,seasonalFit=season;
  const evidence=[month,quarter,year,...(week?[week]:[]),...(shopping?[shopping]:[])].slice(0,5).map(r=>({url:r.sourceUrl,observedAt:r.observedAt,signal:'search-trend',note:`ZA ${r.searchType}, ${r.window}, shopper term '${term}'. Category-interest evidence, not exact-SKU sales. Half-window change ${termSummary(r,term)?.changePercent??'not calculable'}%.`}));
  signals.push({term,include,exclude,lane,angle,demand,creative,seasonalFit,evidence,confidence:shoppingSupported?'moderate':'limited',knownScore:demand+creative+seasonalFit,monthChange:m.changePercent,quarterChange:q.changePercent});
 }
 const candidates=products.flatMap(p=>{
  if(!p.images?.length||!(p.price>0)||p.priceOnRequest)return [];
  const choices=signals.filter(s=>s.include.test(p.name)&&!s.exclude.test(p.name));
  if(!choices.length)return [];
  const s=choices.sort((a,b)=>b.knownScore-a.knownScore||a.term.localeCompare(b.term))[0];
  return [{slug:p.slug,name:p.name,term:s.term,lane:s.lane,creativeAngle:s.angle,confidence:s.confidence,evidence:s.evidence,monthChange:s.monthChange,quarterChange:s.quarterChange,subscores:{demand:s.demand,supply:null,margin:null,creative:s.creative,season:s.seasonalFit},knownScore:s.knownScore,knownMaximum:55,provisional:true,unknowns:['Exact-SKU sales demand','Landed contribution margin','Delivery cost and returns allowance'],price:p.price}];
 }).sort((a,b)=>b.knownScore-a.knownScore||a.slug.localeCompare(b.slug));
 // Interleave researched intents, with a maximum of ten models per intent.
 const buckets=new Map();for(const p of candidates){const list=buckets.get(p.term)||[];if(list.length<10)list.push(p);buckets.set(p.term,list);}
 const selected=[];for(let i=0;i<10&&selected.length<limit;i++)for(const list of buckets.values()){if(list[i]&&selected.length<limit)selected.push(list[i]);}
 return {entries:selected.map((p,i)=>({...p,rank:i+1})),qualifiedCount:selected.length,matchedCandidates:candidates.length,requestedCount:limit,coverage:[...new Set(fresh.map(r=>r.batch))],qualifiedTerms:[...new Set(selected.map(p=>p.term))],observedAt:fresh.length?fresh.map(r=>r.observedAt).sort().at(-1):null,scope:'ZA category search evidence. Scores provisional. Margin unverified. Social publishing requires approval.'};
}
export function applyPriority(products,slugs){const order=new Map(slugs.map((s,i)=>[s,i]));return products.map((p,i)=>({p,i})).sort((a,b)=>(order.get(a.p.slug)??Infinity)-(order.get(b.p.slug)??Infinity)||a.i-b.i).map(x=>x.p);}
