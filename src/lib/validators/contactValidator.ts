import { isValidAddress } from "../utils/sanitize";

export function validateContactInput(name: string, address: string) {
  if (!name.trim()) return { valid: false, message: "Name is required" };
  if (!isValidAddress(address.trim())) return { valid: false, message: "Invalid wallet address" };
  return { valid: true };
}
