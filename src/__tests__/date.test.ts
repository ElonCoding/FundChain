import { formatTimeRemaining } from "../lib/utils/date";

describe("date utilities", () => {
  it("handles expired deadlines", () => {
    const past = Math.floor(Date.now() / 1000) - 100;
    expect(formatTimeRemaining(past)).toBe("Expired");
  });

  it("handles future deadlines", () => {
    const future = Math.floor(Date.now() / 1000) + 90000;
    expect(formatTimeRemaining(future)).toContain("remaining");
  });
});
