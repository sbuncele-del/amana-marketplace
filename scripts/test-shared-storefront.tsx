import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {StorefrontLayout} from '../packages/storefront/home';
import {storefrontSectionOrder,alignedStorefrontOrder} from '../packages/storefront/config';
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

// Old saved CMS order and every market obey the same researched-product position.
assert.deepEqual(alignedStorefrontOrder(['missions','featured','demand','discovery','value']),['missions','demand','featured','discovery','value']);
assert.equal(alignedStorefrontOrder(['missions','demand','demand','featured']).filter(id=>id==='demand').length,1);
const localProduct={id:'tn-local',slug:'tn-local'};
const priorityHtml=renderToStaticMarkup(<StorefrontLayout store={{sectionOrder:['missions','featured','demand','discovery'],hiddenSections:['demand'],featuredTitle:'Local featured'}} theme={{background:'#FAF8F5',accent:'#DA292B'}} slideshow={null} missions={null} more={null} activeMerchandising={{headline:'Local approved selection',description:'Local evidence'}} demandProducts={[localProduct]} featuredProducts={[product]} valueProducts={[]} collections={[]} renderProduct={p=><span>{p.slug}</span>}/>);
assert.ok(priorityHtml.indexOf('Local approved selection')<priorityHtml.indexOf('Local featured'));
assert.ok(priorityHtml.includes('tn-local'));
console.log('Cross-shop priority order passed, including older saved layouts and market-local product inputs.');
