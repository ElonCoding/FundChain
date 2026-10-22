export function isValidGroupId(groupId: string): boolean {
  return /^[a-zA-Z0-9_-]{3,64}$/.test(groupId);
}
