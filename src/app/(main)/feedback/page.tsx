import type {Metadata} from 'next';
import FeedbackForm from './form';
export const metadata:Metadata={title:'Share your experience',robots:{index:false,follow:false}};
export default function FeedbackPage(){return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-3xl font-bold">How is your Plentovo find?</h1><p className="my-5 text-slate-600">Tell us what felt good and what we could improve. Your feedback stays with our customer-care team.</p><FeedbackForm/></main>;}
