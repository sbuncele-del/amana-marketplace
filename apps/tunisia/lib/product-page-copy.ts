// Product page wording shared with the South Africa layout (details card, help cards). French and Arabic need a native-speaker review.
import type {Locale} from './catalogue';
type Words = {details: string; moreTitle: string; explore: (department: string) => string; deliveryTitle: string; deliveryText: string; helpTitle: string; helpText: string; original: string};
export const productPageCopy: Record<Locale, Words> = {
  en: {details: 'Product details', moreTitle: 'More in this department', explore: d => `Explore ${d.toLowerCase()}.`, deliveryTitle: 'Delivery questions?', deliveryText: 'Learn how your delivery is arranged.', helpTitle: 'Need help choosing?', helpText: 'Ask Plentovo about this product.', original: 'Supplier description in its original language'},
  fr: {details: 'Détails du produit', moreTitle: 'Plus dans ce rayon', explore: d => `Découvrez ${d.toLowerCase()}.`, deliveryTitle: 'Une question sur la livraison ?', deliveryText: 'Découvrez comment votre livraison est organisée.', helpTitle: 'Besoin d’aide pour choisir ?', helpText: 'Posez vos questions à Plentovo sur ce produit.', original: 'Description du fournisseur dans sa langue d’origine'},
  ar: {details: 'تفاصيل المنتج', moreTitle: 'المزيد في هذا القسم', explore: d => `تصفّح ${d}.`, deliveryTitle: 'لديك أسئلة عن التوصيل؟', deliveryText: 'تعرّف على كيفية ترتيب توصيل طلبك.', helpTitle: 'تحتاج مساعدة في الاختيار؟', helpText: 'اسأل Plentovo عن هذا المنتج.', original: 'وصف المورّد بلغته الأصلية'},
};
