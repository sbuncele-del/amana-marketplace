import Image from 'next/image';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';

const groups=[
  {
    "title": "Ready for the next job",
    "subtitle": "Tools and practical help for everyday fixes.",
    "href": "/department/diy-hardware",
    "action": "Explore tools & DIY",
    "items": [
      {
        "label": "Tools & repair",
        "href": "/department/tools",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/cfafc39f-31a1-4622-bf57-41e92d6bf4af_Product_Staging.jpg?v=1791811486"
      },
      {
        "label": "Hardware",
        "href": "/department/hardware",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/6e6a82f0-2830-444e-8226-1b97ac6b4cbe.jpg?v=1792075990"
      },
      {
        "label": "Car care & tools",
        "href": "/department/car-care-tools",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/4c605109-2e82-40d6-9501-2b7752d525f2.jpg?v=1791449421"
      },
      {
        "label": "Measuring & scales",
        "href": "/department/measuring-tools-scales",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/ce0609f9-health-beauty-personal-bathroom-scale-perfect-dealz-1233947295755__83753.jpg?v=1768537453"
      }
    ]
  },
  {
    "title": "Make more of outside",
    "subtitle": "Fresh air, movement and time together.",
    "href": "/department/garden-outdoor",
    "action": "Explore garden & outdoor",
    "items": [
      {
        "label": "Garden care",
        "href": "/department/garden-care",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/pomelli_photoshoot_image_1_1_0518_2_9c23928c-dd55-4591-b3f0-73dcb40d86ea.jpg?v=1779090361"
      },
      {
        "label": "Camping & picnic",
        "href": "/department/camping-braai-picnic",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/a481a595-9ef4-4530-9c04-7e464b15d19c.jpg?v=1791531065"
      },
      {
        "label": "Fitness & exercise",
        "href": "/department/fitness-exercise",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/Gemini_Generated_Image_xn8moqxn8moqxn8m.png?v=1782987288"
      },
      {
        "label": "Sports accessories",
        "href": "/department/sports-accessories",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/pomelli_photoshoot_image_1_1_0525_32.jpg?v=1779702081"
      }
    ]
  },
  {
    "title": "Useful home essentials",
    "subtitle": "Power, lighting and security in one place.",
    "href": "/department/electrical-accessories",
    "action": "Explore electrical essentials",
    "items": [
      {
        "label": "Backup power",
        "href": "/department/backup-power",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/pomelli_photoshoot_image_1_1_0831_29.png?v=1788186039"
      },
      {
        "label": "Safety & security",
        "href": "/department/security",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/shot_0_Edit_with_AI.jpg?v=1791970305"
      },
      {
        "label": "Outdoor & solar lights",
        "href": "/department/outdoor-solar-lighting",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/c89e7057-9540-4be1-afe3-b98d6344979f.jpg?v=1791195370"
      },
      {
        "label": "Electrical accessories",
        "href": "/department/electrical-accessories",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/aT_Zns68s9jegfjBn6XOIa.png?v=1792593592"
      }
    ]
  },
  {
    "title": "For your day ahead",
    "subtitle": "Work, travel and useful finishing touches.",
    "href": "/department/stationery-office-supplies",
    "action": "Explore work essentials",
    "items": [
      {
        "label": "Stationery & office",
        "href": "/department/stationery-office-supplies",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/shot_0-2026-10-15T162849.445.jpg?v=1792075202"
      },
      {
        "label": "Fashion & accessories",
        "href": "/department/clothing-accessories",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/d63d7207-smart-sunglasses-wireless-headset-default-title-33746945507417.png?v=1771255446"
      },
      {
        "label": "Travel essentials",
        "href": "/collections/travel-essentials",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/fe4f3027-Toiletries_Travel_Pouch_Kit_with_Refillable_Spray_Bottles_Perfect_dealz__63091.jpg?v=1768538363"
      },
      {
        "label": "Wardrobes",
        "href": "/department/affordable-wardrobes",
        "image": "https://cdn.shopify.com/s/files/1/0599/8821/3889/files/Gemini_Generated_Image_2vprqf2vprqf2vpr.jpg?v=1791789847"
      }
    ]
  }
];

export function MoreDepartments(){
 return <section id="more-to-explore" aria-labelledby="more-departments-title" className="mx-auto max-w-[1800px] px-4 pt-10">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 id="more-departments-title" className="text-2xl font-bold tracking-tight">More to explore</h2><p className="mt-2 text-sm text-gray-500">Find a useful starting point for your next plan.</p></div><Link href="/browse" className="text-xs font-semibold text-red-700">Browse all products →</Link></div>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
   {groups.map(group=><article key={group.title} className="flex min-w-0 flex-col rounded-xl border border-[#ECEAE5] bg-white p-4 lg:p-5">
    <h3 className="text-xl font-bold leading-tight tracking-tight">{group.title}</h3>
    <p className="mt-1.5 text-xs leading-5 text-gray-500">{group.subtitle}</p>
    <div className="mb-5 mt-4 grid grid-cols-2 gap-x-3 gap-y-4">{group.items.map(item=><Link key={item.href} href={item.href} className="group min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700">
     <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F6F4F0]"><Image src={item.image} alt="" unoptimized fill sizes="(max-width:640px) 44vw,(max-width:1280px) 22vw,200px" className="object-cover transition duration-300 motion-reduce:transition-none group-hover:scale-105"/></div>
     <span className="mt-2 block text-xs font-medium group-hover:text-red-700">{item.label}</span>
    </Link>)}</div>
    <Link href={group.href} className="mt-auto flex items-center justify-center gap-3 rounded-full bg-[#F4F4F4] px-3 py-3 text-xs font-semibold transition hover:bg-red-50 hover:text-red-700">{group.action}<ArrowRight size={15}/></Link>
   </article>)}
  </div>
 </section>;
}
