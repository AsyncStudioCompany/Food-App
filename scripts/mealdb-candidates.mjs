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
  turkey: 'dinde', 'turkey breast': 'dinde', 'turkey mince': 'dinde',
  pork: 'porc', 'pork chops': 'porc', 'pork tenderloin': 'porc', 'pork shoulder': 'porc', 'pork belly': 'porc', 'minced pork': 'porc', 'ground pork': 'porc',
  sausages: 'saucisses', sausage: 'saucisses', 'pork sausages': 'saucisses',
  lamb: 'agneau', 'lamb mince': 'agneau', 'lamb shoulder': 'agneau', 'lamb leg': 'agneau', 'minced lamb': 'agneau', 'lamb loin chops': 'agneau',
  cod: 'poisson_blanc', haddock: 'poisson_blanc', 'white fish': 'poisson_blanc', 'white fish fillets': 'poisson_blanc', 'sea bass': 'poisson_blanc', tilapia: 'poisson_blanc', 'cod fillet': 'poisson_blanc',
  'smoked salmon': 'saumon_fume',
  'goats cheese': 'chevre', "goat's cheese": 'chevre', 'goat cheese': 'chevre',
  ricotta: 'ricotta',
  tofu: 'tofu', 'firm tofu': 'tofu',
  duck: 'canard', 'duck legs': 'canard', 'duck breast': 'canard',
  veal: 'veau',
  mussels: 'fruits_de_mer', squid: 'fruits_de_mer', clams: 'fruits_de_mer', 'crab meat': 'fruits_de_mer', crab: 'fruits_de_mer', scallops: 'fruits_de_mer', octopus: 'fruits_de_mer',
  mascarpone: 'mascarpone',
  'cream cheese': 'fromage_frais', 'soft cheese': 'fromage_frais', 'cottage cheese': 'fromage_frais', 'quark': 'fromage_frais',
  halloumi: 'halloumi',
  'chicken wings': 'poulet', 'chicken drumsticks': 'poulet', 'whole chicken': 'poulet', 'chicken stock breast': 'poulet',
  'beef shin': 'boeuf', 'beef steak': 'boeuf', 'braising steak': 'boeuf', 'chuck steak': 'boeuf', 'beef chuck': 'boeuf', 'minced meat': 'boeuf_hache', 'ground meat': 'boeuf_hache', 'lean minced beef': 'boeuf_hache',
  'prosciutto': 'jambon', 'parma ham': 'jambon', 'cooked ham': 'jambon', 'gammon': 'jambon', 'ham hock': 'jambon',
  'streaky bacon': 'lardons', 'bacon rashers': 'lardons',
  mackerel: 'poisson_blanc', 'fish fillets': 'poisson_blanc', 'white fish': 'poisson_blanc', 'monkfish': 'poisson_blanc', 'salt cod': 'poisson_blanc', 'trout': 'saumon',
  'gruyère': 'cheddar', gruyere: 'cheddar', 'emmental': 'cheddar', 'mature cheddar': 'cheddar', 'red leicester cheese': 'cheddar', 'monterey jack cheese': 'cheddar', 'colby jack cheese': 'cheddar', 'shredded mexican cheese': 'cheddar', 'stilton cheese': 'cheddar', 'brie': 'chevre', 'blue cheese': 'cheddar', 'grated parmesan': 'fromage', 'pecorino romano': 'fromage',
  'buttermilk': 'lait', 'skimmed milk': 'lait', 'full fat milk': 'lait', 'evaporated milk': 'lait',
  'yoghurt': 'yaourt', 'greek yoghurt': 'yaourt',
  'egg yolks': 'oeufs', 'egg yolk': 'oeufs', 'egg white': 'oeufs', 'egg whites': 'oeufs', 'large eggs': 'oeufs', 'eggs, beaten': 'oeufs',
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
  lettuce: 'salade', 'little gem lettuce': 'salade', 'romaine lettuce': 'salade', 'iceberg lettuce': 'salade',
  peas: 'petits_pois', 'frozen peas': 'petits_pois', 'garden peas': 'petits_pois',
  sweetcorn: 'mais', corn: 'mais', 'sweet corn': 'mais',
  cauliflower: 'chou_fleur',
  'sweet potatoes': 'patate_douce', 'sweet potato': 'patate_douce',
  celery: 'celeri',
  radish: 'radis', radishes: 'radis',
  beetroot: 'betterave', beets: 'betterave',
  'butternut squash': 'courge', pumpkin: 'courge', squash: 'courge',
  fennel: 'fenouil', 'fennel bulb': 'fenouil',
  asparagus: 'asperges',
  turnips: 'navet', turnip: 'navet',
  parsnip: 'panais', parsnips: 'panais',
  okra: 'gombo',
  plantain: 'plantain', plantains: 'plantain', 'green plantain': 'plantain',
  'mixed peppers': 'poivron', 'orange pepper': 'poivron', 'red peppers': 'poivron', 'green peppers': 'poivron',
  'plum tomato': 'tomate', 'vine tomatoes': 'tomate', 'baby plum tomatoes': 'tomate',
  'baby carrots': 'carotte', 'savoy cabbage': 'chou', 'cabbage leaves': 'chou', 'bok choy': 'chou', 'pak choi': 'chou', 'kale': 'epinards', 'watercress': 'salade', rocket: 'salade', 'mixed salad leaves': 'salade', 'salad leaves': 'salade', 'lettuce leaves': 'salade', 'spring greens': 'chou', 'bean sprouts': 'salade',
  'red chile flakes': null,
  'broad beans': 'haricots_verts', 'mangetout': 'haricots_verts', 'sugar snap peas': 'haricots_verts', 'runner beans': 'haricots_verts',
  'button mushroom': 'champignons', 'shiitake mushrooms': 'champignons', 'wild mushrooms': 'champignons', 'portobello mushrooms': 'champignons', 'oyster mushrooms': 'champignons',
  'red onion': 'oignon', 'onion, chopped': 'oignon', 'baby onions': 'oignon', 'pearl onions': 'oignon',
  // Fruits
  lemon: 'citron', 'lemon juice': 'citron', 'lemon zest': 'citron',
  lime: 'citron_vert', 'lime juice': 'citron_vert',
  banana: 'banane', bananas: 'banane',
  apple: 'pomme', apples: 'pomme',
  avocado: 'avocat', avocados: 'avocat',
  orange: 'orange', oranges: 'orange', 'orange juice': 'orange', 'orange zest': 'orange',
  pear: 'poire', pears: 'poire',
  strawberries: 'fraises',
  mango: 'mangue',
  raspberries: 'fruits_rouges', blueberries: 'fruits_rouges', blackberries: 'fruits_rouges', 'mixed berries': 'fruits_rouges', 'frozen berries': 'fruits_rouges', cranberries: 'fruits_rouges', redcurrants: 'fruits_rouges',
  pineapple: 'ananas', 'pineapple chunks': 'ananas',
  peaches: 'peches', peach: 'peches', nectarines: 'peches',
  cherries: 'cerises', 'glace cherries': 'cerises',
  apricots: 'abricots', 'dried apricots': 'abricots', apricot: 'abricots',
  'bramley apples': 'pomme', 'granny smith apples': 'pomme', 'cooking apples': 'pomme', 'green apple': 'pomme', 'apple juice': null,
  lemons: 'citron', limes: 'citron_vert', 'lime zest': 'citron_vert',
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
  'rice noodles': 'nouilles', 'rice vermicelli': 'nouilles', 'rice stick noodles': 'nouilles', 'egg noodles': 'nouilles_oeufs', noodles: 'nouilles_oeufs', 'udon noodles': 'nouilles_oeufs', 'ramen noodles': 'nouilles_oeufs',
  'kidney beans': 'haricots_rouges', 'red kidney beans': 'haricots_rouges',
  'cannellini beans': 'haricots_blancs', 'white beans': 'haricots_blancs', 'butter beans': 'haricots_blancs', 'haricot beans': 'haricots_blancs',
  quinoa: 'quinoa',
  bulgur: 'boulgour', 'bulgur wheat': 'boulgour',
  sardines: 'sardines',
  'black olives': 'olives', 'green olives': 'olives', olives: 'olives', 'kalamata olives': 'olives',
  'puff pastry': 'pate_feuilletee',
  walnuts: 'noix', almonds: 'amandes', 'flaked almonds': 'amandes', 'ground almonds': 'amandes', peanuts: 'cacahuetes',
  'dark chocolate': 'chocolat', chocolate: 'chocolat', 'milk chocolate': 'chocolat', 'white chocolate': 'chocolat', 'chocolate chips': 'chocolat', 'dark chocolate chips': 'chocolat', 'plain chocolate': 'chocolat',
  'shortcrust pastry': 'pate_brisee', 'pastry': 'pate_brisee', 'filo pastry': 'pate_feuilletee',
  oats: 'flocons_avoine', 'rolled oats': 'flocons_avoine', 'porridge oats': 'flocons_avoine',
  'digestive biscuits': 'biscuits', biscuits: 'biscuits', 'graham cracker crumbs': 'biscuits', 'ginger biscuits': 'biscuits', 'sponge fingers': 'biscuits', 'ladyfingers': 'biscuits',
  'condensed milk': 'lait_concentre', 'sweetened condensed milk': 'lait_concentre',
  polenta: 'polenta', cornmeal: 'polenta',
  'black beans': 'haricots_noirs',
  raisins: 'raisins_secs', sultanas: 'raisins_secs', currants: 'raisins_secs', 'mixed fruit': 'raisins_secs', 'dried fruit': 'raisins_secs',
  dates: 'dattes', 'medjool dates': 'dattes',
  'desiccated coconut': 'noix_coco', 'shredded coconut': 'noix_coco', 'coconut': 'noix_coco',
  hazlenuts: 'noisettes', hazelnuts: 'noisettes', pistachios: 'pistaches', 'pine nuts': 'pignons', pecans: 'noix', 'pecan nuts': 'noix', cashews: 'amandes', 'cashew nuts': 'amandes',
  'peanut butter': 'beurre_cacahuete',
  'basmati rice': 'riz', 'risotto rice': 'riz', 'paella rice': 'riz', 'brown rice': 'riz', 'sticky rice': 'riz', 'glutinous rice': 'riz', 'jasmine rice': 'riz',
  'lasagne sheets': 'pates', 'spaghetti': 'pates', 'orzo': 'pates', 'pappardelle pasta': 'pates', 'fusilli': 'pates', 'paccheri pasta': 'pates', 'ditalini': 'pates', 'bowtie pasta': 'pates', 'ravioli': 'pates', 'tortellini': 'pates', 'gnocchi': 'pates', 'vermicelli pasta': 'pates',
  'bread flour': 'farine', 'strong white bread flour': 'farine', 'wholemeal flour': 'farine', 'semolina': 'semoule',
  'naan bread': 'pain', 'pitta bread': 'pain', 'baguette': 'pain', 'bread rolls': 'pain', 'burger buns': 'pain', 'ciabatta': 'pain', 'sourdough bread': 'pain', 'breadcrumbs': null, 'flour tortillas': 'tortillas', 'tortilla chips': 'tortillas', 'taco shells': 'tortillas',
  'tinned tomatos': 'tomate_conc', 'passata': 'tomate_conc', 'chopped tomatoes': 'tomate_conc', 'tomato sauce': 'tomate_conc',
  'tuna steaks': 'thon', 'tinned tuna': 'thon', 'canned tuna': 'thon',
  'green lentils': 'lentilles', 'puy lentils': 'lentilles', 'yellow split peas': 'lentilles', 'split peas': 'lentilles',
  'canned chickpeas': 'pois_chiches', 'dried chickpeas': 'pois_chiches',
}
const PANTRY = /syrup|cocoa|gelatine|jam|icing|caster|demerara|muscovado|cream of tartar|bicarbonate|soda|food colouring|custard|rum|brandy|sherry|beer|marsala|cider|kirsch|liqueur|amaretto|stock|broth|bouillon|tahini|miso|hoisin|pesto|salsa|chutney|relish|pickle|gherkin|capers|anchov|fish sauce|pepper flakes|peppercorn|seeds?\b|leaves|sprigs|herbs|zaatar|sumac|ras el hanout|nutmeg|mace|vanilla|almond extract|orange blossom|rose water|yeast|baking|lard|ghee|margarine|shortening|dripping|suet|ice|tabasco|mirin|sake|rice wine|shaoxing|coconut oil|olive|sesame|salt|pepper$|black pepper|oil|water|sugar|stock|cube|paprika|cumin|coriander|cilantro|parsley|thyme|bay lea|oregano|basil|mint|dill|rosemary|chives|sage|cinnamon|nutmeg|turmeric|cardamom|clove|allspice|garam|curry|chilli|chili|cayenne|saffron|ginger paste|garlic powder|onion powder|soy sauce|fish sauce|oyster sauce|vinegar|mustard|honey|worcestershire|ketchup|mayonnaise|tomato puree|tomato paste|baking|yeast|vanilla|cornstarch|corn flour|cornflour|sesame seed|white wine|red wine|capers|breadcrumbs|scotch bonnet|jalapeno|sriracha|tabasco|hot sauce|harissa|fennel seed|mustard seed|star anise|five spice|lemongrass|kaffir|bouquet garni/


