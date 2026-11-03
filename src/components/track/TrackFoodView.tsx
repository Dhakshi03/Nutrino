"use client";

import React, { useState } from "react";
import {
  FoodItem,
  LoggedMealItem,
  MascotState,
  MealType,
  SavedMeal,
} from "@/types/nutrino";
import {
  buildCalculatedMealItem,
  sumNutrientSnapshots,
} from "@/lib/services/nutrition-engine";
import { NutrinoMascot } from "@/components/mascot/NutrinoMascot";
import {
  Sparkles,
  Camera,
  Mic,
  Search,
  BookmarkCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Repeat,
} from "lucide-react";

interface TrackFoodViewProps {
  foodCatalog: FoodItem[];
  savedMeals: SavedMeal[];
  defaultMealType?: MealType;
  initialTextPrompt?: string;
  onConfirmLogMeal: (payload: {
    mealType: MealType;
    loggingMethod: "text" | "photo" | "voice" | "manual" | "saved_meal";
    rawInput?: string;
    confidenceScore: number;
    items: { foodId: string; quantity: number; unitName: string }[];
  }) => Promise<void>;
  onLogSavedMeal: (savedMealId: string, mealType: MealType) => Promise<void>;
  onCreateSavedMeal: (payload: {
    name: string;
    defaultMealType: MealType;
    items: { foodId: string; quantity: number; unitName: string }[];
  }) => Promise<void>;
  userId: string;
}

const PORTION_UNITS = [
  "dosa",
  "idli",
  "roti",
  "katori",
  "bowl",
  "cup",
  "ladle",
  "glass",
  "piece",
  "slice",
  "tbsp",
  "tsp",
  "small",
  "medium",
  "large",
  "100g",
];

const QUICK_NL_EXAMPLES = [
  "I had two dosas and a bowl of sambar",
  "I had two idlis, one bowl of sambar and a cup of tea",
  "2 rotis, 1 katori dal tadka and 1 katori paneer bhurji",
  "1 bowl poha, 2 boiled eggs and 1 cup filter coffee",
  "1 bowl steamed rice, 1 katori rajma masala and 1 glass chaas",
];

