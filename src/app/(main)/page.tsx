import type {Metadata} from 'next';
import Storefront from '@/components/shop/storefront';
export const metadata: Metadata = {
  title: 'Online Shopping South Africa',
  description: 'Good things. Plenty of choice. Shop home, kitchen, electronics, beauty, kids and more at Plentovo, with South African delivery.',
  alternates: { canonical: '/' },
};

export default function HomePage(){return <Storefront/>;}
