import assert from 'node:assert/strict';
import {canInviteShopping} from '../packages/storefront/shopping-invitation';
for(const [path,base] of [['/browse',''],['/product/mug',''],['/tunisia/fr/shop','/tunisia'],['/ar/shop','/tunisia'],['/tunisia/en','/tunisia']]){
 assert(canInviteShopping(path,base,45000,650,800),path);
 assert(!canInviteShopping(path,base,44000,650,800));
 assert(!canInviteShopping(path,base,45000,100,800));
}
for(const path of ['/cart','/checkout','/account','/login','/tunisia/fr/cart','/tunisia/fr/checkout','/tunisia/fr/help','/tunisia/fr/company-information'])assert(!canInviteShopping(path,path.startsWith('/tunisia')?'/tunisia':'',90000,2000,800),path);
console.log('Shopping invitation checks passed: time, scrolling, country paths, transactional exclusions');
