import {
  FoodItem,
  LoggedMealItem,
  NutrientSnapshot,
  NutritionTargets,
  UserGoals,
  UserProfile,
} from "@/types/nutrino";
import { FOOD_DATABASE } from "@/lib/data/indian-food-db";

export function createEmptyNutrientSnapshot(): NutrientSnapshot {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    saturatedFat: 0,
    fiber: 0,
    sugars: 0,
    sodiumMg: 0,
    calciumMg: 0,
    ironMg: 0,
    potassiumMg: 0,
    magnesiumMg: 0,
    zincMg: 0,
    vitaminAMcg: 0,
    vitaminB12Mcg: 0,
    vitaminCMg: 0,
    vitaminDMcg: 0,
    folateMcg: 0,
  };
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Deterministic formula required by Section 10:
 * Nutrient consumed = (quantity in grams / 100) * nutrient value per 100 g
 */
export function calculateNutrientsForGrams(
  per100g: NutrientSnapshot,
  grams: number
): NutrientSnapshot {
  const factor = Math.max(0, grams) / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein: round1(per100g.protein * factor),
    carbs: round1(per100g.carbs * factor),
    fat: round1(per100g.fat * factor),
    saturatedFat: round1(per100g.saturatedFat * factor),
    fiber: round1(per100g.fiber * factor),
    sugars: round1(per100g.sugars * factor),
    sodiumMg: Math.round(per100g.sodiumMg * factor),
    calciumMg: Math.round(per100g.calciumMg * factor),
    ironMg: round1(per100g.ironMg * factor),
    potassiumMg: Math.round(per100g.potassiumMg * factor),
    magnesiumMg: Math.round(per100g.magnesiumMg * factor),
    zincMg: round1(per100g.zincMg * factor),
    vitaminAMcg: Math.round(per100g.vitaminAMcg * factor),
    vitaminB12Mcg: round2(per100g.vitaminB12Mcg * factor),
    vitaminCMg: round1(per100g.vitaminCMg * factor),
    vitaminDMcg: round1(per100g.vitaminDMcg * factor),
    folateMcg: Math.round(per100g.folateMcg * factor),
  };
}

/**
 * Resolves a food item and a portion (quantity + unitName) into exact grams.
 */
export function resolveServingGrams(
  food: FoodItem,
  quantity: number,
  unitName?: string
): { unitName: string; grams: number } {
  const normalizedUnit = (unitName || food.defaultServingUnit).toLowerCase().trim();
  const safeQty = Math.max(0.1, quantity || 1);

  if (normalizedUnit === "g" || normalizedUnit === "gram" || normalizedUnit === "grams") {
    return { unitName: "100g", grams: Math.round(safeQty) };
  }
  if (normalizedUnit === "100g") {
    return { unitName: "100g", grams: Math.round(safeQty * 100) };
  }

  // Exact match in food's defined servings
  const exactServing = food.servings.find(
    (s) => s.unitName.toLowerCase() === normalizedUnit
  );
  if (exactServing) {
    return {
      unitName: exactServing.unitName,
      grams: Math.round(safeQty * exactServing.gramsEquivalent),
    };
  }

  // Fallback universal Indian portion approximations when a user switches units
  const fallbackMultipliers: Record<string, number> = {
    katori: 150,
    bowl: 180,
    "small bowl": 110,
    "large bowl": 250,
    cup: 180,
    "half cup": 90,
    "1/2 cup": 90,
    glass: 200,
    ladle: 80,
    tbsp: 15,
    tablespoon: 15,
    tsp: 5,
    teaspoon: 5,
    roti: 35,
    dosa: 80,
    idli: 45,
    piece: food.defaultServingGrams,
    slice: 30,
    small: Math.round(food.defaultServingGrams * 0.7),
    medium: food.defaultServingGrams,
    large: Math.round(food.defaultServingGrams * 1.4),
  };

  if (fallbackMultipliers[normalizedUnit]) {
    return {
      unitName: normalizedUnit,
      grams: Math.round(safeQty * fallbackMultipliers[normalizedUnit]),
    };
  }

  return {
    unitName: food.defaultServingUnit,
    grams: Math.round(safeQty * food.defaultServingGrams),
  };
}

/**
 * Builds a complete LoggedMealItem with calculated NutrientSnapshot
 */
export function buildCalculatedMealItem(
  food: FoodItem,
  quantity: number,
  unitName?: string,
  existingId?: string
): LoggedMealItem {
  const resolved = resolveServingGrams(food, quantity, unitName);
  const nutrition = calculateNutrientsForGrams(food.per100g, resolved.grams);
  return {
    id: existingId || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    foodId: food.id,
    foodName: food.name,
    quantity: round2(quantity),
    unitName: resolved.unitName,
    grams: resolved.grams,
    nutrition,
  };
}

/**
 * Sums multiple NutrientSnapshots into a single aggregate snapshot
 */
