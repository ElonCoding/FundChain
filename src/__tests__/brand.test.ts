import { BRAND_COLORS } from "../lib/constants/brand";

describe("brand constants", () => {
  it("contains primary emerald and deep forest", () => {
    expect(BRAND_COLORS.emerald).toBe("#16A34A");
    expect(BRAND_COLORS.deepForest).toBe("#0A2E22");
    expect(BRAND_COLORS.orange).toBe("#F97316");
  });
});
