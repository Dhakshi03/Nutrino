import { Food, FoodLogEntry, MealType, NutrientValues, ServingUnit } from "./types";
import { createNutritionSnapshot, scaleNutrientValues } from "./calculator";
import { STARTER_FOODS } from "./starter-db";

export interface ParsedMealItem {
  id: string;
  rawFragment: string;
  foodName: string;
  matchedFood: Food | null;
  servingQuantity: number;
  servingUnit: ServingUnit;
  nutritionSnapshot: NutrientValues;
  confidence: number; // 0.0 - 1.0
  isProvisional: boolean;
  matchType: "exact_catalog" | "alias_catalog" | "archetype_estimate" | "unknown";
  clarifyingNote?: string;
}

export interface ParsedMealResult {
  rawInput: string;
  detectedMealType: MealType;
  items: ParsedMealItem[];
  totalNutrients: NutrientValues;
  overallConfidence: "high" | "moderate" | "low";
}

// Word-to-number dictionary for natural English & Indian phrasing
const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  half: 0.5,
  quarter: 0.25,
  couple: 2,
  pair: 2,
  double: 2,
  triple: 3,
};

// Unit aliases mapping to ServingUnit
const UNIT_ALIASES: Record<string, ServingUnit> = {
  katori: "katori",
  katoris: "katori",
  bowl: "bowl",
  bowls: "bowl",
  "small bowl": "bowl",
  "medium bowl": "bowl",
  "large bowl": "bowl",
  ladle: "ladle",
  ladles: "ladle",
  glass: "glass",
  glasses: "glass",
  cup: "cup",
  cups: "cup",
  roti: "roti",
  rotis: "roti",
  chapati: "roti",
  chapatis: "roti",
  chapatti: "roti",
  chapattis: "roti",
  phulka: "roti",
  phulkas: "roti",
  idli: "idli",
  idlis: "idli",
  idly: "idli",
  idlies: "idli",
  dosa: "dosa",
  dosas: "dosa",
  dosai: "dosa",
  piece: "piece",
  pieces: "piece",
  pc: "piece",
  pcs: "piece",
  slice: "slice",
  slices: "slice",
  plate: "plate",
  plates: "plate",
  spoon: "tbsp",
  spoons: "tbsp",
  tbsp: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  scoop: "scoop",
  scoops: "scoop",
  serving: "serving",
  servings: "serving",
  portion: "serving",
  portions: "serving",
  g: "g",
  gram: "g",
  grams: "g",
  gm: "g",
  gms: "g",
  ml: "ml",
  milliliter: "ml",
  milliliters: "ml",
};

