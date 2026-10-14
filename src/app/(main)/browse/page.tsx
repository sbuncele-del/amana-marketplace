import type {Metadata} from 'next';
import {CatalogueBrowser} from '@/components/shop/catalogue-browser';
export const metadata:Metadata={title:'Browse Products in South Africa',description:'Explore home, kitchen, electronics, beauty, kids and more. Filter by price and availability at Afrishelf.',alternates:{canonical:'/browse'}};
export default function BrowsePage(){return <CatalogueBrowser/>;}
