import fs from "node:fs";
import path from "node:path";

/** Локальное хранилище: users + families + activity в одном JSON. */
const DATA_FILE = "apelsin-data.json";

export type StoredUser = {
  id: string;
  login_norm: string;
  login_display: string;
  first_name?: string;
  last_name?: string;
  password_hash: string;
  family_id: string | null;
  month_qr_spend: number;
};

/** Семья в файле = то же, что in-memory */
export type StoredFamily = {
  id: string;
  leaderId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: string;
  /** true = по коду не пускаем (только вручную; в демо по умолчанию false) */
  closedToJoins?: boolean;
};

export type StoredActivity = {
  id: number;
  family_id: string;
  actor_user_id: string;
  kind: string;
  amount_rub: number | null;
  created_at: string;
};

type RootV2 = {
  v: 2;
  users: StoredUser[];
  families: StoredFamily[];
  activity: StoredActivity[];
  nextActivityId: number;
};

const g = globalThis as unknown as { __apelsin_disk?: RootV2 | null | undefined };

function getRoot(): RootV2 {
  const r = g.__apelsin_disk;
  if (!r) throw new Error("ensurePersistence() before disk access");
  return r;
}

function dataPath() {
  return path.join(process.cwd(), ".data", DATA_FILE);
}

function save() {
  const r = g.__apelsin_disk;
  if (!r) return;
  const p = dataPath();
  const tmp = `${p}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(r), "utf8");
  fs.renameSync(tmp, p);
}

function migrateLegacyFile(raw: string): RootV2 {
  const j = JSON.parse(raw) as Record<string, unknown>;
  const out: RootV2 = {
    v: 2,
    users: [],
    families: [],
    activity: [],
    nextActivityId: 1,
  };

  const usersRaw = j.users;
  if (Array.isArray(usersRaw)) {
    for (const u of usersRaw as Record<string, unknown>[]) {
      out.users.push({
        id: String(u.id ?? ""),
        login_norm: String(u.login_norm ?? ""),
        login_display: String(u.login_display ?? ""),
        first_name: u.first_name as string | undefined,
        last_name: u.last_name as string | undefined,
        password_hash: String(u.password_hash ?? ""),
        family_id: (u.family_id ?? u.squad_id) != null ? String(u.family_id ?? u.squad_id) : null,
        month_qr_spend: typeof u.month_qr_spend === "number" ? u.month_qr_spend : 0,
      });
    }
  }

  const famRaw = j.families;
  if (Array.isArray(famRaw)) {
    for (const f of famRaw as Record<string, unknown>[]) {
      out.families.push({
        id: String(f.id ?? ""),
        leaderId: String(f.leaderId ?? ""),
        memberIds: Array.isArray(f.memberIds) ? (f.memberIds as string[]).map(String) : [],
        inviteCode: String(f.inviteCode ?? ""),
        createdAt: String(f.createdAt ?? ""),
        closedToJoins: Boolean(f.closedToJoins),
      });
    }
  }

  const actRaw = j.activity;
  let nextActId = typeof j.nextActivityId === "number" && j.nextActivityId > 0 ? j.nextActivityId : 1;
  if (Array.isArray(actRaw)) {
    for (const a of actRaw as Record<string, unknown>[]) {
      const fid = String((a as { family_id?: string; squad_id?: string }).family_id ?? (a as { squad_id?: string }).squad_id ?? "");
      if (!fid) continue;
      let aid = Number(a.id);
      if (!Number.isFinite(aid) || aid < 1) {
        aid = nextActId++;
      } else if (aid >= nextActId) {
        nextActId = aid + 1;
      }
      out.activity.push({
        id: aid,
        family_id: fid,
        actor_user_id: String(a.actor_user_id ?? ""),
        kind: String(a.kind ?? ""),
        amount_rub: a.amount_rub == null ? null : Number(a.amount_rub),
        created_at: String(a.created_at ?? ""),
      });
    }
  }
  out.nextActivityId = nextActId;

  return out;
}

export function ensurePersistence(): void {
  if (g.__apelsin_disk) return;
  const dir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const p = dataPath();
  if (fs.existsSync(p)) {
    try {
      const raw = fs.readFileSync(p, "utf8");
      g.__apelsin_disk = migrateLegacyFile(raw);
      save();
    } catch {
      g.__apelsin_disk = { v: 2, users: [], families: [], activity: [], nextActivityId: 1 };
      save();
    }
  } else {
    g.__apelsin_disk = { v: 2, users: [], families: [], activity: [], nextActivityId: 1 };
    save();
  }
}

export function getDiskFamilies(): StoredFamily[] {
  return getRoot().families.slice();
}

export function replaceDiskFamilies(families: StoredFamily[]) {
  getRoot().families = families;
  save();
}

export function diskUserByLoginNorm(loginNorm: string): StoredUser | undefined {
  return getRoot().users.find((x) => x.login_norm === loginNorm);
}

export function diskUserById(id: string): StoredUser | undefined {
  return getRoot().users.find((x) => x.id === id);
}

export function diskAddUser(u: StoredUser) {
  getRoot().users.push(u);
  save();
}

export function diskUpdateUser(id: string, patch: Partial<Pick<StoredUser, "family_id" | "month_qr_spend">>) {
  const u = getRoot().users.find((x) => x.id === id);
  if (!u) return;
  Object.assign(u, patch);
  save();
}

export function diskInsertActivity(
  a: Pick<StoredActivity, "family_id" | "actor_user_id" | "kind" | "amount_rub">
) {
  const r = getRoot();
  const id = r.nextActivityId++;
  const created_at = new Date().toISOString().replace("T", " ").slice(0, 19);
  r.activity.push({ ...a, id, created_at });
  save();
}

export function diskActivityForFamily(familyId: string, limit: number): StoredActivity[] {
  return getRoot()
    .activity.filter((x) => x.family_id === familyId)
    .sort((a, b) => b.id - a.id)
    .slice(0, limit);
}
