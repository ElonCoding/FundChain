export async function hashPayload(data: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return "0x" + Buffer.from(data).toString("hex").slice(0, 64);
  }
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
