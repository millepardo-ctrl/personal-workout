import type { DayType, MacroTarget } from '../domain/types'

export type Slot = 'desayuno' | 'pre' | 'post' | 'almuerzo' | 'snack' | 'cena'

export interface Meal {
  slot: Slot
  title: string
  items: string[]
  macros: Partial<MacroTarget>
  /** true = macros estimados por la app (el PDF solo da kcal para ese día) */
  approx?: boolean
  alternatives?: { label: string; options: string[] }
}

export const SLOT_LABEL: Record<Slot, string> = {
  desayuno: 'Desayuno',
  pre: 'Pre-entreno (90 min antes)',
  post: 'Post-entreno (30–60 min después)',
  almuerzo: 'Almuerzo',
  snack: 'Snack dulce',
  cena: 'Cena',
}

export const SNACK_OPTIONS = [
  '1 taza arándanos frescos (150 g)',
  '1 taza uvas verdes (150 g)',
  '2 cuadros chocolate negro 85 %+ (20 g)',
  '100 g yogurt griego + 1 cda miel',
  'Piña deshidratada 30 g',
]

const LEGUMES = { label: 'Alternativas a los frijoles', options: ['Lentejas cocidas 100 g', 'Garbanzos cocidos 85 g', 'Frijoles enlatados', 'Sin legumbres: +30 g arroz integral seco'] }
const DINNER_ALTS = {
  label: 'Otras opciones al salmón',
  options: ['Atún fresco 150 g (similar omega-3)', 'Carne de res magra 150 g (+1 cda aceite)', 'Carne de pavo 150 g (más aceite o aguacate)', 'Camarones (+1 cda aceite o aguacate)', 'Pollo 150 g (agrega aguacate)', 'Camarones 180 g crudos (+1 cda aceite)'],
}
const SNACK: Meal = { slot: 'snack', title: 'Snack dulce diario', items: ['Elige UNA opción'], macros: { kcal: 110, protein: 2, carbs: 20, fat: 3 }, alternatives: { label: 'Opciones', options: SNACK_OPTIONS } }

