import { sanitizeInput, isValidAddress } from "../lib/utils/sanitize";

describe("sanitize utilities", () => {
  it("strips HTML angle brackets", () => {
    expect(sanitizeInput("<script>alert()</script>")).toBe("scriptalert()/script");
  });

  it("validates ethereum/avalanche addresses", () => {
    expect(isValidAddress("0x54A39697E45a7dC7d6DC7e43B3cDAF8Cd71cBC43")).toBe(true);
    expect(isValidAddress("0xinvalid")).toBe(false);
  });
});
