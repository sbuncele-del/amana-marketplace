type SitemapProduct={slug:string;groupSlug?:string;active?:boolean};
export function marketSitemap(market:'tunisia'|'algeria',pages:string[],products:SitemapProduct[]){
 const origin='https://plentovo.com/'+market;
 const locales=['en','fr','ar'];
 const escape=(value:string)=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
 const paths=[...new Set([...pages,...products.filter(p=>p.active!==false).map(p=>'product/'+(p.groupSlug||p.slug))])];
 const entries=paths.flatMap(path=>{
  const links=locales.map(locale=>({locale,url:origin+'/'+locale+(path?'/'+path:'')}));
  return links.map(link=>'<url><loc>'+escape(link.url)+'</loc>'+links.map(other=>'<xhtml:link rel="alternate" hreflang="'+other.locale+'" href="'+escape(other.url)+'"/>').join('')+'</url>');
 });
 if(entries.length>50000)throw new Error('Market sitemap exceeds 50,000 URL limit; split before publishing');
 return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+entries.join('')+'</urlset>';
}