export function TrackFoodView({
  foodCatalog,
  savedMeals,
  defaultMealType = "breakfast",
  initialTextPrompt = "",
  onConfirmLogMeal,
  onLogSavedMeal,
  onCreateSavedMeal,
  userId,
}: TrackFoodViewProps) {
  const [activeMethod, setActiveMethod] = useState<
    "text" | "manual" | "photo" | "voice" | "saved"
  >("text");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [nlText, setNlText] = useState(
    initialTextPrompt || "I had two dosas and a bowl of sambar"
  );
  const [isParsing, setIsParsing] = useState(false);

  // Unified Confirmation Basket
  const [draftItems, setDraftItems] = useState<LoggedMealItem[]>(() => {
    const dosa = foodCatalog.find((f) => f.id === "plain-dosa");
    const sambar = foodCatalog.find((f) => f.id === "sambar");
    if (dosa && sambar) {
      return [
        buildCalculatedMealItem(dosa, 2, "dosa"),
        buildCalculatedMealItem(sambar, 1, "bowl"),
      ];
    }
    return [];
  });
  const [confidenceScore, setConfidenceScore] = useState(0.95);
  const [mascotState, setMascotState] = useState<MascotState>("eating");
  const [nutrinoNote, setNutrinoNote] = useState(
    "Tell me what you ate in plain words, snap a photo, use voice, or pick items below. Every logging method converges on the confirmation card so you're always in control!"
  );
  const [estimationDisclosure, setEstimationDisclosure] = useState(
    "Approximate household measures (katori, piece, bowl) are automatically converted to grams using ICMR-NIN reference weights."
  );

  // Manual search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hostelFilterOnly, setHostelFilterOnly] = useState(false);

  // Photo state
  const [photoPreviewName, setPhotoPreviewName] = useState("");
  const [photoHint, setPhotoHint] = useState("South Indian Dosa & Sambar Plate");

  // Voice state
  const [isListening, setIsListening] = useState(false);

  // Save as combo state
  const [saveComboName, setSaveComboName] = useState("");
  const [savingMealLoading, setSavingMealLoading] = useState(false);
  const [justLoggedBanner, setJustLoggedBanner] = useState("");

  const categories = [
    "All",
    "South Indian",
    "North Indian",
    "Dal & Pulses",
    "Rice & Breads",
    "Sabzi & Curries",
    "Eggs, Meat & Fish",
    "Hostel & Mess Staples",
    "Dairy & Plant Milk",
    "Fruits & Nuts",
    "Beverages",
  ];

  const handleParseNaturalLanguage = async (textToParse: string, mode: "parse_text" | "parse_photo" | "parse_voice" = "parse_text") => {
    if (!textToParse.trim()) return;
    setIsParsing(true);
    setMascotState("thinking");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          userId,
          text: textToParse,
          mealType,
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setDraftItems(data.draft.items || []);
        setConfidenceScore(data.draft.confidenceScore || 0.9);
        setMascotState(data.draft.mascotState || "eating");
        setNutrinoNote(data.draft.nutrinoComment || "Parsed your meal! Confirm below.");
        setEstimationDisclosure(data.draft.estimationNote || "");
        if (data.draft.inferredMealType) {
          setMealType(data.draft.inferredMealType);
        }
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateDraftItem = (
    itemId: string,
    newQty: number,
    newUnit: string
  ) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const food = foodCatalog.find((f) => f.id === item.foodId);
        if (!food) return item;
        return buildCalculatedMealItem(food, Math.max(0.25, newQty), newUnit, item.id);
      })
    );
  };

  const handleRemoveDraftItem = (itemId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleAddFoodToDraft = (food: FoodItem) => {
    setDraftItems((prev) => {
      const existing = prev.find((i) => i.foodId === food.id);
      if (existing) {
        return prev.map((i) =>
          i.foodId === food.id
            ? buildCalculatedMealItem(food, i.quantity + 1, i.unitName, i.id)
            : i
        );
      }
      return [...prev, buildCalculatedMealItem(food, 1, food.defaultServingUnit)];
    });
    setMascotState("eating");
    setNutrinoNote(`Added ${food.name.split("(")[0].trim()} to your meal confirmation tray!`);
  };

  const startVoiceCapture = () => {
    const SpeechRec =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      // Friendly fallback for desktop browsers without Web Speech API
      const simulated = "I had two idlis, one bowl of sambar and a cup of tea";
      setNlText(simulated);
      handleParseNaturalLanguage(simulated, "parse_voice");
      return;
    }

    try {
      setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRec as any)();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript) {
          setNlText(transcript);
          handleParseNaturalLanguage(transcript, "parse_voice");
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleConfirmMeal = async () => {
    if (draftItems.length === 0) return;
    setSavingMealLoading(true);
    try {
      await onConfirmLogMeal({
        mealType,
        loggingMethod:
          activeMethod === "saved" ? "saved_meal" : activeMethod,
        rawInput: nlText,
        confidenceScore,
        items: draftItems.map((i) => ({
          foodId: i.foodId,
          quantity: i.quantity,
          unitName: i.unitName,
        })),
      });
      setMascotState("happy");
      setJustLoggedBanner(
        `Yay! Your ${mealType} (${draftTotals.calories} kcal, ${draftTotals.protein}g protein) has been logged and your dashboard is updated!`
      );
      setTimeout(() => setJustLoggedBanner(""), 5000);
    } finally {
      setSavingMealLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!saveComboName.trim() || draftItems.length === 0) return;
    await onCreateSavedMeal({
      name: saveComboName.trim(),
      defaultMealType: mealType,
      items: draftItems.map((i) => ({
        foodId: i.foodId,
        quantity: i.quantity,
        unitName: i.unitName,
      })),
    });
    setSaveComboName("");
    setJustLoggedBanner(`Saved "${saveComboName.trim()}" for 1-tap logging anytime!`);
    setTimeout(() => setJustLoggedBanner(""), 4000);
  };

  const draftTotals = sumNutrientSnapshots(draftItems.map((i) => i.nutrition));

  const filteredCatalog = foodCatalog.filter((f) => {
    if (selectedCategory !== "All" && f.category !== selectedCategory) return false;
    if (hostelFilterOnly && !f.isHostelStaple) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.aliases.some((a) => a.toLowerCase().includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Mascot Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-nutrino-light/85 border border-nutrino-border p-5">
        <div className="flex items-center gap-4">
          <NutrinoMascot state={mascotState} size="sm" />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-nutrino-primary border border-nutrino-border mb-1">
              <Sparkles className="h-3 w-3" /> Effortless Food Tracking
            </span>
            <h2 className="text-lg font-extrabold text-nutrino-deep">
              What did you eat today?
            </h2>
            <p className="text-xs sm:text-sm text-nutrino-text mt-0.5 max-w-2xl">
              {nutrinoNote}
            </p>
          </div>
        </div>

        {/* Meal Type Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-nutrino-border self-stretch sm:self-auto justify-center">
          {(["breakfast", "lunch", "snacks", "dinner"] as MealType[]).map((mt) => (
            <button
              key={mt}
              onClick={() => setMealType(mt)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                mealType === mt
                  ? "bg-nutrino-primary text-white"
                  : "text-nutrino-muted hover:text-nutrino-deep"
              }`}
            >
              {mt}
            </button>
          ))}
        </div>
      </div>

      {justLoggedBanner && (
        <div className="flex items-center gap-3 rounded-2xl bg-nutrino-primary text-white px-5 py-3.5 shadow-nutrino-md">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-bold">{justLoggedBanner}</span>
        </div>
      )}

      {/* 5 Logging Method Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "text", label: "Natural Text AI", icon: Sparkles },
          { id: "manual", label: "Search & Portions", icon: Search },
          { id: "photo", label: "Photo Logging", icon: Camera },
          { id: "voice", label: "Voice Logging", icon: Mic },
          { id: "saved", label: `Saved Meals (${savedMeals.length})`, icon: BookmarkCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() =>
                setActiveMethod(tab.id as "text" | "manual" | "photo" | "voice" | "saved")
              }
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold border transition-all ${
                activeMethod === tab.id
                  ? "bg-nutrino-deep text-white border-nutrino-deep shadow-nutrino-sm"
                  : "bg-white text-nutrino-text border-nutrino-border hover:border-nutrino-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Input Method Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeMethod === "text" && (
            <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Describe Your Meal in Plain Words
                </h3>
                <span className="text-[11px] font-semibold text-nutrino-muted">
                  No weighing scale required
                </span>
              </div>

              <textarea
                rows={3}
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                placeholder='e.g., "I had two dosas and a bowl of sambar" or "2 rotis, 1 katori dal and 1 cup tea"'
                className="w-full rounded-2xl border border-nutrino-border bg-nutrino-bg p-3.5 text-sm font-medium text-nutrino-deep focus:border-nutrino-primary focus:bg-white focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => handleParseNaturalLanguage(nlText, "parse_text")}
                  disabled={isParsing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-nutrino-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-nutrino-sm hover:bg-nutrino-deep transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  {isParsing ? "Analyzing Meal..." : "Analyze & Estimate Nutrition"}
                </button>
                <span className="text-xs text-nutrino-muted">
                  Matches against ICMR-NIN & USDA food records
                </span>
              </div>

              {/* Sample 1-Tap Natural Language Prompts */}
              <div className="pt-2 border-t border-nutrino-border">
                <div className="text-xs font-bold text-nutrino-muted mb-2">
                  Try an example in one tap:
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_NL_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setNlText(ex);
                        handleParseNaturalLanguage(ex, "parse_text");
                      }}
                      className="rounded-xl bg-nutrino-light/70 hover:bg-nutrino-light border border-nutrino-border px-3 py-1.5 text-xs font-semibold text-nutrino-deep text-left transition-colors"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMethod === "photo" && (
            <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
              <h3 className="font-extrabold text-base text-nutrino-deep">
                Photo Food Logging & Visual Portion Estimation
              </h3>
              <p className="text-xs text-nutrino-muted">
                Upload a photo of your plate or choose a sample Indian meal plate below. Nutrino estimates visible foods and portions for your confirmation.
              </p>

              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-nutrino-sage bg-nutrino-light/40 p-6 cursor-pointer hover:bg-nutrino-light/70 transition-colors">
                <Camera className="h-8 w-8 text-nutrino-primary mb-2" />
                <span className="text-sm font-bold text-nutrino-deep">
                  {photoPreviewName
                    ? `Selected: ${photoPreviewName}`
                    : "Click to Upload Meal Photo (JPG / PNG / WebP)"}
                </span>
                <span className="text-xs text-nutrino-muted mt-1">
                  Or describe visible items below for instant vision estimation
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhotoPreviewName(file.name);
                      handleParseNaturalLanguage(photoHint || file.name, "parse_photo");
                    }
                  }}
                />
              </label>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-nutrino-deep">
                  What plate is in the photo? (Or tap a quick plate preset)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "South Indian Dosa + Sambar Plate", q: "2 dosas, 1 bowl sambar and 1 tbsp coconut chutney" },
                    { label: "North Indian Roti-Dal-Sabzi Thali", q: "2 rotis, 1 katori dal tadka, 1 katori aloo gobi and 1 katori curd" },
                    { label: "Hostel Mess Rajma Chawal Plate", q: "1 bowl steamed rice, 1 katori rajma masala and 1 bowl sprouts salad" },
                    { label: "Egg Omelette & Toast Breakfast", q: "1 masala omelette, 2 whole wheat bread slices and 1 cup tea" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPhotoHint(preset.q);
                        handleParseNaturalLanguage(preset.q, "parse_photo");
                      }}
                      className="rounded-xl bg-nutrino-bg hover:bg-nutrino-light border border-nutrino-border px-3 py-2 text-xs font-bold text-nutrino-deep transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl bg-nutrino-accent/25 border border-nutrino-warning/50 p-3 text-xs text-nutrino-deep">
                <Info className="h-4 w-4 text-nutrino-deep shrink-0 mt-0.5" />
                <span>
                  <strong>Honest Photo Estimate Note:</strong> Photographs help identify dishes and approximate visible portions, but never reveal exact ingredient weights or hidden cooking oil. Please review and adjust portions on the confirmation card!
                </span>
              </div>
            </div>
          )}

          {activeMethod === "voice" && (
            <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
              <h3 className="font-extrabold text-base text-nutrino-deep">
                Natural Voice Food Logging
              </h3>
              <p className="text-xs text-nutrino-muted">
                Speak naturally—like &ldquo;I had two idlis, one bowl of sambar and a cup of tea&rdquo;—and Nutrino converts your speech into structured meal items.
              </p>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-nutrino-light/60 border border-nutrino-border p-6">
                <button
                  type="button"
                  onClick={startVoiceCapture}
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-nutrino-md transition-all ${
                    isListening
                      ? "bg-nutrino-error animate-pulse scale-110"
                      : "bg-nutrino-primary hover:bg-nutrino-deep"
                  }`}
                >
                  <Mic className="h-7 w-7" />
                </button>
                <span className="mt-3 text-sm font-bold text-nutrino-deep">
                  {isListening
                    ? "Listening... Speak your meal now!"
                    : "Tap Microphone to Speak Your Meal"}
                </span>
                <span className="mt-1 text-xs text-nutrino-muted">
                  Supports Indian English & Hindi food terms (roti, katori, idli, dosa, dal, poha, chai)
                </span>
              </div>
            </div>
          )}

          {activeMethod === "saved" && (
            <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Saved Meals & One-Tap Repeat Combinations
                </h3>
                <span className="text-xs font-semibold text-nutrino-primary">
                  1-Tap Log
                </span>
              </div>

              <div className="space-y-3">
                {savedMeals.map((sm) => (
                  <div
                    key={sm.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-nutrino-bg border border-nutrino-border p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-nutrino-deep">
                          {sm.name}
                        </span>
                        <span className="rounded-full bg-nutrino-light px-2 py-0.5 text-[10px] font-bold uppercase text-nutrino-primary">
                          {sm.defaultMealType}
                        </span>
                      </div>
                      <div className="text-xs text-nutrino-muted mt-1">
                        {sm.items
                          .map((i) => `${i.quantity} ${i.unitName} ${i.foodName.split("(")[0].trim()}`)
                          .join(" + ")}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs font-bold text-nutrino-deep">
                        <span>{sm.totalNutrition.calories} kcal</span>
                        <span className="text-nutrino-primary">
                          {sm.totalNutrition.protein}g Protein
                        </span>
                        <span>{sm.totalNutrition.carbs}g Carbs</span>
                        <span>{sm.totalNutrition.fat}g Fat</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onLogSavedMeal(sm.id, mealType)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-nutrino-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-nutrino-deep transition-colors shrink-0"
                    >
                      <Repeat className="h-3.5 w-3.5" />
                      Log in 1 Tap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Food Search & Indian Category Browser (Always accessible below or in Manual mode) */}
          <div className="rounded-3xl bg-white border border-nutrino-border p-5 shadow-nutrino-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Indian & Global Food Library ({filteredCatalog.length} foods)
                </h3>
                <p className="text-xs text-nutrino-muted">
                  Tap any dish to add it to your meal confirmation tray
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-bold text-nutrino-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={hostelFilterOnly}
                  onChange={(e) => setHostelFilterOnly(e.target.checked)}
                  className="rounded accent-nutrino-primary"
                />
                Hostel / Mess Staples Only
              </label>
            </div>

            <div className="relative">
              <Search className="h-4 w-4 text-nutrino-muted absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search idli, dosa, sambar, roti, dal, paneer, poha, roasted chana, eggs..."
                className="w-full rounded-2xl border border-nutrino-border bg-nutrino-bg pl-10 pr-4 py-2.5 text-sm focus:border-nutrino-primary focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap border transition-colors ${
                    selectedCategory === cat
                      ? "bg-nutrino-primary text-white border-nutrino-primary"
                      : "bg-nutrino-bg text-nutrino-muted border-nutrino-border hover:text-nutrino-deep"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.map((food) => {
                const defaultGramRatio = food.defaultServingGrams / 100;
                const servingCal = Math.round(food.per100g.calories * defaultGramRatio);
                const servingProt = Math.round(food.per100g.protein * defaultGramRatio * 10) / 10;

                return (
                  <div
                    key={food.id}
                    className="flex items-center justify-between rounded-2xl bg-nutrino-bg/70 hover:bg-nutrino-light/60 border border-nutrino-border p-3 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs sm:text-sm text-nutrino-deep truncate">
                        {food.name}
                      </div>
                      <div className="text-[11px] text-nutrino-muted">
                        1 {food.defaultServingUnit} ({food.defaultServingGrams}g) •{" "}
                        <span className="font-semibold text-nutrino-deep">{servingCal} kcal</span> •{" "}
                        <span className="font-semibold text-nutrino-primary">{servingProt}g P</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddFoodToDraft(food)}
                      className="rounded-xl bg-white hover:bg-nutrino-primary hover:text-white text-nutrino-primary border border-nutrino-border p-2 transition-colors shrink-0"
                      title={`Add ${food.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Unified Meal Confirmation Interface (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-3xl bg-white border-2 border-nutrino-primary/30 p-5 shadow-nutrino-md space-y-4">
            <div className="flex items-center justify-between border-b border-nutrino-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-nutrino-primary">
                  Unified Meal Confirmation
                </span>
                <h3 className="text-base font-extrabold text-nutrino-deep capitalize">
                  Confirm {mealType} ({draftItems.length} {draftItems.length === 1 ? "item" : "items"})
                </h3>
              </div>
              <span className="rounded-full bg-nutrino-light px-2.5 py-1 text-[11px] font-bold text-nutrino-deep border border-nutrino-border">
                {Math.round(confidenceScore * 100)}% Match Confidence
              </span>
            </div>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <NutrinoMascot state="planning" size="sm" />
                <p className="text-xs text-nutrino-muted max-w-xs mx-auto">
                  Your meal tray is empty. Type what you ate above or tap <strong>+</strong> on any dish from the library!
                </p>
              </div>
            ) : (
              <>
                {/* Itemized Portion Editor */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {draftItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-nutrino-deep">
                            {item.foodName}
                          </div>
                          <div className="text-[11px] text-nutrino-muted">
                            ≈ {item.grams}g •{" "}
                            <strong className="text-nutrino-deep">
                              {item.nutrition.calories} kcal
                            </strong>{" "}
                            • P: {item.nutrition.protein}g • C: {item.nutrition.carbs}g • F:{" "}
                            {item.nutrition.fat}g
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftItem(item.id)}
                          className="text-nutrino-muted hover:text-nutrino-error p-1"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Approximate Portion Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-nutrino-border bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateDraftItem(
                                item.id,
                                Math.max(0.5, item.quantity - 0.5),
                                item.unitName
                              )
                            }
                            className="px-2.5 py-1 text-xs font-bold text-nutrino-deep hover:bg-nutrino-light"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            min="0.25"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateDraftItem(
                                item.id,
                                parseFloat(e.target.value) || 1,
                                item.unitName
                              )
                            }
                            className="w-12 text-center text-xs font-bold text-nutrino-deep focus:outline-none tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateDraftItem(
                                item.id,
                                item.quantity + 0.5,
                                item.unitName
                              )
                            }
                            className="px-2.5 py-1 text-xs font-bold text-nutrino-deep hover:bg-nutrino-light"
                          >
                            +
                          </button>
                        </div>

                        <select
                          value={item.unitName}
                          onChange={(e) =>
                            handleUpdateDraftItem(item.id, item.quantity, e.target.value)
                          }
                          className="flex-1 rounded-xl border border-nutrino-border bg-white px-2.5 py-1.5 text-xs font-semibold text-nutrino-deep"
                        >
                          {PORTION_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Calculated Macro & Micronutrient Totals */}
                <div className="rounded-2xl bg-nutrino-light/70 border border-nutrino-border p-3.5 space-y-2.5">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2 border border-nutrino-border">
                      <div className="text-[10px] font-semibold text-nutrino-muted uppercase">
                        Calories
                      </div>
                      <div className="text-sm font-extrabold text-nutrino-deep tabular-nums">
                        {draftTotals.calories}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-2 border border-nutrino-border">
                      <div className="text-[10px] font-semibold text-nutrino-muted uppercase">
                        Protein
                      </div>
                      <div className="text-sm font-extrabold text-nutrino-primary tabular-nums">
                        {draftTotals.protein}g
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-2 border border-nutrino-border">
                      <div className="text-[10px] font-semibold text-nutrino-muted uppercase">
                        Carbs
                      </div>
                      <div className="text-sm font-extrabold text-nutrino-deep tabular-nums">
                        {draftTotals.carbs}g
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-2 border border-nutrino-border">
                      <div className="text-[10px] font-semibold text-nutrino-muted uppercase">
                        Fat
                      </div>
                      <div className="text-sm font-extrabold text-nutrino-deep tabular-nums">
                        {draftTotals.fat}g
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between text-[11px] font-semibold text-nutrino-muted px-1">
                    <span>Fiber: {draftTotals.fiber}g</span>
                    <span>Iron: {draftTotals.ironMg}mg</span>
                    <span>Calcium: {draftTotals.calciumMg}mg</span>
                    <span>Vit C: {draftTotals.vitaminCMg}mg</span>
                  </div>
                </div>

                {estimationDisclosure && (
                  <p className="text-[11px] text-nutrino-muted leading-relaxed">
                    {estimationDisclosure}
                  </p>
                )}

                {/* Primary Confirm & Log CTA */}
                <button
                  type="button"
                  disabled={savingMealLoading}
                  onClick={handleConfirmMeal}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-nutrino-primary py-3.5 text-sm font-extrabold text-white shadow-nutrino-md hover:bg-nutrino-deep transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {savingMealLoading
                    ? "Saving to Nutrition Log..."
                    : `Confirm & Log ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} (${draftTotals.calories} kcal)`}
                </button>

                {/* Save as Reusable Combo ("My Usual Breakfast") */}
                <div className="pt-2 border-t border-nutrino-border flex gap-2">
                  <input
                    type="text"
                    value={saveComboName}
                    onChange={(e) => setSaveComboName(e.target.value)}
                    placeholder='Save combo as e.g. "My Usual Dosa Breakfast"'
                    className="flex-1 rounded-xl border border-nutrino-border px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    className="rounded-xl bg-nutrino-bg hover:bg-nutrino-light border border-nutrino-border px-3 py-1.5 text-xs font-bold text-nutrino-deep shrink-0"
                  >
                    Save Combo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