export function sumNutrientSnapshots(snapshots: NutrientSnapshot[]): NutrientSnapshot {
  const total = createEmptyNutrientSnapshot();
  for (const s of snapshots) {
    total.calories += s.calories;
    total.protein += s.protein;
    total.carbs += s.carbs;
    total.fat += s.fat;
    total.saturatedFat += s.saturatedFat;
    total.fiber += s.fiber;
    total.sugars += s.sugars;
    total.sodiumMg += s.sodiumMg;
    total.calciumMg += s.calciumMg;
    total.ironMg += s.ironMg;
    total.potassiumMg += s.potassiumMg;
    total.magnesiumMg += s.magnesiumMg;
    total.zincMg += s.zincMg;
    total.vitaminAMcg += s.vitaminAMcg;
    total.vitaminB12Mcg += s.vitaminB12Mcg;
    total.vitaminCMg += s.vitaminCMg;
    total.vitaminDMcg += s.vitaminDMcg;
    total.folateMcg += s.folateMcg;
  }

  return {
    calories: Math.round(total.calories),
    protein: round1(total.protein),
    carbs: round1(total.carbs),
    fat: round1(total.fat),
    saturatedFat: round1(total.saturatedFat),
    fiber: round1(total.fiber),
    sugars: round1(total.sugars),
    sodiumMg: Math.round(total.sodiumMg),
    calciumMg: Math.round(total.calciumMg),
    ironMg: round1(total.ironMg),
    potassiumMg: Math.round(total.potassiumMg),
    magnesiumMg: Math.round(total.magnesiumMg),
    zincMg: round1(total.zincMg),
    vitaminAMcg: Math.round(total.vitaminAMcg),
    vitaminB12Mcg: round2(total.vitaminB12Mcg),
    vitaminCMg: round1(total.vitaminCMg),
    vitaminDMcg: round1(total.vitaminDMcg),
    folateMcg: Math.round(total.folateMcg),
  };
}

export function getFoodById(foodId: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === foodId);
}

export function searchFoods(
  query: string,
  options?: {
    category?: string;
    dietaryPreference?: string;
    hostelOnly?: boolean;
  }
): FoodItem[] {
  const q = query.toLowerCase().trim();

  return FOOD_DATABASE.filter((food) => {
    if (options?.category && options.category !== "All" && food.category !== options.category) {
      return false;
    }
    if (options?.hostelOnly && !food.isHostelStaple) {
      return false;
    }
    if (options?.dietaryPreference) {
      const pref = options.dietaryPreference;
      if (pref === "vegan" && food.dietType !== "vegan") return false;
      if (
        pref === "vegetarian" &&
        food.dietType !== "vegan" &&
        food.dietType !== "vegetarian"
      ) {
        return false;
      }
      if (pref === "eggetarian" && food.dietType === "non_vegetarian") {
        return false;
      }
    }
    if (!q) return true;
    return (
      food.name.toLowerCase().includes(q) ||
      food.category.toLowerCase().includes(q) ||
      food.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });
}

/**
 * Calculates safe, evidence-based daily nutrition targets using Mifflin-St Jeor + ICMR-NIN guidelines.
 * Enforces safe minimum bounds so users are never given extreme or unsafe calorie restrictions.
 */
export function calculateNutritionTargets(
  profile: UserProfile,
  goals: UserGoals
): NutritionTargets {
  const weight = Math.max(35, Math.min(220, profile.weightKg || 65));
  const height = Math.max(130, Math.min(220, profile.heightCm || 168));
  const age = Math.max(16, Math.min(95, profile.age || 24));

  // Mifflin-St Jeor BMR
  const genderOffset =
    profile.gender === "female" ? -161 : profile.gender === "male" ? 5 : -78;
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;

  const activityMultipliers: Record<UserProfile["activityLevel"], number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  const tdee = bmr * (activityMultipliers[profile.activityLevel] || 1.5);

  let targetCalories = Math.round(tdee);
  if (goals.primaryGoal === "weight_loss") {
    targetCalories = Math.round(tdee - 380); // Sustainable ~0.35-0.4kg/week deficit
  } else if (goals.primaryGoal === "muscle_building" || goals.primaryGoal === "sports_performance") {
    targetCalories = Math.round(tdee + 250);
  }

  // Enforce safe clinical floor (never below 1350 kcal for women / 1500 kcal for men)
  const minSafeCalories = profile.gender === "female" ? 1350 : 1500;
  targetCalories = Math.max(minSafeCalories, Math.min(4200, targetCalories));

  // Protein calculation based on goal (g per kg body weight)
  let proteinPerKg = 1.1; // General wellness & ICMR enhanced baseline
  if (
    goals.primaryGoal === "muscle_building" ||
    goals.primaryGoal === "high_protein" ||
    goals.secondaryGoals.includes("high_protein")
  ) {
    proteinPerKg = 1.65;
  } else if (goals.primaryGoal === "weight_loss" || goals.primaryGoal === "sports_performance") {
    proteinPerKg = 1.45;
  }

  const proteinG = Math.round(weight * proteinPerKg);
  const fatCalories = targetCalories * 0.27;
  const fatG = Math.round(fatCalories / 9);
  const remainingCalories = Math.max(400, targetCalories - proteinG * 4 - fatG * 9);
  const carbsG = Math.round(remainingCalories / 4);

  const isFemale = profile.gender === "female";

  return {
    userId: profile.userId,
    calculationMethod: "Mifflin-St Jeor + ICMR-NIN 2024 Safe Bounds",
    calories: targetCalories,
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    saturatedFat: Math.round((targetCalories * 0.08) / 9),
    fiber: targetCalories >= 2000 ? 32 : 26,
    sugars: Math.round((targetCalories * 0.07) / 4),
    sodiumMg: 2000,
    calciumMg: 1000,
    ironMg: isFemale ? 21 : 17, // ICMR-NIN RDA for Indian adults
    potassiumMg: 3500,
    magnesiumMg: isFemale ? 325 : 400,
    zincMg: isFemale ? 11 : 14,
    vitaminAMcg: 840,
    vitaminB12Mcg: 2.4,
    vitaminCMg: isFemale ? 65 : 80,
    vitaminDMcg: 15,
    folateMcg: 300,
  };
}

