import { isValidE164Phone } from "../lib/validators/phoneValidator";

describe("phoneValidator", () => {
  it("validates legitimate E.164 numbers", () => {
    expect(isValidE164Phone("+14155552671")).toBe(true);
    expect(isValidE164Phone("+919876543210")).toBe(true);
  });

  it("rejects non-E.164 formats", () => {
    expect(isValidE164Phone("12345")).toBe(false);
    expect(isValidE164Phone("abc")).toBe(false);
  });
});
