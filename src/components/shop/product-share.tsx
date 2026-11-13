'use client';

import {useState} from 'react';
import {Link2,Send} from 'lucide-react';

export function ProductShare({slug,title,image}:{slug:string;title:string;image?:string}) {
 const [status,setStatus]=useState('');
 const url=`https://plentovo.com/product/${encodeURIComponent(slug)}`;
 const link=encodeURIComponent(url);
 const name=encodeURIComponent(title);
 const links=[
  {label:'Facebook',mark:'f',href:`https://www.facebook.com/sharer/sharer.php?u=${link}`},
  {label:'X',mark:'𝕏',href:`https://twitter.com/intent/tweet?url=${link}&text=${name}`},
  {label:'Pinterest',mark:'Ⓟ',href:`https://pinterest.com/pin/create/button/?url=${link}&description=${name}${image?`&media=${encodeURIComponent(image)}`:''}`},
  {label:'LinkedIn',mark:'in',href:`https://www.linkedin.com/sharing/share-offsite/?url=${link}`},
  {label:'Telegram',mark:<Send size={16}/>,href:`https://t.me/share/url?url=${link}&text=${name}`},
 ];
 return <div className="mt-5 flex flex-wrap items-center gap-1 text-sm text-gray-700" aria-label="Share this product">
  <span className="mr-1 font-semibold">Share</span>
  {links.map(({label,mark,href})=><a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`} title={label} className="grid size-10 place-items-center rounded-full font-bold hover:bg-gray-100 hover:text-red-700">{mark}</a>)}
  <button type="button" aria-label="Copy product link" title="Copy link" onClick={async()=>{try{await navigator.clipboard.writeText(url);setStatus('Link copied');}catch{setStatus(url);}}} className="grid size-10 place-items-center rounded-full hover:bg-gray-100 hover:text-red-700"><Link2 size={17}/></button>
  <span role="status" className="break-all text-xs">{status}</span>
 </div>;
}
