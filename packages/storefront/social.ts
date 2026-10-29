// Country pages plus confirmed shared Plentovo channels. Instagram is pending verification.
export const sharedSocialLinks = [
 {name:'YouTube',label:'YouTube · Plentovo',href:'https://www.youtube.com/@plentovo'},
 {name:'TikTok',label:'TikTok · @plentovo',href:'https://www.tiktok.com/@plentovo'},
 {name:'Pinterest',label:'Pinterest · Plentovo',href:'https://www.pinterest.com/plentovo/'},
];
export function countrySocialLinks(country:'ZA'|'TN'|'DZ') {return [{name:'Facebook',label:country==='TN'?'Facebook · Plentovo Tunisia':country==='DZ'?'Facebook · Plentovo Algeria':'Facebook · Plentovo',href:'https://www.facebook.com/'+(country==='TN'?'plentovotunisia':country==='DZ'?'plentovoalgeria':'plentovo')},...sharedSocialLinks,{name:'All stores & socials',label:'All stores & socials',href:'https://plentovo.com/connect'}];}
