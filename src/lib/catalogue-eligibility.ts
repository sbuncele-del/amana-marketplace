const excluded = /stun[\s-]*gun|taser|pepper.?spray|\bfirearm\b|\bbaton\b|knuckle.?knife|knuckle.?duster|brass.?knuckle|rifle.?scope|riflescope|gun.?laser|gun.?cleaning|pistol.?light|(?:tactical|hunting|karambit|kerambit).*knife|knife.*(?:tactical|hunting|karambit|kerambit)|credit.?card.*knife/i;
export function isRetailProduct(name:string){return !excluded.test(name);}
