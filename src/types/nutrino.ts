export type MascotState =
  | "welcome"
  | "happy"
  | "thinking"
  | "explaining"
  | "planning"
  | "eating"
  | "encouraging"
  | "concerned"
  | "sleeping"
  | "celebration"
  | "error";

export type MealType = "breakfast" | "lunch" | "snacks" | "dinner";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "eggetarian"
  | "non_vegetarian"
  | "pescatarian"
  | "other";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

export type PrimaryGoal =
  | "weight_loss"
  | "weight_maintenance"
  | "muscle_building"
  | "general_health"
  | "improved_habits"
  | "high_protein"
  | "sports_performance"
  | "specific_concern"
  | "custom";

export type LoggingMethod =
  | "text"
  | "photo"
  | "voice"
  | "manual"
  | "saved_meal"
  | "meal_plan";

export interface NutrientSnapshot {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sugars: number;
  sodiumMg: number;
  calciumMg: number;
  ironMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  zincMg: number;
  vitaminAMcg: number;
  vitaminB12Mcg: number;
  vitaminCMg: number;
  vitaminDMcg: number;
  folateMcg: number;
}

export interface ServingConversion {
  unitName: string; // e.g., "katori", "roti", "dosa", "idli", "bowl", "cup", "piece", "glass", "ladle", "tbsp", "tsp", "small", "medium", "large", "100g"
  label: string;    // e.g., "1 Katori (150g)"
  gramsEquivalent: number;
}

export interface FoodItem {
  id: string;
  name: string;
  aliases: string[];
  category:
    | "South Indian"
    | "North Indian"
    | "Dal & Pulses"
    | "Rice & Breads"
    | "Sabzi & Curries"
    | "Eggs, Meat & Fish"
    | "Dairy & Plant Milk"
    | "Fruits & Nuts"
    | "Snacks & Street Food"
    | "Beverages"
    | "Hostel & Mess Staples"
    | "Packaged & Quick";
  cuisine: string;
  dietType: "vegan" | "vegetarian" | "eggetarian" | "non_vegetarian";
  sourceDatabase: "ICMR-NIN" | "USDA" | "ICMR-NIN Composite";
  isHostelStaple: boolean;
  budgetTier: "low" | "medium" | "high";
  defaultServingUnit: string;
  defaultServingGrams: number;
  servings: ServingConversion[];
  per100g: NutrientSnapshot;
}

export interface LoggedMealItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unitName: string;
  grams: number;
  nutrition: NutrientSnapshot;
}

export interface LoggedMeal {
  id: string;
  userId: string;
  mealType: MealType;
  dateKey: string; // YYYY-MM-DD
  loggedAt: string;
  loggingMethod: LoggingMethod;
  rawInput?: string;
  confidenceScore: number;
  items: LoggedMealItem[];
  totalNutrition: NutrientSnapshot;
}

export interface SavedMeal {
  id: string;
  userId: string;
  name: string;
  defaultMealType: MealType;
  items: {
    foodId: string;
    foodName: string;
    quantity: number;
    unitName: string;
    grams: number;
  }[];
  totalNutrition: NutrientSnapshot;
  timesLogged: number;
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: "female" | "male" | "non-binary" | "prefer-not-to-say";
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  exerciseFrequencyDays: number;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  intolerances: string[];
  country: string;
  region: string;
  unitPreference: "metric" | "imperial";
  wakeTime: string;
  sleepTime: string;
  cookingFacilities: "none_hostel" | "kettle_induction" | "basic_kitchen" | "full_kitchen";
  hostelMode: boolean;
  eatingOutFrequency: string;
  foodBudget: "budget_student" | "moderate" | "flexible";
  preferredMealsPerDay: number;
}

export interface UserGoals {
  userId: string;
  primaryGoal: PrimaryGoal;
  secondaryGoals: string[];
  customGoalText?: string;
  targetWeightKg?: number;
}

export interface NutritionTargets extends NutrientSnapshot {
  userId: string;
  calculationMethod: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  profile: UserProfile;
  goals: UserGoals;
  targets: NutritionTargets;
}

export interface PlannedMealSlot {
  id: string;
  dayLabel: string;
  mealType: MealType;
  title: string;
  servingDescription: string;
  prepTimeMins: number;
  ingredients: string[];
  instructions: string[];
  items: {
    foodId: string;
    foodName: string;
    quantity: number;
    unitName: string;
    grams: number;
  }[];
  nutrition: NutrientSnapshot;
}

export interface MealPlan {
  id: string;
  userId: string;
  planType: "daily" | "weekly";
  startDate: string;
  title: string;
  availableIngredients: string[];
  meals: PlannedMealSlot[];
  createdAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantityLabel: string;
  isPurchased: boolean;
}

export interface ProgressEntry {
  id: string;
  userId: string;
  dateKey: string;
  weightKg?: number;
  waterGlasses: number;
  energyRating?: number;
  notes?: string;
}

export interface AIActionCard {
  title: string;
  mealType: MealType;
  servingDescription: string;
  whyItFits: string;
  items: {
    foodId: string;
    foodName: string;
    quantity: number;
    unitName: string;
    grams: number;
  }[];
  nutrition: NutrientSnapshot;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mascotState: MascotState;
  actionCards?: AIActionCard[];
  createdAt: string;
  providerBadge?: "Live AI" | "Nutrino Nutrition Engine";
}

export interface ContextualGreeting {
  headline: string;
  subtext: string;
  mascotState: MascotState;
  badgeText: string;
  suggestedActionLabel: string;
  suggestedActionTarget: "track" | "planner" | "ai" | "insights";
  suggestedPrompt?: string;
}

