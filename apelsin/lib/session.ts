import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { getUserById } from "@/lib/store";

export function getSessionUserId(): string | null {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  if (!getUserById(id)) return null;
  return id;
}
