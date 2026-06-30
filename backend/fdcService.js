// fdcService.js
// Wraps calls to the USDA FoodData Central public API and normalizes
// its responses into the shape Calorific stores in the `foods` collection.
// Docs: https://fdc.nal.usda.gov/api-guide.html
// Base: https://api.nal.usda.gov/fdc/v1/

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const FDC_API_KEY = process.env.FDC_API_KEY;

// FDC nutrient IDs we care about for Core macro tracking.
// (Confirmed against FDC sample responses: Energy=1008, Protein=1003,
// Total lipid (fat)=1004, Carbohydrate by difference=1005)
const NUTRIENT_IDS = {
  CALORIES: 1008,
  PROTEIN: 1003,
  FAT: 1004,
  CARBS: 1005,
};

function extractNutrient(foodNutrients, nutrientId) {
  if (!Array.isArray(foodNutrients)) return 0;
  const match = foodNutrients.find(
    (n) => n.nutrient?.id === nutrientId || n.nutrientId === nutrientId
  );
  // FDC's two endpoints shape this slightly differently:
  // /foods/search results use `nutrientId` + `value` directly on the nutrient object,
  // /food/:id results use the nested `nutrient.id` + `amount` shape (see fdcService notes).
  if (!match) return 0;
  return match.amount ?? match.value ?? 0;
}

// Normalizes one FDC search result into our `foods` collection shape.
function normalizeSearchResult(fdcFood) {
  return {
    source: "fdc",
    fdcId: fdcFood.fdcId,
    name: fdcFood.description,
    brand: fdcFood.brandOwner || fdcFood.brandName || null,
    servingSize: fdcFood.servingSize || 100,
    servingSizeUnit: fdcFood.servingSizeUnit || "g",
    calories: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.CALORIES),
    protein: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.PROTEIN),
    fat: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.FAT),
    carbs: extractNutrient(fdcFood.foodNutrients, NUTRIENT_IDS.CARBS),
    cachedAt: new Date(),
  };
}

// Search FDC for foods matching a query string.
// Returns an array of normalized food objects (not yet saved to DB).
async function searchFDC(query, pageSize = 20) {
  if (!FDC_API_KEY) {
    throw new Error("FDC_API_KEY is not set in .env");
  }

  const url = `${FDC_BASE_URL}/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&api_key=${FDC_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FDC search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const foods = data.foods || [];
  return foods.map(normalizeSearchResult);
}

// Fetch full detail for a single food by its FDC ID.
// Returns a normalized food object (not yet saved to DB).
async function getFDCFoodDetail(fdcId) {
  if (!FDC_API_KEY) {
    throw new Error("FDC_API_KEY is not set in .env");
  }

  const url = `${FDC_BASE_URL}/food/${fdcId}?api_key=${FDC_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FDC detail lookup failed: ${response.status} ${response.statusText}`);
  }

  const fdcFood = await response.json();
  return normalizeSearchResult(fdcFood);
}

module.exports = { searchFDC, getFDCFoodDetail, NUTRIENT_IDS };
