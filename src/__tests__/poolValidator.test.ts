import { validatePoolInput } from "../lib/validators/poolValidator";

describe("poolValidator", () => {
  it("fails when title is empty", () => {
    const res = validatePoolInput({
      title: "",
      contribMode: "fixed",
      fixedAmount: "1.0",
    });
    expect(res.valid).toBe(false);
    expect(res.errors.title).toBeDefined();
  });

  it("passes when valid fixed inputs provided", () => {
    const res = validatePoolInput({
      title: "Teacher Fund",
      contribMode: "fixed",
      fixedAmount: "0.5",
    });
    expect(res.valid).toBe(true);
  });
});
