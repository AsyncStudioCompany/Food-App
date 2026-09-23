import type { AisleId, Ingredient, PhotoCredit, Recipe } from '../domain/types.ts'
import { MEALDB_RECIPES } from './mealdb.ts'

export const AISLES: [AisleId, string][] = [
  ['frais', 'Crèmerie & frais'],
  ['legumes', 'Légumes'],
  ['fruits', 'Fruits'],
  ['epicerie', 'Épicerie'],
]

const I = (
  id: string,
  name: string,
  aisle: AisleId,
  unit: Ingredient['unit'],
  defaultQty: number,
  extra: Pick<Ingredient, 'animal' | 'allergens'> = {},
): Ingredient => ({ id, name, aisle, unit, defaultQty, ...extra })

export const INGREDIENTS: Ingredient[] = [
  I('oeufs', 'Œufs', 'frais', 'pc', 6, { animal: 'egg', allergens: ['Œufs'] }),
  I('creme', 'Crème fraîche', 'frais', 'cl', 20, { animal: 'dairy', allergens: ['Lactose'] }),
  I('beurre', 'Beurre', 'frais', 'g', 250, { animal: 'dairy', allergens: ['Lactose'] }),
  I('lait', 'Lait', 'frais', 'cl', 100, { animal: 'dairy', allergens: ['Lactose'] }),
  I('fromage', 'Parmesan', 'frais', 'g', 100, { animal: 'dairy', allergens: ['Lactose'] }),
  I('mozzarella', 'Mozzarella', 'frais', 'g', 125, { animal: 'dairy', allergens: ['Lactose'] }),
  I('lardons', 'Lardons', 'frais', 'g', 200, { animal: 'pork' }),
  I('jambon', 'Jambon', 'frais', 'pc', 4, { animal: 'pork' }),
  I('poulet', 'Poulet', 'frais', 'g', 300, { animal: 'meat' }),
  I('saumon', 'Saumon', 'frais', 'g', 250, { animal: 'fish' }),
  I('yaourt', 'Yaourts', 'frais', 'pc', 4, { animal: 'dairy', allergens: ['Lactose'] }),
  I('feta', 'Feta', 'frais', 'g', 200, { animal: 'dairy', allergens: ['Lactose'] }),
  I('cheddar', 'Fromage râpé', 'frais', 'g', 150, { animal: 'dairy', allergens: ['Lactose'] }),
  I('chorizo', 'Chorizo', 'frais', 'g', 200, { animal: 'pork' }),
  I('boeuf', 'Bœuf', 'frais', 'g', 500, { animal: 'meat' }),
  I('boeuf_hache', 'Bœuf haché', 'frais', 'g', 400, { animal: 'meat' }),
  I('crevettes', 'Crevettes', 'frais', 'g', 200, { animal: 'fish' }),
  I('champignons', 'Champignons', 'legumes', 'g', 250),
  I('oignon', 'Oignons', 'legumes', 'pc', 2),
  I('ail', 'Ail', 'legumes', 'pc', 3),
  I('courgette', 'Courgettes', 'legumes', 'pc', 2),
  I('poivron', 'Poivron', 'legumes', 'pc', 1),
  I('pdt', 'Pommes de terre', 'legumes', 'pc', 4),
  I('epinards', 'Épinards', 'legumes', 'g', 200),
  I('tomate', 'Tomates', 'legumes', 'pc', 4),
  I('carotte', 'Carottes', 'legumes', 'pc', 4),
  I('brocoli', 'Brocoli', 'legumes', 'g', 300),
  I('oignon_vert', 'Oignons nouveaux', 'legumes', 'pc', 6),
  I('aubergine', 'Aubergines', 'legumes', 'pc', 2),
  I('concombre', 'Concombre', 'legumes', 'pc', 1),
  I('poireau', 'Poireaux', 'legumes', 'pc', 2),
  I('haricots_verts', 'Haricots verts', 'legumes', 'g', 300),
  I('chou', 'Chou', 'legumes', 'pc', 1),
  I('gingembre', 'Gingembre', 'legumes', 'g', 50),
  I('citron', 'Citron', 'fruits', 'pc', 1),
  I('citron_vert', 'Citron vert', 'fruits', 'pc', 2),
  I('banane', 'Bananes', 'fruits', 'pc', 3),
  I('pomme', 'Pommes', 'fruits', 'pc', 4),
  I('avocat', 'Avocats', 'fruits', 'pc', 2),
  I('pates', 'Pâtes', 'epicerie', 'g', 500, { allergens: ['Gluten'] }),
  I('riz', 'Riz', 'epicerie', 'g', 500),
  I('farine', 'Farine', 'epicerie', 'g', 1000, { allergens: ['Gluten'] }),
  I('semoule', 'Semoule', 'epicerie', 'g', 500, { allergens: ['Gluten'] }),
  I('pain', 'Pain de mie', 'epicerie', 'pc', 8, { allergens: ['Gluten'] }),
  I('pois_chiches', 'Pois chiches', 'epicerie', 'g', 400),
  I('tomate_conc', 'Tomates concassées', 'epicerie', 'g', 400),
  I('lait_coco', 'Lait de coco', 'epicerie', 'cl', 40),
  I('lentilles', 'Lentilles', 'epicerie', 'g', 500),
  I('thon', 'Thon', 'epicerie', 'g', 140, { animal: 'fish' }),
  I('tortillas', 'Tortillas', 'epicerie', 'pc', 6, { allergens: ['Gluten'] }),
  I('nouilles', 'Nouilles de riz', 'epicerie', 'g', 250),
  I('haricots_rouges', 'Haricots rouges', 'epicerie', 'g', 400),
]