// Common Indian dish alias lookup mapping directly to STARTER_FOODS IDs
const FOOD_ALIAS_MAP: Record<string, string> = {
  idli: "food_steamed_idli",
  idlis: "food_steamed_idli",
  idly: "food_steamed_idli",
  idlies: "food_steamed_idli",
  dosa: "food_plain_dosa",
  dosas: "food_plain_dosa",
  dosai: "food_plain_dosa",
  sambar: "food_vegetable_sambar",
  sambhar: "food_vegetable_sambar",
  roti: "food_roti_chapati",
  rotis: "food_roti_chapati",
  chapati: "food_roti_chapati",
  chapatis: "food_roti_chapati",
  phulka: "food_roti_chapati",
  phulkas: "food_roti_chapati",
  rice: "food_cooked_white_rice",
  "white rice": "food_cooked_white_rice",
  "brown rice": "food_cooked_brown_rice",
  "steamed rice": "food_cooked_white_rice",
  dal: "food_dal_tadka",
  daal: "food_dal_tadka",
  "dal tadka": "food_dal_tadka",
  "yellow dal": "food_dal_tadka",
  rajma: "food_rajma_curry",
  chole: "food_chole_curry",
  chana: "food_roasted_chana",
  curd: "food_curd_yogurt",
  dahi: "food_curd_yogurt",
  yogurt: "food_curd_yogurt",
  paneer: "food_paneer_cottage_cheese",
  "cottage cheese": "food_paneer_cottage_cheese",
  egg: "food_boiled_egg",
  eggs: "food_boiled_egg",
  "boiled egg": "food_boiled_egg",
  "boiled eggs": "food_boiled_egg",
  omelette: "food_egg_omelette",
  omlet: "food_egg_omelette",
  bhurji: "food_egg_omelette",
  "egg white": "food_egg_whites",
  "egg whites": "food_egg_whites",
  milk: "food_milk_full_fat",
  chai: "food_masala_chai",
  tea: "food_masala_chai",
  "masala chai": "food_masala_chai",
  poha: "food_poha",
  oats: "food_rolled_oats",
  oatmeal: "food_rolled_oats",
  "soya chunks": "food_soya_chunks",
  tofu: "food_firm_tofu",
  whey: "food_whey_protein",
  "protein powder": "food_whey_protein",
  chicken: "food_chicken_breast",
  "chicken curry": "food_chicken_curry",
  fish: "food_fish_curry",
  "fish curry": "food_fish_curry",
  banana: "food_fresh_banana",
  bananas: "food_fresh_banana",
  apple: "food_fresh_apple",
  apples: "food_fresh_apple",
  salad: "food_mixed_salad",
  bread: "food_wheat_bread",
  "peanut butter": "food_peanut_butter",
  rasam: "food_tomato_rasam",
  "tomato rasam": "food_tomato_rasam",
  "curd rice": "food_curd_rice",
  "thayir sadam": "food_curd_rice",
  upma: "food_rava_upma",
  pongal: "food_ven_pongal",
  "ven pongal": "food_ven_pongal",
  buttermilk: "food_buttermilk",
  chaas: "food_buttermilk",
  mor: "food_buttermilk",
  paratha: "food_aloo_paratha",
  "aloo paratha": "food_aloo_paratha",
  "paneer curry": "food_paneer_curry",
  "paneer butter masala": "food_paneer_curry",
  biryani: "food_chicken_biryani",
  "chicken biryani": "food_chicken_biryani",
};

/**
 * Extracts candidate food name, quantity, and serving unit from a single fragment.
 * e.g. "two idlis" -> { quantity: 2, unit: "piece", foodQuery: "idlis" }
 * e.g. "1 bowl of sambar" -> { quantity: 1, unit: "bowl", foodQuery: "sambar" }
 * e.g. "2 chapatis" -> { quantity: 2, unit: "piece", foodQuery: "chapatis" }
 */
