// Blink client disabled — app now uses Supabase.
// This file is kept to avoid breaking imports that haven't been updated yet.
export const blink = {
  auth: {
    login: () => {},
    logout: () => {},
    onAuthStateChanged: () => () => {},
  },
  db: {} as any,
  storage: {} as any,
  ai: {} as any,
  email: {} as any,
}
