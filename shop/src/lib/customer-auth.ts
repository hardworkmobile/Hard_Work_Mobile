import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

// Mirrors the staff login flow in src/app/(auth)/login/actions.ts:
// we mint the Auth.js session JWT ourselves so the cookie name/salt stay
// consistent regardless of protocol. Customer sessions carry userType:"customer".
const COOKIE = "authjs.session-token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

type SessionCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

export async function createCustomerSession(customer: SessionCustomer) {
  const jwt = await encode({
    token: {
      sub: customer.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? undefined,
      userType: "customer",
    },
    secret: process.env.AUTH_SECRET!,
    salt: COOKIE,
    maxAge: MAX_AGE,
  });

  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true,
    secure: false, // matches useSecureCookies:false in auth.config.ts (revisit for Vercel/HTTPS in Phase 7)
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
