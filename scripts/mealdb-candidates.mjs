// Lists TheMealDB recipes that fit the Mijote catalog, with a first guess of the quantities.
// Usage: node scripts/mealdb-candidates.mjs [meals.json] > candidates.json
// Without a file, downloads the whole TheMealDB catalog (search by first letter).
// The output is a starting point: names, steps and quantities are then reviewed by hand
// and written to src/data/mealdb.ts.
import { readFileSync } from 'node:fs'

/** English ingredient → Mijote catalog id, or a pantry label (not tracked in the fridge). */
const MAP = {
  // Crèmerie & frais
  egg: 'oeufs', eggs: 'oeufs', 'free-range egg, beaten': 'oeufs', 'free-range eggs, beaten': 'oeufs',
  'double cream': 'creme', 'heavy cream': 'creme', 'single cream': 'creme', 'creme fraiche': 'creme', 'sour cream': 'creme', 'whipping cream': 'creme',
  butter: 'beurre', 'unsalted butter': 'beurre', 'salted butter': 'beurre',
  milk: 'lait', 'whole milk': 'lait', 'semi-skimmed milk': 'lait',
  parmesan: 'fromage', 'parmesan cheese': 'fromage', 'parmigiano-reggiano': 'fromage', pecorino: 'fromage',
  mozzarella: 'mozzarella', 'mozzarella balls': 'mozzarella',
  bacon: 'lardons', pancetta: 'lardons', lardons: 'lardons', 'smoked bacon': 'lardons', 'bacon strips': 'lardons',
  ham: 'jambon',
  chicken: 'poulet', 'chicken breast': 'poulet', 'chicken breasts': 'poulet', 'chicken thighs': 'poulet', 'chicken legs': 'poulet', 'chicken thigh': 'poulet',
  salmon: 'saumon', 'salmon fillet': 'saumon', 'salmon fillets': 'saumon',
  'greek yogurt': 'yaourt', yogurt: 'yaourt', 'natural yogurt': 'yaourt', 'plain yogurt': 'yaourt',
  beef: 'boeuf', 'beef fillet': 'boeuf', 'stewing beef': 'boeuf', 'beef brisket': 'boeuf', 'sirloin steak': 'boeuf', 'rump steak': 'boeuf',
  'minced beef': 'boeuf_hache', 'ground beef': 'boeuf_hache', 'beef mince': 'boeuf_hache',
  prawns: 'crevettes', 'king prawns': 'crevettes', shrimp: 'crevettes', 'tiger prawns': 'crevettes', 'raw king prawns': 'crevettes',
  feta: 'feta', 'feta cheese': 'feta',
  chorizo: 'chorizo',
  cheddar: 'cheddar', 'cheddar cheese': 'cheddar', 'grated cheese': 'cheddar', cheese: 'cheddar',
  // Légumes
  mushrooms: 'champignons', mushroom: 'champignons', 'chestnut mushroom': 'champignons', 'button mushrooms': 'champignons',
  onion: 'oignon', onions: 'oignon', 'red onion': 'oignon', 'red onions': 'oignon', 'white onion': 'oignon', 'yellow onion': 'oignon', 'brown onion': 'oignon', shallots: 'oignon', shallot: 'oignon',
  garlic: 'ail', 'garlic clove': 'ail', 'garlic cloves': 'ail', 'minced garlic': 'ail',
  courgette: 'courgette', courgettes: 'courgette', zucchini: 'courgette',
  'red pepper': 'poivron', 'green pepper': 'poivron', 'yellow pepper': 'poivron', 'red bell pepper': 'poivron', 'bell pepper': 'poivron', 'green bell pepper': 'poivron',
  potatoes: 'pdt', potato: 'pdt', 'new potatoes': 'pdt', 'floury potatoes': 'pdt', 'baby new potatoes': 'pdt',
  spinach: 'epinards', 'baby spinach': 'epinards',
  tomato: 'tomate', tomatoes: 'tomate', 'cherry tomatoes': 'tomate',
  carrots: 'carotte', carrot: 'carotte',
  broccoli: 'brocoli',
  'spring onions': 'oignon_vert', 'spring onion': 'oignon_vert', scallions: 'oignon_vert', 'green onions': 'oignon_vert',
  aubergine: 'aubergine', eggplant: 'aubergine',
  cucumber: 'concombre',
  leek: 'poireau', leeks: 'poireau',
  'green beans': 'haricots_verts',
  cabbage: 'chou', 'white cabbage': 'chou', 'red cabbage': 'chou',
  ginger: 'gingembre', 'fresh ginger': 'gingembre',
  lettuce: 'salade',
  // Fruits
  lemon: 'citron', 'lemon juice': 'citron', 'lemon zest': 'citron',
  lime: 'citron_vert', 'lime juice': 'citron_vert',
  banana: 'banane', bananas: 'banane',
  apple: 'pomme', apples: 'pomme',
  avocado: 'avocat', avocados: 'avocat',
  // Épicerie
  spaghetti: 'pates', penne: 'pates', 'penne rigate': 'pates', linguine: 'pates', fettuccine: 'pates', pasta: 'pates', tagliatelle: 'pates', rigatoni: 'pates', macaroni: 'pates', farfalle: 'pates',
  rice: 'riz', 'basmati rice': 'riz', 'jasmine rice': 'riz', 'long grain rice': 'riz', 'white rice': 'riz', 'arborio risotto rice': 'riz',
  flour: 'farine', 'plain flour': 'farine', 'all purpose flour': 'farine', 'self-raising flour': 'farine',
  couscous: 'semoule',
  bread: 'pain', 'white bread': 'pain',
  chickpeas: 'pois_chiches',
  'chopped tomatoes': 'tomate_conc', 'tinned tomatos': 'tomate_conc', 'canned tomatoes': 'tomate_conc', 'plum tomatoes': 'tomate_conc', 'diced tomatoes': 'tomate_conc', 'crushed tomatoes': 'tomate_conc',
  'coconut milk': 'lait_coco', 'coconut cream': 'lait_coco',
  lentils: 'lentilles', 'red lentils': 'lentilles', 'green lentils': 'lentilles', 'brown lentils': 'lentilles',
  tuna: 'thon',
  tortillas: 'tortillas', 'flour tortilla': 'tortillas', 'corn tortillas': 'tortillas',
  'rice noodles': 'nouilles', 'egg noodles': 'nouilles', noodles: 'nouilles', 'udon noodles': 'nouilles',
  'kidney beans': 'haricots_rouges', 'red kidney beans': 'haricots_rouges',
}
const PANTRY = /salt|pepper$|black pepper|oil|water|sugar|stock|cube|paprika|cumin|coriander|cilantro|parsley|thyme|bay lea|oregano|basil|mint|dill|rosemary|chives|sage|cinnamon|nutmeg|turmeric|cardamom|clove|allspice|garam|curry|chilli|chili|cayenne|saffron|ginger paste|garlic powder|onion powder|soy sauce|fish sauce|oyster sauce|vinegar|mustard|honey|worcestershire|ketchup|mayonnaise|tomato puree|tomato paste|baking|yeast|vanilla|cornstarch|corn flour|cornflour|sesame seed|white wine|red wine|capers|breadcrumbs|scotch bonnet|jalapeno|sriracha|tabasco|hot sauce|harissa|fennel seed|mustard seed|star anise|five spice|lemongrass|kaffir|bouquet garni/