// ——— Quantities: TheMealDB measures ("1 cup", "2 lbs", "3 cloves") → catalog base unit (g, cl, pc) ———
import { INGREDIENTS } from '../src/data/catalog.ts'
const CATALOG = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]))
const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }
const WORDS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, half: 0.5 }
/** Grams per ml for volume measures of solids. */
const DENSITY = { farine: 0.53, riz: 0.78, semoule: 0.7, quinoa: 0.72, boulgour: 0.7, lentilles: 0.8, flocons_avoine: 0.35, cheddar: 0.4, fromage: 0.4, mozzarella: 0.45, feta: 0.6, epinards: 0.13, salade: 0.1, beurre: 0.96, chocolat: 0.7, noix: 0.5, amandes: 0.6, cacahuetes: 0.6, noisettes: 0.6, pistaches: 0.55, pignons: 0.6, raisins_secs: 0.6, dattes: 0.6, noix_coco: 0.35, mais: 0.65, petits_pois: 0.6, fruits_rouges: 0.6, champignons: 0.3, haricots_verts: 0.5, pois_chiches: 0.7, haricots_rouges: 0.7, haricots_blancs: 0.7, haricots_noirs: 0.7, biscuits: 0.4, polenta: 0.7, pates: 0.4, crevettes: 0.6, poulet: 0.6, boeuf_hache: 0.9, yaourt: 1, fromage_frais: 1, mascarpone: 1, ricotta: 1, tomate_conc: 1, lait_concentre: 1.3, courge: 0.6, olives: 0.6, cerises: 0.6, fraises: 0.6 }
/** Grams of one unnamed piece of an ingredient counted in grams ("2 chicken breasts"). */
function pieceGrams(id, en) {
  if (/breast/.test(en)) return 150
  if (/thigh/.test(en)) return 120
  if (/drumstick|wing/.test(en)) return 90
  if (/leg/.test(en)) return 250
  if (/whole|^chicken$/.test(en)) return 1400
  if (/chop/.test(en)) return 180
  if (/fillet|steak/.test(en)) return 150
  if (/sausage/.test(en)) return 60
  if (id === 'poisson_blanc' || id === 'saumon') return 150
  if (id === 'crevettes') return 25
  if (id === 'sardines') return 50
  if (id === 'chou_fleur' || id === 'brocoli') return 500
  if (id === 'courge') return 1000
  return null
}

