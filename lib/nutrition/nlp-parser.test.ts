import { describe, it, expect } from "vitest";
import { parseNaturalMealDescription } from "./nlp-parser";
import { STARTER_FOODS } from "./starter-db";

describe("Natural Language Meal Parser & Decoupled Nutrition Engine", () => {
  it("parses '2 idlis and 1 bowl of sambar' deterministically from structured catalog", () => {
    const result = parseNaturalMealDescription("2 idlis and 1 bowl of sambar", STARTER_FOODS, "breakfast");
    expect(result.items).toHaveLength(2);

    const idliItem = result.items[0];
    expect(idliItem.foodName).toContain("Steamed Idli");
    expect(idliItem.servingQuantity).toBe(2);
    expect(idliItem.matchType).toBe("alias_catalog");
    expect(idliItem.nutritionSnapshot.protein).toBeGreaterThan(0);
    expect(idliItem.nutritionSnapshot.calories).toBeGreaterThan(0);

    const sambarItem = result.items[1];
    expect(sambarItem.foodName).toContain("Vegetable Sambar");
    expect(sambarItem.servingQuantity).toBe(1);
    expect(sambarItem.nutritionSnapshot.calories).toBeGreaterThan(0);

    // Sum is deterministic
    expect(result.totalNutrients.calories).toBe(
      Math.round((idliItem.nutritionSnapshot.calories ?? 0) + (sambarItem.nutritionSnapshot.calories ?? 0))
    );
  });

  it("parses 'I had two chapatis with paneer curry' for dinner", () => {
    const result = parseNaturalMealDescription("I had two chapatis with paneer curry for dinner");
    expect(result.detectedMealType).toBe("dinner");
    expect(result.items).toHaveLength(2);

    const chapati = result.items.find((i) => i.foodName.toLowerCase().includes("roti") || i.foodName.toLowerCase().includes("chapati"));
    expect(chapati).toBeDefined();
    expect(chapati?.servingQuantity).toBe(2);
    // 2 rotis ~ 2 * 3.2g = 6.4g protein
    expect(chapati?.nutritionSnapshot.protein).toBe(6.4);
    expect(chapati?.nutritionSnapshot.calories).toBe(210);

    const paneer = result.items.find((i) => i.foodName.toLowerCase().includes("paneer"));
    expect(paneer).toBeDefined();
    expect(paneer?.nutritionSnapshot.protein).toBeGreaterThan(0);
  });

  it("parses '1 glass of milk and a banana' with exact portions", () => {
    const result = parseNaturalMealDescription("1 glass of milk and a banana");
    expect(result.items).toHaveLength(2);

    const milk = result.items.find((i) => i.foodName.toLowerCase().includes("milk"));
    expect(milk).toBeDefined();
    expect(milk?.servingQuantity).toBe(1);

    const banana = result.items.find((i) => i.foodName.toLowerCase().includes("banana"));
    expect(banana).toBeDefined();
    expect(banana?.servingQuantity).toBe(1);
    expect(banana?.nutritionSnapshot.calories).toBe(105);
    expect(banana?.nutritionSnapshot.protein).toBe(1.3);
  });

  it("detects uncatalogued dish like 'Had a bowl of mutton rogan josh for lunch' with provisional archetype estimate", () => {
    const result = parseNaturalMealDescription("Had a bowl of mutton rogan josh for lunch");
    expect(result.detectedMealType).toBe("lunch");
    expect(result.items).toHaveLength(1);
    const dish = result.items[0];
    expect(dish.foodName.toLowerCase()).toContain("mutton rogan josh");
    expect(dish.isProvisional).toBe(true);
    expect(dish.nutritionSnapshot.protein).toBeGreaterThan(5);
    expect(dish.nutritionSnapshot.calories).toBeGreaterThan(150);
  });

  it("parses catalog dishes like 'chicken biryani' with high confidence", () => {
    const result = parseNaturalMealDescription("1 plate of chicken biryani");
    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    expect(item.foodName).toContain("Chicken Biryani");
    expect(item.isProvisional).toBe(false);
    expect(item.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("guarantees 100% deterministic reproducibility independent of any AI", () => {
    const run1 = parseNaturalMealDescription("2 chapatis, dal tadka and 1 katori curd");
    const run2 = parseNaturalMealDescription("2 chapatis, dal tadka and 1 katori curd");

    expect(run1.totalNutrients).toEqual(run2.totalNutrients);
    expect(run1.items.length).toBe(run2.items.length);
    for (let i = 0; i < run1.items.length; i++) {
      expect(run1.items[i].nutritionSnapshot).toEqual(run2.items[i].nutritionSnapshot);
    }
  });
});
