/** Aliments proposés en pastilles sur l'écran « Mon frigo », par rayon. Les autres se trouvent via la recherche. */
export const FRIDGE_SECTIONS: { title: string; ingredientIds: string[] }[] = [
  {
    title: 'Légumes',
    ingredientIds: [
      'tomato', 'onion', 'garlic', 'carrot', 'potato', 'zucchini', 'bell_pepper', 'mushroom', 'spinach',
      'broccoli', 'lettuce', 'cucumber', 'eggplant', 'leek', 'avocado', 'shallot', 'green_beans', 'pumpkin',
    ],
  },
  {
    title: 'Viandes & poissons',
    ingredientIds: [
      'chicken_breast', 'ground_beef', 'steak', 'bacon', 'ham', 'sausage', 'beef_stew', 'salmon', 'canned_tuna',
      'cod', 'shrimp',
    ],
  },
  {
    title: 'Produits laitiers & œufs',
    ingredientIds: [
      'egg', 'milk', 'butter', 'cream', 'grated_cheese', 'parmesan', 'mozzarella', 'feta', 'goat_cheese', 'yogurt',
    ],
  },
  {
    title: 'Féculents',
    ingredientIds: [
      'pasta', 'spaghetti', 'rice', 'gnocchi', 'semolina', 'lentils', 'red_lentils', 'chickpeas', 'kidney_beans',
      'bread', 'tortilla', 'oats',
    ],
  },
  { title: 'Fruits', ingredientIds: ['lemon', 'lime', 'apple', 'banana', 'orange', 'strawberry', 'kiwi', 'pear'] },
  { title: 'Herbes fraîches', ingredientIds: ['basil', 'parsley', 'coriander', 'mint', 'chives', 'ginger'] },
  {
    title: 'Épicerie',
    ingredientIds: [
      'canned_tomato', 'coconut_milk', 'tomato_sauce', 'stock_cube', 'pesto', 'soy_sauce', 'tofu', 'dark_chocolate',
      'honey', 'shortcrust_pastry', 'puff_pastry', 'pizza_dough',
    ],
  },
]
