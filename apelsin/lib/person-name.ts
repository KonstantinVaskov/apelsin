import type { SessionUser } from "@/lib/types";

/** «Имя Фамилия» для UI и журнала; без ФИО — e-mail/логин, как в старых демо-записях */
export function formatBankPersonName(
  u: Pick<SessionUser, "login" | "firstName" | "lastName"> | null | undefined
): string {
  if (!u) return "Участник";
  const fn = (u.firstName ?? "").trim();
  const ln = (u.lastName ?? "").trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  return (u.login ?? "").trim() || "Участник";
}
