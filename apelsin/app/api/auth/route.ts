import { NextResponse } from "next/server";
import { ensurePersistence } from "@/lib/apelsin-disk";
import { getUserById, getUserPublic, initFamiliesFromDisk, registerUser, verifyLogin } from "@/lib/store";
import { getSessionUserId } from "@/lib/session";
import { COOKIE_MAX_AGE_SEC, SESSION_COOKIE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    ensurePersistence();
    initFamiliesFromDisk();
    const id = getSessionUserId();
    if (!id) return NextResponse.json({ user: null });
    const s = getUserById(id);
    const u = s
      ? { id: s.id, login: s.login, firstName: s.firstName, lastName: s.lastName }
      : null;
    return NextResponse.json({ user: u });
  } catch (err) {
    console.error("GET /api/auth", err);
    return NextResponse.json(
      { error: "server", message: err instanceof Error ? err.message : "err" },
      { status: 500 }
    );
  }
}

type PostBody = {
  action?: "register" | "login" | "logout";
  login?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody;
    const action = body.action;

    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    ensurePersistence();
    initFamiliesFromDisk();

    const login = String(body.login ?? "");
    const password = String(body.password ?? "");

    if (action === "register") {
      const r = registerUser(
        login,
        password,
        String(body.firstName ?? ""),
        String(body.lastName ?? "")
      );
      if (!r.ok) {
        const status = r.error === "login_taken" ? 409 : 400;
        return NextResponse.json({ error: r.error }, { status });
      }
      const u = getUserPublic(r.userId);
      const res = NextResponse.json({ ok: true, user: u });
      res.cookies.set(SESSION_COOKIE, r.userId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE_SEC,
      });
      return res;
    }

    if (action === "login") {
      const r = verifyLogin(login, password);
      if (!r.ok) {
        return NextResponse.json({ error: r.error }, { status: 401 });
      }
      const u = getUserPublic(r.userId);
      const res = NextResponse.json({ ok: true, user: u });
      res.cookies.set(SESSION_COOKIE, r.userId, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE_SEC,
      });
      return res;
    }

    return NextResponse.json({ error: "action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/auth", err);
    return NextResponse.json(
      { error: "server", message: err instanceof Error ? err.message : "err" },
      { status: 500 }
    );
  }
}
