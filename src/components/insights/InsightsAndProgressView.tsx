"use client";

import React, { useState } from "react";
import {
  LoggedMeal,
  MealType,
  NutrientSnapshot,
  ProgressEntry,
  UserAccount,
} from "@/types/nutrino";
import { sumNutrientSnapshots } from "@/lib/services/nutrition-engine";
import { NutrinoMascot } from "@/components/mascot/NutrinoMascot";
import {
  TrendingUp,
  Award,
  Droplets,
  Scale,
  Home,
  Info,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";

interface InsightsAndProgressViewProps {
  user: UserAccount;
  todayTotals: NutrientSnapshot;
  allUserMeals: LoggedMeal[];
  progressEntries: ProgressEntry[];
  streakDays: number;
  onLogProgress: (weightKg?: number, waterGlasses?: number) => Promise<void>;
  onQuickLogHostelAddition: (
    foodId: string,
    qty: number,
    unit: string,
    mealType: MealType
  ) => Promise<void>;
}

export function InsightsAndProgressView({
  user,
  todayTotals,
  allUserMeals,
  progressEntries,
  streakDays,
  onLogProgress,
  onQuickLogHostelAddition,
}: InsightsAndProgressViewProps) {
  const latestProgress = progressEntries[progressEntries.length - 1];
  const [weightInput, setWeightInput] = useState<string>(
    String(latestProgress?.weightKg || user.profile.weightKg || 62)
  );
  const [waterGlasses, setWaterGlasses] = useState<number>(
    latestProgress?.waterGlasses ?? 5
  );
  const [savedToast, setSavedToast] = useState("");

  // Aggregate daily totals by dateKey for 7-day trend
  const dailyMap = new Map<string, NutrientSnapshot>();
  for (const meal of allUserMeals) {
    const prev = dailyMap.get(meal.dateKey);
    dailyMap.set(
      meal.dateKey,
      prev
        ? sumNutrientSnapshots([prev, meal.totalNutrition])
        : meal.totalNutrition
    );
  }

  const sortedDates = Array.from(dailyMap.keys()).sort().slice(-7);
  const dailySeries = sortedDates.map((dKey) => {
    const snap = dailyMap.get(dKey)!;
    return {
      dateKey: dKey,
      shortLabel: dKey.slice(5),
      calories: snap.calories,
      protein: snap.protein,
      fiber: snap.fiber,
      ironMg: snap.ironMg,
    };
  });

  const avgCalories =
    dailySeries.length > 0
      ? Math.round(
          dailySeries.reduce((s, d) => s + d.calories, 0) / dailySeries.length
        )
      : todayTotals.calories;

  const avgProtein =
    dailySeries.length > 0
      ? Math.round(
          (dailySeries.reduce((s, d) => s + d.protein, 0) / dailySeries.length) *
            10
        ) / 10
      : todayTotals.protein;

  const avgFiber =
    dailySeries.length > 0
      ? Math.round(
          (dailySeries.reduce((s, d) => s + d.fiber, 0) / dailySeries.length) * 10
        ) / 10
      : todayTotals.fiber;

  const micronutrients = [
    {
      name: "Iron",
      current: todayTotals.ironMg,
      target: user.targets.ironMg,
      unit: "mg",
      tip: "Pair rajma, chana, or poha with fresh lemon juice (Vitamin C boosts plant iron absorption!).",
    },
    {
      name: "Calcium",
      current: todayTotals.calciumMg,
      target: user.targets.calciumMg,
      unit: "mg",
      tip: "Curd/dahi, paneer, toned milk, ragi, and sesame seeds are top Indian calcium sources.",
    },
    {
      name: "Dietary Fiber",
      current: todayTotals.fiber,
      target: user.targets.fiber,
      unit: "g",
      tip: "Whole pulses (sabut dal, chana, sprouts), whole wheat roti, and guava/apple keep fiber strong.",
    },
    {
      name: "Vitamin B12",
      current: todayTotals.vitaminB12Mcg,
      target: user.targets.vitaminB12Mcg,
      unit: "mcg",
      tip: "Found mainly in curd, milk, paneer, eggs, and fish/chicken.",
    },
    {
      name: "Vitamin C",
      current: todayTotals.vitaminCMg,
      target: user.targets.vitaminCMg,
      unit: "mg",
      tip: "Guava, amla, lemon, tomatoes in sambar, and sprouted moong provide natural Vitamin C.",
    },
    {
      name: "Folate (B9)",
      current: todayTotals.folateMcg,
      target: user.targets.folateMcg,
      unit: "mcg",
      tip: "Lentils (toor/moong dal), spinach, rajma, and chickpeas are rich in folate.",
    },
    {
      name: "Potassium",
      current: todayTotals.potassiumMg,
      target: user.targets.potassiumMg,
      unit: "mg",
      tip: "Coconut water, bananas, sambar vegetables, and pulses support healthy electrolyte balance.",
    },
    {
      name: "Magnesium",
      current: todayTotals.magnesiumMg,
      target: user.targets.magnesiumMg,
      unit: "mg",
      tip: "Almonds, roasted chana, whole wheat rotis, and green leafy vegetables.",
    },
    {
      name: "Zinc",
      current: todayTotals.zincMg,
      target: user.targets.zincMg,
      unit: "mg",
      tip: "Chickpeas, paneer, pumpkin seeds, whole grains, and eggs.",
    },
  ];

  const handleSaveMetrics = async () => {
    await onLogProgress(parseFloat(weightInput) || user.profile.weightKg, waterGlasses);
    setSavedToast("Updated your weight & hydration log for today!");
    setTimeout(() => setSavedToast(""), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Mascot Celebration & Weekly Report Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-nutrino-light/85 border border-nutrino-border p-5">
        <div className="flex items-center gap-4">
          <NutrinoMascot
            state={streakDays >= 3 ? "celebration" : "explaining"}
            size="sm"
          />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-nutrino-primary border border-nutrino-border mb-1">
              <Award className="h-3 w-3" /> {streakDays}-Day Logging Consistency
            </span>
            <h2 className="text-lg font-extrabold text-nutrino-deep">
              You&apos;ve been showing up consistently this week!
            </h2>
            <p className="text-xs sm:text-sm text-nutrino-text mt-0.5 max-w-2xl">
              Your {dailySeries.length}-day average is{" "}
              <strong>{avgCalories} kcal</strong>,{" "}
              <strong>{avgProtein}g protein</strong>, and{" "}
              <strong>{avgFiber}g fiber</strong>. Remember: healthy eating is about patterns over weeks, never perfection in a single meal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 bg-white p-3 rounded-2xl border border-nutrino-border text-center shrink-0">
          <div className="px-2">
            <div className="text-[10px] font-bold uppercase text-nutrino-muted">
              Avg Calories
            </div>
            <div className="text-sm font-extrabold text-nutrino-deep tabular-nums">
              {avgCalories}
            </div>
          </div>
          <div className="px-2 border-x border-nutrino-border">
            <div className="text-[10px] font-bold uppercase text-nutrino-muted">
              Avg Protein
            </div>
            <div className="text-sm font-extrabold text-nutrino-primary tabular-nums">
              {avgProtein}g
            </div>
          </div>
          <div className="px-2">
            <div className="text-[10px] font-bold uppercase text-nutrino-muted">
              Avg Fiber
            </div>
            <div className="text-sm font-extrabold text-nutrino-deep tabular-nums">
              {avgFiber}g
            </div>
          </div>
        </div>
      </div>

      {savedToast && (
        <div className="flex items-center gap-2 rounded-2xl bg-nutrino-primary text-white px-4 py-3 text-xs font-bold shadow-nutrino-sm">
          <CheckCircle2 className="h-4 w-4" />
          {savedToast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 7-Day Trend Chart & Micronutrient Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 7-Day Calorie & Protein Bar Chart */}
          <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-nutrino-deep flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-nutrino-primary" />
                  Weekly Calorie & Protein Consistency
                </h3>
                <p className="text-xs text-nutrino-muted">
                  Daily Target: {user.targets.calories} kcal • {user.targets.protein}g Protein
                </p>
              </div>
              <span className="rounded-full bg-nutrino-light px-3 py-1 text-xs font-bold text-nutrino-deep">
                Last {dailySeries.length} Logged Days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 px-1 border-b border-nutrino-border">
              {dailySeries.map((day) => {
                const calPct = Math.min(
                  100,
                  Math.round((day.calories / user.targets.calories) * 100)
                );
                const protPct = Math.min(
                  100,
                  Math.round((day.protein / user.targets.protein) * 100)
                );

                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-col items-center justify-end h-full gap-1.5"
                  >
                    <div className="text-[10px] font-bold text-nutrino-deep tabular-nums">
                      {day.calories}
                    </div>
                    <div className="w-full flex items-end justify-center gap-1 h-28">
                      <div
                        style={{ height: `${Math.max(12, calPct)}%` }}
                        className="w-3.5 rounded-t-lg bg-nutrino-primary transition-all"
                        title={`${day.dateKey}: ${day.calories} kcal`}
                      />
                      <div
                        style={{ height: `${Math.max(12, protPct)}%` }}
                        className="w-2.5 rounded-t-lg bg-nutrino-accent transition-all"
                        title={`${day.dateKey}: ${day.protein}g protein`}
                      />
                    </div>
                    <div className="text-[10px] font-semibold text-nutrino-muted pb-1">
                      {day.shortLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-nutrino-muted">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-nutrino-primary" /> Calories
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-nutrino-accent" /> Protein %
                </span>
              </div>
              <span>Calculated from verified meal snapshots</span>
            </div>
          </div>

          {/* Micronutrient & Fiber Insights */}
          <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-nutrino-deep">
                Today&apos;s Micronutrient & Fiber Profile
              </h3>
              <p className="text-xs text-nutrino-muted">
                Estimated from your logged foods today against ICMR-NIN daily guidelines
              </p>
            </div>

            <div className="space-y-3">
              {micronutrients.map((m) => {
                const pct = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div
                    key={m.name}
                    className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-nutrino-deep">{m.name}</span>
                      <span className="font-bold text-nutrino-primary tabular-nums">
                        {m.current} / {m.target} {m.unit} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white border border-nutrino-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-nutrino-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-nutrino-muted">{m.tip}</p>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Clinical Distinction Disclosure (Section 14 & 21) */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-nutrino-light/60 border border-nutrino-border p-3.5 text-xs text-nutrino-deep">
              <Info className="h-4 w-4 text-nutrino-primary shrink-0 mt-0.5" />
              <span>
                <strong>Dietary Estimate vs. Clinical Testing:</strong> These values reflect estimated nutrient intake from your logged meals and are educational—not a diagnosis of clinical vitamin or mineral deficiency. Always consult a healthcare provider for blood work or supplementation advice.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Hostel Mode Optimizer + Weight & Hydration Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Hostel & Mess Mode Optimizer (Section 16) */}
          <div className="rounded-3xl bg-white border-2 border-nutrino-primary/25 p-5 shadow-nutrino-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-nutrino-primary" />
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Hostel & Mess Diet Optimizer
                </h3>
              </div>
              <span className="rounded-full bg-nutrino-accent/60 px-2.5 py-0.5 text-[11px] font-bold text-nutrino-deep">
                No-Cook Additions
              </span>
            </div>

            <p className="text-xs text-nutrino-muted leading-relaxed">
              Eating in a college mess, PG, or office canteen? Mess meals often provide plenty of rice/roti carbs but lighter protein. Keep these affordable, zero-cook staples on hand and log them in one tap:
            </p>

            <div className="space-y-2.5">
              {[
                {
                  foodId: "roasted-chana",
                  title: "1 Handful Roasted Bhuna Chana (45g)",
                  sub: "+10.1g Protein • +4.3mg Iron • +7.6g Fiber • Shelf-stable in hostel room",
                  qty: 1,
                  unit: "katori",
                  mealType: "snacks" as MealType,
                },
                {
                  foodId: "curd-dahi",
                  title: "1 Katori Plain Curd / Dahi (120g)",
                  sub: "+4.2g Protein • +170mg Calcium • Probiotics with mess lunch",
                  qty: 1,
                  unit: "katori",
                  mealType: "lunch" as MealType,
                },
                {
                  foodId: "sprouts-salad",
                  title: "1 Bowl Moong & Chana Sprouts (120g)",
                  sub: "+8.6g Protein • +20mg Vitamin C • Easy overnight soak",
                  qty: 1,
                  unit: "bowl",
                  mealType: "breakfast" as MealType,
                },
                {
                  foodId: "boiled-egg",
                  title: "2 Boiled Eggs (Kettle / Mess Add-on)",
                  sub: "+12.6g Complete Protein • +1.1mcg Vit B12",
                  qty: 2,
                  unit: "piece",
                  mealType: "breakfast" as MealType,
                },
                {
                  foodId: "peanut-butter",
                  title: "1 Tbsp Natural Peanut Butter + 1 Banana",
                  sub: "+5.1g Protein • Healthy fats & potassium pre-workout",
                  qty: 1,
                  unit: "tbsp",
                  mealType: "snacks" as MealType,
                },
              ].map((addon) => (
                <div
                  key={addon.foodId}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-nutrino-bg border border-nutrino-border p-3"
                >
                  <div>
                    <div className="font-bold text-xs text-nutrino-deep">
                      {addon.title}
                    </div>
                    <div className="text-[11px] text-nutrino-muted">
                      {addon.sub}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await onQuickLogHostelAddition(
                        addon.foodId,
                        addon.qty,
                        addon.unit,
                        addon.mealType
                      );
                      setSavedToast(`Added ${addon.title} to your ${addon.mealType} log!`);
                      setTimeout(() => setSavedToast(""), 3500);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-nutrino-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-nutrino-deep shrink-0"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Log
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Weight & Hydration Tracker */}
          <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
            <h3 className="font-extrabold text-base text-nutrino-deep">
              Habit, Hydration & Optional Weight Check-In
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-nutrino-deep mb-2">
                  <Droplets className="h-4 w-4 text-nutrino-primary" />
                  Water Intake (Glasses)
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                    className="rounded-lg bg-white border border-nutrino-border px-2.5 py-1 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-lg font-extrabold text-nutrino-primary tabular-nums">
                    {waterGlasses} / 8
                  </span>
                  <button
                    type="button"
                    onClick={() => setWaterGlasses(waterGlasses + 1)}
                    className="rounded-lg bg-white border border-nutrino-border px-2.5 py-1 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-nutrino-deep mb-2">
                  <Scale className="h-4 w-4 text-nutrino-primary" />
                  Body Weight (kg)
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full rounded-xl border border-nutrino-border bg-white px-3 py-1.5 text-sm font-extrabold text-nutrino-deep text-center tabular-nums"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveMetrics}
              className="w-full rounded-2xl bg-nutrino-deep py-2.5 text-xs font-bold text-white hover:bg-nutrino-primary transition-colors"
            >
              Save Today&apos;s Check-In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

