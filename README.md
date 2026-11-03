# Nutrino — Your Little Buddy for Better Eating

**Nutrino (v2.0)** is an AI-Powered Personal Nutritionist & Flexible Meal Planning Platform designed with an authentic Indian food database, Hostel & Mess Mode, and an original soft 3D-inspired avocado mascot (**Nutrino**).

---

## 1. Quick Start & Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy environment variables
cp .env.example .env.local

# 3. Start development server
npm run dev

# 4. Run production build verification
npm run build
```

Open `http://localhost:3000` in your browser.

---

## 2. Environment Variables (`.env.example`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL (falls back to persistent local SQL/JSON store `.nutrino-data/nutrino-db.json` if unset) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side Supabase service role key |
| `GEMINI_API_KEY` | Optional | Server-side Gemini API key (never exposed to client) |
| `OPENAI_API_KEY` | Optional | Server-side OpenAI API key (never exposed to client) |
| `NUTRINO_SESSION_SECRET` | Optional | Secret for signing user sessions |

---

## 3. Core Architecture & Highlights

1. **Original Soft-3D Avocado Mascot (`src/components/mascot/NutrinoMascot.tsx` & `public/mascot/nutrino-avatar.svg`)**:
   - Reusable parametric soft-3D vector character with all **11 required expression states**: `welcome`, `happy`, `thinking`, `explaining`, `planning`, `eating`, `encouraging`, `concerned`, `sleeping`, `celebration`, and `error`.
2. **Signature Contextual Greeting Engine (`src/lib/services/greeting-engine.ts`)**:
   - Dynamically adapts Nutrino's greeting, expression, and suggested next step to the user's time of day, logged meals today, remaining protein/calories, Hostel Mode, and logging streak.
3. **Centralized Nutrition Calculation Engine (`src/lib/services/nutrition-engine.ts`)**:
   - Strictly separated from AI interpretation.
   - Calculates 18 macro and micronutrient values (`Calories`, `Protein`, `Carbs`, `Fat`, `Saturated Fat`, `Fiber`, `Sugars`, `Sodium`, `Calcium`, `Iron`, `Potassium`, `Magnesium`, `Zinc`, `Vitamins A, B12, C, D`, and `Folate`) using `(grams / 100) * per100g`.
   - Supports Indian household measures (`dosa`, `idli`, `roti`, `katori`, `bowl`, `cup`, `ladle`, `glass`, `piece`, `slice`, `tbsp`, `tsp`).
4. **PostgreSQL / Supabase Schema (`supabase/migrations/001_nutrino_schema.sql`)**:
   - All 18 normalized tables with foreign keys, check constraints, indexes, historical nutrition snapshots, and Row Level Security (`auth.uid() = user_id`).

