import Link from 'next/link';
import {CreditCard, FileText, House, Layers3, Package, ShoppingCart, Truck, Users} from 'lucide-react';
import styles from '../../experience-preview/preview.module.css';

export const backOfficeHome = '/operations/back-office';
const links = [
  ['Today', '', House], ['Orders', '?view=orders', ShoppingCart], ['Payments', '?view=payments', CreditCard],
  ['Products', '/products', Package], ['Suppliers', '/suppliers', Layers3], ['Quotes', '?view=quotes', FileText],
  ['Delivery', '?view=delivery', Truck], ['Customers', '/customers', Users],
] as const;

export function BackOfficeNavigation({active}: {active: string}) {
  return <aside className={styles.sidebar}>
    <Link href={backOfficeHome} aria-label="Plentovo Back Office">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/plentovo-light.svg" alt="Plentovo" className={styles.logo} />
    </Link>
    <nav aria-label="Back Office">{links.map(([title, path, Icon]) =>
      <Link key={title} className={styles.navLink} aria-current={active === title ? 'page' : undefined} href={backOfficeHome + path}>
        <Icon size={24} aria-hidden="true" />{title}
      </Link>)}</nav>
  </aside>;
}
