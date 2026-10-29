import assert from 'node:assert/strict';
import {restoreMarketCart} from '../packages/storefront/market-cart';
const raw=JSON.stringify([{id:'mug',quantity:2},{id:'lamp',quantity:1}]);
assert.deepEqual(restoreMarketCart(raw,[]),[{id:'mug',quantity:2},{id:'lamp',quantity:1}],'Opening an information-only page must preserve cart lines');
assert.deepEqual(restoreMarketCart(raw,[{id:'mug',stock:1},{id:'lamp',stock:0}]),[{id:'mug',quantity:1}],'A real catalogue must clamp stock and remove unavailable lines');
assert.deepEqual(restoreMarketCart('[{"id":"mug","quantity":1},{"id":"mug","quantity":2},{"id":"bad","quantity":-1}]'),[{id:'mug',quantity:3}]);
assert.deepEqual(restoreMarketCart('broken'),[]);
assert.deepEqual(restoreMarketCart('[{"id":"mug","quantity":1000000}]'),[{id:'mug',quantity:99}]);
console.log('Market cart checks passed: information-page persistence, stock reconciliation, invalid data and duplicate lines.');
