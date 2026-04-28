import type { PublicUser, SessionUser, Family } from "@/lib/types";
import {
  FAMILY_LEVEL_BONUSES,
  FAMILY_SPEND_THRESHOLDS_RUB,
  MAX_FAMILY_MEMBERS,
} from "@/lib/constants";
import { diskResetAllData, getDiskFamilies, replaceDiskFamilies } from "@/lib/apelsin-disk";
import { formatBankPersonName } from "@/lib/person-name";
import { generateId } from "@/lib/utils";
import {
  dbLoadUserById,
  dbTryCreateUser,
  dbUpdateUserState,
  dbVerifyAndGetUser,
  rowToSessionUser,
} from "@/lib/user-persist";

type Mem = {
  users: Map<string, SessionUser>;
  loginNormToUserId: Map<string, string>;
  /** In-memory: синхр. с getDiskFamilies при старте и после изменений */
  families: Map<string, Family>;
  codeToFamilyId: Map<string, string>;
};

function mem(): Mem {
  const g = globalThis as unknown as { __apelsin_mem?: Mem };
  if (!g.__apelsin_mem) {
    g.__apelsin_mem = {
      users: new Map(),
      loginNormToUserId: new Map(),
      families: new Map(),
      codeToFamilyId: new Map(),
    };
  }
  return g.__apelsin_mem;
}

const m = mem();
const users = m.users;
const loginNormToUserId = m.loginNormToUserId;
const families = m.families;
const codeToFamilyId = m.codeToFamilyId;

const memInitG = globalThis as unknown as { __families_hydrated?: number };

function persistRegisteredUser(u: SessionUser | null | undefined) {
  if (!u?.id.startsWith("u_")) return;
  dbUpdateUserState(u);
}

const FAMILY_LINK_BASE = "https://apelsin.ru/family";

function validateLogin(s: string) {
  const t = s.trim().normalize("NFC");
  if (t.length < 3 || t.length > 50) {
    return { ok: false as const, error: "login_invalid" as const };
  }
  if (!/^[a-zA-Zа-яА-ЯёЁ0-9@+_.\s-]+$/.test(t)) {
    return { ok: false as const, error: "login_invalid" as const };
  }
  return { ok: true as const, login: t, key: t.toLowerCase() };
}

function validatePhone(s: string) {
  const t = s.trim().replace(/[^\d+]/g, "");
  if (t.length < 10 || t.length > 15) return { ok: false as const, error: "login_invalid" as const };
  return { ok: true as const, key: t, display: t };
}

function validatePersonName(
  s: string,
  field: "first" | "last"
):
  | { ok: true; name: string }
  | { ok: false; error: "first_name_invalid" | "last_name_invalid" } {
  const t = s.trim().normalize("NFC");
  if (t.length < 1 || t.length > 50) {
    return { ok: false, error: field === "first" ? "first_name_invalid" : "last_name_invalid" };
  }
  if (!/[a-zA-Zа-яА-ЯёЁ]/.test(t)) {
    return { ok: false, error: field === "first" ? "first_name_invalid" : "last_name_invalid" };
  }
  if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s'’.\-]+$/.test(t)) {
    return { ok: false, error: field === "first" ? "first_name_invalid" : "last_name_invalid" };
  }
  return { ok: true, name: t };
}

function hasAnyLetter(p: string) {
  for (const ch of p) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x41 && c <= 0x5a) return true;
    if (c >= 0x61 && c <= 0x7a) return true;
    if (c >= 0x400 && c <= 0x4ff) return true;
    if (c === 0x401 || c === 0x451) return true;
  }
  return false;
}

function hasAnyDecimalDigit(p: string) {
  for (const ch of p) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x30 && c <= 0x39) return true;
    if (c >= 0xff10 && c <= 0xff19) return true;
  }
  return false;
}

function validatePassword(p: string) {
  if (p.length < 8 || p.length > 128) {
    return { ok: false as const, error: "password_length" as const };
  }
  if (!hasAnyLetter(p)) {
    return { ok: false as const, error: "password_letter" as const };
  }
  if (!hasAnyDecimalDigit(p)) {
    return { ok: false as const, error: "password_digit" as const };
  }
  return { ok: true as const };
}

function reconcileStaleFamilyInSessionUser(u: SessionUser): void {
  if (u.familyId && !families.get(u.familyId)) {
    u.familyId = null;
    persistRegisteredUser(u);
  }
}

