"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AIActionCard,
  AIMessage,
  NutrientSnapshot,
  UserAccount,
} from "@/types/nutrino";
import { NutrinoMascot } from "@/components/mascot/NutrinoMascot";
import {
  Send,
  Sparkles,
  X,
  CheckCircle2,
  PlusCircle,
} from "lucide-react";

interface AINutritionistModalProps {
  isOpen: boolean;
  user: UserAccount;
  todayTotals: NutrientSnapshot;
  messages: AIMessage[];
  initialPrompt?: string;
  onClose: () => void;
  onSendMessage: (question: string) => Promise<void>;
  onLogActionCard: (card: AIActionCard) => Promise<void>;
}

const SUGGESTED_PROMPTS = [
  "What should I eat for breakfast?",
  "How can I increase protein today?",
  "Suggest a budget-friendly vegetarian dinner",
  "How are my calories and micronutrients looking today?",
];

export function AINutritionistModal({
  isOpen,
  user,
  todayTotals,
  messages,
  initialPrompt = "",
  onClose,
  onSendMessage,
  onLogActionCard,
}: AINutritionistModalProps) {
  const [input, setInput] = useState(initialPrompt);
  const [isSending, setIsSending] = useState(false);
  const [loggedCardTitle, setLoggedCardTitle] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToAsk: string) => {
    const q = textToAsk.trim();
    if (!q || isSending) return;
    setInput("");
    setIsSending(true);
    try {
      await onSendMessage(q);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-nutrino-deep/45 backdrop-blur-sm sm:p-4">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] sm:h-[82vh] rounded-t-3xl sm:rounded-3xl bg-nutrino-bg border border-nutrino-border shadow-nutrino-lg overflow-hidden">
        {/* Top Conversational Header */}
        <div className="flex items-center justify-between bg-white px-5 py-3.5 border-b border-nutrino-border">
          <div className="flex items-center gap-3">
            <NutrinoMascot
              state={isSending ? "thinking" : "explaining"}
              size="xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-nutrino-deep">
                  Nutrino AI Nutritionist
                </h3>
                <span className="rounded-full bg-nutrino-light px-2 py-0.5 text-[10px] font-bold text-nutrino-primary border border-nutrino-border">
                  Context-Aware
                </span>
              </div>
              <p className="text-xs text-nutrino-muted">
                Today: {todayTotals.calories} / {user.targets.calories} kcal •{" "}
                {todayTotals.protein}g / {user.targets.protein}g Protein
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-nutrino-muted hover:bg-nutrino-light hover:text-nutrino-deep transition-colors"
            aria-label="Close AI assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="shrink-0 mt-1">
                  <NutrinoMascot state={msg.mascotState || "explaining"} size="xs" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-3xl p-4 space-y-3 ${
                  msg.role === "user"
                    ? "bg-nutrino-primary text-white rounded-br-md"
                    : "bg-white border border-nutrino-border text-nutrino-text rounded-bl-md shadow-nutrino-sm"
                }`}
              >
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {msg.content}
                </div>

                {/* Actionable Meal Suggestion Cards */}
                {msg.actionCards && msg.actionCards.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {msg.actionCards.map((card, idx) => {
                      const isLogged = loggedCardTitle === card.title;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl bg-nutrino-light/65 border border-nutrino-border p-3.5 space-y-2 text-nutrino-deep"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-nutrino-primary">
                                Suggested {card.mealType}
                              </span>
                              <h4 className="font-extrabold text-xs sm:text-sm text-nutrino-deep">
                                {card.title}
                              </h4>
                              <p className="text-[11px] text-nutrino-muted">
                                {card.servingDescription}
                              </p>
                            </div>
                            <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-extrabold text-nutrino-deep border border-nutrino-border shrink-0">
                              {card.nutrition.calories} kcal
                            </span>
                          </div>

                          <p className="text-[11px] text-nutrino-text">
                            {card.whyItFits}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-2 text-[11px] font-bold">
                              <span className="text-nutrino-primary">
                                P: {card.nutrition.protein}g
                              </span>
                              <span>C: {card.nutrition.carbs}g</span>
                              <span>F: {card.nutrition.fat}g</span>
                            </div>

                            <button
                              type="button"
                              onClick={async () => {
                                await onLogActionCard(card);
                                setLoggedCardTitle(card.title);
                                setTimeout(() => setLoggedCardTitle(null), 3500);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-nutrino-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-nutrino-deep transition-colors"
                            >
                              {isLogged ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Logged!
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="h-3.5 w-3.5" /> Log This Meal
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-3">
              <NutrinoMascot state="thinking" size="xs" />
              <div className="rounded-2xl bg-white border border-nutrino-border px-4 py-2.5 text-xs font-semibold text-nutrino-muted">
                Nutrino is checking your profile and calculating meal options...
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Suggested Prompts Bar */}
        <div className="bg-white px-4 pt-2.5 pb-1 border-t border-nutrino-border flex gap-1.5 overflow-x-auto">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-full bg-nutrino-light/70 hover:bg-nutrino-light border border-nutrino-border px-3 py-1 text-[11px] font-bold text-nutrino-deep whitespace-nowrap transition-colors"
            >
              <Sparkles className="h-3 w-3 inline mr-1 text-nutrino-primary" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="bg-white p-3.5 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nutrino about meals, protein, hostel snacks, or your weekly progress..."
            className="flex-1 rounded-2xl border border-nutrino-border bg-nutrino-bg px-4 py-2.5 text-xs sm:text-sm focus:border-nutrino-primary focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center justify-center rounded-2xl bg-nutrino-primary p-3 text-white shadow-nutrino-sm hover:bg-nutrino-deep transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

