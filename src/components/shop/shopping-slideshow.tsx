import {SharedSlideshow} from '../../../packages/storefront/slideshow';
import {defaultSlides} from '@/lib/cms/defaults';
import type {StoreConfig} from '@/lib/cms/domain';
export function ShoppingSlideshow({slides=defaultSlides}:{slides?:StoreConfig['slides']}){return <SharedSlideshow slides={slides}/>;}
