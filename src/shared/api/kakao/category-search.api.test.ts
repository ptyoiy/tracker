import { describe, expect, it } from "vitest";
import { getCategorySearch } from "./category-search";

describe("kakao category-search API", () => {
  it("should fetch places by category code (e.g., SW8 - Subway)", async () => {
    const lng = 127.04870992465413;
    const lat = 37.505167825521674;
    const radius = 1000;

    const result = await getCategorySearch("SW8", lng, lat, radius);
    console.dir(result, { depth: 3 });
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("place_name");
      expect(result[0]).toHaveProperty("x");
      expect(result[0]).toHaveProperty("y");
    }
  });
});
