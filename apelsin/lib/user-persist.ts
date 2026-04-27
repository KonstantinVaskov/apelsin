import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { SessionUser } from "@/lib/types";
import { diskAddUser, diskUpdateUser, diskUserById, diskUserByLoginNorm, type StoredUser } from "@/lib/apelsin-disk";

const SCRYPT_OPTS: { N: number; r: number; p: number; maxmem: number } = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

/** Логин: trim, NFC, нижний регистр в качестве уникального ключа */
export function normalizeLoginKey(raw: string): string {
  return raw.trim().normalize("NFC").toLowerCase();
}

function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64, SCRYPT_OPTS);
  return `s1$${salt.toString("base64")}$${hash.toString("base64")}`;
}

function verifyPassword(plain: string, stored: string): boolean {
  if (!stored.startsWith("s1$")) return false;
  const parts = stored.split("$");
  if (parts.length !== 3) return false;
  try {
    const salt = Buffer.from(parts[1]!, "base64");
    const hash = Buffer.from(parts[2]!, "base64");
    const h2 = scryptSync(plain, salt, 64, SCRYPT_OPTS);
    if (hash.length !== h2.length) return false;
    return timingSafeEqual(hash, h2);
  } catch {
    return false;
  }
}

export type AppUserRow = StoredUser;

export function dbCreateUser(
  id: string,
  loginNorm: string,
  loginDisplay: string,
  firstName: string,
  lastName: string,
  passwordPlain: string
) {
  const password_hash = hashPassword(passwordPlain);
  diskAddUser({
    id,
    login_norm: loginNorm,
    login_display: loginDisplay,
    first_name: firstName,
    last_name: lastName,
    password_hash,
    family_id: null,
    month_qr_spend: 0,
  });
}

export function dbTryCreateUser(
  id: string,
  loginNorm: string,
  loginDisplay: string,
  firstName: string,
  lastName: string,
  passwordPlain: string
): { ok: true } | { ok: false; error: "login_taken" } {
  if (diskUserByLoginNorm(loginNorm)) return { ok: false, error: "login_taken" };
  dbCreateUser(id, loginNorm, loginDisplay, firstName, lastName, passwordPlain);
  return { ok: true };
}

export function dbVerifyAndGetUser(loginNorm: string, passwordPlain: string): AppUserRow | null {
  const u = diskUserByLoginNorm(loginNorm);
  if (!u) return null;
  if (!verifyPassword(passwordPlain, u.password_hash)) return null;
  return u;
}

export function dbLoadUserById(id: string): AppUserRow | null {
  return diskUserById(id) ?? null;
}

export function dbUpdateUserState(u: SessionUser) {
  if (!u.id.startsWith("u_")) return;
  try {
    diskUpdateUser(u.id, { family_id: u.familyId, month_qr_spend: u.monthQrSpendRub });
  } catch (e) {
    console.error("dbUpdateUserState", e);
  }
}

export function rowToSessionUser(row: AppUserRow): SessionUser {
  return {
    id: row.id,
    login: row.login_display,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    familyId: row.family_id,
    monthQrSpendRub: row.month_qr_spend,
  };
}
