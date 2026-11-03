import { NextRequest, NextResponse } from "next/server";
import {
  DatabaseUserRecord,
  readDatabase,
  sanitizeUser,
  writeDatabase,
} from "@/lib/db/store";
import {
  buildCalculatedMealItem,
  calculateNutritionTargets,
  getFoodById,
  sumNutrientSnapshots,
} from "@/lib/services/nutrition-engine";
import {
  generatePersonalizedMealPlan,
} from "@/lib/services/ai-nutritionist";
import { generateContextualGreeting } from "@/lib/services/greeting-engine";
import { FOOD_DATABASE } from "@/lib/data/indian-food-db";
import {
  LoggedMeal,
  LoggedMealItem,
  MealType,
  SavedMeal,
  UserGoals,
  UserProfile,
} from "@/types/nutrino";

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const db = readDatabase();
  const requestedUserId = req.nextUrl.searchParams.get("userId") || "user-demo-priya";
  const dateKey = req.nextUrl.searchParams.get("date") || getTodayDateKey();

  const userRecord =
    db.users.find((u) => u.id === requestedUserId) || db.users[0];

  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const safeUser = sanitizeUser(userRecord);
  const userMeals = db.meals.filter((m) => m.userId === safeUser.id);
  const todayMeals = userMeals.filter((m) => m.dateKey === dateKey);
  const todayTotals = sumNutrientSnapshots(todayMeals.map((m) => m.totalNutrition));

  // Compute logging streak
  const uniqueDates = Array.from(new Set(userMeals.map((m) => m.dateKey))).sort();
  const streakDays = Math.max(1, uniqueDates.length);

  const greeting = generateContextualGreeting({
    user: safeUser,
    todayMeals,
    todayTotals,
    streakDays,
  });

  const userSavedMeals = db.savedMeals.filter((s) => s.userId === safeUser.id);
  const userPlans = db.mealPlans.filter((p) => p.userId === safeUser.id);
  const activePlan =
    userPlans[userPlans.length - 1] ||
    generatePersonalizedMealPlan({ user: safeUser, planType: "daily" });

  const userProgress = db.progressEntries
    .filter((p) => p.userId === safeUser.id)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const groceryList = db.groceryByUserId[safeUser.id] || [];
  const chatMessages = db.chatByUserId[safeUser.id] || [];

  return NextResponse.json({
    user: safeUser,
    availableDemoUsers: db.users
      .filter((u) => u.isDemo)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, hostelMode: u.profile.hostelMode })),
    dateKey,
    todayMeals,
    allUserMeals: userMeals,
    todayTotals,
    streakDays,
    greeting,
    savedMeals: userSavedMeals,
    activePlan,
    progressEntries: userProgress,
    groceryList,
    chatMessages,
    foodCatalog: FOOD_DATABASE,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId = "user-demo-priya" } = body;
    const db = readDatabase();

    // --------------------------------------------------------
    // 1. AUTHENTICATION: REGISTER, LOGIN, PASSWORD RESET
    // --------------------------------------------------------
    if (action === "register") {
      const { email, password, name } = body;
      if (!email || !name) {
        return NextResponse.json(
          { error: "Name and email are required." },
          { status: 400 }
        );
      }
      const existing = db.users.find(
        (u) => u.email.toLowerCase() === String(email).toLowerCase()
      );
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 400 }
        );
      }

      const newUserId = `user-${Date.now()}`;
      const defaultProfile: UserProfile = {
        userId: newUserId,
        age: 24,
        gender: "prefer-not-to-say",
        heightCm: 168,
        weightKg: 65,
        activityLevel: "moderately_active",
        exerciseFrequencyDays: 3,
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
      const defaultGoals: UserGoals = {
        userId: newUserId,
        primaryGoal: "general_health",
        secondaryGoals: ["improved_habits"],
      };
      const targets = calculateNutritionTargets(defaultProfile, defaultGoals);

      const newUser: DatabaseUserRecord = {
        id: newUserId,
        email: String(email).trim(),
        passwordHash: String(password || "nutrino123"),
        name: String(name).trim(),
        isDemo: false,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        profile: defaultProfile,
        goals: defaultGoals,
        targets,
      };

      db.users.push(newUser);
      db.chatByUserId[newUserId] = [
        {
          id: `msg-init-${Date.now()}`,
          role: "assistant",
          content: `Welcome to Nutrino, **${newUser.name}**! I'm your personal nutrition buddy. Tell me what you ate or ask me any food question anytime!`,
          mascotState: "welcome",
          createdAt: new Date().toISOString(),
          providerBadge: "Nutrino Nutrition Engine",
        },
      ];
      db.groceryByUserId[newUserId] = [];
      writeDatabase(db);

      return NextResponse.json({ user: sanitizeUser(newUser) });
    }

    if (action === "login") {
      const { email, password } = body;
      const found = db.users.find(
        (u) => u.email.toLowerCase() === String(email || "").toLowerCase()
      );
      if (!found || (password && found.passwordHash !== password && !found.isDemo)) {
        return NextResponse.json(
          { error: "Invalid email or password. Try Demo Mode or register a new account!" },
          { status: 401 }
        );
      }
      return NextResponse.json({ user: sanitizeUser(found) });
    }

    if (action === "reset_password") {
      const { email, newPassword } = body;
      const found = db.users.find(
        (u) => u.email.toLowerCase() === String(email || "").toLowerCase()
      );
      if (!found) {
        return NextResponse.json(
          { error: "No account found with that email address." },
          { status: 404 }
        );
      }
      found.passwordHash = String(newPassword || "nutrino123");
      writeDatabase(db);
      return NextResponse.json({ message: "Password updated! You can now sign in." });
    }

    const userIndex = db.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: "Unauthorized user session" }, { status: 401 });
    }
    const userRecord = db.users[userIndex];

    // --------------------------------------------------------
    // 2. ONBOARDING & PROFILE / GOAL / TARGET CALCULATION
    // --------------------------------------------------------
    if (action === "complete_onboarding" || action === "update_profile") {
      const updatedProfile: UserProfile = {
        ...userRecord.profile,
        ...(body.profile || {}),
        userId: userRecord.id,
      };
      const updatedGoals: UserGoals = {
        ...userRecord.goals,
        ...(body.goals || {}),
        userId: userRecord.id,
      };
      const updatedTargets = calculateNutritionTargets(updatedProfile, updatedGoals);

      userRecord.profile = updatedProfile;
      userRecord.goals = updatedGoals;
      userRecord.targets = updatedTargets;
      if (body.name) userRecord.name = String(body.name).trim();
      userRecord.onboardingCompleted = true;

      // Also regenerate active meal plan to match updated profile
      const freshPlan = generatePersonalizedMealPlan({
        user: sanitizeUser(userRecord),
        planType: "daily",
      });
      db.mealPlans = db.mealPlans.filter((p) => p.userId !== userRecord.id);
      db.mealPlans.push(freshPlan);

      writeDatabase(db);
      return NextResponse.json({
        user: sanitizeUser(userRecord),
        activePlan: freshPlan,
      });
    }

    // --------------------------------------------------------
    // 3. LOG A MEAL (With Server-Side Nutrition Calculation)
    // --------------------------------------------------------
    if (action === "log_meal") {
      const {
        mealType = "breakfast",
        dateKey = getTodayDateKey(),
        loggingMethod = "manual",
        rawInput,
        confidenceScore = 1.0,
        items = [],
      } = body;

      const calculatedItems: LoggedMealItem[] = [];
      for (const rawItem of items) {
        const food = getFoodById(rawItem.foodId);
        if (!food) continue;
        calculatedItems.push(
          buildCalculatedMealItem(
            food,
            Number(rawItem.quantity) || 1,
            rawItem.unitName
          )
        );
      }

      if (calculatedItems.length === 0) {
        return NextResponse.json(
          { error: "Please select at least one food item to log." },
          { status: 400 }
        );
      }

      const newMeal: LoggedMeal = {
        id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: userRecord.id,
        mealType: mealType as MealType,
        dateKey,
        loggedAt: new Date().toISOString(),
        loggingMethod,
        rawInput,
        confidenceScore,
        items: calculatedItems,
        totalNutrition: sumNutrientSnapshots(calculatedItems.map((i) => i.nutrition)),
      };

      db.meals.push(newMeal);
      writeDatabase(db);
      return NextResponse.json({ meal: newMeal });
    }

    // --------------------------------------------------------
    // 4. EDIT / DELETE / DUPLICATE A LOGGED MEAL
    // --------------------------------------------------------
    if (action === "update_meal") {
      const { mealId, mealType, items } = body;
      const mealIdx = db.meals.findIndex(
        (m) => m.id === mealId && m.userId === userRecord.id
      );
      if (mealIdx === -1) {
        return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      }

      const recalcItems: LoggedMealItem[] = [];
      for (const item of items || []) {
        const food = getFoodById(item.foodId);
        if (!food) continue;
        recalcItems.push(
          buildCalculatedMealItem(food, Number(item.quantity) || 1, item.unitName, item.id)
        );
      }

      if (recalcItems.length === 0) {
        // If all items removed, delete the meal
        db.meals.splice(mealIdx, 1);
      } else {
        db.meals[mealIdx] = {
          ...db.meals[mealIdx],
          mealType: (mealType || db.meals[mealIdx].mealType) as MealType,
          items: recalcItems,
          totalNutrition: sumNutrientSnapshots(recalcItems.map((i) => i.nutrition)),
        };
      }

      writeDatabase(db);
      return NextResponse.json({ success: true });
    }

    if (action === "delete_meal") {
      const { mealId } = body;
      db.meals = db.meals.filter(
        (m) => !(m.id === mealId && m.userId === userRecord.id)
      );
      writeDatabase(db);
      return NextResponse.json({ success: true });
    }

    if (action === "duplicate_meal") {
      const { mealId, targetMealType } = body;
      const source = db.meals.find(
        (m) => m.id === mealId && m.userId === userRecord.id
      );
      if (!source) {
        return NextResponse.json({ error: "Source meal not found" }, { status: 404 });
      }
      const copy: LoggedMeal = {
        ...source,
        id: `meal-${Date.now()}`,
        mealType: (targetMealType || source.mealType) as MealType,
        loggedAt: new Date().toISOString(),
        dateKey: getTodayDateKey(),
      };
      db.meals.push(copy);
      writeDatabase(db);
      return NextResponse.json({ meal: copy });
    }

    // --------------------------------------------------------
    // 5. SAVED MEALS (Create & 1-Tap Log)
    // --------------------------------------------------------
    if (action === "save_meal_template") {
      const { name, defaultMealType = "breakfast", items = [] } = body;
      const calcItems = items
        .map((i: { foodId: string; quantity: number; unitName?: string }) => {
          const f = getFoodById(i.foodId);
          return f ? buildCalculatedMealItem(f, Number(i.quantity) || 1, i.unitName) : null;
        })
        .filter((x: LoggedMealItem | null): x is LoggedMealItem => x !== null);

      if (!name || calcItems.length === 0) {
        return NextResponse.json(
          { error: "Provide a name and at least one food item." },
          { status: 400 }
        );
      }

      const saved: SavedMeal = {
        id: `saved-${Date.now()}`,
        userId: userRecord.id,
        name: String(name).trim(),
        defaultMealType,
        items: calcItems.map((c: LoggedMealItem) => ({
          foodId: c.foodId,
          foodName: c.foodName,
          quantity: c.quantity,
          unitName: c.unitName,
          grams: c.grams,
        })),
        totalNutrition: sumNutrientSnapshots(calcItems.map((c: LoggedMealItem) => c.nutrition)),
        timesLogged: 0,
      };

      db.savedMeals.push(saved);
      writeDatabase(db);
      return NextResponse.json({ savedMeal: saved });
    }

    if (action === "log_saved_meal") {
      const { savedMealId, mealType } = body;
      const template = db.savedMeals.find(
        (s) => s.id === savedMealId && s.userId === userRecord.id
      );
      if (!template) {
        return NextResponse.json({ error: "Saved meal not found" }, { status: 404 });
      }

      template.timesLogged += 1;
      const calcItems = template.items
        .map((i) => {
          const f = getFoodById(i.foodId);
          return f ? buildCalculatedMealItem(f, i.quantity, i.unitName) : null;
        })
        .filter((x): x is LoggedMealItem => x !== null);

      const newMeal: LoggedMeal = {
        id: `meal-${Date.now()}`,
        userId: userRecord.id,
        mealType: (mealType || template.defaultMealType) as MealType,
        dateKey: getTodayDateKey(),
        loggedAt: new Date().toISOString(),
        loggingMethod: "saved_meal",
        rawInput: `Saved Meal: ${template.name}`,
        confidenceScore: 1.0,
        items: calcItems,
        totalNutrition: sumNutrientSnapshots(calcItems.map((c) => c.nutrition)),
      };

      db.meals.push(newMeal);
      writeDatabase(db);
      return NextResponse.json({ meal: newMeal });
    }

    // --------------------------------------------------------
    // 6. MEAL PLANNER (Generate Daily/Weekly, Replace Slot)
    // --------------------------------------------------------
    if (action === "generate_plan") {
      const { planType = "daily", availableIngredients = [] } = body;
      const plan = generatePersonalizedMealPlan({
        user: sanitizeUser(userRecord),
        planType,
        availableIngredients,
      });
      db.mealPlans = db.mealPlans.filter((p) => p.userId !== userRecord.id);
      db.mealPlans.push(plan);
      writeDatabase(db);
      return NextResponse.json({ activePlan: plan });
    }

    if (action === "replace_planned_slot") {
      const { slotId } = body;
      const userPlanIdx = db.mealPlans.findIndex((p) => p.userId === userRecord.id);
      if (userPlanIdx === -1) {
        return NextResponse.json({ error: "No active plan" }, { status: 404 });
      }
      const plan = db.mealPlans[userPlanIdx];
      const slotIdx = plan.meals.findIndex((s) => s.id === slotId);
      if (slotIdx !== -1) {
        const currentSlot = plan.meals[slotIdx];
        const freshPlan = generatePersonalizedMealPlan({
          user: sanitizeUser(userRecord),
          planType: "weekly",
        });
        const candidates = freshPlan.meals.filter(
          (m) => m.mealType === currentSlot.mealType && m.title !== currentSlot.title
        );
        if (candidates.length > 0) {
          plan.meals[slotIdx] = {
            ...candidates[0],
            id: `slot-replaced-${Date.now()}`,
            dayLabel: currentSlot.dayLabel,
          };
        }
      }
      writeDatabase(db);
      return NextResponse.json({ activePlan: plan });
    }

    // --------------------------------------------------------
    // 7. PROGRESS & WATER LOGGING
    // --------------------------------------------------------
    if (action === "log_progress") {
      const { weightKg, waterGlasses, notes } = body;
      const today = getTodayDateKey();
      const existingIdx = db.progressEntries.findIndex(
        (p) => p.userId === userRecord.id && p.dateKey === today
      );

      if (existingIdx !== -1) {
        db.progressEntries[existingIdx] = {
          ...db.progressEntries[existingIdx],
          weightKg: weightKg !== undefined ? Number(weightKg) : db.progressEntries[existingIdx].weightKg,
          waterGlasses:
            waterGlasses !== undefined
              ? Number(waterGlasses)
              : db.progressEntries[existingIdx].waterGlasses,
          notes: notes !== undefined ? notes : db.progressEntries[existingIdx].notes,
        };
      } else {
        db.progressEntries.push({
          id: `prog-${Date.now()}`,
          userId: userRecord.id,
          dateKey: today,
          weightKg: weightKg ? Number(weightKg) : userRecord.profile.weightKg,
          waterGlasses: waterGlasses !== undefined ? Number(waterGlasses) : 1,
          energyRating: 5,
          notes,
        });
      }

      if (weightKg && Number(weightKg) > 25) {
        userRecord.profile.weightKg = Number(weightKg);
      }

      writeDatabase(db);
      return NextResponse.json({ success: true });
    }

    // --------------------------------------------------------
    // 8. GROCERY LIST MANAGEMENT
    // --------------------------------------------------------
    if (action === "add_grocery_item") {
      const { name, category = "Staples", quantityLabel = "1 pack" } = body;
      if (!db.groceryByUserId[userRecord.id]) {
        db.groceryByUserId[userRecord.id] = [];
      }
      db.groceryByUserId[userRecord.id].unshift({
        id: `g-${Date.now()}`,
        name: String(name).trim(),
        category,
        quantityLabel,
        isPurchased: false,
      });
      writeDatabase(db);
      return NextResponse.json({ groceryList: db.groceryByUserId[userRecord.id] });
    }

    if (action === "toggle_grocery_item") {
      const { itemId } = body;
      const list = db.groceryByUserId[userRecord.id] || [];
      const item = list.find((i) => i.id === itemId);
      if (item) item.isPurchased = !item.isPurchased;
      writeDatabase(db);
      return NextResponse.json({ groceryList: list });
    }

    if (action === "delete_grocery_item") {
      const { itemId } = body;
      db.groceryByUserId[userRecord.id] = (db.groceryByUserId[userRecord.id] || []).filter(
        (i) => i.id !== itemId
      );
      writeDatabase(db);
      return NextResponse.json({ groceryList: db.groceryByUserId[userRecord.id] });
    }

    // --------------------------------------------------------
    // 9. SECURITY: ACCOUNT DELETE
    // --------------------------------------------------------
    if (action === "delete_account") {
      if (userRecord.isDemo) {
        return NextResponse.json(
          { error: "Demo accounts cannot be permanently deleted, only custom accounts." },
          { status: 400 }
        );
      }
      db.users = db.users.filter((u) => u.id !== userRecord.id);
      db.meals = db.meals.filter((m) => m.userId !== userRecord.id);
      db.savedMeals = db.savedMeals.filter((s) => s.userId !== userRecord.id);
      db.mealPlans = db.mealPlans.filter((p) => p.userId !== userRecord.id);
      db.progressEntries = db.progressEntries.filter((p) => p.userId !== userRecord.id);
      delete db.groceryByUserId[userRecord.id];
      delete db.chatByUserId[userRecord.id];
      writeDatabase(db);
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

