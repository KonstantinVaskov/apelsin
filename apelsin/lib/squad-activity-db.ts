import { formatBankPersonName } from "@/lib/person-name";
import { formatMoney } from "@/lib/format";
import { getUserById } from "@/lib/store";
import { diskActivityForFamily, diskInsertActivity } from "@/lib/apelsin-disk";

export type FamilyActivityKind =
  | "squad_created"
  | "member_joined"
  | "member_left"
  | "member_kicked"
  | "leadership_transferred"
  | "qr_payment"
  | "demo_peers"
  | "reset_my_spend"
  | "demo_reset";

export type FamilyActivityRow = {
  id: number;
  at: string;
  line: string;
};

export function insertFamilyActivity(
  familyId: string,
  actorUserId: string,
  kind: FamilyActivityKind,
  amountRub?: number
) {
  try {
    diskInsertActivity({
      family_id: familyId,
      actor_user_id: actorUserId,
      kind,
      amount_rub: amountRub != null && Number.isFinite(amountRub) ? amountRub : null,
    });
  } catch (e) {
    console.error("insertFamilyActivity", e);
  }
}

/** @deprecated */ export const insertSquadActivity = insertFamilyActivity;

function formatLine(row: {
  actor_user_id: string;
  kind: string;
  amount_rub: number | null;
}): string {
  const u = getUserById(row.actor_user_id);
  const who = formatBankPersonName(u);
  switch (row.kind as FamilyActivityKind) {
    case "squad_created":
      return `${who} создал(а) семью`;
    case "member_joined":
      return `${who} вступил(а) в семью`;
    case "member_left":
      return `${who} вышел(а) из семьи`;
    case "member_kicked":
      return `Организатор исключил(а) участника из семьи`;
    case "leadership_transferred":
      return `Роль организатора передана самому активному участнику`;
    case "qr_payment": {
      const a = row.amount_rub != null ? row.amount_rub : 0;
      return `${who} — оплата по QR: ${formatMoney(a)}`;
    }
    case "demo_peers":
      return "Добавлены демо-участники (тестовые данные)";
    case "reset_my_spend":
      return `${who} обнулил(а) свои траты по QR за текущий месяц`;
    case "demo_reset":
      return `${who} сбросил(а) тестовые данные семьи`;
    default:
      return row.kind;
  }
}

export function getFamilyActivityLog(familyId: string, limit = 40): FamilyActivityRow[] {
  try {
    const raw = diskActivityForFamily(familyId, limit);
    return raw.map((r) => ({
      id: r.id,
      at: r.created_at,
      line: formatLine({
        actor_user_id: r.actor_user_id,
        kind: r.kind,
        amount_rub: r.amount_rub,
      }),
    }));
  } catch (e) {
    console.error("getFamilyActivityLog", e);
    return [];
  }
}

/** Совместимость */
export type SquadActivityRow = FamilyActivityRow;
