"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AIActionCard,
  AIMessage,
  ContextualGreeting,
  FoodItem,
  GroceryItem,
  LoggedMeal,
  MascotState,
  MealPlan,
  MealType,
  NutrientSnapshot,
  PlannedMealSlot,
  ProgressEntry,
  SavedMeal,
  UserAccount,
  UserGoals,
  UserProfile,
} from "@/types/nutrino";
import {
  MASCOT_STATE_META,
  NutrinoMascot,
} from "@/components/mascot/NutrinoMascot";
import { OnboardingAndAuthModal } from "@/components/onboarding/OnboardingAndAuthModal";
import { TrackFoodView } from "@/components/track/TrackFoodView";
import { MealPlannerView } from "@/components/planner/MealPlannerView";
import { InsightsAndProgressView } from "@/components/insights/InsightsAndProgressView";
import { AINutritionistModal } from "@/components/ai/AINutritionistModal";
import {
  Home,
  Utensils,
  Calendar,
  BarChart3,
  User,
  Sparkles,
  Plus,
  Camera,
  Repeat,
  Trash2,
  Copy,
  Edit3,
  Download,
  UserCheck,
  Shield,
  Flame,
  Check,
} from "lucide-react";

const ALL_MASCOT_STATES: MascotState[] = [
  "welcome",
  "happy",
  "thinking",
  "explaining",
  "planning",
  "eating",
  "encouraging",
  "concerned",
  "sleeping",
  "celebration",
  "error",
];

