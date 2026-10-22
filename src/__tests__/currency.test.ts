import { formatAvax, avaxToWei } from "../lib/utils/currency";

describe("currency utilities", () => {
  it("formats string amounts correctly", () => {
    expect(formatAvax("1.5000")).toBe("1.5000 AVAX");
  });

  it("handles bigint amounts correctly", () => {
    expect(formatAvax(BigInt(1000000000000000000))).toBe("1.0000 AVAX");
  });

  it("converts avax to wei bigint", () => {
    expect(avaxToWei("1.0")).toBe(BigInt("1000000000000000000"));
  });
});
