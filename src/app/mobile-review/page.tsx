import {notFound} from 'next/navigation';
export const metadata={title:'Mobile layout review',robots:{index:false,follow:false}};
export default function MobileReview(){
 if(process.env.VERCEL_ENV!=='preview'&&process.env.NODE_ENV!=='development')notFound();
 return <main style={{minHeight:'100vh',background:'#e8e8e8',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}><h1 style={{fontSize:'16px',fontWeight:700}}>Plentovo · 390px mobile browser preview</h1><p style={{fontSize:'13px'}}>Live responsive website. Physical-device keyboard and installation checks remain separate.</p><iframe title="Plentovo mobile shopping preview" src="/" style={{width:'390px',height:'844px',border:'1px solid #ccc',borderRadius:'16px',background:'white'}}/></main>;
}