/** Один раз за процесс: грузит семьи с диска в память (после ensurePersistence) */
export function initFamiliesFromDisk(): void {
  if (memInitG.__families_hydrated) return;
  memInitG.__families_hydrated = 1;
  for (const f of getDiskFamilies()) {
    families.set(f.id, { ...f, closedToJoins: f.closedToJoins ?? false });
    codeToFamilyId.set(f.inviteCode, f.id);
  }
}

export function resetDemoState(): void {
  users.clear();
  loginNormToUserId.clear();
  families.clear();
  codeToFamilyId.clear();
  memInitG.__families_hydrated = 0;
  diskResetAllData();
}

function saveFamiliesToDisk() {
  replaceDiskFamilies(
    Array.from(families.values()).map((f) => ({
      id: f.id,
      leaderId: f.leaderId,
      memberIds: [...f.memberIds],
      inviteCode: f.inviteCode,
      createdAt: f.createdAt,
      closedToJoins: f.closedToJoins,
    }))
  );
}

export function getUserById(id: string): SessionUser | null {
  const cached = users.get(id);
  if (cached) {
    reconcileStaleFamilyInSessionUser(cached);
    return cached;
  }
  const row = dbLoadUserById(id);
  if (!row) return null;
  let u = rowToSessionUser(row);
  reconcileStaleFamilyInSessionUser(u);
  if (u.familyId && !families.get(u.familyId)) u = { ...u, familyId: null };
  users.set(id, u);
  loginNormToUserId.set(row.login_norm, id);
  if (u.familyId === null && row.family_id != null) persistRegisteredUser(u);
  return u;
}

function uget(id: string): SessionUser | null {
  return users.get(id) ?? null;
}

export function getUserPublic(id: string): PublicUser | null {
  const u = users.get(id);
  if (!u) return null;
  return { id: u.id, login: u.login, firstName: u.firstName, lastName: u.lastName };
}

export function registerUser(loginRaw: string, password: string, firstNameRaw: string, lastNameRaw: string) {
  const f = validatePersonName(firstNameRaw, "first");
  if (!f.ok) return { ok: false as const, error: f.error };
  const l = validatePersonName(lastNameRaw, "last");
  if (!l.ok) return { ok: false as const, error: l.error };
  const em = validatePhone(loginRaw);
  if (!em.ok) return { ok: false as const, error: em.error };
  const pw = validatePassword(password);
  if (!pw.ok) return { ok: false as const, error: pw.error };
  const id = generateId("u");
  const ins = dbTryCreateUser(id, em.key, em.display, f.name, l.name, password);
  if (!ins.ok) return { ok: false as const, error: "login_taken" as const };
  const u: SessionUser = {
    id,
    login: em.display,
    firstName: f.name,
    lastName: l.name,
    familyId: null,
    monthQrSpendRub: 0,
  };
  users.set(id, u);
  loginNormToUserId.set(em.key, id);
  return { ok: true as const, userId: id };
}

export function verifyLogin(loginRaw: string, password: string) {
  const v = validateLogin(loginRaw);
  if (!v.ok) return { ok: false as const, error: "invalid_credentials" as const };
  const row = dbVerifyAndGetUser(v.key, password);
  if (!row) return { ok: false as const, error: "invalid_credentials" as const };
  let u = rowToSessionUser(row);
  reconcileStaleFamilyInSessionUser(u);
  if (u.familyId && !families.get(u.familyId)) u = { ...u, familyId: null };
  users.set(row.id, u);
  loginNormToUserId.set(row.login_norm, row.id);
  if (u.familyId === null && row.family_id != null) persistRegisteredUser(u);
  return { ok: true as const, userId: row.id };
}

function uensureWithLogin(id: string, login: string): SessionUser {
  let u = users.get(id);
  if (!u) {
    u = { id, login, firstName: "", lastName: "", familyId: null, monthQrSpendRub: 0 };
    users.set(id, u);
  }
  return u;
}

function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    ""
  );
}

function ensureUniqueInviteCode() {
  let c = makeInviteCode();
  for (let i = 0; i < 30 && codeToFamilyId.has(c); i++) c = makeInviteCode();
  return c;
}