export default function NutrinoApp() {
  const [activeTab, setActiveTab] = useState<
    "home" | "track" | "planner" | "insights" | "profile"
  >("home");
  const [currentUserId, setCurrentUserId] = useState<string>("user-demo-priya");
  const [loading, setLoading] = useState<boolean>(true);

  // Server-hydrated application state
  const [user, setUser] = useState<UserAccount | null>(null);
  const [availableDemoUsers, setAvailableDemoUsers] = useState<
    { id: string; name: string; email: string; hostelMode: boolean }[]
  >([]);
  const [todayMeals, setTodayMeals] = useState<LoggedMeal[]>([]);
  const [allUserMeals, setAllUserMeals] = useState<LoggedMeal[]>([]);
  const [todayTotals, setTodayTotals] = useState<NutrientSnapshot | null>(null);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [greeting, setGreeting] = useState<ContextualGreeting | null>(null);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([]);
  const [foodCatalog, setFoodCatalog] = useState<FoodItem[]>([]);

  // UI Modals & Interactive States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState("");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingModalMode, setOnboardingModalMode] = useState<"auth" | "onboarding">("onboarding");
  const [trackDefaultMealType, setTrackDefaultMealType] = useState<MealType>("breakfast");
  const [trackInitialPrompt, setTrackInitialPrompt] = useState<string>("");
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [previewMascotState, setPreviewMascotState] = useState<MascotState | null>(null);
  const [showMascotShowcaseOnHome, setShowMascotShowcaseOnHome] = useState<boolean>(false);

  const fetchAppState = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/state?userId=${encodeURIComponent(uid)}`);
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setAvailableDemoUsers(data.availableDemoUsers || []);
        setTodayMeals(data.todayMeals || []);
        setAllUserMeals(data.allUserMeals || []);
        setTodayTotals(data.todayTotals);
        setStreakDays(data.streakDays || 1);
        setGreeting(data.greeting);
        setSavedMeals(data.savedMeals || []);
        setActivePlan(data.activePlan);
        setProgressEntries(data.progressEntries || []);
        setGroceryList(data.groceryList || []);
        setChatMessages(data.chatMessages || []);
        setFoodCatalog(data.foodCatalog || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppState(currentUserId);
  }, [currentUserId, fetchAppState]);

  const mutateState = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, userId: currentUserId }),
    });
    await fetchAppState(currentUserId);
    return res.json();
  };

  if (loading || !user || !todayTotals || !greeting || !activePlan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-nutrino-bg p-6 text-center">
        <NutrinoMascot state="welcome" size="lg" />
        <h1 className="mt-4 text-xl font-extrabold text-nutrino-deep">
          Loading Nutrino...
        </h1>
        <p className="mt-1 text-xs text-nutrino-muted">
          Your little buddy for better eating is preparing your kitchen & nutrition engine.
        </p>
      </div>
    );
  }

  const calPercent = Math.min(
    100,
    Math.round((todayTotals.calories / user.targets.calories) * 100)
  );
  const proteinPercent = Math.min(
    100,
    Math.round((todayTotals.protein / user.targets.protein) * 100)
  );
  const carbsPercent = Math.min(
    100,
    Math.round((todayTotals.carbs / user.targets.carbs) * 100)
  );
  const fatPercent = Math.min(
    100,
    Math.round((todayTotals.fat / user.targets.fat) * 100)
  );
  const fiberPercent = Math.min(
    100,
    Math.round((todayTotals.fiber / user.targets.fiber) * 100)
  );

  const displayedMascotState = previewMascotState || greeting.mascotState;

  const handleExportUserData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      product: "Nutrino v2.0",
      user,
      todayTotals,
      meals: allUserMeals,
      savedMeals,
      activePlan,
      progressEntries,
      groceryList,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nutrino-data-${user.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-nutrino-bg pb-24 md:pb-10">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-nutrino-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo + Tagline */}
          <div
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <NutrinoMascot state="welcome" size="xs" animated={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-nutrino-deep group-hover:text-nutrino-primary transition-colors">
                  Nutrino
                </span>
                {user.profile.hostelMode && (
                  <span className="rounded-full bg-nutrino-accent/70 px-2 py-0.5 text-[10px] font-extrabold text-nutrino-deep">
                    Hostel Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-nutrino-muted hidden sm:block">
                Your little buddy for better eating
              </p>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-nutrino-bg p-1 rounded-2xl border border-nutrino-border">
            {(
              [
                { id: "home", label: "Home", icon: Home },
                { id: "track", label: "Track", icon: Utensils },
                { id: "planner", label: "Meal Planner", icon: Calendar },
                { id: "insights", label: "Insights", icon: BarChart3 },
                { id: "profile", label: "Profile", icon: User },
              ] as const
            ).map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveTab(nav.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-nutrino-primary text-white shadow-nutrino-sm"
                      : "text-nutrino-muted hover:text-nutrino-deep"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {nav.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Profile Switcher & Prominent Ask Nutrino AI Entry Point */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setOnboardingModalMode("auth");
                setIsOnboardingOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-nutrino-bg hover:bg-nutrino-light border border-nutrino-border px-3 py-2 text-xs font-bold text-nutrino-deep transition-colors"
              title="Switch Demo Profile or Sign In"
            >
              <UserCheck className="h-3.5 w-3.5 text-nutrino-primary" />
              <span className="max-w-[110px] truncate">{user.name.split("(")[0].trim()}</span>
            </button>

            <button
              onClick={() => setIsAIModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-nutrino-primary hover:bg-nutrino-deep px-3.5 py-2 text-xs font-extrabold text-white shadow-nutrino-sm transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask Nutrino</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* ============================================================
            TAB 1: HOME DASHBOARD
           ============================================================ */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* SIGNATURE CONTEXTUAL GREETING HERO CARD */}
            <section className="relative rounded-3xl bg-gradient-to-br from-nutrino-light via-nutrino-light/70 to-white border border-nutrino-border p-5 sm:p-6 shadow-nutrino-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  <div className="shrink-0 flex flex-col items-center">
                    <NutrinoMascot
                      state={displayedMascotState}
                      size="lg"
                      showBadge
                      onClick={() => setShowMascotShowcaseOnHome(!showMascotShowcaseOnHome)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMascotShowcaseOnHome(!showMascotShowcaseOnHome)}
                      className="mt-1.5 text-[11px] font-bold text-nutrino-primary hover:underline"
                    >
                      {showMascotShowcaseOnHome
                        ? "Hide Mascot Expressions"
                        : "Tap Nutrino (11 Expressions)"}
                    </button>
                  </div>

                  <div className="space-y-2.5 max-w-xl">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="rounded-full bg-white px-3 py-0.5 text-xs font-extrabold text-nutrino-primary border border-nutrino-border">
                        {greeting.badgeText}
                      </span>
                      <span className="text-xs font-semibold text-nutrino-muted">
                        {new Date().toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-nutrino-accent/60 px-2.5 py-0.5 text-xs font-extrabold text-nutrino-deep">
                        <Flame className="h-3 w-3" /> {streakDays}-Day Streak
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-nutrino-deep leading-tight">
                      {previewMascotState
                        ? `Nutrino is feeling ${MASCOT_STATE_META[previewMascotState].label}!`
                        : greeting.headline}
                    </h1>

                    <p className="text-xs sm:text-sm text-nutrino-text leading-relaxed">
                      {previewMascotState
                        ? MASCOT_STATE_META[previewMascotState].defaultQuote
                        : greeting.subtext}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          if (greeting.suggestedActionTarget === "ai") {
                            setAiInitialPrompt(greeting.suggestedPrompt || "");
                            setIsAIModalOpen(true);
                          } else {
                            setActiveTab(greeting.suggestedActionTarget);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-nutrino-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-nutrino-sm hover:bg-nutrino-deep transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {greeting.suggestedActionLabel}
                      </button>

                      <button
                        onClick={() => {
                          setAiInitialPrompt(
                            greeting.suggestedPrompt ||
                              "What should I eat for my next meal today?"
                          );
                          setIsAIModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-white hover:bg-nutrino-bg border border-nutrino-border px-4 py-2.5 text-xs font-bold text-nutrino-deep transition-colors"
                      >
                        Chat with Nutrino
                      </button>

                      <button
                        onClick={() => {
                          setOnboardingModalMode("onboarding");
                          setIsOnboardingOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-2xl bg-white/80 hover:bg-white border border-nutrino-border px-3.5 py-2.5 text-xs font-semibold text-nutrino-muted hover:text-nutrino-deep transition-colors"
                      >
                        Personalize Goals
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Natural Language Log Box on Home */}
                <div className="w-full md:w-80 rounded-2xl bg-white/95 border border-nutrino-border p-4 shadow-nutrino-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-nutrino-deep">
                      Instant Natural-Language Log
                    </span>
                    <span className="text-[10px] font-bold text-nutrino-primary">
                      AI Parser
                    </span>
                  </div>
                  <p className="text-[11px] text-nutrino-muted">
                    Say what you ate—e.g. &ldquo;I had two dosas and a bowl of sambar&rdquo;:
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={trackInitialPrompt}
                      onChange={(e) => setTrackInitialPrompt(e.target.value)}
                      placeholder="I had two dosas and a bowl of sambar..."
                      className="flex-1 rounded-xl border border-nutrino-border bg-nutrino-bg px-3 py-2 text-xs focus:border-nutrino-primary focus:bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => setActiveTab("track")}
                      className="rounded-xl bg-nutrino-primary px-3 py-2 text-xs font-bold text-white hover:bg-nutrino-deep shrink-0"
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive 11-State Mascot Expression Switcher Drawer */}
              {showMascotShowcaseOnHome && (
                <div className="mt-5 pt-4 border-t border-nutrino-border">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold text-nutrino-deep">
                      Nutrino Reusable Mascot Asset System — All 11 Expression States
                    </span>
                    {previewMascotState && (
                      <button
                        onClick={() => setPreviewMascotState(null)}
                        className="text-xs font-bold text-nutrino-primary hover:underline"
                      >
                        Reset to Contextual Greeting State
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-2">
                    {ALL_MASCOT_STATES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setPreviewMascotState(st)}
                        className={`flex flex-col items-center rounded-2xl p-2 border transition-all ${
                          displayedMascotState === st
                            ? "bg-white border-nutrino-primary ring-2 ring-nutrino-primary/25"
                            : "bg-white/60 border-nutrino-border hover:bg-white"
                        }`}
                      >
                        <NutrinoMascot state={st} size="xs" animated={false} />
                        <span className="mt-1 text-[10px] font-bold text-nutrino-deep capitalize">
                          {st}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* QUICK ACTIONS ROW */}
            <section className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                onClick={() => setActiveTab("track")}
                className="flex items-center gap-2.5 rounded-2xl bg-white hover:bg-nutrino-light border border-nutrino-border p-3.5 text-left shadow-nutrino-sm transition-all"
              >
                <span className="rounded-xl bg-nutrino-light p-2 text-nutrino-primary">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-nutrino-deep">Log Food</div>
                  <div className="text-[10px] text-nutrino-muted">Text, Search, Voice</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("track")}
                className="flex items-center gap-2.5 rounded-2xl bg-white hover:bg-nutrino-light border border-nutrino-border p-3.5 text-left shadow-nutrino-sm transition-all"
              >
                <span className="rounded-xl bg-nutrino-light p-2 text-nutrino-primary">
                  <Camera className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-nutrino-deep">Food Photo</div>
                  <div className="text-[10px] text-nutrino-muted">Visual estimate</div>
                </div>
              </button>

              <button
                onClick={() => setIsAIModalOpen(true)}
                className="flex items-center gap-2.5 rounded-2xl bg-white hover:bg-nutrino-light border border-nutrino-border p-3.5 text-left shadow-nutrino-sm transition-all"
              >
                <span className="rounded-xl bg-nutrino-light p-2 text-nutrino-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-nutrino-deep">Ask Nutrino</div>
                  <div className="text-[10px] text-nutrino-muted">AI Nutritionist</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("planner")}
                className="flex items-center gap-2.5 rounded-2xl bg-white hover:bg-nutrino-light border border-nutrino-border p-3.5 text-left shadow-nutrino-sm transition-all"
              >
                <span className="rounded-xl bg-nutrino-light p-2 text-nutrino-primary">
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-nutrino-deep">Meal Plan</div>
                  <div className="text-[10px] text-nutrino-muted">Daily & Weekly</div>
                </div>
              </button>

              <button
                onClick={async () => {
                  if (savedMeals[0]) {
                    await mutateState({
                      action: "log_saved_meal",
                      savedMealId: savedMeals[0].id,
                      mealType: savedMeals[0].defaultMealType,
                    });
                  } else {
                    setActiveTab("track");
                  }
                }}
                className="col-span-2 sm:col-span-1 flex items-center gap-2.5 rounded-2xl bg-white hover:bg-nutrino-light border border-nutrino-border p-3.5 text-left shadow-nutrino-sm transition-all"
              >
                <span className="rounded-xl bg-nutrino-light p-2 text-nutrino-primary">
                  <Repeat className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-xs font-extrabold text-nutrino-deep">Repeat Saved</div>
                  <div className="text-[10px] text-nutrino-muted">1-Tap Usual Meal</div>
                </div>
              </button>
            </section>

            {/* DAILY NUTRITION OVERVIEW + NUTRINO'S DAILY SUGGESTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Nutrition Overview Card (8 cols) */}
              <div className="lg:col-span-8 rounded-3xl bg-white border border-nutrino-border p-5 sm:p-6 shadow-nutrino-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-nutrino-primary">
                      Real-Time Calculated Intake
                    </span>
                    <h2 className="text-lg font-extrabold text-nutrino-deep">
                      Daily Nutrition Overview
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-nutrino-muted">
                    Target Method: {user.targets.calculationMethod}
                  </span>
                </div>

                {/* Calorie Hero Bar */}
                <div className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold text-nutrino-deep tabular-nums">
                        {todayTotals.calories}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-nutrino-muted ml-1.5">
                        / {user.targets.calories} kcal consumed
                      </span>
                    </div>
                    <span className="rounded-full bg-nutrino-light px-3 py-1 text-xs font-extrabold text-nutrino-primary tabular-nums">
                      {Math.max(0, user.targets.calories - todayTotals.calories)} kcal remaining
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white border border-nutrino-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-nutrino-primary transition-all duration-500"
                      style={{ width: `${calPercent}%` }}
                    />
                  </div>
                </div>

                {/* 4 Macro Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Protein",
                      val: todayTotals.protein,
                      target: user.targets.protein,
                      pct: proteinPercent,
                      unit: "g",
                      highlight: true,
                    },
                    {
                      label: "Carbohydrates",
                      val: todayTotals.carbs,
                      target: user.targets.carbs,
                      pct: carbsPercent,
                      unit: "g",
                      highlight: false,
                    },
                    {
                      label: "Healthy Fats",
                      val: todayTotals.fat,
                      target: user.targets.fat,
                      pct: fatPercent,
                      unit: "g",
                      highlight: false,
                    },
                    {
                      label: "Dietary Fiber",
                      val: todayTotals.fiber,
                      target: user.targets.fiber,
                      pct: fiberPercent,
                      unit: "g",
                      highlight: false,
                    },
                  ].map((macro) => (
                    <div
                      key={macro.label}
                      className={`rounded-2xl p-3.5 border ${
                        macro.highlight
                          ? "bg-nutrino-light/60 border-nutrino-primary/40"
                          : "bg-nutrino-bg/70 border-nutrino-border"
                      }`}
                    >
                      <div className="text-xs font-bold text-nutrino-muted">
                        {macro.label}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-lg font-extrabold text-nutrino-deep tabular-nums">
                          {macro.val}
                          {macro.unit}
                        </span>
                        <span className="text-[11px] font-semibold text-nutrino-muted tabular-nums">
                          / {macro.target}
                          {macro.unit}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-white overflow-hidden">
                        <div
                          className="h-full rounded-full bg-nutrino-primary transition-all"
                          style={{ width: `${macro.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Micronutrients Strip */}
                <div className="pt-2 border-t border-nutrino-border flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-nutrino-deep">
                    Key Micronutrients Today:
                  </span>
                  <div className="flex flex-wrap gap-3 text-nutrino-muted font-semibold tabular-nums">
                    <span>
                      Iron:{" "}
                      <strong className="text-nutrino-deep">
                        {todayTotals.ironMg}/{user.targets.ironMg}mg
                      </strong>
                    </span>
                    <span>
                      Calcium:{" "}
                      <strong className="text-nutrino-deep">
                        {todayTotals.calciumMg}/{user.targets.calciumMg}mg
                      </strong>
                    </span>
                    <span>
                      Vit B12:{" "}
                      <strong className="text-nutrino-deep">
                        {todayTotals.vitaminB12Mcg}/{user.targets.vitaminB12Mcg}mcg
                      </strong>
                    </span>
                    <span>
                      Vit C:{" "}
                      <strong className="text-nutrino-deep">
                        {todayTotals.vitaminCMg}/{user.targets.vitaminCMg}mg
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Nutrino's Daily Suggestion Card (4 cols) */}
              <div className="lg:col-span-4 rounded-3xl bg-nutrino-light/80 border border-nutrino-border p-5 shadow-nutrino-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <NutrinoMascot state="explaining" size="sm" />
                    <div>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-nutrino-primary border border-nutrino-border">
                        Nutrino&apos;s Daily Insight
                      </span>
                      <h3 className="font-extrabold text-base text-nutrino-deep mt-1">
                        Smart Next Step
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-nutrino-deep leading-relaxed">
                    {todayTotals.protein < user.targets.protein * 0.6
                      ? `"You're doing great! Looks like we could add a little more protein (+${Math.round(
                          user.targets.protein - todayTotals.protein
                        )}g remaining) to your next meal. A katori of soya chunks, paneer bhurji, dal tadka, roasted chana, or 2 eggs will fit right in!"`
                      : `"Wonderful balance today! Adding a serving of fruit or vegetable sambar at your next meal will top up your fiber and Vitamin C."`}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setAiInitialPrompt(
                        "Suggest a high-protein meal for my next slot today"
                      );
                      setIsAIModalOpen(true);
                    }}
                    className="w-full rounded-2xl bg-nutrino-primary py-3 text-xs font-extrabold text-white shadow-nutrino-sm hover:bg-nutrino-deep transition-colors"
                  >
                    Suggest a Meal with Nutrino AI
                  </button>
                  <button
                    onClick={() => setActiveTab("planner")}
                    className="w-full rounded-2xl bg-white py-2.5 text-xs font-bold text-nutrino-deep border border-nutrino-border hover:bg-nutrino-bg transition-colors"
                  >
                    Open Today&apos;s Meal Plan
                  </button>
                </div>
              </div>
            </div>

            {/* TODAY'S MEALS: BREAKFAST, LUNCH, SNACKS, DINNER */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-nutrino-deep">
                    Today&apos;s Logged Meals
                  </h2>
                  <p className="text-xs text-nutrino-muted">
                    Edit portions, duplicate, or add foods to any meal slot—all nutrition totals recalculate automatically
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("track")}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-nutrino-primary px-4 py-2 text-xs font-bold text-white hover:bg-nutrino-deep"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Food
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["breakfast", "lunch", "snacks", "dinner"] as MealType[]).map(
                  (slotType) => {
                    const slotMeals = todayMeals.filter((m) => m.mealType === slotType);
                    const slotCalories = slotMeals.reduce(
                      (acc, m) => acc + m.totalNutrition.calories,
                      0
                    );
                    const slotProtein =
                      Math.round(
                        slotMeals.reduce(
                          (acc, m) => acc + m.totalNutrition.protein,
                          0
                        ) * 10
                      ) / 10;

                    return (
                      <div
                        key={slotType}
                        className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-nutrino-border pb-2.5">
                            <div>
                              <h3 className="font-extrabold text-base text-nutrino-deep capitalize">
                                {slotType}
                              </h3>
                              <span className="text-xs text-nutrino-muted">
                                {slotMeals.length === 0
                                  ? "Nothing logged yet"
                                  : `${slotCalories} kcal • ${slotProtein}g Protein`}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                setTrackDefaultMealType(slotType);
                                setActiveTab("track");
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-nutrino-light hover:bg-nutrino-primary hover:text-white px-3 py-1.5 text-xs font-bold text-nutrino-primary transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add {slotType}
                            </button>
                          </div>

                          {slotMeals.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-xs text-nutrino-muted">
                                Tap <strong>+ Add {slotType}</strong> to log with text, voice, photo, or search.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {slotMeals.map((meal) => {
                                const isEditing = editingMealId === meal.id;
                                return (
                                  <div
                                    key={meal.id}
                                    className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3.5 space-y-2.5"
                                  >
                                    {meal.rawInput && (
                                      <div className="text-[11px] italic text-nutrino-muted">
                                        &ldquo;{meal.rawInput}&rdquo;
                                      </div>
                                    )}

                                    <div className="space-y-2">
                                      {meal.items.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between gap-2 text-xs"
                                        >
                                          <div className="min-w-0">
                                            <span className="font-bold text-nutrino-deep">
                                              {item.foodName.split("(")[0].trim()}
                                            </span>
                                            <span className="text-nutrino-muted ml-1.5">
                                              ({item.quantity} {item.unitName} • {item.grams}g)
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-bold text-nutrino-deep tabular-nums">
                                              {item.nutrition.calories} kcal
                                            </span>
                                            {isEditing && (
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updatedItems = meal.items.map((x) =>
                                                      x.id === item.id
                                                        ? {
                                                            ...x,
                                                            quantity: Math.max(
                                                              0.5,
                                                              x.quantity - 0.5
                                                            ),
                                                          }
                                                        : x
                                                    );
                                                    mutateState({
                                                      action: "update_meal",
                                                      mealId: meal.id,
                                                      mealType: meal.mealType,
                                                      items: updatedItems,
                                                    });
                                                  }}
                                                  className="rounded bg-white border border-nutrino-border px-1.5 py-0.5 text-[10px] font-bold"
                                                >
                                                  -0.5
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const updatedItems = meal.items.map((x) =>
                                                      x.id === item.id
                                                        ? {
                                                            ...x,
                                                            quantity: x.quantity + 0.5,
                                                          }
                                                        : x
                                                    );
                                                    mutateState({
                                                      action: "update_meal",
                                                      mealId: meal.id,
                                                      mealType: meal.mealType,
                                                      items: updatedItems,
                                                    });
                                                  }}
                                                  className="rounded bg-white border border-nutrino-border px-1.5 py-0.5 text-[10px] font-bold"
                                                >
                                                  +0.5
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Meal Item Actions: Edit Portions, Duplicate, Delete */}
                                    <div className="flex items-center justify-between pt-2 border-t border-nutrino-border text-[11px]">
                                      <span className="font-bold text-nutrino-primary">
                                        Total: {meal.totalNutrition.calories} kcal •{" "}
                                        {meal.totalNutrition.protein}g P
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingMealId(isEditing ? null : meal.id)
                                          }
                                          className="inline-flex items-center gap-1 text-nutrino-muted hover:text-nutrino-deep font-semibold"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                          {isEditing ? "Done" : "Edit Portions"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            mutateState({
                                              action: "duplicate_meal",
                                              mealId: meal.id,
                                            })
                                          }
                                          className="inline-flex items-center gap-1 text-nutrino-muted hover:text-nutrino-deep font-semibold"
                                          title="Duplicate meal"
                                        >
                                          <Copy className="h-3 w-3" /> Repeat
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            mutateState({
                                              action: "delete_meal",
                                              mealId: meal.id,
                                            })
                                          }
                                          className="inline-flex items-center gap-1 text-nutrino-muted hover:text-nutrino-error font-semibold"
                                          title="Delete meal"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          </div>
        )}

        {/* ============================================================
            TAB 2: FOOD TRACKING & SAVED MEALS
           ============================================================ */}
        {activeTab === "track" && (
          <TrackFoodView
            foodCatalog={foodCatalog}
            savedMeals={savedMeals}
            defaultMealType={trackDefaultMealType}
            initialTextPrompt={trackInitialPrompt}
            userId={currentUserId}
            onConfirmLogMeal={async (payload) => {
              await mutateState({
                action: "log_meal",
                ...payload,
              });
            }}
            onLogSavedMeal={async (savedMealId, mealType) => {
              await mutateState({
                action: "log_saved_meal",
                savedMealId,
                mealType,
              });
            }}
            onCreateSavedMeal={async (payload) => {
              await mutateState({
                action: "save_meal_template",
                ...payload,
              });
            }}
          />
        )}

        {/* ============================================================
            TAB 3: PERSONALIZED MEAL PLANNER & GROCERY LIST
           ============================================================ */}
        {activeTab === "planner" && (
          <MealPlannerView
            user={user}
            activePlan={activePlan}
            todayTotals={todayTotals}
            groceryList={groceryList}
            onGeneratePlan={async (planType, availableIngredients) => {
              await mutateState({
                action: "generate_plan",
                planType,
                availableIngredients,
              });
            }}
            onReplaceSlot={async (slotId) => {
              await mutateState({
                action: "replace_planned_slot",
                slotId,
              });
            }}
            onLogPlannedSlot={async (slot: PlannedMealSlot) => {
              await mutateState({
                action: "log_meal",
                mealType: slot.mealType,
                loggingMethod: "meal_plan",
                rawInput: `Planned Meal: ${slot.title}`,
                confidenceScore: 1.0,
                items: slot.items.map((i) => ({
                  foodId: i.foodId,
                  quantity: i.quantity,
                  unitName: i.unitName,
                })),
              });
            }}
            onAddGrocery={async (name, category, quantityLabel) => {
              await mutateState({
                action: "add_grocery_item",
                name,
                category,
                quantityLabel,
              });
            }}
            onToggleGrocery={async (itemId) => {
              await mutateState({
                action: "toggle_grocery_item",
                itemId,
              });
            }}
            onDeleteGrocery={async (itemId) => {
              await mutateState({
                action: "delete_grocery_item",
                itemId,
              });
            }}
          />
        )}

        {/* ============================================================
            TAB 4: NUTRITIONAL INSIGHTS, PROGRESS & HOSTEL MODE
           ============================================================ */}
        {activeTab === "insights" && (
          <InsightsAndProgressView
            user={user}
            todayTotals={todayTotals}
            allUserMeals={allUserMeals}
            progressEntries={progressEntries}
            streakDays={streakDays}
            onLogProgress={async (weightKg, waterGlasses) => {
              await mutateState({
                action: "log_progress",
                weightKg,
                waterGlasses,
              });
            }}
            onQuickLogHostelAddition={async (foodId, qty, unit, mealType) => {
              await mutateState({
                action: "log_meal",
                mealType,
                loggingMethod: "manual",
                rawInput: "Hostel Mode Quick Addition",
                items: [{ foodId, quantity: qty, unitName: unit }],
              });
            }}
          />
        )}

        {/* ============================================================
            TAB 5: PROFILE, TARGETS, MASCOT SYSTEM & SECURITY
           ============================================================ */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Summary Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white border border-nutrino-border p-6 shadow-nutrino-sm">
              <div className="flex items-center gap-4">
                <NutrinoMascot state="happy" size="md" />
                <div>
                  <span className="rounded-full bg-nutrino-light px-3 py-0.5 text-xs font-bold text-nutrino-primary">
                    {user.isDemo ? "Demo Account" : "Personal Account"}
                  </span>
                  <h2 className="text-xl font-extrabold text-nutrino-deep mt-1">
                    {user.name}
                  </h2>
                  <p className="text-xs text-nutrino-muted">
                    {user.email} • Primary Goal:{" "}
                    <strong className="text-nutrino-deep capitalize">
                      {user.goals.primaryGoal.replace(/_/g, " ")}
                    </strong>{" "}
                    • Diet:{" "}
                    <strong className="text-nutrino-deep capitalize">
                      {user.profile.dietaryPreference.replace(/_/g, " ")}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setOnboardingModalMode("onboarding");
                    setIsOnboardingOpen(true);
                  }}
                  className="rounded-2xl bg-nutrino-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-nutrino-deep"
                >
                  Edit Profile & Recalculate Targets
                </button>
                <button
                  onClick={() => {
                    setOnboardingModalMode("auth");
                    setIsOnboardingOpen(true);
                  }}
                  className="rounded-2xl bg-nutrino-bg border border-nutrino-border px-4 py-2.5 text-xs font-bold text-nutrino-deep hover:bg-nutrino-light"
                >
                  Switch Account
                </button>
              </div>
            </div>

            {/* Calculated Daily Targets Card */}
            <div className="rounded-3xl bg-white border border-nutrino-border p-6 shadow-nutrino-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Your Calculated Daily Nutrition Targets
                </h3>
                <span className="text-xs font-semibold text-nutrino-primary">
                  {user.targets.calculationMethod}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                {[
                  { label: "Calories", val: `${user.targets.calories} kcal` },
                  { label: "Protein", val: `${user.targets.protein}g` },
                  { label: "Carbs", val: `${user.targets.carbs}g` },
                  { label: "Fat", val: `${user.targets.fat}g` },
                  { label: "Fiber", val: `${user.targets.fiber}g` },
                  { label: "Iron", val: `${user.targets.ironMg}mg` },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3"
                  >
                    <div className="text-xs text-nutrino-muted">{t.label}</div>
                    <div className="text-base font-extrabold text-nutrino-deep mt-0.5 tabular-nums">
                      {t.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete 11-State Nutrino Mascot Asset System Showcase */}
            <div className="rounded-3xl bg-white border border-nutrino-border p-6 shadow-nutrino-sm space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-nutrino-primary">
                  Brand Identity & Character Design System
                </span>
                <h3 className="text-lg font-extrabold text-nutrino-deep">
                  Nutrino Original Soft-3D Avocado Mascot — All 11 States
                </h3>
                <p className="text-xs text-nutrino-muted">
                  Consistent proportions, soft 3D gradients, and expressive states used across onboarding, food logging, meal planning, insights, and achievements.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {ALL_MASCOT_STATES.map((st) => (
                  <div
                    key={st}
                    className="flex flex-col items-center text-center rounded-2xl bg-nutrino-bg border border-nutrino-border p-4 space-y-2"
                  >
                    <NutrinoMascot state={st} size="sm" />
                    <div>
                      <div className="font-extrabold text-xs text-nutrino-deep">
                        {MASCOT_STATE_META[st].label}
                      </div>
                      <div className="text-[11px] text-nutrino-muted">
                        {MASCOT_STATE_META[st].description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy, Data Export & Account Deletion (Section 21) */}
            <div className="rounded-3xl bg-white border border-nutrino-border p-6 shadow-nutrino-sm space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-nutrino-primary" />
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Security, Data Privacy & Health Safety Disclosures
                </h3>
              </div>

              <p className="text-xs text-nutrino-muted leading-relaxed">
                Nutrino isolates your personal logs and nutrition targets to your account. All nutritional values are calculated deterministically from ICMR-NIN & USDA composition tables and represent educational dietary estimates—never medical diagnoses or prescriptions.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportUserData}
                  className="inline-flex items-center gap-2 rounded-2xl bg-nutrino-light hover:bg-nutrino-primary hover:text-white border border-nutrino-border px-4 py-2.5 text-xs font-bold text-nutrino-deep transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export My Nutrition Data (JSON)
                </button>

                {!user.isDemo && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await mutateState({ action: "delete_account" });
                      if (res.deleted) {
                        setCurrentUserId("user-demo-priya");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-nutrino-error/15 hover:bg-nutrino-error hover:text-white border border-nutrino-error px-4 py-2.5 text-xs font-bold text-nutrino-deep transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Custom Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-nutrino-border px-2 py-1.5 flex items-center justify-around">
        {(
          [
            { id: "home", label: "Home", icon: Home },
            { id: "track", label: "Track", icon: Utensils },
            { id: "planner", label: "Planner", icon: Calendar },
            { id: "insights", label: "Insights", icon: BarChart3 },
            { id: "profile", label: "Profile", icon: User },
          ] as const
        ).map((nav) => {
          const Icon = nav.icon;
          const isActive = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => setActiveTab(nav.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-colors ${
                isActive ? "text-nutrino-primary font-extrabold" : "text-nutrino-muted font-medium"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODALS: CONVERSATIONAL ONBOARDING / AUTH & AI NUTRITIONIST CHAT */}
      <OnboardingAndAuthModal
        isOpen={isOnboardingOpen}
        initialMode={onboardingModalMode}
        currentUser={user}
        availableDemoUsers={availableDemoUsers}
        onClose={() => setIsOnboardingOpen(false)}
        onSelectUser={async (uid) => {
          setCurrentUserId(uid);
        }}
        onAuthSuccess={(authedUser, startOnboarding) => {
          setCurrentUserId(authedUser.id);
          if (!startOnboarding) {
            setIsOnboardingOpen(false);
          }
        }}
        onCompleteOnboarding={async (payload) => {
          await mutateState({
            action: "complete_onboarding",
            ...payload,
          });
        }}
      />

      <AINutritionistModal
        isOpen={isAIModalOpen}
        user={user}
        todayTotals={todayTotals}
        messages={chatMessages}
        initialPrompt={aiInitialPrompt}
        onClose={() => setIsAIModalOpen(false)}
        onSendMessage={async (question) => {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "chat",
              userId: currentUserId,
              text: question,
            }),
          });
          const data = await res.json();
          if (data.messages) {
            setChatMessages(data.messages);
          }
        }}
        onLogActionCard={async (card: AIActionCard) => {
          await mutateState({
            action: "log_meal",
            mealType: card.mealType,
            loggingMethod: "text",
            rawInput: `Nutrino AI Suggestion: ${card.title}`,
            confidenceScore: 1.0,
            items: card.items.map((i) => ({
              foodId: i.foodId,
              quantity: i.quantity,
              unitName: i.unitName,
            })),
          });
        }}
      />
    </div>
  );
}

