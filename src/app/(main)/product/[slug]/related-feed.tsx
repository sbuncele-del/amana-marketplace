'use client';

import {CatalogueCard,type CatalogueCardData} from '@/components/shop/catalogue-card';
import {RelatedFeed} from '../../../../../packages/storefront/related-feed';

export default function RelatedCatalogueFeed({department,excluded}:{department:string;excluded:string[]}){
 return <RelatedFeed<CatalogueCardData>
  title="More from this department"
  endpoint={'/api/catalogue?limit=24&collection='+encodeURIComponent(department)}
  excluded={excluded}
  select={data=>data.products.filter(product=>product.category.slug===department&&product.supplierAvailable&&!product.priceOnRequest&&product.price>0&&product.images[0])}
  render={product=><CatalogueCard product={product}/>}
 />;
}