type Row = [id: string, qty: number]
type Photo = { url: string; credit?: PhotoCredit }

const MEALDB = (file: string): Photo => ({ url: 'https://www.themealdb.com/images/media/meals/' + file })
const FLICKR = (url: string, author: string, license: string, page: string): Photo => ({ url, credit: { author, license, url: page } })

/**
 * Photos of the house recipes, checked one by one: the same dish (or a very close one) from TheMealDB,
 * otherwise a freely licensed photo found with Openverse (credited on the recipe page).
 * No photo rather than a wrong one: the recipe then shows the striped background of the design.
 */
const PHOTOS: Record<string, Photo> = {
  r1: MEALDB('yvpuuy1511797244.jpg'),
  r2: FLICKR('https://live.staticflickr.com/2555/4192674340_c27f81b9a4_b.jpg', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/4192674340'),
  r3: MEALDB('llcbn01574260722.jpg'),
  r4: MEALDB('quuxsx1511476154.jpg'),
  r5: FLICKR('https://live.staticflickr.com/4056/4686189351_effc253bcc_b.jpg', 'danoxster', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/41132143@N00/4686189351'),
  r6: FLICKR('https://live.staticflickr.com/2/1356543_38c1234425_b.jpg', 'stu_spivack', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/35034346243@N01/1356543'),
  r7: MEALDB('wuyd2h1765655837.jpg'),
  r8: FLICKR('https://live.staticflickr.com/8230/8563900925_e3433ee86a_b.jpg', 'pelican', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/85936780@N00/8563900925'),
  r9: MEALDB('g373701551450225.jpg'),
  r10: FLICKR('https://live.staticflickr.com/65535/51779128469_fbf0ea21be_b.jpg', 'MattCC716', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/27874898@N00/51779128469'),
  r11: MEALDB('1550441882.jpg'),
  r12: MEALDB('58bkyo1593350017.jpg'),
  r13: FLICKR('https://live.staticflickr.com/5455/30800638736_fd5825e31f_b.jpg', 'USDA', 'Domaine public', 'https://www.flickr.com/photos/41284017@N08/30800638736'),
  r15: FLICKR('https://live.staticflickr.com/3193/2409085893_ef652e7374_b.jpg', 'avlxyz', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/10559879@N00/2409085893'),
  r16: FLICKR('https://live.staticflickr.com/5098/5452560446_0e6faf054a_b.jpg', 'plasticrevolver', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/31474531@N00/5452560446'),
  r17: MEALDB('0dhtwr1763371444.jpg'),
  r18: MEALDB('xutquv1505330523.jpg'),
  r19: FLICKR('https://live.staticflickr.com/4077/5451534765_6cb5e9b840_b.jpg', 'seelensturm', 'CC BY 2.0', 'https://www.flickr.com/photos/61404197@N00/5451534765'),
  r20: MEALDB('xxyupu1468262513.jpg'),
  r21: FLICKR('https://live.staticflickr.com/3003/2548028515_32582280dd_b.jpg', 'cyclonebill', 'CC BY-SA 2.0', 'https://www.flickr.com/photos/23178876@N03/2548028515'),
  r22: MEALDB('jyvy8u1783800448.jpg'),
  r23: FLICKR('https://live.staticflickr.com/7015/6662178673_8ce9c0444d_b.jpg', 'amlamster', 'CC BY 2.0', 'https://www.flickr.com/photos/35892836@N07/6662178673'),
  r24: FLICKR(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/French_grated_carrot_salad_%28cropped%29.jpg/960px-French_grated_carrot_salad_%28cropped%29.jpg',
    '건복맘',
    'CC BY 2.0',
    'https://commons.wikimedia.org/w/index.php?curid=97474037',
  ),
}

const R = (id: string, name: string, cuisine: Recipe['cuisine'], minutes: number, ingredients: Row[], steps: string[]): Recipe => ({
  id,
  name,
  cuisine,
  minutes,
  servings: 2,
  ingredients: ingredients.map(([ingId, qty]) => ({ id: ingId, qty })),
  steps,
  photoTerms: [],
  photoUrl: PHOTOS[id]?.url,
  photoCredit: PHOTOS[id]?.credit,
})

/** House recipes (from the design prototype and written for Mijote). */
const HOUSE_RECIPES: Recipe[] = [
  R('r1', 'Omelette forestière', 'Française', 12, [['oeufs', 3], ['champignons', 150], ['oignon', 1]], [
    "Émince l'oignon et les champignons.",
    "Fais-les dorer 5 min à la poêle avec un filet d'huile.",
    'Bats les œufs, sale, poivre, verse sur les légumes.',
    "Laisse prendre à feu doux, plie en deux, c'est prêt.",
  ]),
  R('r2', 'Pâtes crème & champignons', 'Italienne', 20, [['pates', 200], ['champignons', 200], ['creme', 20], ['oignon', 1]], [
    "Lance l'eau des pâtes, bien salée.",
    'Fais revenir oignon et champignons émincés 6 min.',
    'Ajoute la crème, laisse réduire 3 min.',
    'Mélange avec les pâtes égouttées, poivre généreusement.',
  ]),
  R('r5', 'Œufs cocotte à la crème', 'Française', 15, [['oeufs', 2], ['creme', 10], ['champignons', 50]], [
    'Préchauffe le four à 180 °C.',
    'Mets champignons hachés et crème au fond de 2 ramequins.',
    'Casse un œuf dans chaque, sale, poivre.',
    'Cuis 10 min au bain-marie : le jaune doit rester coulant.',
  ]),
  R('r13', 'Poêlée de champignons à la crème', 'Française', 15, [['champignons', 250], ['creme', 10], ['oignon', 1]], [
    'Coupe les champignons en quartiers.',
    "Saisis-les à feu vif avec l'oignon 7 min.",
    'Ajoute la crème, laisse napper 2 min et sers.',
  ]),
  R('r14', "Pâtes à l'oignon caramélisé", 'Italienne', 25, [['pates', 200], ['oignon', 2]], [
    'Émince finement les oignons.',
    "Fais-les compoter 15 min à feu doux avec l'huile.",
    "Cuis les pâtes, garde un peu d'eau de cuisson.",
    "Mélange le tout avec l'eau de cuisson pour lier.",
  ]),
  R('r15', 'Œufs brouillés crémeux', 'Française', 8, [['oeufs', 3], ['creme', 5]], [
    'Bats les œufs avec la crème.',
    'Cuis à feu très doux en remuant sans arrêt.',
    "Retire du feu quand c'est encore un peu baveux.",
  ]),
  R('r3', 'Carbonara', 'Italienne', 15, [['pates', 200], ['oeufs', 2], ['lardons', 150], ['fromage', 50]], [
    'Cuis les pâtes.',
    'Fais dorer les lardons sans matière grasse.',
    "Mélange jaunes d'œufs et parmesan râpé.",
    "Hors du feu, mélange pâtes, lardons et sauce avec un peu d'eau de cuisson.",
  ]),
  R('r4', 'Frittata à la courgette', 'Italienne', 25, [['oeufs', 4], ['courgette', 1], ['oignon', 1], ['fromage', 40]], [
    "Râpe la courgette, émince l'oignon.",
    'Fais-les revenir 5 min.',
    'Verse les œufs battus avec le parmesan.',
    'Cuis 10 min couvert à feu doux.',
  ]),
  R('r6', 'Velouté de champignons', 'Française', 30, [['champignons', 250], ['oignon', 1], ['creme', 10], ['pdt', 1]], [
    "Fais suer l'oignon.",
    "Ajoute champignons et pomme de terre en dés, couvre d'eau.",
    'Cuis 20 min puis mixe avec la crème.',
  ]),
  R('r7', 'Riz sauté aux œufs', 'Asiatique', 20, [['riz', 150], ['oeufs', 2], ['oignon', 1], ['poivron', 1]], [
    "Cuis le riz (ou prends un reste, c'est encore mieux).",
    'Saute oignon et poivron à feu vif.',
    'Ajoute le riz, puis les œufs battus, remue vite.',
  ]),
  R('r9', 'Shakshuka', 'Moyen-Orient', 25, [['oeufs', 4], ['tomate_conc', 400], ['oignon', 1], ['poivron', 1]], [
    'Fais revenir oignon et poivron.',
    'Ajoute les tomates, mijote 10 min.',
    'Creuse 4 puits, casse les œufs, couvre 6 min.',
  ]),
  R('r10', 'Pâtes ail & citron', 'Italienne', 12, [['pates', 200], ['ail', 2], ['citron', 1]], [
    'Cuis les pâtes.',
    "Fais blondir l'ail émincé dans l'huile.",
    'Mélange avec zeste et jus de citron.',
  ]),
  R('r11', 'Poêlée paysanne', 'Française', 25, [['pdt', 3], ['champignons', 150], ['lardons', 100], ['oignon', 1]], [
    'Coupe les pommes de terre en dés, fais-les dorer 15 min.',
    'Ajoute lardons, oignon et champignons.',
    'Poursuis 8 min à feu vif.',
  ]),
  R('r12', 'Crêpes du dimanche', 'Française', 30, [['farine', 250], ['oeufs', 3], ['lait', 50]], [
    'Mélange farine et œufs.',
    'Ajoute le lait petit à petit.',
    'Laisse reposer 15 min puis cuis à la poêle.',
  ]),
  R('r8', 'Curry de pois chiches', 'Indienne', 30, [['pois_chiches', 400], ['lait_coco', 40], ['oignon', 1], ['tomate_conc', 400]], [
    "Fais revenir l'oignon avec les épices.",
    'Ajoute tomates, lait de coco et pois chiches.',
    'Mijote 20 min.',
  ]),
  R('r16', 'Quesadillas aux champignons', 'Mexicaine', 15, [['tortillas', 2], ['champignons', 150], ['fromage', 60]], [
    'Poêle les champignons.',
    'Garnis une tortilla de champignons et fromage, referme.',
    'Dore 2 min de chaque côté.',
  ]),
  R('r17', 'Poulet curry coco', 'Indienne', 30, [['poulet', 300], ['lait_coco', 40], ['oignon', 1], ['riz', 150]], [
    'Lance la cuisson du riz.',
    "Coupe le poulet en dés et émince l'oignon.",
    "Fais dorer le poulet avec l'oignon et le curry 6 min.",
    'Ajoute le lait de coco, mijote 10 min et sers avec le riz.',
  ]),
  R('r18', 'Croque-monsieur', 'Française', 15, [['pain', 4], ['jambon', 2], ['mozzarella', 125], ['beurre', 20]], [
    'Préchauffe le four à 200 °C.',
    'Beurre les tranches de pain.',
    'Garnis de jambon et de mozzarella, referme.',
    "Dore 10 min au four, c'est prêt.",
  ]),
  R('r19', 'Pâtes au thon et à la tomate', 'Italienne', 20, [['pates', 200], ['thon', 140], ['tomate_conc', 400], ['oignon', 1]], [
    "Lance l'eau des pâtes, bien salée.",
    "Fais revenir l'oignon émincé 3 min.",
    'Ajoute les tomates et le thon, mijote 10 min.',
    'Mélange avec les pâtes égouttées.',
  ]),
  R('r20', 'Bol saumon, riz & brocoli', 'Asiatique', 25, [['saumon', 250], ['riz', 150], ['brocoli', 200], ['citron', 1]], [
    'Cuis le riz.',
    "Plonge le brocoli 6 min dans l'eau bouillante.",
    'Saisis le saumon 3 min de chaque côté.',
    'Sers le tout avec un filet de citron.',
  ]),
  R('r21', 'Taboulé express', 'Moyen-Orient', 20, [['semoule', 150], ['tomate', 2], ['citron', 1], ['oignon', 1]], [
    "Verse l'eau bouillante sur la semoule, couvre 5 min.",
    "Coupe les tomates et l'oignon en petits dés.",
    "Mélange tout avec le jus de citron et l'huile.",
    'Laisse reposer 10 min au frais.',
  ]),
  R('r22', 'Guacamole & tortillas', 'Mexicaine', 10, [['avocat', 2], ['tomate', 1], ['oignon', 1], ['citron', 1], ['tortillas', 4]], [
    'Écrase les avocats à la fourchette.',
    "Coupe la tomate et l'oignon en petits dés.",
    'Mélange avec le jus de citron, sale.',
    'Sers avec les tortillas.',
  ]),
  R('r23', 'Tomates mozzarella', 'Italienne', 10, [['tomate', 3], ['mozzarella', 125]], [
    'Coupe les tomates et la mozzarella en tranches.',
    "Alterne-les dans l'assiette.",
    "Sale, poivre, un filet d'huile et sers.",
  ]),
  R('r24', 'Carottes râpées au citron', 'Française', 10, [['carotte', 3], ['citron', 1]], [
    'Épluche et râpe les carottes.',
    "Mélange avec le jus de citron et l'huile.",
    'Sers bien frais.',
  ]),
]

export const RECIPES: Recipe[] = [...HOUSE_RECIPES, ...MEALDB_RECIPES]
