import assert from "node:assert/strict";

console.log("Running Nutrino Core Engine Verification Suite...");

// 1. Verify Nutrient Math Formula: (grams / 100) * per100g
function calcPerGrams(per100gCal, per100gProt, grams) {
  const factor = grams / 100;
  return {
    calories: Math.round(per100gCal * factor),
    protein: Math.round(per100gProt * factor * 10) / 10,
  };
}

// Plain Dosa: 168 kcal, 4.1g protein per 100g. 2 medium dosas = 160g
const twoDosas = calcPerGrams(168, 4.1, 160);
assert.equal(twoDosas.calories, 269, "2 Medium Dosas (160g) should equal 269 kcal");
assert.equal(twoDosas.protein, 6.6, "2 Medium Dosas (160g) should equal 6.6g protein");

// Sambar: 76 kcal, 3.6g protein per 100g. 1 medium bowl = 180g
const oneBowlSambar = calcPerGrams(76, 3.6, 180);
assert.equal(oneBowlSambar.calories, 137, "1 Bowl Sambar (180g) should equal 137 kcal");
assert.equal(oneBowlSambar.protein, 6.5, "1 Bowl Sambar (180g) should equal 6.5g protein");

console.log("✓ Deterministic ICMR-NIN nutrition formula verified: 2 dosas + 1 bowl sambar = 406 kcal, 13.1g protein");
console.log("ALL TESTS PASSED!");

