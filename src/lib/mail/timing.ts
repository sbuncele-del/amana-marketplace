// South Africa is UTC+2 year-round. Follow-ups are sent at 10:00 SAST.
export function easterSunday(year:number){const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);return new Date(Date.UTC(year,Math.floor((h+l-7*m+114)/31)-1,(h+l-7*m+114)%31+1));}
const key=(d:Date)=>d.toISOString().slice(0,10);
export function businessDay(d:Date){
 if([0,6].includes(d.getUTCDay()))return false;
 const y=d.getUTCFullYear(),holidays=new Set<string>();
 for(const [month,day] of [[1,1],[3,21],[4,27],[5,1],[6,16],[8,9],[9,24],[12,16],[12,25],[12,26]]){const h=new Date(Date.UTC(y,month-1,day));holidays.add(key(h));if(h.getUTCDay()===0){h.setUTCDate(h.getUTCDate()+1);holidays.add(key(h));}}
 for(const offset of [-2,1]){const h=easterSunday(y);h.setUTCDate(h.getUTCDate()+offset);holidays.add(key(h));}
 // Additional officially proclaimed holidays can be supplied without a release.
 for(const date of (process.env.ZA_EXTRA_HOLIDAYS||'').split(','))holidays.add(date.trim());
 return !holidays.has(key(d));
}
export function followupDue(start:Date,days:number,business=false){
 const local=new Date(start.getTime()+2*3600000);local.setUTCHours(0,0,0,0);
 for(let n=0;n<days;){local.setUTCDate(local.getUTCDate()+1);if(!business||businessDay(local))n++;}
 while(!businessDay(local))local.setUTCDate(local.getUTCDate()+1);
 local.setUTCHours(8,0,0,0);return local;
}
