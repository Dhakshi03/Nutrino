"use client";

import React, { useState } from "react";
import {
  GroceryItem,
  MealPlan,
  MealType,
  NutrientSnapshot,
  PlannedMealSlot,
  UserAccount,
} from "@/types/nutrino";
import { NutrinoMascot } from "@/components/mascot/NutrinoMascot";
import {
  Calendar,
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";

interface MealPlannerViewProps {
  user: UserAccount;
  activePlan: MealPlan;
  todayTotals: NutrientSnapshot;
  groceryList: GroceryItem[];
  onGeneratePlan: (
    planType: "daily" | "weekly",
    availableIngredients: string[]
  ) => Promise<void>;
  onReplaceSlot: (slotId: string) => Promise<void>;
  onLogPlannedSlot: (slot: PlannedMealSlot) => Promise<void>;
  onAddGrocery: (name: string, category: string, quantityLabel: string) => Promise<void>;
  onToggleGrocery: (itemId: string) => Promise<void>;
  onDeleteGrocery: (itemId: string) => Promise<void>;
}

export function MealPlannerView({
  user,
  activePlan,
  todayTotals,
  groceryList,
  onGeneratePlan,
  onReplaceSlot,
  onLogPlannedSlot,
  onAddGrocery,
  onToggleGrocery,
  onDeleteGrocery,
}: MealPlannerViewProps) {
  const [planType, setPlanType] = useState<"daily" | "weekly">(activePlan.planType || "daily");
  const [ingredientsInput, setIngredientsInput] = useState(
    (activePlan.availableIngredients || []).join(", ")
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("Today");
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [loggedSlotId, setLoggedSlotId] = useState<string | null>(null);

  // Grocery form state
  const [newGroceryName, setNewGroceryName] = useState("");
  const [newGroceryQty, setNewGroceryQty] = useState("1 pack");
  const [newGroceryCat, setNewGroceryCat] = useState("Staples & Pulses");

  const uniqueDays = Array.from(new Set(activePlan.meals.map((m) => m.dayLabel)));
  const currentDay = uniqueDays.includes(selectedDay)
    ? selectedDay
    : uniqueDays[0] || "Today";

  const dayMeals = activePlan.meals.filter((m) => m.dayLabel === currentDay);
  const dayPlannedCalories = dayMeals.reduce((acc, m) => acc + m.nutrition.calories, 0);
  const dayPlannedProtein =
    Math.round(dayMeals.reduce((acc, m) => acc + m.nutrition.protein, 0) * 10) / 10;

  const handleRegenerate = async (type: "daily" | "weekly") => {
    setPlanType(type);
    setIsGenerating(true);
    try {
      const ingList = ingredientsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await onGeneratePlan(type, ingList);
      setSelectedDay(type === "weekly" ? "Monday" : "Today");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;
    await onAddGrocery(newGroceryName.trim(), newGroceryCat, newGroceryQty);
    setNewGroceryName("");
  };

  const remainingCalToday = Math.max(0, user.targets.calories - todayTotals.calories);

  return (
    <div className="space-y-6">
      {/* Mascot Planner Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-nutrino-light/85 border border-nutrino-border p-5">
        <div className="flex items-center gap-4">
          <NutrinoMascot
            state={isGenerating ? "thinking" : "planning"}
            size="sm"
          />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-nutrino-primary border border-nutrino-border mb-1">
              <Calendar className="h-3 w-3" /> Flexible & Adaptive Meal Planner
            </span>
            <h2 className="text-lg font-extrabold text-nutrino-deep">
              {isGenerating
                ? "Nutrino is crafting your personalized meal plan..."
                : "Your plan is ready! Flexible around your real life."}
            </h2>
            <p className="text-xs sm:text-sm text-nutrino-text mt-0.5 max-w-2xl">
              {todayTotals.calories > 0
                ? `Adaptive Mode: You've logged ${todayTotals.calories} kcal today, leaving ~${remainingCalToday} kcal toward your ${user.targets.calories} kcal target. Planned meals are never marked eaten automatically—tap "Log Meal" only when you eat them!`
                : `Tailored for your ${user.profile.dietaryPreference.replace(/_/g, " ")} preference (${user.targets.calories} kcal & ${user.targets.protein}g protein target). Swap any single meal anytime!`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => handleRegenerate("daily")}
            disabled={isGenerating}
            className={`rounded-2xl px-4 py-2.5 text-xs font-bold border transition-all ${
              planType === "daily"
                ? "bg-nutrino-primary text-white border-nutrino-primary shadow-nutrino-sm"
                : "bg-white text-nutrino-deep border-nutrino-border"
            }`}
          >
            Daily Plan
          </button>
          <button
            onClick={() => handleRegenerate("weekly")}
            disabled={isGenerating}
            className={`rounded-2xl px-4 py-2.5 text-xs font-bold border transition-all ${
              planType === "weekly"
                ? "bg-nutrino-primary text-white border-nutrino-primary shadow-nutrino-sm"
                : "bg-white text-nutrino-deep border-nutrino-border"
            }`}
          >
            7-Day Weekly Plan
          </button>
        </div>
      </div>

      {/* Ingredient-Based Filter Bar */}
      <div className="rounded-3xl bg-white border border-nutrino-border p-4 shadow-nutrino-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-nutrino-deep mb-1">
            Have ingredients in your kitchen or hostel room? (Optional)
          </label>
          <input
            type="text"
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
            placeholder="e.g., Paneer, Poha, Eggs, Moong Dal, Curd, Oats..."
            className="w-full rounded-xl border border-nutrino-border bg-nutrino-bg px-3.5 py-2 text-xs sm:text-sm focus:border-nutrino-primary focus:bg-white focus:outline-none"
          />
        </div>
        <button
          onClick={() => handleRegenerate(planType)}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-nutrino-deep px-5 py-3 text-xs font-bold text-white hover:bg-nutrino-primary transition-colors sm:mt-5"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Adapt Plan with Ingredients"}
        </button>
      </div>

      {/* Day Selector Tabs (for Weekly Plan) */}
      {uniqueDays.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {uniqueDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap border transition-all ${
                currentDay === day
                  ? "bg-nutrino-primary text-white border-nutrino-primary"
                  : "bg-white text-nutrino-muted border-nutrino-border hover:text-nutrino-deep"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Planned Meal Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-nutrino-deep">
              {currentDay}&apos;s Planned Meals
            </h3>
            <span className="text-xs font-bold text-nutrino-primary">
              Plan Total: {dayPlannedCalories} kcal • {dayPlannedProtein}g Protein
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dayMeals.map((slot) => {
              const isExpanded = expandedRecipeId === slot.id;
              const isJustLogged = loggedSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  className="flex flex-col justify-between rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm hover:border-nutrino-sage transition-all space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-nutrino-light px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-nutrino-primary">
                        {slot.mealType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-nutrino-muted">
                        <Clock className="h-3.5 w-3.5" /> {slot.prepTimeMins} mins
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-nutrino-deep">
                      {slot.title}
                    </h4>
                    <p className="text-xs text-nutrino-muted leading-relaxed">
                      {slot.servingDescription}
                    </p>

                    {/* Calculated Nutrition Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="rounded-xl bg-nutrino-bg border border-nutrino-border px-2.5 py-1 text-xs font-extrabold text-nutrino-deep">
                        {slot.nutrition.calories} kcal
                      </span>
                      <span className="rounded-xl bg-nutrino-light/70 border border-nutrino-border px-2.5 py-1 text-xs font-extrabold text-nutrino-primary">
                        {slot.nutrition.protein}g Protein
                      </span>
                      <span className="rounded-xl bg-nutrino-bg border border-nutrino-border px-2.5 py-1 text-xs font-semibold text-nutrino-muted">
                        C: {slot.nutrition.carbs}g • F: {slot.nutrition.fat}g
                      </span>
                    </div>

                    {/* Ingredients & Recipe Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRecipeId(isExpanded ? null : slot.id)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-nutrino-primary hover:underline pt-1"
                    >
                      <ChefHat className="h-3.5 w-3.5" />
                      {isExpanded ? "Hide Recipe & Ingredients" : "View Recipe & Ingredients"}
                    </button>

                    {isExpanded && (
                      <div className="rounded-2xl bg-nutrino-bg p-3.5 border border-nutrino-border space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-nutrino-deep">Ingredients: </span>
                          <span className="text-nutrino-muted">
                            {slot.ingredients.join(", ")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-nutrino-deep">Preparation:</span>
                          <ol className="list-decimal list-inside space-y-1 text-nutrino-muted">
                            {slot.instructions.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Replace Single Meal OR Log as Eaten */}
                  <div className="flex items-center gap-2 pt-2 border-t border-nutrino-border">
                    <button
                      type="button"
                      onClick={() => onReplaceSlot(slot.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-nutrino-bg hover:bg-nutrino-light border border-nutrino-border px-3 py-2 text-xs font-bold text-nutrino-deep transition-colors"
                      title="Swap only this meal without regenerating the rest of your plan"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Swap Meal
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        await onLogPlannedSlot(slot);
                        setLoggedSlotId(slot.id);
                        setTimeout(() => setLoggedSlotId(null), 3000);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-nutrino-primary hover:bg-nutrino-deep px-3 py-2 text-xs font-bold text-white transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isJustLogged ? "Logged to Today!" : "Log as Eaten"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grocery List & Smart Kitchen Panel (4 cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-nutrino-primary" />
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Smart Grocery List
                </h3>
              </div>
              <span className="rounded-full bg-nutrino-light px-2.5 py-0.5 text-xs font-bold text-nutrino-primary">
                {groceryList.filter((g) => !g.isPurchased).length} to buy
              </span>
            </div>

            <form onSubmit={handleQuickAddGrocery} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroceryName}
                  onChange={(e) => setNewGroceryName(e.target.value)}
                  placeholder="Add item (e.g., Soya Chunks, Curd)"
                  className="flex-1 rounded-xl border border-nutrino-border bg-nutrino-bg px-3 py-2 text-xs focus:border-nutrino-primary focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={newGroceryQty}
                  onChange={(e) => setNewGroceryQty(e.target.value)}
                  placeholder="Qty"
                  className="w-20 rounded-xl border border-nutrino-border bg-nutrino-bg px-2.5 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newGroceryCat}
                  onChange={(e) => setNewGroceryCat(e.target.value)}
                  className="flex-1 rounded-xl border border-nutrino-border bg-white px-2.5 py-1.5 text-xs text-nutrino-muted"
                >
                  <option value="Staples & Pulses">Staples & Pulses</option>
                  <option value="Dairy & Eggs">Dairy & Eggs</option>
                  <option value="Fruits & Produce">Fruits & Produce</option>
                  <option value="Hostel & Snacks">Hostel & Snacks</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-nutrino-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-nutrino-deep"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {groceryList.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-2xl border p-3 transition-colors ${
                    item.isPurchased
                      ? "bg-nutrino-bg/50 border-nutrino-border opacity-65"
                      : "bg-white border-nutrino-border"
                  }`}
                >
                  <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={item.isPurchased}
                      onChange={() => onToggleGrocery(item.id)}
                      className="h-4 w-4 rounded accent-nutrino-primary"
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${
                          item.isPurchased
                            ? "line-through text-nutrino-muted"
                            : "text-nutrino-deep"
                        }`}
                      >
                        {item.name}
                      </div>
                      <div className="text-[10px] text-nutrino-muted">
                        {item.category} • {item.quantityLabel}
                      </div>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => onDeleteGrocery(item.id)}
                    className="text-nutrino-muted hover:text-nutrino-error p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

