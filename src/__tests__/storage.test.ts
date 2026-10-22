import { getStorageItem, setStorageItem } from "../lib/utils/storage";

describe("storage utilities", () => {
  it("returns fallback value when key does not exist", () => {
    expect(getStorageItem("non_existent_key", "default")).toBe("default");
  });
});
