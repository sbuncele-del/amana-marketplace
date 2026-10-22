'use client';
import { createContext,useContext,useState,useEffect,ReactNode } from 'react';
type Line = {id:string;quantity:number;weightGrams?:number|null;merchandise:{id:string;title:string;price:{amount:string;currencyCode:string};product:{title:string;handle:string;images:{url:string}[]}}};
const CartContext=createContext<null | {deliveryMethod:'DELIVERY'|'COLLECTION';setDeliveryMethod:(method:'DELIVERY'|'COLLECTION')=>void;cartId:string|null;checkoutUrl:string|null;lines:Line[];totalAmount:{amount:string;currencyCode:string}|null;itemCount:number;loading:boolean;addToCart:(id:string,quantity?:number)=>Promise<{checkoutUrl:string}>;updateLine:(id:string,quantity:number)=>Promise<void>;removeLine:(id:string)=>Promise<void>;goToCheckout:()=>void;clearCart:()=>void}>(null);
const KEY='amana_local_cart_v1';
async function validated(lines: unknown): Promise<Line[]> {
 const response=await fetch('/api/catalogue/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines}),cache:'no-store'});
 if(!response.ok)throw new Error('Unable to check stock and prices');
 return (await response.json()).lines;
}
export function CartProvider({children}:{children:ReactNode}) {
 const [deliveryMethod,setDeliveryMethod]=useState<'DELIVERY'|'COLLECTION'>('DELIVERY');
 const [lines,setLines]=useState<Line[]>([]); const [ready,setReady]=useState(false);
 useEffect(()=>{try{if(localStorage.getItem('afrishelf_delivery_method_v1')==='COLLECTION')setDeliveryMethod('COLLECTION');}catch{}let active=true;void (async()=>{try{const current=await validated(JSON.parse(localStorage.getItem(KEY)||'[]'));if(active)setLines(current);}catch{}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(lines.map(({id,quantity})=>({id,quantity}))));}catch{}},[lines,ready]);
 useEffect(()=>{if(ready)try{localStorage.setItem('afrishelf_delivery_method_v1',deliveryMethod);}catch{}},[ready,deliveryMethod]);
 async function addToCart(id:string,quantity=1){const candidate=await validated([{id,quantity}]);if(!candidate.length)throw new Error('Invalid product');const found=lines.find(l=>l.id===id);const next=found?lines.map(l=>l.id===id?{...l,quantity:Math.min(10,l.quantity+quantity)}:l):[...lines,candidate[0]];const checked=await validated(next);localStorage.setItem(KEY,JSON.stringify(checked.map(({id,quantity})=>({id,quantity}))));setLines(checked);return {checkoutUrl:'/cart'};}
 async function updateLine(id:string,quantity:number){setLines(await validated(lines.map(l=>l.id===id?{...l,quantity}:l)));}
 async function removeLine(id:string){setLines(old=>old.filter(l=>l.id!==id));}
 const total=lines.reduce((s,l)=>s+Number(l.merchandise.price.amount)*l.quantity,0);
 return <CartContext.Provider value={{deliveryMethod,setDeliveryMethod,cartId:lines.length?'local':null,checkoutUrl:lines.length?'/cart':null,lines,totalAmount:{amount:total.toFixed(2),currencyCode:'ZAR'},itemCount:lines.reduce((s,l)=>s+l.quantity,0),loading:!ready,addToCart,updateLine,removeLine,goToCheckout:()=>{window.location.href='/cart';},clearCart:()=>setLines([])}}>{children}</CartContext.Provider>;
}
export function useCart(){const context=useContext(CartContext);if(!context)throw new Error('CartProvider required');return context;}
