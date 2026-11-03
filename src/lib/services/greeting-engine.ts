import {
  ContextualGreeting,
  LoggedMeal,
  MascotState,
  NutrientSnapshot,
  UserAccount,
} from "@/types/nutrino";

/**
 * Signature Interaction: Contextual Greeting Engine
 * Generates a dynamic, personalized Nutrino greeting and mascot expression
 * whenever the user opens or interacts with the dashboard—adapting to:
 *  - Time of day (Early morning, Breakfast window, Lunch, Evening Chai/Snack, Dinner, Late night)
 *  - Meals logged so far today (0 meals, just breakfast, mid-day progress, protein/fiber pace)
 *  - User lifestyle (Hostel mode, primary goal, logging consistency)
 */
export function generateContextualGreeting(params: {
  user: UserAccount;
  todayMeals: LoggedMeal[];
  todayTotals: NutrientSnapshot;
  hourOfDay?: number;
  streakDays?: number;
}): ContextualGreeting {
  const { user, todayMeals, todayTotals, streakDays = 1 } = params;
  const hour =
    typeof params.hourOfDay === "number"
      ? params.hourOfDay
      : new Date().getHours();

  const firstName = user.name.split(" ")[0] || "Friend";
  const hasBreakfast = todayMeals.some((m) => m.mealType === "breakfast");
  const hasLunch = todayMeals.some((m) => m.mealType === "lunch");
  const hasDinner = todayMeals.some((m) => m.mealType === "dinner");
  const mealCount = todayMeals.length;

  const calRatio = user.targets.calories > 0 ? todayTotals.calories / user.targets.calories : 0;
  const proteinRatio = user.targets.protein > 0 ? todayTotals.protein / user.targets.protein : 0;
  const proteinRemaining = Math.max(0, Math.round(user.targets.protein - todayTotals.protein));

  // 1. Late Night / Rest Window (22:30 - 04:59)
  if (hour >= 23 || hour < 5) {
    return {
      headline: `Winding down, ${firstName}?`,
      subtext:
        mealCount > 0
          ? `You logged ${mealCount} meal${mealCount > 1 ? "s" : ""} today (${todayTotals.calories} kcal). Rest up well—sleep is just as important as nutrition!`
          : `It's late! Even if you didn't log today, tomorrow is a fresh canvas. Get some good rest.`,
      mascotState: "sleeping",
      badgeText: "Night Rest Mode",
      suggestedActionLabel: mealCount === 0 ? "Quick-log dinner before bed" : "View today's summary",
      suggestedActionTarget: mealCount === 0 ? "track" : "insights",
      suggestedPrompt: "What's a light, sleep-friendly late night snack?",
    };
  }

  // 2. Milestone Celebration: Reached >= 85% of protein & reasonable calories
  if (proteinRatio >= 0.85 && calRatio >= 0.7 && calRatio <= 1.15) {
    return {
      headline: `Look at you go, ${firstName}!`,
      subtext: `You've hit ${todayTotals.protein}g of your ${user.targets.protein}g protein goal today! Consistent days like this build lasting habits.`,
      mascotState: "celebration",
      badgeText: `${streakDays}-Day Momentum`,
      suggestedActionLabel: "See your nutrient breakdown",
      suggestedActionTarget: "insights",
      suggestedPrompt: "Explain my nutritional balance today!",
    };
  }

  // 3. Morning Window (05:00 - 10:59)
  if (hour >= 5 && hour < 11) {
    if (!hasBreakfast && mealCount === 0) {
      return {
        headline: `Good morning, ${firstName}! Ready for a fresh start?`,
        subtext: user.profile.hostelMode
          ? `What's on the hostel mess breakfast menu today? Tell me in plain words—like "2 idlis and sambar"—and I'll handle the rest!`
          : `No need to weigh anything today. Just tell me what you had for breakfast or tap a saved meal to start your day.`,
        mascotState: "welcome",
        badgeText: "Morning Kickoff",
        suggestedActionLabel: "Log Breakfast",
        suggestedActionTarget: "track",
        suggestedPrompt: "What should I eat for a high-protein Indian breakfast?",
      };
    }

    return {
      headline: `Yay, ${firstName}! Breakfast is logged.`,
      subtext: `You're off to a great start with ${todayTotals.calories} kcal and ${todayTotals.protein}g protein. Want to peek at lunch ideas that balance your afternoon?`,
      mascotState: "happy",
      badgeText: "Great Morning Start",
      suggestedActionLabel: "Plan Lunch",
      suggestedActionTarget: "planner",
      suggestedPrompt: "Suggest a balanced Indian lunch to complement my breakfast.",
    };
  }

  // 4. Midday / Lunch Window (11:00 - 15:59)
  if (hour >= 11 && hour < 16) {
    if (mealCount === 0) {
      return {
        headline: `Hey ${firstName}! Busy morning?`,
        subtext: `That's totally okay! Whether you grabbed a quick chai & poha or you're heading into lunch now, let's log it in seconds.`,
        mascotState: "encouraging",
        badgeText: "Midday Check-In",
        suggestedActionLabel: "Quick Log Meal",
        suggestedActionTarget: "track",
        suggestedPrompt: "I had two dosas and a bowl of sambar",
      };
    }

    if (!hasLunch) {
      return {
        headline: `Lunchtime, ${firstName}! Let's fuel your afternoon.`,
        subtext: `You have ${proteinRemaining}g protein left for today. Adding a katori of dal, curd, sprouts, or eggs at lunch will keep your energy steady!`,
        mascotState: "planning",
        badgeText: "Lunch Idea Ready",
        suggestedActionLabel: "Log or Plan Lunch",
        suggestedActionTarget: "track",
        suggestedPrompt: "Suggest a filling lunch with at least 20g protein.",
      };
    }

    return {
      headline: `Afternoon check-in, ${firstName}!`,
      subtext: `Lunch is in the books (${todayTotals.calories} / ${user.targets.calories} kcal so far). Feeling a 4 PM slump later? I have smart chai-time snack ideas ready.`,
      mascotState: "explaining",
      badgeText: `${Math.round(proteinRatio * 100)}% Protein Goal`,
      suggestedActionLabel: "Ask Nutrino for Snack Ideas",
      suggestedActionTarget: "ai",
      suggestedPrompt: "Suggest a healthy 4 PM Indian snack with tea.",
    };
  }

  // 5. Evening Tea / Snack Window (16:00 - 18:59)
  if (hour >= 16 && hour < 19) {
    return {
      headline: `Good evening, ${firstName}! Chai or snack time?`,
      subtext:
        proteinRatio < 0.5
          ? `Looks like we're at ${todayTotals.protein}g protein so far today. A handful of roasted chana, sprouts chaat, or boiled eggs right now works wonders!`
          : `You're pacing nicely at ${todayTotals.calories} kcal today. Log your evening snack or let's figure out what's for dinner!`,
      mascotState: proteinRatio < 0.5 ? "explaining" : "eating",
      badgeText: "Evening Fuel",
      suggestedActionLabel: "Log Evening Snack",
      suggestedActionTarget: "track",
      suggestedPrompt: "How can I add 15g protein in my evening snack on a budget?",
    };
  }

  // 6. Dinner Window (19:00 - 22:59)
  if (!hasDinner) {
    return {
      headline: `Dinner time, ${firstName}! Let's wrap up strong.`,
      subtext:
        proteinRemaining > 20
          ? `We have room for ~${Math.max(300, user.targets.calories - todayTotals.calories)} kcal and ${proteinRemaining}g protein. Want a comforting dinner suggestion that fits?`
          : `You've had a well-paced day so far! Log your dinner whenever you're ready.`,
      mascotState: "planning",
      badgeText: "Evening Wrap-Up",
      suggestedActionLabel: "Log Dinner",
      suggestedActionTarget: "track",
      suggestedPrompt: "What should I eat for dinner tonight based on my remaining macros?",
    };
  }

  return {
    headline: `Awesome consistency today, ${firstName}!`,
    subtext: `All main meals logged (${todayTotals.calories} kcal, ${todayTotals.protein}g protein, ${todayTotals.fiber}g fiber). You're building habits one meal at a time!`,
    mascotState: "happy",
    badgeText: "Daily Complete",
    suggestedActionLabel: "View Daily Insights",
    suggestedActionTarget: "insights",
    suggestedPrompt: "Summarize how I ate today and one tip for tomorrow.",
  };
}

