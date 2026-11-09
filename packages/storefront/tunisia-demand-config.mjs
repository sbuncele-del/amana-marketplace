// Natural shopper terms, scoped to Tunisia. Shared anchor comparisons stay within a batch.
export const tunisiaBatches={
 kitchen:['air fryer','hachoir','mixeur','friteuse sans huile','خلاط'],
 beauty:['air fryer','sèche cheveux','lisseur','brosse soufflante','tondeuse'],
 home:['air fryer','rangement','étagère','chauffage','aspirateur'],
 electronics:['air fryer','smart watch','écouteurs bluetooth','power bank','montre connectée'],
};
export const tunisiaIntents=[
 ['air fryer',/air.?fryer|friteuse.*sans.huile|قلاية.*هوائ/i,/papier|silicone|liner|accessoir|basket|panier|moule|ورق/i,'Cuisine du quotidien','Plus de temps à table.',7],
 ['friteuse sans huile',/air.?fryer|friteuse.*sans.huile|قلاية.*هوائ/i,/papier|silicone|liner|accessoir|basket|panier|moule|ورق/i,'Cuisine du quotidien','Plus de temps à table.',7],
 ['hachoir',/hachoir|chopper|قطاعة|فرامة/i,/lame.seule|replacement|rechange/i,'Cuisine du quotidien','La préparation, en plus simple.',7],
 ['mixeur',/mixeur|blender|mixer|خلاط/i,/lame.seule|rechange|pinceau|cosmétique/i,'Cuisine du quotidien','De bonnes idées, à mixer.',7],
 ['خلاط',/mixeur|blender|mixer|خلاط/i,/lame.seule|rechange|pinceau|cosmétique/i,'Cuisine du quotidien','De bonnes idées, à mixer.',7],
 ['sèche cheveux',/s[eè]che.?cheveux|hair.?dryer|مجفف.*شعر/i,/support|holder|brosse|brush|rechange/i,'Un peu de soin, chaque jour','Votre routine mérite un peu de douceur.',6],
 ['lisseur',/lisseur|straightener|fer.*lisser|مملس/i,/support|holder|rechange/i,'Un peu de soin, chaque jour','Un bon départ pour votre journée.',6],
 ['brosse soufflante',/brosse.*soufflante|hot.air.brush|فرشاة.*هوائ/i,/support|holder|rechange/i,'Un peu de soin, chaque jour','Votre routine, un peu plus simple.',6],
 ['tondeuse',/tondeuse|hair.*clipper|beard.*trimmer|ماكينة.*حلاقة/i,/gazon|pelouse|lawn|chien|animal|rechange/i,'Un peu de soin, chaque jour','Prenez soin de vous, à votre rythme.',6],
 ['rangement',/rangement|organis[aezt]|storage|منظم|تخزين/i,/m[eé]dic|pilule|pills|lame|creme|crème/i,'Faites plus de place','Une place pour chaque chose.',6],
 ['étagère',/[eé]tag[eè]re|shelf|shelves|رفوف/i,/support.*telephone|mural.*t[eé]l[eé]/i,'Faites plus de place','Retrouvez de la place chez vous.',6],
 ['chauffage',/chauffage|heater|سخان|دفاية/i,/eau|water|aquarium|voiture|car\b|rechange/i,'Bien chez vous','Un peu plus de confort à la maison.',9],
 ['aspirateur',/aspirateur|vacuum|مكنسة/i,/sac.seul|filtre.seul|rechange|replacement/i,'Bien chez vous','Moins de miettes. Plus de place pour vivre.',7],
 ['smart watch',/smart.?watch|montre.*connect|ساعة.*ذكي/i,/bracelet.seul|strap|chargeur|charger|coque|protect/i,'Des idées pour le quotidien','Un petit plus dans votre journée.',6],
 ['montre connectée',/smart.?watch|montre.*connect|ساعة.*ذكي/i,/bracelet.seul|strap|chargeur|charger|coque|protect/i,'Des idées pour le quotidien','Un petit plus dans votre journée.',6],
 ['écouteurs bluetooth',/[eé]couteurs.*(?:bluetooth|sans.fil)|(?:wireless|bluetooth).*earbud|سماعات.*(?:بلوتوث|لاسلكي)/i,/coque|case.only|rechange/i,'Des idées pour le quotidien','Votre journée, avec sa bande-son.',6],
 ['power bank',/power.?bank|batterie.externe|شاحن.*متنقل/i,/coque|case.only|rechange/i,'Des idées pour le quotidien','Gardez un peu d’énergie en réserve.',6],
];
