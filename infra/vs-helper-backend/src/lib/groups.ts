// Excludes visually-ambiguous characters (0/O, 1/I) so a code is easy to
// read aloud or type in from a screenshot.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

// The groupId itself doubles as the shareable invite code.
export function generateGroupId(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export const MAX_GROUP_NAME_LENGTH = 40;

// Keeps a group leaderboard's read cost fixed (single Query + one
// BatchGetItem, no pagination) — plenty for a private friend group.
export const MAX_GROUP_MEMBERS = 50;
