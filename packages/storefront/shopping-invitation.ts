export function canInviteShopping(pathname:string,basePath:string,elapsed:number,scrollDistance:number,viewportHeight:number){
 const path=basePath&&pathname.startsWith(basePath)?pathname.slice(basePath.length):pathname;
 const route=basePath?path.replace(/^\/(en|fr|ar)(?=\/|$)/,''):path;
 const shopping=route===''||route==='/'||/^\/(browse|shop|collections)(\/|$)/.test(route)||/^\/product\//.test(route);
 return shopping&&elapsed>=45000&&scrollDistance>=Math.max(400,viewportHeight*.75);
}
