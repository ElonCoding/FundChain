import { isValidOtp } from "../lib/validators/otpValidator";

describe("otpValidator", () => {
  it("validates 6-digit PIN", () => {
    expect(isValidOtp(["1", "2", "3", "4", "5", "6"])).toBe(true);
  });

  it("rejects incomplete PINs", () => {
    expect(isValidOtp(["1", "2", "3", "4", "5", ""])).toBe(false);
  });
});
