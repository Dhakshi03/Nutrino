-- =============================================================================
-- NUTRINO v2.0 — Complete Normalized PostgreSQL / Supabase Database Schema
-- Includes 18 core entities, indexes, constraints, historical snapshots & RLS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER_PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  age INT CHECK (age >= 13 AND age <= 120),
  gender TEXT CHECK (gender IN ('female', 'male', 'non-binary', 'prefer-not-to-say')),
  height_cm NUMERIC(5,2) CHECK (height_cm >= 100 AND height_cm <= 250),
  weight_kg NUMERIC(5,2) CHECK (weight_kg >= 25 AND weight_kg <= 300),
  activity_level TEXT NOT NULL DEFAULT 'moderately_active'
    CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  exercise_frequency_days INT DEFAULT 3 CHECK (exercise_frequency_days >= 0 AND exercise_frequency_days <= 7),
  dietary_preference TEXT NOT NULL DEFAULT 'vegetarian'
    CHECK (dietary_preference IN ('vegetarian', 'vegan', 'eggetarian', 'non_vegetarian', 'pescatarian', 'other')),
  allergies TEXT[] DEFAULT '{}',
  intolerances TEXT[] DEFAULT '{}',
  country TEXT DEFAULT 'India',
  region TEXT DEFAULT 'South & North Indian',
  unit_preference TEXT DEFAULT 'metric' CHECK (unit_preference IN ('metric', 'imperial')),
  wake_time TEXT DEFAULT '07:00',
  sleep_time TEXT DEFAULT '23:00',
  cooking_facilities TEXT DEFAULT 'full_kitchen' CHECK (cooking_facilities IN ('none_hostel', 'kettle_induction', 'basic_kitchen', 'full_kitchen')),
  hostel_mode BOOLEAN DEFAULT FALSE,
  eating_out_frequency TEXT DEFAULT '1_2_weekly',
  food_budget TEXT DEFAULT 'moderate' CHECK (food_budget IN ('budget_student', 'moderate', 'flexible')),
  preferred_meals_per_day INT DEFAULT 4 CHECK (preferred_meals_per_day BETWEEN 2 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. USER_GOALS
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  primary_goal TEXT NOT NULL DEFAULT 'general_health'
    CHECK (primary_goal IN (
      'weight_loss',
      'weight_maintenance',
      'muscle_building',
      'general_health',
      'improved_habits',
      'high_protein',
      'sports_performance',
      'specific_concern',
      'custom'
    )),
  secondary_goals TEXT[] DEFAULT '{}',
  custom_goal_text TEXT,
  target_weight_kg NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. NUTRITION_TARGETS
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  calories INT NOT NULL CHECK (calories >= 1200 AND calories <= 5000),
  protein_g INT NOT NULL CHECK (protein_g >= 30),
  carbs_g INT NOT NULL CHECK (carbs_g >= 50),
  fat_g INT NOT NULL CHECK (fat_g >= 25),
  saturated_fat_g INT NOT NULL DEFAULT 20,
  fiber_g INT NOT NULL DEFAULT 30,
  sugars_g INT NOT NULL DEFAULT 36,
  sodium_mg INT NOT NULL DEFAULT 2000,
  calcium_mg INT NOT NULL DEFAULT 1000,
  iron_mg NUMERIC(5,1) NOT NULL DEFAULT 17,
  potassium_mg INT NOT NULL DEFAULT 3500,
  magnesium_mg INT NOT NULL DEFAULT 380,
  zinc_mg NUMERIC(5,1) NOT NULL DEFAULT 11,
  vitamin_a_mcg INT NOT NULL DEFAULT 800,
  vitamin_b12_mcg NUMERIC(5,2) NOT NULL DEFAULT 2.4,
  vitamin_c_mg INT NOT NULL DEFAULT 80,
  vitamin_d_mcg INT NOT NULL DEFAULT 15,
  folate_mcg INT NOT NULL DEFAULT 300,
  calculation_method TEXT NOT NULL DEFAULT 'mifflin_st_jeor_icmr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FOOD_ITEMS (Verified ICMR-NIN & USDA records per 100g)
CREATE TABLE IF NOT EXISTS public.food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  cuisine TEXT NOT NULL DEFAULT 'Indian',
  diet_type TEXT NOT NULL CHECK (diet_type IN ('vegan', 'vegetarian', 'eggetarian', 'non_vegetarian')),
  source_database TEXT NOT NULL DEFAULT 'ICMR-NIN',
  is_hostel_staple BOOLEAN DEFAULT FALSE,
  budget_tier TEXT DEFAULT 'low' CHECK (budget_tier IN ('low', 'medium', 'high')),
  default_serving_unit TEXT NOT NULL,
  default_serving_grams NUMERIC(6,1) NOT NULL,
  -- Per 100g verified nutrient values
  calories_per_100g NUMERIC(6,1) NOT NULL,
  protein_per_100g NUMERIC(5,2) NOT NULL,
  carbs_per_100g NUMERIC(5,2) NOT NULL,
  fat_per_100g NUMERIC(5,2) NOT NULL,
  saturated_fat_per_100g NUMERIC(5,2) DEFAULT 0,
  fiber_per_100g NUMERIC(5,2) DEFAULT 0,
  sugars_per_100g NUMERIC(5,2) DEFAULT 0,
  sodium_mg_per_100g NUMERIC(6,1) DEFAULT 0,
  calcium_mg_per_100g NUMERIC(6,1) DEFAULT 0,
  iron_mg_per_100g NUMERIC(5,2) DEFAULT 0,
  potassium_mg_per_100g NUMERIC(6,1) DEFAULT 0,
  magnesium_mg_per_100g NUMERIC(6,1) DEFAULT 0,
  zinc_mg_per_100g NUMERIC(5,2) DEFAULT 0,
  vitamin_a_mcg_per_100g NUMERIC(6,1) DEFAULT 0,
  vitamin_b12_mcg_per_100g NUMERIC(5,2) DEFAULT 0,
  vitamin_c_mg_per_100g NUMERIC(5,2) DEFAULT 0,
  vitamin_d_mcg_per_100g NUMERIC(5,2) DEFAULT 0,
  folate_mcg_per_100g NUMERIC(6,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items (name);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON public.food_items (category);

-- 6. FOOD_SERVINGS (Food-specific approximate portion conversions)
CREATE TABLE IF NOT EXISTS public.food_servings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id TEXT NOT NULL REFERENCES public.food_items(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  label TEXT NOT NULL,
  grams_equivalent NUMERIC(6,1) NOT NULL CHECK (grams_equivalent > 0)
);

CREATE INDEX IF NOT EXISTS idx_food_servings_food_id ON public.food_servings (food_id);

-- 7. RECIPES
CREATE TABLE IF NOT EXISTS public.recipes (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT NOT NULL DEFAULT 'Indian',
  diet_type TEXT NOT NULL DEFAULT 'vegetarian',
  prep_time_mins INT NOT NULL DEFAULT 15,
  servings INT NOT NULL DEFAULT 1,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  budget_tier TEXT DEFAULT 'low',
  is_hostel_friendly BOOLEAN DEFAULT FALSE,
  nutrition_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RECIPE_INGREDIENTS
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id TEXT NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES public.food_items(id),
  quantity NUMERIC(6,2) NOT NULL,
  unit_name TEXT NOT NULL,
  grams NUMERIC(6,1) NOT NULL
);

-- 9. MEALS (Logged meal events with historical nutrition snapshot)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  date_key TEXT NOT NULL, -- YYYY-MM-DD
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logging_method TEXT NOT NULL DEFAULT 'manual' CHECK (logging_method IN ('text', 'photo', 'voice', 'manual', 'saved_meal', 'meal_plan')),
  raw_input TEXT,
  confidence_score NUMERIC(3,2) DEFAULT 1.0,
  nutrition_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals (user_id, date_key);

-- 10. MEAL_ITEMS (Individual food entries inside a logged meal)
CREATE TABLE IF NOT EXISTS public.meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES public.food_items(id),
  food_name TEXT NOT NULL,
  quantity NUMERIC(6,2) NOT NULL CHECK (quantity > 0),
  unit_name TEXT NOT NULL,
  grams NUMERIC(6,1) NOT NULL CHECK (grams > 0),
  nutrition_snapshot JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON public.meal_items (meal_id);

-- 11. MEAL_PLANS
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('daily', 'weekly')),
  start_date TEXT NOT NULL,
  title TEXT NOT NULL,
  available_ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PLANNED_MEALS
CREATE TABLE IF NOT EXISTS public.planned_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  title TEXT NOT NULL,
  serving_description TEXT NOT NULL,
  prep_time_mins INT NOT NULL DEFAULT 15,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  items JSONB NOT NULL,
  nutrition_snapshot JSONB NOT NULL
);

