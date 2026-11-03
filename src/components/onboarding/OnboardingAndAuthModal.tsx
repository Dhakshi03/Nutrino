"use client";

import React, { useState } from "react";
import {
  ActivityLevel,
  DietaryPreference,
  PrimaryGoal,
  UserAccount,
  UserGoals,
  UserProfile,
} from "@/types/nutrino";
import { NutrinoMascot } from "@/components/mascot/NutrinoMascot";
import { Check, Sparkles, ArrowRight, ArrowLeft, ShieldCheck, X } from "lucide-react";

interface OnboardingAndAuthModalProps {
  isOpen: boolean;
  initialMode: "auth" | "onboarding";
  currentUser: UserAccount;
  availableDemoUsers: { id: string; name: string; email: string; hostelMode: boolean }[];
  onClose: () => void;
  onSelectUser: (userId: string) => Promise<void>;
  onAuthSuccess: (user: UserAccount, startOnboarding: boolean) => void;
  onCompleteOnboarding: (payload: {
    name: string;
    profile: Partial<UserProfile>;
    goals: Partial<UserGoals>;
  }) => Promise<void>;
}

const GOAL_OPTIONS: { id: PrimaryGoal; label: string; desc: string }[] = [
  { id: "weight_loss", label: "Sustainable Weight Loss", desc: "Gentle calorie deficit without giving up Indian staples" },
  { id: "muscle_building", label: "Muscle Building & Strength", desc: "Higher daily protein & workout fuel" },
  { id: "improved_habits", label: "Improved Eating Habits", desc: "Consistent meals, better fiber & micronutrients" },
  { id: "high_protein", label: "Increase Protein Intake", desc: "Practical vegetarian, egg, or non-veg protein ideas" },
  { id: "general_health", label: "General Health & Energy", desc: "Balanced everyday nutrition & steady energy" },
  { id: "weight_maintenance", label: "Weight Maintenance", desc: "Stay nourished around your current weight" },
  { id: "sports_performance", label: "Sports & Active Performance", desc: "Energy, recovery, and hydration focus" },
  { id: "specific_concern", label: "Iron / Fiber / Nutrient Focus", desc: "Bridge common dietary gaps gently" },
];

const DIET_OPTIONS: { id: DietaryPreference; label: string; badge: string }[] = [
  { id: "vegetarian", label: "Vegetarian (Lacto-Veg)", badge: "Dairy + Plant" },
  { id: "eggetarian", label: "Eggetarian", badge: "Veg + Eggs" },
  { id: "non_vegetarian", label: "Non-Vegetarian", badge: "All Foods" },
  { id: "vegan", label: "Vegan", badge: "100% Plant-Based" },
  { id: "pescatarian", label: "Pescatarian", badge: "Veg + Fish" },
];

