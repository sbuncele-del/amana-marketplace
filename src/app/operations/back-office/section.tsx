import {Geist} from 'next/font/google';
import styles from '../../experience-preview/preview.module.css';
import {BackOfficeNavigation} from './navigation';

const geist = Geist({subsets: ['latin']});

export function BackOfficeSection({active, children}: {active: string; children: React.ReactNode}) {
  return <div className={`${geist.className} ${styles.shell}`} data-panel="false">
    <BackOfficeNavigation active={active} />
    <header className={styles.header}><span className="text-sm font-semibold">Plentovo Back Office</span></header>
    <main className={`${styles.main} ${styles.embedded}`} id="main-content">
      <h1>{active}</h1>
      {children}
    </main>
  </div>;
}
