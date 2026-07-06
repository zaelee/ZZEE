import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = {
  console,
  window: {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
};

vm.createContext(context);

for (const file of ["js/data.js", "js/naver-shared-restaurants.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
}

const summary = vm.runInContext(
  `(() => {
    const combined = [...RESTAURANTS, ...NAVER_SHARED_RESTAURANTS];
    const validCoordinates = combined.filter((restaurant) =>
      Number.isFinite(Number(restaurant.latitude)) && Number.isFinite(Number(restaurant.longitude))
    );
    const platformRatingValues = combined.flatMap((restaurant) =>
      Object.entries(restaurant.platformRatings || {}).map(([platform, data]) => ({
        name: restaurant.name,
        platform,
        rating: data.rating,
        reviewCount: data.reviewCount,
      }))
    );
    const invalidPlatformRatings = platformRatingValues.filter(
      (item) => item.rating !== null && item.rating !== undefined && (!Number.isFinite(item.rating) || item.rating <= 0 || item.rating > 5)
    );
    const categories = [...new Set(combined.map((restaurant) => restaurant.category))].sort();
    const areas = [...new Set(combined.map((restaurant) => restaurant.area))].sort();
    return {
      base: RESTAURANTS.length,
      shared: NAVER_SHARED_RESTAURANTS.length,
      total: combined.length,
      validCoordinates: validCoordinates.length,
      invalidPlatformRatings,
      categories,
      areas,
    };
  })()`,
  context
);

console.log(JSON.stringify(summary, null, 2));

if (summary.total === 0) throw new Error("No restaurants loaded");
if (summary.validCoordinates < summary.total * 0.9) throw new Error("Too many restaurants are missing coordinates");
if (summary.invalidPlatformRatings.length) throw new Error("Platform rating field contains non-rating values");
