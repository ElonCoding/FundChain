import { calculateFundingPercent } from "../lib/utils/math";

describe("math utilities", () => {
  it("computes funding percentage correctly", () => {
    expect(calculateFundingPercent("5.0", "10.0")).toBe(50);
    expect(calculateFundingPercent(10, 10)).toBe(100);
    expect(calculateFundingPercent(12, 10)).toBe(100);
  });
});
