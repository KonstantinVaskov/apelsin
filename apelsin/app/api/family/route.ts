import { NextResponse } from "next/server";
import { ensurePersistence } from "@/lib/apelsin-disk";
import {
  createFamily,
  getFamilyState,
  getUserById,
  initFamiliesFromDisk,
  joinFamilyByCode,
  kickFamilyMember,
  transferLeadership,
  leaveFamily,
  recordQrPayment,
  resetMyMonthQrSpend,
  resetSquadDemoProperties,
  seedDemoPeers,
} from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import { getFamilyActivityLog, insertFamilyActivity } from "@/lib/squad-activity-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function boot() {
  ensurePersistence();
  initFamiliesFromDisk();
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function jsonFamily(userId: string) {
  const state = getFamilyState(userId);
  if (!state) return { state: null as ReturnType<typeof getFamilyState>, activity: [] };
  if (!state.inFamily) return { state, activity: [] };
  return { state, activity: getFamilyActivityLog(state.family.id) };
}

export async function GET() {
  try {
    boot();
    const userId = getSessionUserId();
    if (!userId) return unauthorized();
    const payload = jsonFamily(userId);
    if (!payload.state) return NextResponse.json({ error: "user" }, { status: 404 });
    return NextResponse.json(payload);
  } catch (err) {
    console.error("GET /api/family", err);
    return NextResponse.json(
      { error: "server", message: err instanceof Error ? err.message : "err" },
      { status: 500 }
    );
  }
}

type Body = {
  action?: "create" | "join" | "leave" | "qr" | "demo_peers" | "reset_my_spend" | "demo_reset" | "kick" | "transfer_leadership";
  amountRub?: number;
  code?: string;
  targetUserId?: string;
};

function statusForJoin(
  e: "code_not_found" | "family_full" | "family_closed" | "already_in_family" | "already_member"
) {
  if (e === "code_not_found") return 404;
  if (e === "family_full" || e === "already_in_family" || e === "already_member") return 409;
  if (e === "family_closed") return 403;
  return 400;
}

export async function POST(req: Request) {
  try {
    boot();
    const userId = getSessionUserId();
    if (!userId) return unauthorized();

    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action;

    if (action === "create") {
      const r = createFamily(userId);
      if (!r.ok) {
        return NextResponse.json(
          { error: r.error },
          { status: r.error === "already_in_family" ? 409 : 400 }
        );
      }
      const st = getFamilyState(userId);
      if (st?.inFamily) insertFamilyActivity(st.family.id, userId, "squad_created");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "join") {
      const r = joinFamilyByCode(userId, String(body.code ?? ""));
      if (!r.ok) {
        const e = r.error;
        const st =
          e === "code_not_found" || e === "family_full" || e === "family_closed" || e === "already_in_family" || e === "already_member"
            ? statusForJoin(e)
            : 400;
        return NextResponse.json({ error: e }, { status: st });
      }
      const st = getFamilyState(userId);
      if (st?.inFamily) insertFamilyActivity(st.family.id, userId, "member_joined");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "leave") {
      const u = getUserById(userId);
      const fid = u?.familyId;
      const r = leaveFamily(userId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      if (fid) insertFamilyActivity(fid, userId, "member_left");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "kick") {
      if (!body.targetUserId) return NextResponse.json({ error: "missing_target" }, { status: 400 });
      const r = kickFamilyMember(userId, body.targetUserId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      const st = getFamilyState(userId);
      if (st?.inFamily) insertFamilyActivity(st.family.id, userId, "member_kicked");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "transfer_leadership") {
      const stBefore = getFamilyState(userId);
      const sid = stBefore?.inFamily ? stBefore.family.id : null;
      if (!sid) return NextResponse.json({ error: "not_in_family" }, { status: 400 });
      
      const r = transferLeadership(sid);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      
      insertFamilyActivity(sid, userId, "leadership_transferred");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "qr") {
      const amount = Number(body.amountRub);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "amount" }, { status: 400 });
      }
      const r = recordQrPayment(userId, amount);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      const st = getFamilyState(userId);
      if (st?.inFamily) insertFamilyActivity(st.family.id, userId, "qr_payment", r.added);
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "demo_peers") {
      const stBefore = getFamilyState(userId);
      const sid = stBefore?.inFamily ? stBefore.family.id : null;
      const r = seedDemoPeers(userId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      if (sid) insertFamilyActivity(sid, userId, "demo_peers");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "reset_my_spend") {
      const stBefore = getFamilyState(userId);
      const sid = stBefore?.inFamily ? stBefore.family.id : null;
      const r = resetMyMonthQrSpend(userId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      if (sid) insertFamilyActivity(sid, userId, "reset_my_spend");
      return NextResponse.json(jsonFamily(userId));
    }
    if (action === "demo_reset") {
      const stBefore = getFamilyState(userId);
      const sid = stBefore?.inFamily ? stBefore.family.id : null;
      const r = resetSquadDemoProperties(userId);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
      if (sid) insertFamilyActivity(sid, userId, "demo_reset");
      return NextResponse.json(jsonFamily(userId));
    }
    return NextResponse.json({ error: "action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/family", err);
    return NextResponse.json(
      { error: "server", message: err instanceof Error ? err.message : "err" },
      { status: 500 }
    );
  }
}
