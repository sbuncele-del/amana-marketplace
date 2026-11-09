import {storefrontSectionOrder,storefrontMissionSlugs,storefrontFeaturedTitle} from "../../../packages/storefront/config";
import type { StoreConfig } from "./domain";
import {defaultSlides} from '../../../packages/storefront/slides';
export {defaultSlides};
export const defaultStore: StoreConfig = {
  name: "Everyday Plentovo",
  theme: "original",
  slides: defaultSlides,
  sectionOrder: [...storefrontSectionOrder],
  hiddenSections: [],
  missionSlugs: [...storefrontMissionSlugs],
  featuredTitle: storefrontFeaturedTitle,
  featuredSlugs: [],
};
