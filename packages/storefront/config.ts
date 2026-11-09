// Approved cross-shop structure; market data and mobile personalisation stay local.
export const storefrontSectionOrder = ['missions','demand','featured','discovery','value','departments','more','budgets','help'] as const;
export const storefrontFeaturedTitle = 'Chosen for your everyday';
export const storefrontMissionSlugs = ['small-space-living','kitchen-made-easier','outdoor-living','bathroom','bedroom','dining-room'];

// Apply the approved priority position even to older saved CMS configurations.
export function alignedStorefrontOrder(order:readonly string[]){
 const sections=[...new Set(order.filter(id=>id!=='demand'))];
 const firstProducts=sections.findIndex(id=>['featured','value','departments'].includes(id));
 sections.splice(firstProducts<0?sections.length:firstProducts,0,'demand');
 return sections;
}