function extractFragmentDetails(fragment: string): {
  quantity: number;
  unit: ServingUnit | null;
  foodQuery: string;
} {
  let text = fragment.trim();
  // Strip filler words at start
  text = text.replace(/^(i had|i ate|ate|had|having|take|took|some|a plate of|plate of|bowl of|glass of|cup of)\s+/i, "");

  let quantity = 1;
  let unit: ServingUnit | null = null;

  // 1. Try to find number + unit pattern at start: e.g. "2 bowls", "1.5 katori", "two glasses", "100g"
  const tokens = text.split(/\s+/);
  if (tokens.length > 0) {
    const firstLower = tokens[0].toLowerCase();
    // Check if first token contains digits + unit, e.g. "100g", "200ml", "2pcs"
    const joinedMatch = firstLower.match(/^(\d+(?:\.\d+)?)(g|gm|gms|gram|grams|ml|katori|bowl|roti|idli|dosa|glass|plate|cup|tbsp|tsp|pc|pcs)$/i);
    if (joinedMatch) {
      quantity = Number(joinedMatch[1]);
      const matchedUnit = UNIT_ALIASES[joinedMatch[2].toLowerCase()];
      if (matchedUnit) unit = matchedUnit;
      tokens.shift();
      text = tokens.join(" ");
    } else if (/^\d+(?:\.\d+)?$/.test(firstLower)) {
      quantity = Number(firstLower);
      tokens.shift();
      text = tokens.join(" ");
    } else if (firstLower in NUMBER_WORDS) {
      quantity = NUMBER_WORDS[firstLower];
      tokens.shift();
      text = tokens.join(" ");
    } else if (firstLower.includes("/")) {
      const parts = firstLower.split("/");
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && Number(parts[1]) > 0) {
        quantity = Number(parts[0]) / Number(parts[1]);
        tokens.shift();
        text = tokens.join(" ");
      }
    }
  }

  // 2. Check next token for unit: e.g. "katori", "bowl", "glass", "idlis", "rotis", "of"
  const remainingTokens = text.split(/\s+/);
  if (remainingTokens.length > 0 && !unit) {
    // Check two-word units first (e.g. "small bowl", "medium bowl")
    if (remainingTokens.length >= 2) {
      const twoWord = `${remainingTokens[0]} ${remainingTokens[1]}`.toLowerCase();
      if (twoWord in UNIT_ALIASES) {
        unit = UNIT_ALIASES[twoWord];
        remainingTokens.splice(0, 2);
        // remove optional "of"
        if (remainingTokens[0]?.toLowerCase() === "of") remainingTokens.shift();
        text = remainingTokens.join(" ");
      }
    }

    if (!unit && remainingTokens.length > 0) {
      const firstRemLower = remainingTokens[0].toLowerCase();
      if (firstRemLower in UNIT_ALIASES) {
        unit = UNIT_ALIASES[firstRemLower];
        if (remainingTokens.length > 1) {
          remainingTokens.shift();
          if (remainingTokens[0]?.toLowerCase() === "of") remainingTokens.shift();
          text = remainingTokens.join(" ");
        } else {
          // When the token is the sole word (e.g. "2 idlis" -> "idlis"), keep the word as the food name
          text = firstRemLower;
        }
      }
    }
  }

  // Clean trailing / leading filler
  text = text.replace(/^of\s+/i, "").trim();

  // If the query itself is a plural Indian staple like "idlis" or "dosas" or "chapatis" without a separate unit
  const lowerFood = text.toLowerCase();
  if (!unit) {
    if (lowerFood === "idlis" || lowerFood === "idli") unit = "piece";
    else if (lowerFood === "dosas" || lowerFood === "dosa") unit = "piece";
    else if (lowerFood === "rotis" || lowerFood === "roti" || lowerFood === "chapatis" || lowerFood === "chapati") unit = "piece";
    else if (lowerFood === "bananas" || lowerFood === "banana" || lowerFood === "apples" || lowerFood === "apple") unit = "piece";
    else if (lowerFood === "eggs" || lowerFood === "egg") unit = "piece";
  }

  return {
    quantity: Math.max(0.1, quantity),
    unit,
    foodQuery: text || fragment,
  };
}

/**
 * Searches and scores foods from catalog and user library.
 */
