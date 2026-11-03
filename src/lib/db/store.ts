import fs from "fs";
import path from "path";
import {
  AIMessage,
  GroceryItem,
  LoggedMeal,
  MealPlan,
  ProgressEntry,
  SavedMeal,
  UserAccount,
  UserGoals,
  UserProfile,
} from "@/types/nutrino";
import {
  buildCalculatedMealItem,
  calculateNutritionTargets,
  getFoodById,
  sumNutrientSnapshots,
} from "@/lib/services/nutrition-engine";
import { generatePersonalizedMealPlan } from "@/lib/services/ai-nutritionist";

export interface DatabaseUserRecord extends UserAccount {
  passwordHash: string;
}

export interface NutrinoDatabase {
  users: DatabaseUserRecord[];
  meals: LoggedMeal[];
  savedMeals: SavedMeal[];
  mealPlans: MealPlan[];
  progressEntries: ProgressEntry[];
  groceryByUserId: Record<string, GroceryItem[]>;
  chatByUserId: Record<string, AIMessage[]>;
}

const DB_DIR = path.join(process.cwd(), ".nutrino-data");
const DB_FILE = path.join(DB_DIR, "nutrino-db.json");

function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function pastDateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function buildSeedDatabase(): NutrinoDatabase {
  const demoUserId = "user-demo-priya";
  const hostelUserId = "user-demo-aarav";

  const priyaProfile: UserProfile = {
    userId: demoUserId,
    age: 26,
    gender: "female",
    heightCm: 163,
    weightKg: 62,
    activityLevel: "moderately_active",
    exerciseFrequencyDays: 4,
    dietaryPreference: "vegetarian",
    allergies: [],
    intolerances: [],
    country: "India",
    region: "South & North Indian",
    unitPreference: "metric",
    wakeTime: "07:00",
    sleepTime: "23:00",
    cookingFacilities: "full_kitchen",
    hostelMode: false,
    eatingOutFrequency: "1_2_weekly",
    foodBudget: "moderate",
    preferredMealsPerDay: 4,
  };

  const priyaGoals: UserGoals = {
    userId: demoUserId,
    primaryGoal: "improved_habits",
    secondaryGoals: ["high_protein", "general_health"],
    targetWeightKg: 59,
  };

  const priyaTargets = calculateNutritionTargets(priyaProfile, priyaGoals);

  const priyaAccount: DatabaseUserRecord = {
    id: demoUserId,
    email: "priya@nutrino.app",
    passwordHash: "demo123",
    name: "Priya Nair",
    isDemo: true,
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    profile: priyaProfile,
    goals: priyaGoals,
    targets: priyaTargets,
  };

  const aaravProfile: UserProfile = {
    userId: hostelUserId,
    age: 20,
    gender: "male",
    heightCm: 175,
    weightKg: 68,
    activityLevel: "moderately_active",
    exerciseFrequencyDays: 4,
    dietaryPreference: "eggetarian",
    allergies: [],
    intolerances: [],
    country: "India",
    region: "Hostel / Mess Meals",
    unitPreference: "metric",
    wakeTime: "07:30",
    sleepTime: "23:30",
    cookingFacilities: "kettle_induction",
    hostelMode: true,
    eatingOutFrequency: "3_4_weekly",
    foodBudget: "budget_student",
    preferredMealsPerDay: 4,
  };

  const aaravGoals: UserGoals = {
    userId: hostelUserId,
    primaryGoal: "muscle_building",
    secondaryGoals: ["high_protein", "sports_performance"],
    targetWeightKg: 72,
  };

  const aaravTargets = calculateNutritionTargets(aaravProfile, aaravGoals);

  const aaravAccount: DatabaseUserRecord = {
    id: hostelUserId,
    email: "aarav@nutrino.app",
    passwordHash: "demo123",
    name: "Aarav Sharma (Hostel Mode)",
    isDemo: true,
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    profile: aaravProfile,
    goals: aaravGoals,
    targets: aaravTargets,
  };

  // Seed today's breakfast for Priya using real calculated food items
  const dosa = getFoodById("plain-dosa")!;
  const sambar = getFoodById("sambar")!;
  const chai = getFoodById("masala-chai")!;
  const bItems = [
    buildCalculatedMealItem(dosa, 2, "dosa", "seed-item-1"),
    buildCalculatedMealItem(sambar, 1, "bowl", "seed-item-2"),
    buildCalculatedMealItem(chai, 1, "cup", "seed-item-3"),
  ];

  const today = todayDateKey();

  const seededMeals: LoggedMeal[] = [
    {
      id: "meal-seed-today-breakfast",
      userId: demoUserId,
      mealType: "breakfast",
      dateKey: today,
      loggedAt: new Date().toISOString(),
      loggingMethod: "text",
      rawInput: "I had two dosas, a bowl of sambar and a cup of tea",
      confidenceScore: 0.96,
      items: bItems,
      totalNutrition: sumNutrientSnapshots(bItems.map((i) => i.nutrition)),
    },
  ];

  // Seed 6 past days of meals & weight progress for Insights & Progress charts
  const roti = getFoodById("wheat-roti")!;
  const dal = getFoodById("dal-tadka")!;
  const paneer = getFoodById("paneer-bhurji")!;
  const poha = getFoodById("poha")!;
  const curd = getFoodById("curd-dahi")!;
  const chana = getFoodById("roasted-chana")!;

  for (let d = 1; d <= 6; d++) {
    const dKey = pastDateKey(d);
    const pastB = [
      buildCalculatedMealItem(poha, 1, "bowl"),
      buildCalculatedMealItem(chai, 1, "cup"),
    ];
    const pastL = [
      buildCalculatedMealItem(roti, 2, "roti"),
      buildCalculatedMealItem(dal, 1, "katori"),
      buildCalculatedMealItem(curd, 1, "katori"),
    ];
    const pastS = [buildCalculatedMealItem(chana, 1, "katori")];
    const pastD = [
      buildCalculatedMealItem(roti, 2, "roti"),
      buildCalculatedMealItem(paneer, 1, "katori"),
    ];

    seededMeals.push(
      {
        id: `meal-past-${d}-b`,
        userId: demoUserId,
        mealType: "breakfast",
        dateKey: dKey,
        loggedAt: new Date(Date.now() - d * 86400000).toISOString(),
        loggingMethod: "manual",
        confidenceScore: 1,
        items: pastB,
        totalNutrition: sumNutrientSnapshots(pastB.map((i) => i.nutrition)),
      },
      {
        id: `meal-past-${d}-l`,
        userId: demoUserId,
        mealType: "lunch",
        dateKey: dKey,
        loggedAt: new Date(Date.now() - d * 86400000).toISOString(),
        loggingMethod: "manual",
        confidenceScore: 1,
        items: pastL,
        totalNutrition: sumNutrientSnapshots(pastL.map((i) => i.nutrition)),
      },
      {
        id: `meal-past-${d}-s`,
        userId: demoUserId,
        mealType: "snacks",
        dateKey: dKey,
        loggedAt: new Date(Date.now() - d * 86400000).toISOString(),
        loggingMethod: "manual",
        confidenceScore: 1,
        items: pastS,
        totalNutrition: sumNutrientSnapshots(pastS.map((i) => i.nutrition)),
      },
      {
        id: `meal-past-${d}-d`,
        userId: demoUserId,
        mealType: "dinner",
        dateKey: dKey,
        loggedAt: new Date(Date.now() - d * 86400000).toISOString(),
        loggingMethod: "manual",
        confidenceScore: 1,
        items: pastD,
        totalNutrition: sumNutrientSnapshots(pastD.map((i) => i.nutrition)),
      }
    );
  }

  // Saved Meals ("My Usual Breakfast", "Quick Dal-Roti Thali", "Hostel Protein Boost")
  const oats = getFoodById("oats-porridge")!;
  const milk = getFoodById("toned-milk")!;
  const banana = getFoodById("banana")!;
  const usualBItems = [
    buildCalculatedMealItem(oats, 1, "bowl"),
    buildCalculatedMealItem(milk, 1, "cup"),
    buildCalculatedMealItem(banana, 1, "piece"),
  ];

  const idli = getFoodById("idli")!;
  const southBItems = [
    buildCalculatedMealItem(idli, 3, "idli"),
    buildCalculatedMealItem(sambar, 1, "bowl"),
  ];

  const savedMeals: SavedMeal[] = [
    {
      id: "saved-usual-breakfast",
      userId: demoUserId,
      name: "My Usual Oats, Milk & Banana Breakfast",
      defaultMealType: "breakfast",
      items: usualBItems.map((i) => ({
        foodId: i.foodId,
        foodName: i.foodName,
        quantity: i.quantity,
        unitName: i.unitName,
        grams: i.grams,
      })),
      totalNutrition: sumNutrientSnapshots(usualBItems.map((i) => i.nutrition)),
      timesLogged: 5,
    },
    {
      id: "saved-south-idli-sambar",
      userId: demoUserId,
      name: "3 Idlis & Bowl of Vegetable Sambar",
      defaultMealType: "breakfast",
      items: southBItems.map((i) => ({
        foodId: i.foodId,
        foodName: i.foodName,
        quantity: i.quantity,
        unitName: i.unitName,
        grams: i.grams,
      })),
      totalNutrition: sumNutrientSnapshots(southBItems.map((i) => i.nutrition)),
      timesLogged: 8,
    },
  ];

  const initialPlan = generatePersonalizedMealPlan({
    user: priyaAccount,
    planType: "daily",
  });

  const progressEntries: ProgressEntry[] = [
    { id: "prog-6", userId: demoUserId, dateKey: pastDateKey(6), weightKg: 62.6, waterGlasses: 7, energyRating: 4 },
    { id: "prog-5", userId: demoUserId, dateKey: pastDateKey(5), weightKg: 62.5, waterGlasses: 8, energyRating: 4 },
    { id: "prog-4", userId: demoUserId, dateKey: pastDateKey(4), weightKg: 62.4, waterGlasses: 7, energyRating: 5 },
    { id: "prog-3", userId: demoUserId, dateKey: pastDateKey(3), weightKg: 62.3, waterGlasses: 8, energyRating: 4 },
    { id: "prog-2", userId: demoUserId, dateKey: pastDateKey(2), weightKg: 62.2, waterGlasses: 8, energyRating: 5 },
    { id: "prog-1", userId: demoUserId, dateKey: pastDateKey(1), weightKg: 62.1, waterGlasses: 9, energyRating: 5 },
    { id: "prog-0", userId: demoUserId, dateKey: today, weightKg: 62.0, waterGlasses: 5, energyRating: 5 },
  ];

  const defaultGrocery: GroceryItem[] = [
    { id: "g-1", name: "Toor Dal & Green Moong Dal", category: "Pulses & Staples", quantityLabel: "1 kg", isPurchased: true },
    { id: "g-2", name: "Fresh Dosa / Idli Batter", category: "South Indian", quantityLabel: "1 pack (1 kg)", isPurchased: true },
    { id: "g-3", name: "Fresh Paneer (Malai)", category: "Dairy", quantityLabel: "200g pack", isPurchased: false },
    { id: "g-4", name: "Plain Dahi / Curd", category: "Dairy", quantityLabel: "400g cup", isPurchased: false },
    { id: "g-5", name: "Roasted Bhuna Chana", category: "Hostel & Snacks", quantityLabel: "250g pack", isPurchased: false },
    { id: "g-6", name: "Ripe Bananas (Yelakki)", category: "Fruits & Produce", quantityLabel: "6 pieces", isPurchased: false },
    { id: "g-7", name: "Drumstick, Carrots & Tomatoes (for Sambar)", category: "Fruits & Produce", quantityLabel: "500g", isPurchased: false },
  ];

  const initialChat: AIMessage[] = [
    {
      id: "msg-welcome-1",
      role: "assistant",
      content:
        "Hey Priya! I'm **Nutrino**, your little nutrition buddy. I saw you logged **2 Plain Dosas, 1 Bowl of Sambar, and Masala Chai** this morning (551 kcal, 17.4g protein). Ask me anything—like how to hit your protein target today, budget-friendly dinner ideas, or what to cook with ingredients in your kitchen!",
      mascotState: "welcome",
      createdAt: new Date().toISOString(),
      providerBadge: "Nutrino Nutrition Engine",
    },
  ];

  return {
    users: [priyaAccount, aaravAccount],
    meals: seededMeals,
    savedMeals,
    mealPlans: [initialPlan],
    progressEntries,
    groceryByUserId: {
      [demoUserId]: defaultGrocery,
      [hostelUserId]: [
        { id: "gh-1", name: "Roasted Bhuna Chana Jar", category: "Hostel Room", quantityLabel: "500g", isPurchased: true },
        { id: "gh-2", name: "Boiled Eggs / Egg Tray", category: "Protein", quantityLabel: "6 eggs", isPurchased: false },
        { id: "gh-3", name: "Natural Peanut Butter", category: "Hostel Room", quantityLabel: "1 jar (350g)", isPurchased: false },
        { id: "gh-4", name: "Bananas & Apples", category: "Fruits", quantityLabel: "6 pieces", isPurchased: false },
      ],
    },
    chatByUserId: {
      [demoUserId]: initialChat,
      [hostelUserId]: [
        {
          id: "msg-hostel-1",
          role: "assistant",
          content:
            "Hey Aarav! **Hostel Mode** is active for your profile. Even when you don't control the mess menu, we can easily hit your **112g protein** goal using smart mess portions + room-friendly staples like boiled eggs, roasted chana, curd, and peanut butter!",
          mascotState: "encouraging",
          createdAt: new Date().toISOString(),
          providerBadge: "Nutrino Nutrition Engine",
        },
      ],
    },
  };
}

export function readDatabase(): NutrinoDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seeded = buildSeedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(seeded, null, 2), "utf-8");
      return seeded;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as NutrinoDatabase;
  } catch {
    return buildSeedDatabase();
  }
}

export function writeDatabase(db: NutrinoDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    // Ignore transient write lock errors
  }
}

export function sanitizeUser(record: DatabaseUserRecord): UserAccount {
  const { passwordHash: _unused, ...safeUser } = record;
  void _unused;
  return safeUser;
}

