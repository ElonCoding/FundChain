export function isValidOtp(digits: string[]): boolean {
  return digits.length === 6 && digits.every((d) => /^\d$/.test(d));
}
