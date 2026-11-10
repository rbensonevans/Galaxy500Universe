// Minimum length for new passwords (sign-up, reset, change). Keep in sync with
// Supabase: Authentication → Sign In / Providers → Email → Minimum password
// length. Existing shorter passwords still sign in.
export const MIN_PASSWORD_LENGTH = 8;
