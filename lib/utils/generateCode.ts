/**
 * Generates a random 6-character alphanumeric room code.
 * Uses uppercase letters and numbers, excluding ambiguous characters (0, O, I, L, 1).
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
