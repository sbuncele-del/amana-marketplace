import type {MetadataRoute} from 'next';
export default function manifest(): MetadataRoute.Manifest {
 return {
  id:'/', name:'Plentovo', short_name:'Plentovo',
  description:'Good things. Plenty of choice. Shop useful finds for your everyday.',
  start_url:'/', scope:'/', display:'standalone', lang:'en-ZA',
  background_color:'#FAF8F5', theme_color:'#DA292B',
  icons:[
   {src:'/brand/plentovo-icon.png',sizes:'192x192',type:'image/png',purpose:'any'},
   {src:'/icons/plentovo-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
  ],
  shortcuts:[{name:'Shopping ideas',url:'/collections'},{name:'Search products',url:'/browse'},{name:'Your cart',url:'/cart'}],
 };
}