export function OnboardingAndAuthModal({
  isOpen,
  initialMode,
  currentUser,
  availableDemoUsers,
  onClose,
  onSelectUser,
  onAuthSuccess,
  onCompleteOnboarding,
}: OnboardingAndAuthModalProps) {
  const [mode, setMode] = useState<"auth" | "onboarding">(initialMode);
  const [authTab, setAuthTab] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(currentUser.name);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Onboarding wizard steps (1 to 5)
  const [step, setStep] = useState(1);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    currentUser.goals.primaryGoal || "improved_habits"
  );
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>(
    currentUser.goals.secondaryGoals || ["high_protein"]
  );
  const [age, setAge] = useState(currentUser.profile.age || 24);
  const [gender, setGender] = useState<UserProfile["gender"]>(
    currentUser.profile.gender || "female"
  );
  const [heightCm, setHeightCm] = useState(currentUser.profile.heightCm || 165);
  const [weightKg, setWeightKg] = useState(currentUser.profile.weightKg || 62);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    currentUser.profile.activityLevel || "moderately_active"
  );
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(
    currentUser.profile.dietaryPreference || "vegetarian"
  );
  const [allergiesText, setAllergiesText] = useState(
    (currentUser.profile.allergies || []).join(", ")
  );
  const [hostelMode, setHostelMode] = useState(currentUser.profile.hostelMode || false);
  const [foodBudget, setFoodBudget] = useState<UserProfile["foodBudget"]>(
    currentUser.profile.foodBudget || "moderate"
  );
  const [cookingFacilities, setCookingFacilities] = useState<UserProfile["cookingFacilities"]>(
    currentUser.profile.cookingFacilities || "full_kitchen"
  );

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setLoading(true);
    try {
      const action =
        authTab === "register"
          ? "register"
          : authTab === "reset"
          ? "reset_password"
          : "login";

      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          password,
          newPassword: password,
          name: name || email.split("@")[0],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
      } else if (authTab === "reset") {
        setAuthMessage(data.message || "Password updated!");
        setAuthTab("login");
      } else if (data.user) {
        if (authTab === "register") {
          setName(data.user.name);
          onAuthSuccess(data.user, true);
          setMode("onboarding");
          setStep(1);
        } else {
          onAuthSuccess(data.user, false);
          onClose();
        }
      }
    } catch {
      setAuthError("Network error while connecting to Nutrino server.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSecondaryGoal = (id: string) => {
    setSecondaryGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      await onCompleteOnboarding({
        name,
        profile: {
          age: Number(age) || 24,
          gender,
          heightCm: Number(heightCm) || 165,
          weightKg: Number(weightKg) || 62,
          activityLevel,
          dietaryPreference,
          allergies: allergiesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          hostelMode,
          foodBudget,
          cookingFacilities,
        },
        goals: {
          primaryGoal,
          secondaryGoals,
        },
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nutrino-deep/45 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-nutrino-border shadow-nutrino-lg overflow-hidden my-auto">
        {/* Top Green Accent Header */}
        <div className="flex items-center justify-between bg-nutrino-light/80 px-6 py-4 border-b border-nutrino-border">
          <div className="flex items-center gap-3">
            <NutrinoMascot
              state={
                mode === "auth"
                  ? "welcome"
                  : step === 1
                  ? "welcome"
                  : step === 5
                  ? "celebration"
                  : "explaining"
              }
              size="xs"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-nutrino-primary">
                {mode === "auth" ? "Nutrino Account & Demo Access" : `Conversational Onboarding • Step ${step} of 5`}
              </span>
              <h2 className="text-lg font-extrabold text-nutrino-deep">
                {mode === "auth"
                  ? "Welcome to Nutrino"
                  : step === 1
                  ? "Hey there! What brings you to Nutrino?"
                  : step === 2
                  ? "Tell me a little about yourself"
                  : step === 3
                  ? "How do you like to eat?"
                  : step === 4
                  ? "Your everyday lifestyle & kitchen"
                  : "Your personalized nutrition profile is ready!"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-nutrino-muted hover:bg-white hover:text-nutrino-deep transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Bar */}
        <div className="flex items-center justify-between bg-nutrino-bg px-6 py-2.5 border-b border-nutrino-border text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("onboarding")}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                mode === "onboarding"
                  ? "bg-nutrino-primary text-white"
                  : "text-nutrino-muted hover:text-nutrino-deep"
              }`}
            >
              Personalize / Onboarding Wizard
            </button>
            <button
              onClick={() => setMode("auth")}
              className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                mode === "auth"
                  ? "bg-nutrino-primary text-white"
                  : "text-nutrino-muted hover:text-nutrino-deep"
              }`}
            >
              Sign In / Register / Demo Switcher
            </button>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-nutrino-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-nutrino-primary" />
            Private & User-Isolated
          </span>
        </div>

        {mode === "auth" ? (
          <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* Instant Demo Profiles */}
            <div className="rounded-2xl bg-nutrino-light/60 border border-nutrino-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-nutrino-deep">
                  Instant Demo Profiles (1-Tap Switch)
                </span>
                <span className="rounded-full bg-nutrino-accent/60 px-2.5 py-0.5 text-[11px] font-bold text-nutrino-deep">
                  Pre-Loaded Indian Meals
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableDemoUsers.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={async () => {
                      await onSelectUser(demo.id);
                      onClose();
                    }}
                    className={`flex items-center justify-between rounded-xl p-3 text-left border transition-all ${
                      currentUser.id === demo.id
                        ? "bg-white border-nutrino-primary ring-2 ring-nutrino-primary/20"
                        : "bg-white/80 border-nutrino-border hover:border-nutrino-primary"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-nutrino-deep">{demo.name}</div>
                      <div className="text-xs text-nutrino-muted">
                        {demo.hostelMode ? "Hostel Mess + Budget Protein" : "Home & Office Indian Meals"}
                      </div>
                    </div>
                    {currentUser.id === demo.id && (
                      <span className="rounded-full bg-nutrino-primary text-white p-1">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Email / Password Form */}
            <div>
              <div className="flex gap-2 border-b border-nutrino-border pb-3 mb-4">
                {(["login", "register", "reset"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setAuthTab(t);
                      setAuthError("");
                      setAuthMessage("");
                    }}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold capitalize transition-colors ${
                      authTab === t
                        ? "bg-nutrino-deep text-white"
                        : "bg-nutrino-bg text-nutrino-muted hover:text-nutrino-deep"
                    }`}
                  >
                    {t === "reset" ? "Reset Password" : t === "register" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>

              {authError && (
                <div className="mb-4 rounded-xl bg-nutrino-error/15 border border-nutrino-error px-4 py-2.5 text-xs font-semibold text-nutrino-deep">
                  {authError}
                </div>
              )}
              {authMessage && (
                <div className="mb-4 rounded-xl bg-nutrino-light border border-nutrino-primary px-4 py-2.5 text-xs font-semibold text-nutrino-deep">
                  {authMessage}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authTab === "register" && (
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ananya Verma"
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm focus:border-nutrino-primary focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-nutrino-deep mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@nutrino.app"
                    className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm focus:border-nutrino-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-nutrino-deep mb-1">
                    {authTab === "reset" ? "New Password" : "Password"}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm focus:border-nutrino-primary focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-nutrino-primary py-3 text-sm font-bold text-white shadow-nutrino-sm hover:bg-nutrino-deep transition-colors"
                >
                  {loading
                    ? "Please wait..."
                    : authTab === "register"
                    ? "Create Account & Start Onboarding"
                    : authTab === "reset"
                    ? "Update Password"
                    : "Sign In to Nutrino"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* CONVERSATIONAL ONBOARDING WIZARD */
          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Conversational Mascot Bubble */}
            <div className="flex items-center gap-4 rounded-2xl bg-nutrino-light/75 border border-nutrino-border p-4">
              <NutrinoMascot
                state={
                  step === 1
                    ? "welcome"
                    : step === 2
                    ? "thinking"
                    : step === 3
                    ? "eating"
                    : step === 4
                    ? "planning"
                    : "celebration"
                }
                size="sm"
              />
              <p className="text-sm font-medium text-nutrino-deep leading-relaxed">
                {step === 1 &&
                  `"Hey there! I'm Nutrino. Let's get to know you so I can help you eat better—without weighing every grain of rice. Pick your main goal below!"`}
                {step === 2 &&
                  `"Got it! Sharing your approximate height, weight, and activity helps me calculate safe, realistic energy and protein targets."`}
                {step === 3 &&
                  `"Whether you love South Indian idli-sambar, North Indian dal-roti, eggs, or chicken—I'll tailor everything around your food culture."`}
                {step === 4 &&
                  `"Are you living in a hostel or eating mess food? Turn on Hostel Mode and I'll suggest zero-cook protein additions and mess-friendly portions!"`}
                {step === 5 &&
                  `"Your nutrition profile is ready! Let's make this journey yours, one meal at a time."`}
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-nutrino-muted mb-2">
                    Primary Goal (Choose 1)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setPrimaryGoal(g.id)}
                        className={`rounded-2xl p-3.5 text-left border transition-all ${
                          primaryGoal === g.id
                            ? "bg-nutrino-light border-nutrino-primary ring-2 ring-nutrino-primary/20"
                            : "bg-white border-nutrino-border hover:border-nutrino-sage"
                        }`}
                      >
                        <div className="font-bold text-sm text-nutrino-deep">{g.label}</div>
                        <div className="text-xs text-nutrino-muted mt-0.5">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-nutrino-muted mb-2">
                    Secondary Focus Areas (Select any)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["high_protein", "better_fiber", "budget_eating", "iron_b12_focus", "consistent_meals"].map(
                      (sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => toggleSecondaryGoal(sec)}
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                            secondaryGoals.includes(sec)
                              ? "bg-nutrino-deep text-white border-nutrino-deep"
                              : "bg-nutrino-bg text-nutrino-text border-nutrino-border"
                          }`}
                        >
                          {sec.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1">
                      Preferred Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={14}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={220}
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-nutrino-deep mb-1.5">
                    Physiological Reference (for BMR & Iron RDA)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["female", "male", "non-binary", "prefer-not-to-say"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`rounded-xl py-2 px-3 text-xs font-bold capitalize border ${
                          gender === g
                            ? "bg-nutrino-primary text-white border-nutrino-primary"
                            : "bg-white text-nutrino-text border-nutrino-border"
                        }`}
                      >
                        {g.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-nutrino-deep mb-1.5">
                    Daily Activity Level
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        { id: "sedentary", label: "Sedentary", sub: "Desk job / study" },
                        { id: "lightly_active", label: "Lightly Active", sub: "1–2 workouts/wk" },
                        { id: "moderately_active", label: "Moderately Active", sub: "3–4 workouts/wk" },
                        { id: "very_active", label: "Very Active", sub: "5–6 workouts/wk" },
                        { id: "extremely_active", label: "Athlete / Intense", sub: "Daily training" },
                      ] as const
                    ).map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setActivityLevel(act.id)}
                        className={`rounded-xl p-2.5 text-left border ${
                          activityLevel === act.id
                            ? "bg-nutrino-light border-nutrino-primary"
                            : "bg-white border-nutrino-border"
                        }`}
                      >
                        <div className="text-xs font-bold text-nutrino-deep">{act.label}</div>
                        <div className="text-[11px] text-nutrino-muted">{act.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-nutrino-muted mb-2">
                    Dietary Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DIET_OPTIONS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDietaryPreference(d.id)}
                        className={`flex items-center justify-between rounded-2xl p-3.5 border text-left ${
                          dietaryPreference === d.id
                            ? "bg-nutrino-light border-nutrino-primary ring-2 ring-nutrino-primary/20"
                            : "bg-white border-nutrino-border"
                        }`}
                      >
                        <span className="font-bold text-sm text-nutrino-deep">{d.label}</span>
                        <span className="rounded-full bg-nutrino-bg px-2.5 py-0.5 text-[11px] font-semibold text-nutrino-muted border border-nutrino-border">
                          {d.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-nutrino-deep mb-1">
                    Allergies or Foods to Avoid (Comma separated, optional)
                  </label>
                  <input
                    type="text"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    placeholder="e.g., Peanuts, Mushroom, Prawns"
                    className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div
                  onClick={() => setHostelMode(!hostelMode)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all flex items-center justify-between ${
                    hostelMode
                      ? "bg-nutrino-light border-nutrino-primary ring-2 ring-nutrino-primary/20"
                      : "bg-white border-nutrino-border"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-nutrino-deep">
                      Enable Hostel / Student Mess Mode
                    </div>
                    <div className="text-xs text-nutrino-muted mt-0.5">
                      Tailors recommendations for mess meals, kettle/no-cook snacks (roasted chana, sprouts, curd, boiled eggs), and student budgets.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hostelMode}
                    onChange={(e) => setHostelMode(e.target.checked)}
                    className="h-5 w-5 accent-nutrino-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1.5">
                      Cooking Setup
                    </label>
                    <select
                      value={cookingFacilities}
                      onChange={(e) =>
                        setCookingFacilities(e.target.value as UserProfile["cookingFacilities"])
                      }
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="full_kitchen">Full Home Kitchen</option>
                      <option value="basic_kitchen">Basic Stove / Induction</option>
                      <option value="kettle_induction">Hostel Kettle / Microwave Only</option>
                      <option value="none_hostel">Mess / Canteen Only (No Cooking)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-nutrino-deep mb-1.5">
                      Food Budget Preference
                    </label>
                    <select
                      value={foodBudget}
                      onChange={(e) =>
                        setFoodBudget(e.target.value as UserProfile["foodBudget"])
                      }
                      className="w-full rounded-xl border border-nutrino-border px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="budget_student">Student / Pocket-Friendly</option>
                      <option value="moderate">Moderate Everyday</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="rounded-2xl bg-nutrino-bg border border-nutrino-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-nutrino-primary">
                      Mifflin-St Jeor + ICMR-NIN Safe Targets
                    </span>
                    <h3 className="text-lg font-extrabold text-nutrino-deep">
                      {name}&apos;s Daily Nutrition Blueprint
                    </h3>
                  </div>
                  <Sparkles className="h-6 w-6 text-nutrino-primary" />
                </div>
                <p className="text-xs text-nutrino-muted">
                  When you click <strong>Save & Launch Dashboard</strong>, Nutrino will calculate your exact daily calories, protein, carbs, fat, fiber, and 10 micronutrients—and generate your personalized Indian meal plan!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-xl bg-white p-3 border border-nutrino-border">
                    <div className="text-xs text-nutrino-muted">Primary Goal</div>
                    <div className="text-sm font-extrabold text-nutrino-deep capitalize mt-0.5">
                      {primaryGoal.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-nutrino-border">
                    <div className="text-xs text-nutrino-muted">Diet Style</div>
                    <div className="text-sm font-extrabold text-nutrino-deep capitalize mt-0.5">
                      {dietaryPreference.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-nutrino-border">
                    <div className="text-xs text-nutrino-muted">Metrics</div>
                    <div className="text-sm font-extrabold text-nutrino-deep mt-0.5">
                      {heightCm}cm • {weightKg}kg
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-nutrino-border">
                    <div className="text-xs text-nutrino-muted">Hostel Mode</div>
                    <div className="text-sm font-extrabold text-nutrino-primary mt-0.5">
                      {hostelMode ? "Active" : "Standard"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-3 border-t border-nutrino-border">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-nutrino-border bg-white px-4 py-2.5 text-xs font-bold text-nutrino-deep hover:bg-nutrino-bg"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-nutrino-primary px-5 py-2.5 text-xs font-bold text-white shadow-nutrino-sm hover:bg-nutrino-deep"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={finishOnboarding}
                  className="inline-flex items-center gap-2 rounded-xl bg-nutrino-primary px-6 py-3 text-sm font-bold text-white shadow-nutrino-md hover:bg-nutrino-deep"
                >
                  <Check className="h-4 w-4" />
                  {loading ? "Calculating Targets..." : "Save & Launch Dashboard"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

