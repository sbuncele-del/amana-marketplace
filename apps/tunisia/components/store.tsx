'use client';
import {TunisiaCatalogueBrowser} from './catalogue-browser';
import {StoreHeader} from './store-header';
import Link from 'next/link';
import {restoreMarketCart} from '../../../packages/storefront/market-cart';
import {mobileCopy} from '../../../packages/storefront/mobile-copy';
import {MobilePurchaseBar,MarketInstall} from './mobile-ui';
import {useEffect,useState,useRef} from 'react';
import {ShoppingBag,Package,Banknote,Plus,Minus,Trash2} from 'lucide-react';
import {groupProducts,chooseVariant} from '@/lib/product-groups';
import {copy} from '@/lib/storefront-copy';
import {StorefrontHome} from './storefront-home';
import {StoreInformation} from './store-information';
import {StoreFooter} from './store-footer';
import {messages} from '@/lib/messages';
import {money,type StoreProduct,type Locale} from '@/lib/catalogue';
type CartLine={id:string;quantity:number};
const storageKey='plentovo:TN:cart:v1';
export default function Store({locale,route,products,initialQuery}:{locale:Locale;route:string;products:StoreProduct[];initialQuery:string;maxPrice?:number}){
 const t=messages[locale], url=(path='')=>`/${locale}${path?'/'+path:''}`;
 const [cart,setCart]=useState<CartLine[]>([]),[ready,setReady]=useState(false),[query,setQuery]=useState(initialQuery);
 useEffect(()=>setQuery(initialQuery),[initialQuery]);
 useEffect(()=>{document.documentElement.lang=locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en';document.documentElement.dir=locale==='ar'?'rtl':'ltr';document.cookie=`plentovo_tn_language=${locale}; Path=/tunisia; Max-Age=31536000; SameSite=Lax`;},[locale]);
 useEffect(()=>{try{setCart(restoreMarketCart(localStorage.getItem(storageKey)||'[]',products));}catch{}setReady(true)},[products]);
 useEffect(()=>{if(ready)try{localStorage.setItem(storageKey,JSON.stringify(cart))}catch{}},[cart,ready]);
 function change(id:string,amount:number){const p=products.find(p=>p.id===id);if(!p)return;setCart(lines=>{const current=lines.find(l=>l.id===id)?.quantity||0;const quantity=Math.max(0,Math.min(p.stock,current+amount));return [...lines.filter(l=>l.id!==id),...(quantity?[{id,quantity}]:[])]})}
 const purchaseButton=useRef<HTMLButtonElement>(null);
 const [added,setAdded]=useState(false);
 const mobile=mobileCopy[locale];
 function addProduct(id:string){const product=products.find(p=>p.id===id);if(!product||(cart.find(l=>l.id===id)?.quantity||0)>=product.stock)return;change(id,1);setAdded(true);}
 const cartUnresolved=cart.some(line=>!products.some(product=>product.id===line.id));
 const count=cart.reduce((n,l)=>n+l.quantity,0),total=cart.reduce((n,l)=>n+(products.find(p=>p.id===l.id)?.priceMillimes||0)*l.quantity,0);
 const groups=groupProducts(products);
 const isListing=route==='shop'||!!query;
 const isHome=(route===''||route==='collections')&&!query;
 const selected=products.find(p=>`product/${p.slug}`===route||`product/${p.groupSlug}`===route);
 const siblings=selected?products.filter(p=>(p.groupId||p.id)===(selected.groupId||selected.id)):[];
 const [selectedOption,setSelectedOption]=useState('');
 const chosen=chooseVariant(siblings,selectedOption,route.replace(/^product\//,''));
 useEffect(()=>setAdded(false),[route,chosen?.id]);
 return <><StoreHeader locale={locale} route={route} query={query} count={count}/>
 <div className={isHome||isListing?'':'tn-legacy'}>
 <div id={isHome||isListing?undefined:'main-content'} role={isHome||isListing?undefined:'main'}>{(route===''||route==='collections')&&!query?<StorefrontHome locale={locale} groups={groups} onAdd={id=>change(id,1)} collections={route==='collections'}/>:null}
 {isListing&&<TunisiaCatalogueBrowser groups={groups} locale={locale}/>}
 {route==='cart'&&!query&&<section className="page"><h1>{t.cart}</h1>{!count?<div className="empty"><ShoppingBag size={40}/><h2>{t.cartEmpty}</h2><p>{t.cartEmptyText}</p><Link prefetch={false} className="button" href={url('shop')}>{t.discover}</Link></div>:<div className="checkout-grid"><div>{cart.map(l=>{const p=products.find(p=>p.id===l.id);if(!p)return <article className="cart-row" key={l.id}><div><p>{mobile.savedItem}</p><p>{mobile.unverified}</p><button type="button" onClick={()=>setCart(cart.filter(x=>x.id!==l.id))}>{t.remove}</button></div></article>;return <article className="cart-row" key={l.id}><img src={p.image} alt={p.title[locale]}/><div><Link prefetch={false} href={url('product/'+p.slug)}>{p.title[locale]}</Link><p>{money(p.priceMillimes,locale)}</p><div className="quantity"><button aria-label={`${t.quantity} −`} onClick={()=>change(l.id,-1)}><Minus size={14}/></button><span>{l.quantity}</span><button aria-label={`${t.quantity} +`} onClick={()=>change(l.id,1)} disabled={l.quantity>=p.stock}><Plus size={14}/></button><button aria-label={t.remove} onClick={()=>setCart(cart.filter(x=>x.id!==l.id))}><Trash2 size={14}/></button></div></div></article>})}</div><aside className="summary"><h2>{t.subtotal}</h2><>{cartUnresolved?<p role="status">{mobile.unverified}</p>:<strong>{money(total,locale)}</strong>}</><p>{t.shippingText}</p>{cartUnresolved?<button type="button" className="button" onClick={()=>window.location.reload()}>{mobile.retry}</button>:<Link prefetch={false} className="button" href={url('checkout')}>{t.checkout}</Link>}</aside></div>}</section>}
 {route==='checkout'&&!query&&<section className="page"><h1>{t.checkoutTitle}</h1><p>{t.checkoutIntro}</p><div className="notice" role="status"><strong>{t.closed}</strong><p>{t.closedText}</p></div><div className="checkout-grid"><form onSubmit={e=>e.preventDefault()} className="address-form"><fieldset disabled><label>{t.name}<input autoComplete="name" name="name"/></label><label>{t.phone}<input type="tel" dir="ltr" autoComplete="tel" name="phone"/></label><div className="field-pair"><label>{t.governorate}<select name="governorate"><option>{t.governorate}</option></select></label><label>{t.delegation}<select name="delegation"><option>{t.delegation}</option></select></label></div><label>{t.address}<textarea autoComplete="street-address" name="address"/></label><label>{t.notes}<textarea name="notes"/></label></fieldset></form><aside className="summary"><Banknote/><h2>{t.cod}</h2><p>{t.codText}</p><hr/><p>{t.subtotal}</p><>{cartUnresolved?<p role="status">{mobile.unverified}</p>:<strong>{money(total,locale)}</strong>}</><p>{t.delivery}: {t.shippingText}</p><button disabled>{t.closed}</button></aside></div></section>}
 {selected&&chosen&&!query&&<section className="page product-detail mobile-product"><div className="product-images" aria-label={locale==='fr'?'Photos du produit':locale==='ar'?'صور المنتج':'Product photos'}>{(chosen.images?.length?chosen.images:[chosen.image]).map((image,i)=><img key={image} src={image} alt={`${(chosen.groupTitle||chosen.title)[locale]} ${i+1}`}/>)}</div><div><Link prefetch={false} href={url('shop')}>{t.back}</Link><h1>{(selected.groupTitle||selected.title)[locale]}</h1><h2 dir="auto">{money(chosen.priceMillimes,locale)}</h2>{siblings.length>1&&<label className="variant-picker">{copy.option[locale]}<select value={chosen.id} onChange={e=>setSelectedOption(e.target.value)}>{siblings.map(p=><option key={p.id} value={p.id}>{(p.optionLabel||p.title[locale]).replace(/:/g,': ')}{!p.stock?' — '+t.out:''}</option>)}</select></label>}<p className={chosen.stock?'stock':'stock out'}>{chosen.stock?copy.inStock[locale]:t.out}</p><button ref={purchaseButton} className="button" disabled={!chosen.stock} onClick={()=>addProduct(chosen.id)}>{chosen.stock?t.add:t.out}</button>{added&&<p role="status">{mobile.added} <Link href={url('cart')}>{mobile.viewCart} →</Link></p>}{chosen.originalSupplierCopy&&<p className="supplier-copy-label">{locale==='ar'?'وصف المورّد بلغته الأصلية':locale==='fr'?'Description du fournisseur dans sa langue d’origine':'Supplier description in its original language'}</p>}<p>{chosen.description?.[locale]}</p></div><MobilePurchaseBar target={purchaseButton} price={money(chosen.priceMillimes,locale)} label={chosen.stock?t.add:t.out} disabled={!chosen.stock} onAdd={()=>addProduct(chosen.id)} cartHref={url('cart')} cartLabel={mobile.viewCart} added={added}/></section>}
 {route==='track'&&!query&&<section className="page info"><Package size={40}/><h1>{route==='track'?t.trackTitle:t.helpTitle}</h1><p>{route==='track'?t.trackText:t.helpText}</p><Link prefetch={false} className="button" href={url()}>{t.home}</Link></section>}
 {['help','privacy','terms','cookies','company-information','returns'].includes(route)&&!query&&<StoreInformation locale={locale} route={route}/>}
 </div></div><StoreFooter locale={locale}/><MarketInstall locale={locale} basePath="/tunisia"/></>;
}

