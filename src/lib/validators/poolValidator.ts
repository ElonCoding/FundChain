import { isValidAddress } from "../utils/sanitize";

export interface PoolValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validatePoolInput(params: {
  title: string;
  fixedAmount?: string;
  minAmount?: string;
  recipientAddress?: string;
  contribMode: "fixed" | "flexible";
}): PoolValidationResult {
  const errors: Record<string, string> = {};

  if (!params.title.trim()) {
    errors.title = "Title is required.";
  }

  if (params.contribMode === "fixed") {
    const val = parseFloat(params.fixedAmount || "0");
    if (isNaN(val) || val <= 0) {
      errors.fixedAmount = "Contribution amount must be greater than 0.";
    }
  } else {
    const val = parseFloat(params.minAmount || "0");
    if (isNaN(val) || val <= 0) {
      errors.minAmount = "Minimum contribution must be greater than 0.";
    }
  }

  if (params.recipientAddress && !isValidAddress(params.recipientAddress)) {
    errors.recipientAddress = "Invalid recipient Avalanche address.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
