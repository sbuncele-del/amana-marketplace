import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildMetaFeed} from '../../src/lib/meta-feed';
import {buildMerchantFeed} from '../../src/lib/merchant-feed';
import type {CatalogueProduct} from '../../src/lib/catalogue';

const make=(slug:string,name:string,available:boolean,extra:Partial<CatalogueProduct>={}):CatalogueProduct=>({
 id:slug,slug,name,description:'A, "quoted" description',details:'',images:['https://cdn.example/'+slug+'.jpg'],
 category:{slug:'air-fryers',name:'Air Fryers'},price:259,currency:'ZAR',
 variants:[{id:'1',title:'Standard',price:259,supplierAvailable:available}],supplierAvailable:available,...extra,
}) as unknown as CatalogueProduct;

test('availability in both feeds follows the verified variant, never a blanket in stock', () => {
 const products=[make('chopper','12-in-1 Vegetable Chopper',true),make('solar','Solar Wall Light',false)];
 const meta=buildMetaFeed(products).csv.split('\n');
 assert.match(meta[1],/,in stock,new,259\.00 ZAR,/);
 assert.match(meta[2],/,out of stock,new,259\.00 ZAR,/);
 const google=buildMerchantFeed(products).tsv.split('\n');
 assert.ok(google[1].includes('\tin_stock\t')&&google[2].includes('\tout_of_stock\t'));
});
test('meta csv quotes commas and quotes and carries the required columns', () => {
 const {csv,count}=buildMetaFeed([make('chopper','Chopper, 12-in-1',true)]);
 assert.equal(count,1);
 assert.equal(csv.split('\n')[0],'id,title,description,availability,condition,price,link,image_link,additional_image_link,brand,google_product_category,product_type');
 assert.ok(csv.includes('"Chopper, 12-in-1"')&&csv.includes('"A, ""quoted"" description"'));
 assert.ok(csv.includes('https://plentovo.com/product/chopper')||csv.includes('/product/chopper'));
});
test('restricted items are kept out of the meta feed', () => {
 assert.equal(buildMetaFeed([make('v','Strawberry vape juice',true)]).count,0);
});
