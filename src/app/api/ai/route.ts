import { NextRequest, NextResponse } from "next/server";
import { readDatabase, sanitizeUser, writeDatabase } from "@/lib/db/store";
import {
  analyzePhotoMealSync,
  generateNutritionistResponseSync,
  parseNaturalLanguageMealSync,
} from "@/lib/services/ai-nutritionist";
import { sumNutrientSnapshots } from "@/lib/services/nutrition-engine";
import { AIMessage, MealType } from "@/types/nutrino";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = "parse_text",
      userId = "user-demo-priya",
      text = "",
      mealType = "breakfast",
    } = body;

    const db = readDatabase();
    const userRecord = db.users.find((u) => u.id === userId) || db.users[0];
    const safeUser = sanitizeUser(userRecord);

    if (mode === "parse_text" || mode === "parse_voice") {
      const parsed = parseNaturalLanguageMealSync(String(text), mealType as MealType);
      return NextResponse.json({ draft: parsed });
    }

    if (mode === "parse_photo") {
      const parsed = analyzePhotoMealSync(String(text || "South Indian Dosa Sambar"), mealType as MealType);
      return NextResponse.json({ draft: parsed });
    }

    if (mode === "chat") {
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayMeals = db.meals.filter(
        (m) => m.userId === safeUser.id && m.dateKey === todayKey
      );
      const todayTotals = sumNutrientSnapshots(todayMeals.map((m) => m.totalNutrition));

      const userMsg: AIMessage = {
        id: `msg-u-${Date.now()}`,
        role: "user",
        content: String(text).trim(),
        mascotState: "thinking",
        createdAt: new Date().toISOString(),
      };

      const replyData = generateNutritionistResponseSync({
        question: String(text),
        user: safeUser,
        todayMeals,
        todayTotals,
      });

      const assistantMsg: AIMessage = {
        id: `msg-a-${Date.now() + 1}`,
        role: "assistant",
        content: replyData.content,
        mascotState: replyData.mascotState,
        actionCards: replyData.actionCards,
        createdAt: new Date().toISOString(),
        providerBadge: replyData.providerBadge,
      };

      if (!db.chatByUserId[safeUser.id]) {
        db.chatByUserId[safeUser.id] = [];
      }
      db.chatByUserId[safeUser.id].push(userMsg, assistantMsg);
      writeDatabase(db);

      return NextResponse.json({
        messages: db.chatByUserId[safeUser.id],
        latestReply: assistantMsg,
      });
    }

    return NextResponse.json({ error: "Unsupported AI mode" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI processing error" },
      { status: 500 }
    );
  }
}