function findBestFoodMatch(query: string, availableFoods: Food[]): { food: Food; confidence: number; matchType: "exact_catalog" | "alias_catalog" } | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // 1. Direct Alias Lookup (highest precision for Indian staples)
  if (q in FOOD_ALIAS_MAP) {
    const targetId = FOOD_ALIAS_MAP[q];
    const match = availableFoods.find((f) => f.id === targetId);
    if (match) {
      return { food: match, confidence: 0.95, matchType: "alias_catalog" };
    }
  }

  // 2. Exact name match
  const exact = availableFoods.find((f) => !f.isArchived && f.name.toLowerCase() === q);
  if (exact) {
    return { food: exact, confidence: 0.98, matchType: "exact_catalog" };
  }

  // 3. Name contains query or query contains name
  const subMatch = availableFoods.find((f) => {
    if (f.isArchived) return false;
    const fLower = f.name.toLowerCase();
    if (q.includes("biryani") && !fLower.includes("biryani")) return false;
    if (q.includes("dosa") && !fLower.includes("dosa")) return false;
    if (q.includes("idli") && !fLower.includes("idli")) return false;
    return fLower.includes(q) || q.includes(fLower);
  });
  if (subMatch) {
    return { food: subMatch, confidence: 0.90, matchType: "alias_catalog" };
  }

  // 4. Token intersection match
  const qWords = q.split(/\s+/).filter((w) => w.length > 2);
  let bestFood: Food | null = null;
  let bestScore = 0;

  for (const f of availableFoods) {
    if (f.isArchived) continue;
    const fLower = f.name.toLowerCase();

    // Guard against cross-dish pollution
    if (q.includes("biryani") && !fLower.includes("biryani")) continue;
    if (q.includes("dosa") && !fLower.includes("dosa")) continue;
    if (q.includes("idli") && !fLower.includes("idli")) continue;

    let hits = 0;
    for (const w of qWords) {
      if (fLower.includes(w)) hits += 1;
    }
    if (hits > bestScore && hits >= 1) {
      bestScore = hits;
      bestFood = f;
    }
  }

  if (bestFood) {
    const confidence = Math.min(0.88, 0.7 + (bestScore / qWords.length) * 0.18);
    return { food: bestFood, confidence, matchType: "alias_catalog" };
  }

  return null;
}

/**
 * Fallback for uncatalogued Indian dishes (e.g. "butter chicken", "biryani", "aloo gobi")
 * Computes deterministic nutrition snapshot from dish archetype per 100g rules.
 */
function createArchetypeSnapshot(foodQuery: string, qty: number, unit: ServingUnit): { snapshot: NutrientValues; category: string } {
  const q = foodQuery.toLowerCase();

  let per100g: NutrientValues = {
    protein: 4.5,
    calories: 140,
    carbohydrates: 20,
    totalFat: 5.0,
    saturatedFat: 1.2,
    fibre: 2.0,
    sugar: 1.0,
    sodium: 250,
    iron: 1.2,
    calcium: 30,
    zinc: 0.8,
    vitB12: null,
    vitD: null,
    folate: 20,
    healthyFats: 2.0,
  };
  let category = "Curry & Gravy";

  if (q.includes("biryani") || q.includes("pulao") || q.includes("fried rice")) {
    category = "Grains & Cereals";
    per100g = {
      protein: 7.5,
      calories: 185,
      carbohydrates: 24,
      totalFat: 6.5,
      saturatedFat: 1.8,
      fibre: 2.0,
      sugar: 1.0,
      sodium: 350,
      iron: 1.5,
      calcium: 35,
      zinc: 1.0,
      vitB12: 0.2,
      vitD: null,
      folate: 20,
      healthyFats: 3.5,
    };
  } else if (q.includes("curry") || q.includes("masala") || q.includes("sabzi") || q.includes("gravy")) {
    category = "Curry & Sabzi";
    per100g = {
      protein: 5.0,
      calories: 130,
      carbohydrates: 12,
      totalFat: 7.0,
      saturatedFat: 1.5,
      fibre: 3.2,
      sugar: 2.0,
      sodium: 280,
      iron: 1.8,
      calcium: 40,
      zinc: 1.0,
      vitB12: 0.1,
      vitD: null,
      folate: 35,
      healthyFats: 3.0,
    };
  }

  // Weight estimation for snapshot
  let grams = qty * 100;
  if (unit === "katori") grams = qty * 150;
  else if (unit === "bowl") grams = qty * 180;
  else if (unit === "plate") grams = qty * 250;
  else if (unit === "piece") grams = qty * 80;
  else if (unit === "g") grams = qty;
  else if (unit === "ml") grams = qty;

  const factor = grams / 100;
  const snapshot: NutrientValues = {
    protein: per100g.protein !== null ? Math.round(per100g.protein * factor * 10) / 10 : null,
    calories: per100g.calories !== null ? Math.round(per100g.calories * factor) : null,
    carbohydrates: per100g.carbohydrates !== null ? Math.round(per100g.carbohydrates * factor * 10) / 10 : null,
    totalFat: per100g.totalFat !== null ? Math.round(per100g.totalFat * factor * 10) / 10 : null,
    saturatedFat: per100g.saturatedFat !== null ? Math.round(per100g.saturatedFat * factor * 10) / 10 : null,
    fibre: per100g.fibre !== null ? Math.round(per100g.fibre * factor * 10) / 10 : null,
    sugar: per100g.sugar !== null ? Math.round(per100g.sugar * factor * 10) / 10 : null,
    sodium: per100g.sodium !== null ? Math.round(per100g.sodium * factor) : null,
    iron: per100g.iron !== null ? Math.round(per100g.iron * factor * 10) / 10 : null,
    calcium: per100g.calcium !== null ? Math.round(per100g.calcium * factor) : null,
    zinc: per100g.zinc !== null ? Math.round(per100g.zinc * factor * 10) / 10 : null,
    vitB12: per100g.vitB12,
    vitD: per100g.vitD,
    folate: per100g.folate !== null ? Math.round(per100g.folate * factor) : null,
    healthyFats: per100g.healthyFats !== null ? Math.round(per100g.healthyFats * factor * 10) / 10 : null,
  };

  return { snapshot, category };
}

