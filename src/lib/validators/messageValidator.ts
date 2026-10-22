export function validateMessageContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length > 0 && trimmed.length <= 4000;
}
