import {siteUrl} from '@/lib/site';
import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
 return {rules:[{userAgent:'*',allow:'/',disallow:['/api/','/account','/wishlist','/cart','/login','/register','/orders/','/dashboard/','/admin/','/checkout/','/operations','/experience-preview',...['tunisia','algeria'].flatMap(market=>['en','fr','ar'].flatMap(locale=>['cart','checkout','track'].map(page=>'/'+market+'/'+locale+'/'+page)))]}],
 sitemap:[siteUrl+'/sitemap.xml',siteUrl+'/tunisia/sitemap.xml',siteUrl+'/algeria/sitemap.xml'],host:siteUrl};
}
