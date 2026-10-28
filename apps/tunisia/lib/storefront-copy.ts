import approved from '@/data/approved-storefront.json';
import {ideas as categories,slides as translatedSlides} from './merchandising';
import type {Locale,Translation} from './catalogue';
const tr=(en:string,fr:string,ar:string):Translation=>({en,fr,ar});
export const copy={
 eyebrow:tr('Plentovo · Everyday possibilities','Plentovo · Les possibilités du quotidien','بلينتوفو · إمكانيات كل يوم'),
 choose:tr('Help me choose','Aidez-moi à choisir','ساعدني على الاختيار'),
 allIdeas:tr('Explore all 15 shopping ideas','Découvrez nos 15 idées shopping','اكتشف 15 فكرة للتسوق'),
 all:tr('View all','Tout voir','عرض الكل'),
 explore:tr('Explore more','Découvrir davantage','اكتشف المزيد'),
 featured:tr(approved.featuredTitle,'Choisis pour votre quotidien','مختارات لحياتك اليومية'),
 budgetTitle:tr('Good finds. Your budget.','De belles trouvailles. À votre budget.','اختيارات جميلة تناسب ميزانيتك.'),
 under:tr('Shop finds under','Des trouvailles à moins de','تسوّق بأقل من'),
 options:tr('Choose options','Choisir les options','اختر الخيارات'),
 option:tr('Choose your option','Choisissez votre option','اختر الخيار المناسب'),
 from:tr('From','À partir de','ابتداءً من'),
 inStock:tr('In stock','En stock','متوفر'),
 empty:tr('No matching products yet','Aucun produit correspondant pour le moment','لا توجد منتجات مطابقة حاليًا'),
 collections:tr('Shopping ideas','Idées shopping','أفكار للتسوق'),
 footerIntro:tr('Everyday finds for your home, your family and everything in between.','Des trouvailles pour votre maison, votre famille et tous les moments du quotidien.','اختيارات لمنزلك وعائلتك وكل تفاصيل حياتك اليومية.'),
 shop:tr('Shop','Boutique','تسوّق'),
 help:tr('Help with your order','Aide pour votre commande','مساعدة بخصوص طلبك'),
 about:tr('About Plentovo','À propos de Plentovo','عن بلينتوفو'),
 follow:tr('Follow Plentovo','Suivre Plentovo','تابع بلينتوفو'),
 departments:tr('Explore our departments','Explorez nos rayons','استكشف أقسامنا'),
 rights:tr('All rights reserved.','Tous droits réservés.','جميع الحقوق محفوظة.'),
 footerLinks:{
  all:tr('All products','Tous les produits','كل المنتجات'),
  budget:tr('Finds under 50 DT','Trouvailles à moins de 50 DT','اختيارات بأقل من 50 د.ت'),
  contact:tr('Contact Plentovo','Contacter Plentovo','تواصل مع بلينتوفو'),
  shipping:tr('Shipping & delivery','Expédition et livraison','الشحن والتوصيل'),
  returns:tr('Returns & refunds','Retours et remboursements','الإرجاع واسترداد الأموال'),
  track:tr('Track your order','Suivre votre commande','تتبع طلبك'),
  cart:tr('Your cart','Votre panier','سلتك'),
  about:tr('About us','À propos de nous','من نحن'),
  partner:tr('Partner with us','Devenir partenaire','كن شريكًا لنا'),
  privacy:tr('Privacy policy','Politique de confidentialité','سياسة الخصوصية'),
  terms:tr('Terms of use','Conditions d’utilisation','شروط الاستخدام'),
  cookies:tr('Cookie policy','Politique de cookies','سياسة ملفات الارتباط'),
  company:tr('Company & registered office details','Société et siège social','بيانات الشركة والمقر المسجّل')
 }
};
const slideTexts=[
 tr(approved.slides[0].text,'Simplifiez votre quotidien en cuisine.','اجعل الطبخ اليومي أسهل قليلًا.'),
 tr(approved.slides[1].text,'Trouvez votre endroit préféré pour vous détendre.','اعثر على مكانك المفضل للاسترخاء.'),
 tr(approved.slides[2].text,'Du linge de lit, des essentiels de chevet et un peu plus de calme.','مفروشات وأساسيات بجانب السرير ولمسة من الهدوء.'),
 tr(approved.slides[3].text,'Trouvez de quoi accompagner leur prochain moment de jeu.','اعثر على ما يناسب لحظة اللعب القادمة.'),
 tr(approved.slides[4].text,'De petits changements pour une salle de bains adaptée à vous.','تغييرات صغيرة لحمام يناسب احتياجاتك.'),
 tr(approved.slides[5].text,'Prenez le temps d’une routine qui vous ressemble.','خصّص وقتًا لروتين يشبهك.'),
 tr(approved.slides[6].text,'Des trouvailles utiles pour le grand air et les moments partagés.','أشياء مفيدة للهواء الطلق وقضاء الوقت معًا.')
];
const slideActions=[tr(approved.slides[0].action,'Explorez la cuisine','استكشف المطبخ'),tr(approved.slides[1].action,'Explorez le salon','استكشف غرفة المعيشة'),tr(approved.slides[2].action,'Explorez la chambre','استكشف غرفة النوم'),tr(approved.slides[3].action,'Explorez les jeux','استكشف الألعاب'),tr(approved.slides[4].action,'Explorez la salle de bains','استكشف الحمام'),tr(approved.slides[5].action,'Explorez les soins quotidiens','استكشف العناية اليومية'),tr(approved.slides[6].action,'Explorez la vie en plein air','استكشف الحياة في الهواء الطلق')];
export const homeSlides=approved.slides.map((s,i)=>({...s,image:s.image.replace('/brand/',''),title:translatedSlides[i].title,text:slideTexts[i],action:slideActions[i],category:translatedSlides[i].category}));
const missionKeys:Record<string,string>={'small-space-living':'organisation','kitchen-made-easier':'kitchen','outdoor-living':'outdoor','bathroom':'bathroom','bedroom':'bedroom','dining-room':'dining','living-room':'living','home-office':'school','cleaning':'cleaning','laundry':'laundry','kids-play':'play','baby-essentials':'baby','beauty-routine':'care','fitness-at-home':'fitness','travel-essentials':'travel'};
const missionTranslations:Record<string,[string,string,string,string]>={
 'small-space-living':['Faites plus de place chez vous','وفّر مساحة أكبر في منزلك','Rangement, organisation et mobilier bien pensé. Un point de départ utile pour l’espace dont vous disposez.','تخزين وتنظيم وأثاث مدروس. ابدأ بما يناسب المساحة المتوفرة لديك.'],
 'kitchen-made-easier':['Simplifiez la cuisine au quotidien','اجعل الطبخ اليومي أسهل','Des outils utiles pour préparer, cuisiner et organiser. Commencez par ce qui faciliterait votre journée.','أدوات مفيدة للتحضير والطبخ والتنظيم. ابدأ بما يجعل يومك أسهل.'],
 'outdoor-living':['Profitez davantage de l’extérieur','استمتع بوقت أطول في الخارج','Des idées pratiques pour le jardin, un repas dehors ou une escapade. Choisissez selon l’occasion.','أفكار عملية للحديقة أو وجبة في الخارج أو يوم بعيدًا عن المنزل. اختر ما يناسب خططك.'],
 'bathroom':['Rafraîchissez votre salle de bains','جدّد حمامك','Organisez vos essentiels, rafraîchissez votre salle de bains et simplifiez votre routine.','نظّم أساسياتك اليومية وجدّد حمامك واجعل روتينك أسهل.'],
 'bedroom':['Une chambre qui vous ressemble','اجعل غرفة نومك على ذوقك','Du linge de lit, du mobilier de chevet et du rangement pour une chambre adaptée à vous.','مفروشات وأثاث بجانب السرير وتنظيم لغرفة نوم تناسبك.'],
 'dining-room':['Réunissez tout le monde à table','اجمع الجميع حول المائدة','Mobilier, vaisselle et essentiels de service pour les repas quotidiens et les moments partagés.','أثاث وأوانٍ وأساسيات تقديم للوجبات اليومية والمناسبات المشتركة.']
};
export const homeMissions=approved.missions.map(m=>{const t=missionTranslations[m.slug];const category=categories.find(c=>c.key===missionKeys[m.slug]);return {...m,key:missionKeys[m.slug],image:m.image.startsWith('/brand/')?'/tunisia'+m.image:m.image,title:tr(m.title,t?.[0]||category?.title.fr||m.title,t?.[1]||category?.title.ar||m.title),description:tr(m.description,t?.[2]||'Des idées utiles pour votre quotidien.',t?.[3]||'أفكار مفيدة لحياتك اليومية.')};});
export const featuredMissions=approved.featuredMissions;
export const discoveryGroups=[
 {title:tr('Make yourself at home','Faites comme chez vous','اشعر بأنك في بيتك'),text:tr('Stylish living for everyday life.','Du style pour la vie de tous les jours.','أناقة للحياة اليومية.'),action:tr('Shop home & kitchen','Maison et cuisine','تسوّق المنزل والمطبخ'),key:'home',items:['living','kitchen','bedroom','dining']},
 {title:tr('A little everyday care','Un peu de soin au quotidien','قليل من العناية كل يوم'),text:tr('Feel good, every day.','Se sentir bien, chaque jour.','اشعر بالراحة كل يوم.'),action:tr('Shop beauty','Beauté et soins','تسوّق الجمال'),key:'care',items:['care','hair','fragrances','bathroom']},
 {title:tr('Made for play','Place au jeu','صُنع للعب'),text:tr('Big adventures start at home.','Les grandes aventures commencent à la maison.','المغامرات الكبيرة تبدأ في المنزل.'),action:tr('Shop kids & baby','Enfants et bébés','تسوّق الأطفال والرضع'),key:'kids',items:['play','baby','school','outdoor']},
 {title:tr('Smart everyday upgrades','Des améliorations pour le quotidien','إضافات ذكية لكل يوم'),text:tr('Tech, tools and a little more ease.','De la tech, des outils et un peu plus de simplicité.','تقنية وأدوات وقليل من السهولة.'),action:tr('Shop electronics','Électronique','تسوّق الإلكترونيات'),key:'electronics',items:['audio','wearables','lighting','organisation']}
];
export const departmentIdeas=[...categories,{key:'fragrances',image:'categories/fragrances-v1.webp',title:tr('Fragrances','Parfums','العطور')}];
export const productRows=[
 {key:'kitchen',title:tr('Make room for kitchen joy','Du bonheur en cuisine','مساحة للمتعة في المطبخ'),text:tr('Useful finds for the meals and moments you make.','Des trouvailles utiles pour vos repas et vos moments partagés.','اختيارات مفيدة لوجباتك ولحظاتك اليومية.')},
 {key:'electronics',title:tr('Small tech. More possibilities.','Petite tech. Grandes possibilités.','تقنية صغيرة. إمكانيات أكثر.'),text:tr('Practical upgrades for home, work and downtime.','Des améliorations pratiques pour la maison, le travail et la détente.','إضافات عملية للمنزل والعمل والاسترخاء.')},
 {key:'kids',title:tr('More joy for the little ones','Plus de joie pour les petits','فرح أكثر للصغار'),text:tr('Find something for their next adventure.','Trouvez de quoi accompagner leur prochaine aventure.','اعثر على ما يناسب مغامرتهم القادمة.')},
 {key:'care',title:tr('A little care, every day','Un peu de soin, chaque jour','قليل من العناية كل يوم'),text:tr('Everyday essentials for feeling your best.','Des essentiels pour vous sentir bien au quotidien.','أساسيات يومية لتشعر بأفضل حال.')},
 {key:'organisation',title:tr('A place for everything','Une place pour chaque chose','مكان لكل شيء'),text:tr('Simple ways to make more room at home.','Des solutions simples pour gagner de la place chez vous.','طرق بسيطة لتوفير مساحة أكبر في المنزل.')},
 {key:'outdoor',title:tr('Good days start outside','Les beaux jours commencent dehors','أيام جميلة تبدأ في الخارج'),text:tr('Find your next reason to enjoy the outdoors.','Trouvez votre prochaine raison de profiter de l’extérieur.','اعثر على سببك القادم للاستمتاع بالهواء الطلق.')}
];
const normal=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const aliases:Record<string,string[]>={home:['living','bedroom','kitchen','dining','organisation','decor'],electronics:['audio','lighting','wearables','electronics','bluetooth','camera','charge','projecteur'],kids:['play','baby','school'],hair:['hair','cheveu','tondeuse','rasoir'],fragrances:['parfum','fragrance'],fitness:['fitness','sport','exercise','roue','roller'],travel:['travel','voyage','sac'],cleaning:['cleaning','nettoy'],laundry:['laundry','linge','lavage']};
export function matchesCategory(p:{category:string;title:Translation},key:string){const hay=normal(p.category+' '+Object.values(p.title).join(' '));return (aliases[key]||[key]).some(term=>hay.includes(normal(term)));}
export function local(locale:Locale,text:Translation){return text[locale];}