function totalFamilyMonthSpend(f: Family) {
  return round2(
    f.memberIds.reduce((sum, id) => {
      const mem = uget(id);
      return sum + (mem?.monthQrSpendRub ?? 0);
    }, 0)
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function familySpendThresholds(memberCount: number) {
  return [...FAMILY_SPEND_THRESHOLDS_RUB];
}

function familyLevelFromTotal(total: number, memberCount: number) {
  const [level1, level2, level3] = FAMILY_SPEND_THRESHOLDS_RUB;
  if (total < level1) {
    return {
      tier: 0 as const,
      avg: total,
      line: `Уровень 0: ${FAMILY_LEVEL_BONUSES[0]}. До 1 уровня нужно ${level1.toLocaleString("ru-RU")} ₽ на семью`,
    };
  }
  if (total < level2) {
    return {
      tier: 1 as const,
      avg: total,
      line: `Уровень 1: ${FAMILY_LEVEL_BONUSES[1]}`,
    };
  }
  if (total < level3) {
    return {
      tier: 2 as const,
      avg: total,
      line: `Уровень 2: ${FAMILY_LEVEL_BONUSES[2]}`,
    };
  }
  return {
    tier: 3 as const,
    avg: total,
    line: `Уровень 3: ${FAMILY_LEVEL_BONUSES[3]}`,
  };
}

function memberRows(viewerId: string, fam: Family) {
  let peer = 0;
  return fam.memberIds.map((mid) => {
    const m = uget(mid);
    const isYou = mid === viewerId;
    if (!isYou) peer += 1;
    return {
      id: mid,
      label: isYou ? "Вы" : m ? formatBankPersonName(m) : `Участник ${peer}`,
      isYou,
      isLeader: mid === fam.leaderId,
      monthQrSpendRub: round2(m?.monthQrSpendRub ?? 0),
    };
  });
}

export function getFamilyState(userId: string) {
  const viewer = getUserById(userId);
  if (!viewer) return null;
  if (!viewer.familyId) {
    return {
      inFamily: false as const,
      maxMembers: MAX_FAMILY_MEMBERS,
      thresholdsRub: familySpendThresholds(1),
    };
  }
  const fam = families.get(viewer.familyId);
  if (!fam) {
    viewer.familyId = null;
    persistRegisteredUser(viewer);
    return {
      inFamily: false as const,
      maxMembers: MAX_FAMILY_MEMBERS,
      thresholdsRub: familySpendThresholds(1),
    };
  }
  const total = totalFamilyMonthSpend(fam);
  const level = familyLevelFromTotal(total, fam.memberIds.length);
  const openSlots = Math.max(0, MAX_FAMILY_MEMBERS - fam.memberIds.length);
  return {
    inFamily: true as const,
    maxMembers: MAX_FAMILY_MEMBERS,
    thresholdsRub: familySpendThresholds(fam.memberIds.length),
    family: {
      id: fam.id,
      leaderId: fam.leaderId,
      inviteCode: fam.inviteCode,
      inviteLink: `${FAMILY_LINK_BASE}?code=${fam.inviteCode}`,
      createdAt: fam.createdAt,
      members: memberRows(userId, fam),
      openSlots,
      totalMonthQrSpendRub: total,
      avgMonthSpendPerMemberRub: level.avg,
      memberCount: fam.memberIds.length,
      closedToJoins: fam.closedToJoins ?? false,
      familyLevel: level.tier,
      familyLine: level.line,
    },
  };
}

/** @deprecated */ export const getSquadState = getFamilyState;

export function createFamily(userId: string) {
  const u = getUserById(userId);
  if (!u) return { ok: false as const, error: "user" as const };
  reconcileStaleFamilyInSessionUser(u);
  if (u.familyId && families.get(u.familyId)) {
    return { ok: false as const, error: "already_in_family" as const };
  }
  if (u.familyId) {
    u.familyId = null;
    persistRegisteredUser(u);
  }
  const id = generateId("sq");
  const code = ensureUniqueInviteCode();
  const f: Family = {
    id,
    leaderId: userId,
    memberIds: [userId],
    inviteCode: code,
    createdAt: new Date().toISOString(),
    closedToJoins: false,
  };
  families.set(id, f);
  codeToFamilyId.set(code, id);
  u.familyId = id;
  persistRegisteredUser(u);
  saveFamiliesToDisk();
  return { ok: true as const };
}

/** @deprecated */ export const createSquad = createFamily;

export function joinFamilyByCode(userId: string, code: string) {
  const u = getUserById(userId);
  if (!u) return { ok: false as const, error: "user" as const };
  reconcileStaleFamilyInSessionUser(u);
  if (u.familyId && families.get(u.familyId)) {
    return { ok: false as const, error: "already_in_family" as const };
  }
  if (u.familyId) {
    u.familyId = null;
    persistRegisteredUser(u);
  }
  const c = code.toUpperCase().trim();
  if (!c) return { ok: false as const, error: "code_not_found" as const };
  const fid = codeToFamilyId.get(c);
  if (!fid) return { ok: false as const, error: "code_not_found" as const };
  const f = families.get(fid);
  if (!f) return { ok: false as const, error: "code_not_found" as const };
  if (f.closedToJoins) {
    return { ok: false as const, error: "family_closed" as const };
  }
  if (f.memberIds.length >= MAX_FAMILY_MEMBERS) {
    return { ok: false as const, error: "family_full" as const };
  }
  if (f.memberIds.includes(userId)) return { ok: false as const, error: "already_member" as const };
  f.memberIds.push(userId);
  u.familyId = fid;
  persistRegisteredUser(u);
  saveFamiliesToDisk();
  return { ok: true as const };
}

/** @deprecated */ export const joinSquadByCode = joinFamilyByCode;

export function leaveFamily(userId: string) {
  const u = getUserById(userId);
  if (!u?.familyId) return { ok: false as const, error: "not_in_family" as const };
  const f = families.get(u.familyId);
  if (!f) {
    u.familyId = null;
    persistRegisteredUser(u);
    return { ok: false as const, error: "not_in_family" as const };
  }
  f.memberIds = f.memberIds.filter((x) => x !== userId);
  u.familyId = null;
  if (f.leaderId === userId && f.memberIds.length > 0) f.leaderId = f.memberIds[0]!;
  if (f.memberIds.length === 0) {
    codeToFamilyId.delete(f.inviteCode);
    families.delete(f.id);
  }
  persistRegisteredUser(u);
  saveFamiliesToDisk();
  return { ok: true as const };
}

/** @deprecated */ export const leaveSquad = leaveFamily;

export function recordQrPayment(userId: string, amountRub: number) {
  const u = getUserById(userId);
  if (!u) return { ok: false as const, error: "user" as const };
  if (!u.familyId) return { ok: false as const, error: "not_in_family" as const };
  if (!families.get(u.familyId)) {
    u.familyId = null;
    persistRegisteredUser(u);
    return { ok: false as const, error: "not_in_family" as const };
  }
  const amt = Math.max(0, Math.round(amountRub * 100) / 100);
  u.monthQrSpendRub = round2(u.monthQrSpendRub + amt);
  persistRegisteredUser(u);
  return { ok: true as const, added: amt };
}

export function resetMyMonthQrSpend(userId: string) {
  const u = getUserById(userId);
  if (!u) return { ok: false as const, error: "user" as const };
  if (!u.familyId) return { ok: false as const, error: "not_in_family" as const };
  if (!families.get(u.familyId)) {
    u.familyId = null;
    persistRegisteredUser(u);
    return { ok: false as const, error: "not_in_family" as const };
  }
  u.monthQrSpendRub = 0;
  persistRegisteredUser(u);
  return { ok: true as const };
}

export function resetSquadDemoProperties(userId: string) {
  const u = getUserById(userId);
  if (!u) return { ok: false as const, error: "user" as const };
  if (!u.familyId) return { ok: false as const, error: "not_in_family" as const };
  const s = families.get(u.familyId);
  if (!s) {
    u.familyId = null;
    persistRegisteredUser(u);
    return { ok: false as const, error: "not_in_family" as const };
  }
  const prefix = `${s.id}-d`;
  const removed: string[] = [];
  for (const mid of s.memberIds) {
    if (mid.startsWith(prefix)) removed.push(mid);
  }
  if (removed.length) {
    const set = new Set(removed);
    s.memberIds = s.memberIds.filter((id) => !set.has(id));
    for (const id of removed) {
      const p = uget(id);
      if (p) {
        p.monthQrSpendRub = 0;
        p.familyId = null;
      }
    }
    if (s.leaderId && set.has(s.leaderId) && s.memberIds.length) {
      s.leaderId = s.memberIds[0]!;
    }
  }
  u.monthQrSpendRub = 0;
  persistRegisteredUser(u);
  saveFamiliesToDisk();
  return { ok: true as const };
}

export function seedDemoPeers(userId: string) {
  const u = getUserById(userId);
  if (!u?.familyId) return { ok: false as const, error: "not_in_family" as const };
  const s = families.get(u.familyId);
  if (!s) return { ok: false as const, error: "not_in_family" as const };
  const spend = [5200, 5600, 4900];
  for (let i = 0; i < 3; i++) {
    if (s.memberIds.length >= MAX_FAMILY_MEMBERS) break;
    const id = `${s.id}-d${i}`;
    const p = uensureWithLogin(id, `демо${i + 1}`);
    p.firstName = "Демо";
    p.lastName = String(i + 1);
    if (p.familyId && p.familyId !== s.id) continue;
    p.monthQrSpendRub = round2(spend[i]!);
    p.familyId = s.id;
    if (!s.memberIds.includes(id)) s.memberIds.push(id);
  }
  persistRegisteredUser(u);
  saveFamiliesToDisk();
  return { ok: true as const };
}
