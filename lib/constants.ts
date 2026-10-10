// Kept separate from lib/auth.ts on purpose: middleware.ts runs on the Edge
// runtime and cannot import Prisma/bcrypt/jsonwebtoken (all Node-only), but
// it does need to know the cookie name to check for its presence.
export const AUTH_COOKIE = "playsphere_token";
