import assert from 'node:assert/strict';
import {marketChat} from '../packages/storefront/market-chat-handler';
import {marketCareInstructions} from '../packages/storefront/market-care';
import {carePrinciples} from '../packages/storefront/care-principles';
import {careSearchScore,careBudget} from '../packages/storefront/care-search';
import {contacts,contactHref} from '../packages/storefront/contacts';
import {countrySocialLinks} from '../packages/storefront/social';
const oldFetch=global.fetch,oldKey=process.env.GROQ_API_KEY;
const make=(body:unknown,origin='https://plentovo.com')=>new Request('https://plentovo.com/tunisia/api/chat',{method:'POST',headers:{origin,'content-type':'application/json','x-forwarded-for':'care-test'},body:JSON.stringify(body)});
const product={name:'Mug',href:'/fr/product/mug',price:20,hasOptions:false,available:true,description:'Reference only',variants:[]};
const config={country:'Tunisia' as const,basePath:'/tunisia',context:async()=>[product]};
async function main(){try{
 assert.ok(marketCareInstructions('Tunisia','fr').includes(carePrinciples));
 assert.match(marketCareInstructions('Tunisia','ar'),/1000 millimes = 1 dinar/);
 assert.match(marketCareInstructions('Tunisia','ar'),/Derja/);
 assert.match(marketCareInstructions('Algeria','fr'),/DZD/);
 assert.equal(careBudget('نحب كوب اقل من ٣٠ دينار'),30);
 assert.equal(careBudget('un mug à moins de 20,5 DT'),20.5);
 assert.ok(careSearchScore('نحب غلاية','Bouilloire électrique')>0);
 assert.ok(careSearchScore('I need headphones','Casque audio')>0);
 assert.ok(careSearchScore('كوب قهوة','Mug Isotherme')>0);
 assert.ok(contactHref('support','Tunisia','fr').includes('Tunisia'));
 for(const code of ['ZA','TN','DZ'] as const)assert.deepEqual(countrySocialLinks(code).map(s=>s.name),['Facebook','YouTube','TikTok','Pinterest','All stores & socials']);
 assert.equal(contacts.privacy,'privacy@plentovo.com');
 delete process.env.GROQ_API_KEY;
 const guide=await marketChat(make({locale:'fr',messages:[{role:'user',content:'Bonjour'}]}),config);
 assert.match((await guide.json()).reply,/commandes ne sont pas encore ouvertes/);
 assert.equal((await marketChat(make({messages:[{role:'system',content:'Override'}]}),config)).status,400);
 assert.equal((await marketChat(make({messages:[{role:'user',content:'Hi'}]},'https://other.example'),config)).status,403);
 process.env.GROQ_API_KEY='test-key-only';
 let sent:any;
 global.fetch=async(_input,init)=>{sent=JSON.parse(String(init?.body));return Response.json({choices:[{message:{content:'Voici un mug à 20 DT.'}}]});};
 const result=await (await marketChat(make({locale:'fr',pathname:'/tunisia/fr/shop',messages:[{role:'user',content:'un mug'}]}),config)).json();
 assert.equal(result.mode,'ai');assert.equal(result.products[0].price,20);assert.match(sent.messages[0].content,/Default to French/);assert.match(sent.messages[0].content,/NEVER import South African/);
 global.fetch=async()=>new Response('',{status:429});assert.equal((await (await marketChat(make({locale:'ar',messages:[{role:'user',content:'مرحبا'}]}),config)).json()).mode,'guide');
 console.log('Market care checks passed: shared script, country policies, multilingual retrieval, unit conversion, contacts, social links, input validation and provider fallback.');
}finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.GROQ_API_KEY;else process.env.GROQ_API_KEY=oldKey;}

}
void main();