-- 13. SAVED_MEALS (1-tap repeat combos like "My Usual Breakfast")
CREATE TABLE IF NOT EXISTS public.saved_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_meal_type TEXT NOT NULL DEFAULT 'breakfast',
  items JSONB NOT NULL,
  nutrition_snapshot JSONB NOT NULL,
  times_logged INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PROGRESS_ENTRIES
CREATE TABLE IF NOT EXISTS public.progress_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  weight_kg NUMERIC(5,2),
  water_glasses INT DEFAULT 0,
  energy_rating INT CHECK (energy_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date_key)
);

-- 15. AI_CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Chat with Nutrino',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AI_MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  mascot_state TEXT DEFAULT 'explaining',
  action_cards JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. GROCERY_LISTS
CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Weekly Grocery List',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. GROCERY_ITEMS
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Produce',
  quantity_label TEXT NOT NULL DEFAULT '1 unit',
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforces strict user data isolation so users can only access their own records
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_servings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

-- Public read access for verified food items & servings
CREATE POLICY "Public read food_items" ON public.food_items FOR SELECT USING (true);
CREATE POLICY "Public read food_servings" ON public.food_servings FOR SELECT USING (true);
CREATE POLICY "Public or owner read recipes" ON public.recipes FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Public read recipe_ingredients" ON public.recipe_ingredients FOR SELECT USING (true);

-- User-isolated policies
CREATE POLICY "Users own record" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own goals" ON public.user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own targets" ON public.nutrition_targets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own meal_items" ON public.meal_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meals m WHERE m.id = meal_items.meal_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users own meal_plans" ON public.meal_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own planned_meals" ON public.planned_meals FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meal_plans mp WHERE mp.id = planned_meals.plan_id AND mp.user_id = auth.uid())
);
CREATE POLICY "Users own saved_meals" ON public.saved_meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own progress" ON public.progress_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ai_conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ai_messages" ON public.ai_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users own grocery_lists" ON public.grocery_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own grocery_items" ON public.grocery_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.grocery_lists gl WHERE gl.id = grocery_items.list_id AND gl.user_id = auth.uid())
);

