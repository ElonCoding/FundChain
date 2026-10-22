export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Display name must be at least 2 characters.";
  if (trimmed.length > 32) return "Display name cannot exceed 32 characters.";
  return null;
}
