// Addresses activated by the owner in Google Workspace; all currently alias one inbox.
export const contacts = {hello:'hello@plentovo.com',support:'support@plentovo.com',sales:'sales@plentovo.com',accounts:'accounts@plentovo.com',legal:'legal@plentovo.com',privacy:'privacy@plentovo.com',complaints:'complaints@plentovo.com'} as const;
export const contactLabels = {
 en:{hello:'General enquiries',support:'Orders, delivery & returns',sales:'Products & sales',accounts:'Invoices & accounts',legal:'Legal enquiries',privacy:'Privacy & personal information',complaints:'Complaints'},
 fr:{hello:'Renseignements généraux',support:'Commandes, livraison et retours',sales:'Produits et ventes',accounts:'Factures et comptabilité',legal:'Questions juridiques',privacy:'Confidentialité et données personnelles',complaints:'Réclamations'},
 ar:{hello:'استفسارات عامة',support:'الطلبات والتوصيل والإرجاع',sales:'المنتجات والمبيعات',accounts:'الفواتير والحسابات',legal:'الشؤون القانونية',privacy:'الخصوصية والبيانات الشخصية',complaints:'الشكاوى'},
};
export function contactHref(channel:keyof typeof contacts,country:string,locale='en') {return 'mailto:'+contacts[channel]+'?subject='+encodeURIComponent(`Plentovo ${country} · ${locale.toUpperCase()}`);}
