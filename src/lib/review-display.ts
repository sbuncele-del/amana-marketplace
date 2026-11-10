export function selectReviews<T extends {rating:number;verified:boolean;createdAt:string}>(reviews:T[], options:{sort:string;stars:number;verifiedOnly:boolean}) {
 return reviews.filter(r=>(!options.stars||r.rating===options.stars)&&(!options.verifiedOnly||r.verified)).sort((a,b)=>{
 const byDate=new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime();
 return options.sort==='highest'?b.rating-a.rating||byDate:options.sort==='lowest'?a.rating-b.rating||byDate:byDate;
 });
}
