'use client';
import { createContext,useContext,useState,useEffect,ReactNode } from 'react';
import catalogue from '@/data/cart-catalogue.json';
type Line = {id:string;quantity:number;merchandise:{id:string;title:string;price:{amount:string;currencyCode:string};product:{title:string;handle:string;images:{url:string}[]}}};
const CartContext=createContext<null | {cartId:string|null;checkoutUrl:string|null;lines:Line[];totalAmount:{amount:string;currencyCode:string}|null;itemCount:number;loading:boolean;addToCart:(id:string,quantity?:number)=>Promise<{checkoutUrl:string}>;updateLine:(id:string,quantity:number)=>Promise<void>;removeLine:(id:string)=>Promise<void>;goToCheckout:()=>void;clearCart:()=>void}>(null);
const KEY='amana_local_cart_v1';
function validated(lines: unknown): Line[] {
 if(!Array.isArray(lines))return [];
 return lines.flatMap(line=>{
  if(!line || typeof line.id!=='string') return [];
  const [handle,variantId]=line.id.split(':'); const p=catalogue.find(p=>p.id===handle);
  const variant=p?.variants.find(v=>v.id===variantId || v.title===variantId);
  if(!p || !variant || !variant.supplierAvailable || !Number.isInteger(line.quantity) || line.quantity<1 || line.quantity>10)return [];
  return [{id:`${handle}:${variant.id}`,quantity:line.quantity,merchandise:{id:`${handle}:${variant.id}`,title:variant.title,price:{amount:variant.price.toFixed(2),currencyCode:'ZAR'},product:{title:p.name,handle:p.slug,images:p.images.map(url=>({url}))}}}];
 });
}
export function CartProvider({children}:{children:ReactNode}) {
 const [lines,setLines]=useState<Line[]>([]); const [ready,setReady]=useState(false);
 useEffect(()=>{try{setLines(validated(JSON.parse(localStorage.getItem(KEY)||'[]')));}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(lines.map(({id,quantity})=>({id,quantity}))));}catch{}},[lines,ready]);
 async function addToCart(id:string,quantity=1){const candidate=validated([{id,quantity}]);if(!candidate.length)throw new Error('Invalid product');const found=lines.find(l=>l.id===id);const next=found?lines.map(l=>l.id===id?{...l,quantity:Math.min(10,l.quantity+quantity)}:l):[...lines,candidate[0]];localStorage.setItem(KEY,JSON.stringify(next.map(({id,quantity})=>({id,quantity}))));setLines(next);return {checkoutUrl:'/cart'};}
 async function updateLine(id:string,quantity:number){setLines(old=>validated(old.map(l=>l.id===id?{...l,quantity}:l)));}
 async function removeLine(id:string){setLines(old=>old.filter(l=>l.id!==id));}
 const total=lines.reduce((s,l)=>s+Number(l.merchandise.price.amount)*l.quantity,0);
 return <CartContext.Provider value={{cartId:lines.length?'local':null,checkoutUrl:lines.length?'/cart':null,lines,totalAmount:{amount:total.toFixed(2),currencyCode:'ZAR'},itemCount:lines.reduce((s,l)=>s+l.quantity,0),loading:!ready,addToCart,updateLine,removeLine,goToCheckout:()=>{window.location.href='/cart';},clearCart:()=>setLines([])}}>{children}</CartContext.Provider>;
}
export function useCart(){const context=useContext(CartContext);if(!context)throw new Error('CartProvider required');return context;}
