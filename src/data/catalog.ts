import type { AisleId, Ingredient, Recipe } from '../domain/types.ts'

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
  I('citron', 'Citron', 'fruits', 'pc', 1),
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
]

type Row = [id: string, qty: number]
const R = (
  id: string,
  name: string,
  cuisine: Recipe['cuisine'],
  minutes: number,
  ingredients: Row[],
  steps: string[],
  photoTerms: string[],
): Recipe => ({
  id,
  name,
  cuisine,
  minutes,
  servings: 2,
  ingredients: ingredients.map(([ingId, qty]) => ({ id: ingId, qty })),
  steps,
  photoTerms,
})

export const RECIPES: Recipe[] = [
  R('r1', 'Omelette forestière', 'Française', 12, [['oeufs', 3], ['champignons', 150], ['oignon', 1]], [
    "Émince l'oignon et les champignons.",
    "Fais-les dorer 5 min à la poêle avec un filet d'huile.",
    'Bats les œufs, sale, poivre, verse sur les légumes.',
    "Laisse prendre à feu doux, plie en deux, c'est prêt.",
  ], ['omelette', 'tortilla']),
  R('r2', 'Pâtes crème & champignons', 'Italienne', 20, [['pates', 200], ['champignons', 200], ['creme', 20], ['oignon', 1]], [
    "Lance l'eau des pâtes, bien salée.",
    'Fais revenir oignon et champignons émincés 6 min.',
    'Ajoute la crème, laisse réduire 3 min.',
    'Mélange avec les pâtes égouttées, poivre généreusement.',
  ], ['fettuc', 'mushroom', 'pasta']),
  R('r5', 'Œufs cocotte à la crème', 'Française', 15, [['oeufs', 2], ['creme', 10], ['champignons', 50]], [
    'Préchauffe le four à 180 °C.',
    'Mets champignons hachés et crème au fond de 2 ramequins.',
    'Casse un œuf dans chaque, sale, poivre.',
    'Cuis 10 min au bain-marie : le jaune doit rester coulant.',
  ], ['baked egg', 'benedict', 'egg']),
  R('r13', 'Poêlée de champignons à la crème', 'Française', 15, [['champignons', 250], ['creme', 10], ['oignon', 1]], [
    'Coupe les champignons en quartiers.',
    "Saisis-les à feu vif avec l'oignon 7 min.",
    'Ajoute la crème, laisse napper 2 min et sers.',
  ], ['mushroom']),
  R('r14', "Pâtes à l'oignon caramélisé", 'Italienne', 25, [['pates', 200], ['oignon', 2]], [
    'Émince finement les oignons.',
    "Fais-les compoter 15 min à feu doux avec l'huile.",
    "Cuis les pâtes, garde un peu d'eau de cuisson.",
    "Mélange le tout avec l'eau de cuisson pour lier.",
  ], ['onion', 'spaghetti']),
  R('r15', 'Œufs brouillés crémeux', 'Française', 8, [['oeufs', 3], ['creme', 5]], [
    'Bats les œufs avec la crème.',
    'Cuis à feu très doux en remuant sans arrêt.',
    "Retire du feu quand c'est encore un peu baveux.",
  ], ['scrambled', 'egg']),
  R('r3', 'Carbonara', 'Italienne', 15, [['pates', 200], ['oeufs', 2], ['lardons', 150], ['fromage', 50]], [
    'Cuis les pâtes.',
    'Fais dorer les lardons sans matière grasse.',
    "Mélange jaunes d'œufs et parmesan râpé.",
    "Hors du feu, mélange pâtes, lardons et sauce avec un peu d'eau de cuisson.",
  ], ['carbonara']),
  R('r4', 'Frittata à la courgette', 'Italienne', 25, [['oeufs', 4], ['courgette', 1], ['oignon', 1], ['fromage', 40]], [
    "Râpe la courgette, émince l'oignon.",
    'Fais-les revenir 5 min.',
    'Verse les œufs battus avec le parmesan.',
    'Cuis 10 min couvert à feu doux.',
  ], ['frittata', 'tortilla']),
  R('r6', 'Velouté de champignons', 'Française', 30, [['champignons', 250], ['oignon', 1], ['creme', 10], ['pdt', 1]], [
    "Fais suer l'oignon.",
    "Ajoute champignons et pomme de terre en dés, couvre d'eau.",
    'Cuis 20 min puis mixe avec la crème.',
  ], ['soup', 'mushroom']),
  R('r7', 'Riz sauté aux œufs', 'Asiatique', 20, [['riz', 150], ['oeufs', 2], ['oignon', 1], ['poivron', 1]], [
    "Cuis le riz (ou prends un reste, c'est encore mieux).",
    'Saute oignon et poivron à feu vif.',
    'Ajoute le riz, puis les œufs battus, remue vite.',
  ], ['fried rice', 'rice']),
  R('r9', 'Shakshuka', 'Moyen-Orient', 25, [['oeufs', 4], ['tomate_conc', 400], ['oignon', 1], ['poivron', 1]], [
    'Fais revenir oignon et poivron.',
    'Ajoute les tomates, mijote 10 min.',
    'Creuse 4 puits, casse les œufs, couvre 6 min.',
  ], ['shakshuka']),
  R('r10', 'Pâtes ail & citron', 'Italienne', 12, [['pates', 200], ['ail', 2], ['citron', 1]], [
    'Cuis les pâtes.',
    "Fais blondir l'ail émincé dans l'huile.",
    'Mélange avec zeste et jus de citron.',
  ], ['linguine', 'lemon', 'spaghetti']),
  R('r11', 'Poêlée paysanne', 'Française', 25, [['pdt', 3], ['champignons', 150], ['lardons', 100], ['oignon', 1]], [
    'Coupe les pommes de terre en dés, fais-les dorer 15 min.',
    'Ajoute lardons, oignon et champignons.',
    'Poursuis 8 min à feu vif.',
  ], ['potato', 'hash']),
  R('r12', 'Crêpes du dimanche', 'Française', 30, [['farine', 250], ['oeufs', 3], ['lait', 50]], [
    'Mélange farine et œufs.',
    'Ajoute le lait petit à petit.',
    'Laisse reposer 15 min puis cuis à la poêle.',
  ], ['crepe', 'pancake']),
  R('r8', 'Curry de pois chiches', 'Indienne', 30, [['pois_chiches', 400], ['lait_coco', 40], ['oignon', 1], ['tomate_conc', 400]], [
    "Fais revenir l'oignon avec les épices.",
    'Ajoute tomates, lait de coco et pois chiches.',
    'Mijote 20 min.',
  ], ['chickpea', 'chana', 'curry']),
  R('r16', 'Quesadillas aux champignons', 'Mexicaine', 15, [['tortillas', 2], ['champignons', 150], ['fromage', 60]], [
    'Poêle les champignons.',
    'Garnis une tortilla de champignons et fromage, referme.',
    'Dore 2 min de chaque côté.',
  ], ['quesadilla', 'taco', 'burrito']),
  R('r17', 'Poulet curry coco', 'Indienne', 30, [['poulet', 300], ['lait_coco', 40], ['oignon', 1], ['riz', 150]], [
    'Lance la cuisson du riz.',
    "Coupe le poulet en dés et émince l'oignon.",
    "Fais dorer le poulet avec l'oignon et le curry 6 min.",
    'Ajoute le lait de coco, mijote 10 min et sers avec le riz.',
  ], ['chicken curry', 'curry']),
  R('r18', 'Croque-monsieur', 'Française', 15, [['pain', 4], ['jambon', 2], ['mozzarella', 125], ['beurre', 20]], [
    'Préchauffe le four à 200 °C.',
    'Beurre les tranches de pain.',
    'Garnis de jambon et de mozzarella, referme.',
    "Dore 10 min au four, c'est prêt.",
  ], ['croque', 'toastie', 'sandwich']),
  R('r19', 'Pâtes au thon et à la tomate', 'Italienne', 20, [['pates', 200], ['thon', 140], ['tomate_conc', 400], ['oignon', 1]], [
    "Lance l'eau des pâtes, bien salée.",
    "Fais revenir l'oignon émincé 3 min.",
    'Ajoute les tomates et le thon, mijote 10 min.',
    'Mélange avec les pâtes égouttées.',
  ], ['tuna pasta', 'tuna', 'pasta']),
  R('r20', 'Bol saumon, riz & brocoli', 'Asiatique', 25, [['saumon', 250], ['riz', 150], ['brocoli', 200], ['citron', 1]], [
    'Cuis le riz.',
    "Plonge le brocoli 6 min dans l'eau bouillante.",
    'Saisis le saumon 3 min de chaque côté.',
    'Sers le tout avec un filet de citron.',
  ], ['salmon', 'teriyaki']),
  R('r21', 'Taboulé express', 'Moyen-Orient', 20, [['semoule', 150], ['tomate', 2], ['citron', 1], ['oignon', 1]], [
    "Verse l'eau bouillante sur la semoule, couvre 5 min.",
    "Coupe les tomates et l'oignon en petits dés.",
    "Mélange tout avec le jus de citron et l'huile.",
    'Laisse reposer 10 min au frais.',
  ], ['tabbouleh', 'couscous', 'salad']),
  R('r22', 'Guacamole & tortillas', 'Mexicaine', 10, [['avocat', 2], ['tomate', 1], ['oignon', 1], ['citron', 1], ['tortillas', 4]], [
    'Écrase les avocats à la fourchette.',
    "Coupe la tomate et l'oignon en petits dés.",
    'Mélange avec le jus de citron, sale.',
    'Sers avec les tortillas.',
  ], ['guacamole', 'nachos', 'burrito']),
  R('r23', 'Tomates mozzarella', 'Italienne', 10, [['tomate', 3], ['mozzarella', 125]], [
    'Coupe les tomates et la mozzarella en tranches.',
    "Alterne-les dans l'assiette.",
    "Sale, poivre, un filet d'huile et sers.",
  ], ['caprese', 'tomato salad', 'salad']),
  R('r24', 'Carottes râpées au citron', 'Française', 10, [['carotte', 3], ['citron', 1]], [
    'Épluche et râpe les carottes.',
    "Mélange avec le jus de citron et l'huile.",
    'Sers bien frais.',
  ], ['carrot', 'salad']),
]
