/** Validate Ethereum/Avalanche wallet address */
export function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Validate phone number â€” E.164 format */
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

/** Validate pool name */
export function isValidPoolName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && t.length <= 80;
}

/** Validate AVAX amount string */
export function isValidAvaxAmount(amount: string): boolean {
  const n = parseFloat(amount);
  if (isNaN(n) || n <= 0) return false;
  const dec = amount.split(".")[1];
  return !dec || dec.length <= 18;
}

/** Validate display name */
export function isValidDisplayName(name: string): boolean {
  const t = name.trim();
  return t.length >= 2 && t.length <= 50;
}