/**
 * Detects meal category from input string or defaults based on current local hour.
 */
function detectMealType(input: string): MealType {
  const lower = input.toLowerCase();
  if (lower.includes("breakfast") || lower.includes("morning")) return "breakfast";
  if (lower.includes("lunch") || lower.includes("afternoon")) return "lunch";
  if (lower.includes("dinner") || lower.includes("supper") || lower.includes("night")) return "dinner";
  if (lower.includes("snack") || lower.includes("tea time") || lower.includes("evening")) return "snack";

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 19) return "snack";
  return "dinner";
}

/**
 * Core Natural Language Meal Parsing Engine.
 * 
 * 1. Segments free-form user sentence into individual items by conjunctions ("and", "with", "+", ",").
 * 2. Parses quantities (numbers, digit words) and units (Indian household measures: katori, bowl, glass, piece, etc.).
 * 3. Matches foods against catalog and user library.
 * 4. Calls the deterministic Nutrition Engine (`createNutritionSnapshot`) to compute exact nutrition.
 * 5. Returns structured parsed meal with confidence and review data.
 */
export function parseNaturalMealDescription(
  input: string,
  customFoods: Food[] = [],
  preferredMealType?: MealType
): ParsedMealResult {
  const cleaned = input.trim();
  const detectedMealType = preferredMealType || detectMealType(cleaned);

  if (!cleaned) {
    return {
      rawInput: input,
      detectedMealType,
      items: [],
      totalNutrients: {
        protein: 0,
        calories: 0,
        carbohydrates: 0,
        totalFat: 0,
        saturatedFat: 0,
        fibre: 0,
        sugar: 0,
        sodium: 0,
        iron: 0,
        calcium: 0,
        zinc: 0,
        vitB12: 0,
        vitD: 0,
        folate: 0,
        healthyFats: 0,
      },
      overallConfidence: "low",
    };
  }

  // Combined food pool (user custom foods first for personal preferences, then starter db)
  const pool = [...customFoods, ...STARTER_FOODS];

  // Remove meal-type prefix / suffix from sentence before splitting
  const sentenceCore = cleaned
    .replace(/\b(for lunch|for breakfast|for dinner|for snacks?|in lunch|in breakfast|in dinner)\b/gi, "")
    .trim();

  // Split sentence by delimiter: "and", "with", "+", "along with", commas, newlines
  const fragments = sentenceCore
    .split(/\s+(?:and|with|along with|\+)\s+|,\s*|\n+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const items: ParsedMealItem[] = [];

  for (let idx = 0; idx < fragments.length; idx++) {
    const frag = fragments[idx];
    const { quantity, unit: parsedUnit, foodQuery } = extractFragmentDetails(frag);

    const match = findBestFoodMatch(foodQuery, pool);

    if (match) {
      const food = match.food;
      // Resolve safe serving unit
      const effectiveUnit: ServingUnit =
        parsedUnit && (parsedUnit === food.referenceUnit || parsedUnit === food.defaultServingUnit)
          ? parsedUnit
          : parsedUnit || food.defaultServingUnit || food.referenceUnit;

      // Deterministic calculation from the Nutrition Engine
      let snapshot: NutrientValues;
      try {
        snapshot = createNutritionSnapshot(food, quantity, effectiveUnit);
      } catch {
        // Fallback to default serving unit if combination is strict
        snapshot = createNutritionSnapshot(food, quantity, food.defaultServingUnit);
      }

      items.push({
        id: `item_${Date.now()}_${idx}`,
        rawFragment: frag,
        foodName: food.name,
        matchedFood: food,
        servingQuantity: quantity,
        servingUnit: effectiveUnit,
        nutritionSnapshot: snapshot,
        confidence: match.confidence,
        isProvisional: false,
        matchType: match.matchType,
      });
    } else {
      // Uncatalogued item -> Smart Indian archetype fallback
      const effectiveUnit = parsedUnit || "serving";
      const { snapshot } = createArchetypeSnapshot(foodQuery, quantity, effectiveUnit);

      items.push({
        id: `item_${Date.now()}_${idx}`,
        rawFragment: frag,
        foodName: foodQuery.charAt(0).toUpperCase() + foodQuery.slice(1),
        matchedFood: null,
        servingQuantity: quantity,
        servingUnit: effectiveUnit,
        nutritionSnapshot: snapshot,
        confidence: 0.72,
        isProvisional: true,
        matchType: "archetype_estimate",
        clarifyingNote: "Provisional estimate — tap to link with your food catalog or adjust macros.",
      });
    }
  }

  // Aggregate totals deterministically
  const totalNutrients: NutrientValues = {
    protein: 0,
    calories: 0,
    carbohydrates: 0,
    totalFat: 0,
    saturatedFat: 0,
    fibre: 0,
    sugar: 0,
    sodium: 0,
    iron: 0,
    calcium: 0,
    zinc: 0,
    vitB12: 0,
    vitD: 0,
    folate: 0,
    healthyFats: 0,
  };

  for (const it of items) {
    const s = it.nutritionSnapshot;
    if (s.protein !== null) totalNutrients.protein = Math.round(((totalNutrients.protein ?? 0) + s.protein) * 10) / 10;
    if (s.calories !== null) totalNutrients.calories = Math.round((totalNutrients.calories ?? 0) + s.calories);
    if (s.carbohydrates !== null) totalNutrients.carbohydrates = Math.round(((totalNutrients.carbohydrates ?? 0) + s.carbohydrates) * 10) / 10;
    if (s.totalFat !== null) totalNutrients.totalFat = Math.round(((totalNutrients.totalFat ?? 0) + s.totalFat) * 10) / 10;
    if (s.fibre !== null) totalNutrients.fibre = Math.round(((totalNutrients.fibre ?? 0) + s.fibre) * 10) / 10;
  }

  const avgConfidence = items.length > 0 ? items.reduce((acc, i) => acc + i.confidence, 0) / items.length : 0;
  const overallConfidence: "high" | "moderate" | "low" =
    avgConfidence >= 0.88 ? "high" : avgConfidence >= 0.7 ? "moderate" : "low";

  return {
    rawInput: input,
    detectedMealType,
    items,
    totalNutrients,
    overallConfidence,
  };
}
