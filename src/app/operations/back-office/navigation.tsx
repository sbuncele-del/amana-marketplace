'use client';

import {signOut} from 'next-auth/react';
import Link from 'next/link';
import {CreditCard, FileText, House, Layers3, LifeBuoy, LogOut, Package, ShoppingCart, Truck, Users} from 'lucide-react';
import styles from '../../experience-preview/preview.module.css';

export const backOfficeHome = '/operations/back-office';
const links = [
  ['Today', '', House], ['Orders', '?view=orders', ShoppingCart], ['Payments', '?view=payments', CreditCard],
  ['Products', '/products', Package], ['Suppliers', '/suppliers', Layers3], ['Quotes', '?view=quotes', FileText],
  ['Delivery', '?view=delivery', Truck], ['Customers', '/customers', Users], ['Support', '/support', LifeBuoy],
] as const;

export function BackOfficeNavigation({active}: {active: string}) {
  return <aside className={`${styles.sidebar} min-[781px]:sticky min-[781px]:top-0 min-[781px]:flex min-[781px]:h-dvh min-[781px]:flex-col`}>
    <Link href={backOfficeHome} aria-label="Plentovo Back Office" className="shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/plentovo-light.svg" alt="Plentovo" className={styles.logo} />
    </Link>
    <nav aria-label="Back Office" className="min-[781px]:min-h-0 min-[781px]:overflow-y-auto">
      {links.map(([title, path, Icon]) =>
        <Link key={title} className={styles.navLink} aria-current={active === title ? 'page' : undefined} href={backOfficeHome + path}>
          <Icon size={24} aria-hidden="true" />{title}
        </Link>)}
    </nav>
    <footer className="mt-3 shrink-0 border-t border-white/15 pt-2 min-[781px]:mt-auto">
      <button
        type="button"
        className="!h-11 !gap-3 !px-4 !text-sm text-white/80 hover:text-white"
        onClick={() => void signOut({redirectTo: '/login?callbackUrl=%2Foperations%2Fback-office'})}
      >
        <LogOut size={17} aria-hidden="true" />Sign out
      </button>
    </footer>
  </aside>;
}