export const MENUS: Record<DayType, Meal[]> = {
  leg: [
    { slot: 'desayuno', title: 'Desayuno', items: ['3 huevos revueltos (3 yemas + 3 claras) con espinaca, tomate, cebolla', '1 tostada integral (25 g)', '100 g queso fresco alemán bajo en grasa (Quark o Cottage)', '½ aguacate mediano (70 g pulpa)', '1 banano pequeño'], macros: { kcal: 520, carbs: 35, protein: 38, fat: 24 } },
    { slot: 'pre', title: 'Pre-entreno', items: ['40 g avena seca (cocinar con agua)', '1 scoop proteína con 125 ml leche de soya sin azúcar + 125 ml agua', '1 manzana mediana'], macros: { kcal: 310, carbs: 50, protein: 30, fat: 3 } },
    { slot: 'post', title: 'Post-entreno', items: ['1 scoop proteína con 125 ml leche de soya sin azúcar + 125 ml agua', '1 banano grande', '5 g creatina (mezclar con el batido)'], macros: { kcal: 295, carbs: 38, protein: 28, fat: 3 } },
    { slot: 'almuerzo', title: 'Almuerzo', items: ['150 g pechuga de pollo (peso CRUDO, sin piel)', '60 g arroz integral seco (≈180 g cocido)', '½ taza frijoles negros cocidos (90 g)', 'Ensalada GRANDE (lechuga, pepino, tomate, zanahoria, alcaparras) – ilimitada', '1 cda aceite de oliva'], macros: { kcal: 540, carbs: 52, protein: 43, fat: 15 }, alternatives: LEGUMES },
    SNACK,
    { slot: 'cena', title: 'Cena', items: ['150 g salmón (peso CRUDO)', '100 g papa al horno (CRUDO, sin piel)', 'Espárragos, brócoli y zanahoria al vapor – ilimitado', 'Ensalada verde con limón'], macros: { kcal: 410, carbs: 25, protein: 36, fat: 14 }, alternatives: DINNER_ALTS },
  ],
  other: [
    { slot: 'desayuno', title: 'Desayuno', items: ['3 huevos revueltos con verduras', '1 tostada integral', '100 g queso fresco alemán', '¼ aguacate (aguacate total del día: 35 g)', 'SIN banano'], macros: { kcal: 470, protein: 38, carbs: 34, fat: 20 }, approx: true },
    { slot: 'pre', title: 'Pre-entreno', items: ['1 scoop proteína con 125 ml leche de soya + 125 ml agua', '1 manzana'], macros: { kcal: 220, protein: 28, carbs: 20, fat: 3 }, approx: true },
    { slot: 'post', title: 'Post-entreno', items: ['1 scoop proteína con 125 ml leche de soya + 125 ml agua', '5 g creatina'], macros: { kcal: 175, protein: 28, carbs: 9, fat: 3 }, approx: true },
    { slot: 'almuerzo', title: 'Almuerzo', items: ['150 g pechuga de pollo CRUDO', '45 g arroz integral seco (≈135 g cocido)', '½ taza frijoles cocidos', 'Ensalada GRANDE + 1 cda aceite de oliva'], macros: { kcal: 480, protein: 43, carbs: 43, fat: 15 }, approx: true, alternatives: LEGUMES },
    SNACK,
    { slot: 'cena', title: 'Cena', items: ['150 g salmón CRUDO', 'SIN papa: más verduras al vapor', 'Brócoli, espárragos, calabacín – ilimitado', 'Ensalada verde grande'], macros: { kcal: 370, protein: 36, carbs: 25, fat: 14 }, approx: true, alternatives: DINNER_ALTS },
  ],
  refeed: [
    { slot: 'desayuno', title: 'Desayuno refeed', items: ['80 g avena seca (cocinar con agua)', '1 scoop proteína (mezclar con la avena)', '2 cdas miel', '1 banano mediano + 1 taza fresas', '1 cda mantequilla de maní'], macros: { kcal: 600 } },
    { slot: 'pre', title: 'Pre-entreno refeed', items: ['2 tostadas integrales + 2 cdas mermelada sin azúcar', '1 banano'], macros: { kcal: 280 } },
    { slot: 'post', title: 'Post-entreno refeed', items: ['1 scoop proteína con agua', '1 banano grande + 5 g creatina'], macros: { kcal: 250 } },
    { slot: 'almuerzo', title: 'Almuerzo refeed', items: ['180 g pechuga de pollo CRUDO', '100 g pasta seca (≈300 g cocida)', 'Salsa de tomate casera (tomate, ajo, albahaca)', 'Ensalada grande sin aceite', '1 panecillo integral'], macros: { kcal: 750 } },
    { slot: 'cena', title: 'Cena refeed', items: ['150 g salmón CRUDO', '250 g papa al horno CRUDO', 'Brócoli y zanahoria al vapor – ilimitado', 'Ensalada verde'], macros: { kcal: 500 } },
  ],
}

export const REMINDERS = [
  'Pesa SIEMPRE crudo: pollo, pescado y carne (pierden ~25 % al cocinar); arroz, pasta y avena secos.',
  'Aguacate (solo pulpa): máximo 70 g en días de pierna y 35 g en los otros días, todas las comidas sumadas.',
  'Proteína en polvo siempre con 125 ml de leche de soya sin azúcar + 125 ml de agua.',
  'Snack dulce: todos los días, elige 1 opción (~110 kcal).',
  'Ilimitado: lechuga, pepino, apio, zanahoria, tomate, brócoli, coliflor, espárragos; limón, vinagre, mostaza, alcaparras, especias; agua, café negro y té sin azúcar.',
  'Refeed: 1 día cada 10, en día de pierna, siguiendo el menú refeed (no es cheat day libre).',
]

export const TRANSITION = [
  { days: 'Días 1–2', title: 'Hidratación', body: '3.5–4 L de agua, té verde, agua con limón y reducir la sal gradualmente.' },
  { days: 'Días 3–5', title: 'Mantenimiento', body: 'Calorías a mantenimiento (TDEE), proteína ~135 g, mucha fibra y verduras en todas las comidas.' },
  { days: 'Día 6', title: 'Empieza el plan', body: 'Entras en déficit y sigues el menú completo.' },
]
