import {Geist} from 'next/font/google';
import {BackOfficePreview} from './back-office-preview';

const geist = Geist({subsets: ['latin']});

export const metadata = {title: 'Back Office Preview | Plentovo', robots: {index: false, follow: false}};

export default function ExperiencePreview() {
  return <div className={geist.className}><BackOfficePreview /></div>;
}
