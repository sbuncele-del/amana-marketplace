import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {StorefrontLayout} from '../packages/storefront/home';
import {storefrontSectionOrder} from '../packages/storefront/config';
Object.assign(globalThis,{React});
const product={id:'test-item',slug:'test-item'};
function render(withFeatured=false){return renderToStaticMarkup(<StorefrontLayout store={{sectionOrder:[...storefrontSectionOrder],hiddenSections:[],featuredTitle:'Selected products'}} theme={{background:'#FAF8F5',accent:'#DA292B'}} slideshow={<div>Slide</div>} missions={<h2>Shopping choices</h2>} more={<h2>More categories</h2>} demandProducts={[]} featuredProducts={withFeatured?[product]:[]} valueProducts={[product]} collections={[{slug:'kitchen',title:'Kitchen row',text:'Useful kitchen items',products:[product]}]} renderProduct={p=><a href={'/product/'+p.slug}>Product</a>}/>);}
const html=render();
assert.ok(html.indexOf('Shopping choices')<html.indexOf('Make yourself at home'));
assert.ok(html.indexOf('Make yourself at home')<html.indexOf('Good finds under R300'));
assert.ok(html.indexOf('Kitchen row')<html.indexOf('More categories'));
assert.ok(html.indexOf('More categories')<html.indexOf('Good finds. Your budget.'));
assert.ok(!html.includes('Selected products'),'An unconfigured featured row must not move discovery down');
assert.ok(render(true).indexOf('Selected products')<render(true).indexOf('Make yourself at home'));
assert.equal((html.match(/<main /g)||[]).length,1);
assert.equal((html.match(/Furniture/g)||[]).length,1);
console.log('Shared storefront checks passed: approved section order, conditional merchandising, discovery labels, and one main landmark.');