const norm = (s) => (s || '').trim().toLowerCase()

async function loadMeals(file) {
  if (file) return JSON.parse(readFileSync(file, 'utf8'))
  const meals = []
  for (const l of 'abcdefghijklmnopqrstuvwxyz') {
    const r = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`)
    meals.push(...((await r.json()).meals ?? []))
  }
  return meals
}

const meals = await loadMeals(process.argv[2])
const out = []
for (const m of meals) {
  if (m.strCategory === 'Dessert') continue
  const ings = []
  const pantry = []
  let unknown = []
  for (let i = 1; i <= 20; i++) {
    const n = norm(m[`strIngredient${i}`])
    if (!n) continue
    const measure = (m[`strMeasure${i}`] || '').trim()
    if (MAP[n]) ings.push({ id: MAP[n], en: n, measure })
    else if (PANTRY.test(n)) pantry.push(n)
    else unknown.push(n)
  }
  if (unknown.length || ings.length < 2) continue
  out.push({
    id: m.idMeal,
    name: m.strMeal,
    category: m.strCategory,
    area: m.strArea ?? m.strCountry ?? null,
    thumb: m.strMealThumb,
    ingredients: ings,
    pantry,
    instructions: m.strInstructions,
  })
}
console.log(JSON.stringify(out, null, 1))