function leadingNumber(m) {
  const t = m.replace(/(\d)\s*([½¼¾⅓⅔⅛])/g, (_, d, f) => String(Number(d) + FRACTIONS[f])).replace(/[½¼¾⅓⅔⅛]/g, (f) => String(FRACTIONS[f]))
  let r = t.match(/^(\d+)\s+(\d+)\/(\d+)/)
  if (r) return [Number(r[1]) + Number(r[2]) / Number(r[3]), t.slice(r[0].length)]
  r = t.match(/^(\d+)\/(\d+)/)
  if (r) return [Number(r[1]) / Number(r[2]), t.slice(r[0].length)]
  r = t.match(/^(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?/)
  if (r) return [r[2] ? (parseFloat(r[1].replace(',', '.')) + parseFloat(r[2].replace(',', '.'))) / 2 : parseFloat(r[1].replace(',', '.')), t.slice(r[0].length)]
  r = t.match(/^(a|an|one|two|three|four|five|six|half)\b/)
  if (r) return [WORDS[r[1]], t.slice(r[0].length)]
  r = t.match(/(?:juice|zest)(?: and (?:juice|zest))? of (\d+|one|a|½|half)/)
  if (r) return [WORDS[r[1]] ?? FRACTIONS[r[1]] ?? Number(r[1]), '']
  return [null, t]
}

const round = (qty, unit) => (unit === 'g' ? Math.max(5, Math.round(qty / 5) * 5) : unit === 'cl' ? Math.max(1, Math.round(qty)) : Math.max(0.5, Math.round(qty * 2) / 2))

function parseQty(measure, id, en) {
  const ing = CATALOG[id]
  const m = measure.toLowerCase().trim()
  if (!m || /to taste|to serve|to garnish|garnish|topping|for frying|as needed|as required|optional|dusting/.test(m)) return { qty: null }
  const [n, rest0] = leadingNumber(m)
  if (n == null || !isFinite(n)) return { qty: null }
  const rest = rest0.trim()
  const unit = (rest.match(/^(kg|g|grams?|gr|ml|millilitres?|l|litres?|liters?|cl|oz|ounces?|fl oz|lbs?|pounds?|cups?|c\b|tbsp|tbs|tblsp|tbls|tablespoons?|tsp|teaspoons?|cans?|tins?|jars?|packets?|packs?|bunch(?:es)?|handfuls?|cloves?|slices?|rashers?|sticks?|knobs?|heads?|pieces?|strips?|large|medium|small|whole|fillets?|bulb)\b/) ?? [''])[0]
  let grams = null
  let ml = null
  let count = null
  if (/^(kg)$/.test(unit)) grams = n * 1000
  else if (/^(g|grams?|gr)$/.test(unit)) grams = n
  else if (/^(oz|ounces?)$/.test(unit)) grams = n * 28
  else if (/^(lbs?|pounds?)$/.test(unit)) grams = n * 454
  else if (/^(ml|millilitres?)$/.test(unit)) ml = n
  else if (/^(l|litres?|liters?)$/.test(unit)) ml = n * 1000
  else if (unit === 'cl') ml = n * 10
  else if (/^(fl oz)$/.test(unit)) ml = n * 30
  else if (/^(cups?|c)$/.test(unit)) ml = n * 240
  else if (/^(tbsp|tbs|tblsp|tbls|tablespoons?)$/.test(unit)) ml = n * 15
  else if (/^(tsp|teaspoons?)$/.test(unit)) ml = n * 5
  else if (/^(cans?|tins?|jars?)$/.test(unit)) grams = ing.unit === 'cl' ? null : n * 400
  else if (/^(packets?|packs?)$/.test(unit)) grams = n * (id.startsWith('nouilles') ? 100 : 250)
  else if (/^(handfuls?)$/.test(unit)) grams = n * 30
  else if (/^(knobs?)$/.test(unit)) grams = n * 15
  else if (/^(sticks?)$/.test(unit)) grams = id === 'beurre' ? n * 113 : null
  else if (/^(bunch(?:es)?)$/.test(unit)) count = id === 'oignon_vert' ? n * 8 : id === 'epinards' ? null : n
  else count = n // cloves, slices, large, medium… or a bare number
  if ((/^(cans?|tins?)$/.test(unit)) && ing.unit === 'cl') ml = n * 400

  let qty = null
  if (ing.unit === 'g') {
    if (grams != null) qty = grams
    else if (ml != null) qty = ml * (DENSITY[id] ?? 1)
    else if (count != null) {
      const pg = pieceGrams(id, en)
      qty = pg ? count * pg : null
    }
  } else if (ing.unit === 'cl') {
    if (ml != null) qty = ml / 10
    else if (grams != null) qty = grams / 10
  } else {
    if (count != null) qty = count
    else if (grams != null && ing.nutrition?.g) qty = grams / ing.nutrition.g
    else if (ml != null && id.startsWith('citron')) qty = ml / 30 // juice of one lemon ≈ 30 ml
  }
  return { qty: qty == null ? null : round(qty, ing.unit) }
}

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
  const ings = []
  const pantry = []
  let unknown = []
  for (let i = 1; i <= 20; i++) {
    const n = norm(m[`strIngredient${i}`])
    if (!n) continue
    const measure = (m[`strMeasure${i}`] || '').trim()
    if (MAP[n] === null) pantry.push(n)
    else if (MAP[n]) ings.push({ id: MAP[n], en: n, measure, ...parseQty(measure, MAP[n], n) })
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
