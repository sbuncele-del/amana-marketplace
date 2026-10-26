import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function worker(network=async()=>new Response('live')){
 const listeners={},writes=[],reads=[];
 const cache={addAll:async paths=>writes.push(...paths)};
 vm.runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{
  self:{location:{origin:'https://plentovo.com'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn},
  caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true,match:async key=>{reads.push(key);return new Response('offline');}},
  fetch:network,URL,Response,
 });
 return {listeners,writes,reads};
}
test('installation precaches only offline page and app icons',async()=>{
 const w=worker();let completion;w.listeners.install({waitUntil:p=>completion=p});await completion;
 assert.deepEqual(w.writes,['/offline.html','/brand/plentovo-icon.png','/icons/plentovo-512.png']);
});
test('API, payment POST and third-party requests are not intercepted',()=>{
 const w=worker();for(const [url,method,mode] of [['https://plentovo.com/api/account','GET','navigate'],['https://plentovo.com/api/cart','POST','cors'],['https://payments.example/pay','GET','navigate']]){
  let intercepted=false;w.listeners.fetch({request:{url,method,mode},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 }
});
test('live navigation stays network-first and is never written to cache',async()=>{
 const w=worker();let response;w.listeners.fetch({request:{url:'https://plentovo.com/account',method:'GET',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await (await response).text(),'live');assert.equal(w.reads.length,0);assert.equal(w.writes.length,0);
});
test('failed navigation returns generic offline screen, not cached private HTML',async()=>{
 const w=worker(async()=>{throw Error('offline');});let response;w.listeners.fetch({request:{url:'https://plentovo.com/checkout',method:'GET',mode:'navigate'},respondWith:p=>response=p});
 assert.equal(await (await response).text(),'offline');assert.deepEqual(w.reads,['/offline.html']);
});
