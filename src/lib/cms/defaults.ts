import {storefrontSectionOrder} from "../../../packages/storefront/config";
import type { StoreConfig } from "./domain";
import {defaultSlides} from '../../../packages/storefront/slides';
export {defaultSlides};
export const defaultStore: StoreConfig = {
  name: "Everyday Plentovo",
  theme: "original",
  slides: defaultSlides,
  sectionOrder: [...storefrontSectionOrder],
  hiddenSections: [],
  missionSlugs: [
    "small-space-living",
    "kitchen-made-easier",
    "outdoor-living",
    "bathroom",
    "bedroom",
    "dining-room",
  ],
  featuredTitle: "Chosen for your everyday",
  featuredSlugs: [],
};
