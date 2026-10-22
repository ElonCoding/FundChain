import { parseContractError } from "../lib/utils/errors";

describe("error parser", () => {
  it("identifies user rejection error", () => {
    expect(parseContractError({ message: "User rejected the transaction." })).toContain("rejected");
  });

  it("identifies gas error", () => {
    expect(parseContractError({ message: "insufficient funds for gas * price + value" })).toContain("Insufficient AVAX");
  });
});
