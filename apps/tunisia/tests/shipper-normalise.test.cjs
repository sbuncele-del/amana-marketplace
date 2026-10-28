const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../lib/shipper-normalise.ts'),'utf8');const moduleResult={exports:{}};new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(moduleResult.exports);const {normaliseShipper}=moduleResult.exports;
const content=[{sourceProductId:'source-1',sourceName:'Source',slug:'source',category:'kitchen',title:{en:'Product',fr:'Produit',ar:'منتج'},description:{en:'Text',fr:'Texte',ar:'نص'},images:['https://cdn.shipper.network/image.jpg']}];
const base={uuid:'source-1',name:'Source',price:'25.125',cost:15,available_qte:7,status:'active',variants:[]};
test('retail price uses TND millimes and private costs are excluded',()=>{const [p]=normaliseShipper([base],content);assert.equal(p.priceMillimes,25125);assert.equal(p.stock,7);assert.equal('cost' in p,false);assert.equal('sourceName' in p,false)});
test('account UUID can differ while source title matches',()=>assert.equal(normaliseShipper([{...base,uuid:'retailer-1'}],content)[0].supplierProductId,'retailer-1'));
test('variant UUID price and stock are preserved',()=>{const [p]=normaliseShipper([{...base,variants:[{uuid:'variant-1',name:'Blue',price:29,available_qte:2}]}],content);assert.equal(p.supplierProductId,'variant-1');assert.equal(p.priceMillimes,29000);assert.equal(p.stock,2)});
test('missing retail price never falls back to supplier cost',()=>assert.equal(normaliseShipper([{...base,price:null}],content).length,0));
test('unreviewed content, inactive products and fractional stock are withheld',()=>{assert.equal(normaliseShipper([base],[]).length,0);assert.equal(normaliseShipper([{...base,status:'inactive'}],content).length,0);assert.equal(normaliseShipper([{...base,available_qte:1.5}],content).length,0)});

test('database decimal strings retain exact millime precision',()=>assert.equal(normaliseShipper([{...base,price:'25.000000000000000000000000000000'}],content)[0].priceMillimes,25000));

test('supplier variants repeating the parent name use neutral option labels',()=>{const [p]=normaliseShipper([{...base,variants:[{uuid:'variant-1',name:'Source',price:29,available_qte:2}]}],content);assert.equal(p.title.en,'Product — Option 1');assert.equal(p.title.ar,'منتج — الخيار 1');assert.equal(p.supplierProductId,'variant-1')});
