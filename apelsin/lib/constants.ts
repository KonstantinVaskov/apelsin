/** Участников в семье (включая создателя) */
export const MAX_FAMILY_MEMBERS = 5;
/** @deprecated */ export const MAX_SQUAD_MEMBERS = MAX_FAMILY_MEMBERS;

export const FAMILY_SPEND_PER_MEMBER_THRESHOLDS_RUB = [3_000, 5_000, 10_000] as const;
/** @deprecated Use FAMILY_SPEND_PER_MEMBER_THRESHOLDS_RUB and multiply by member count. */
export const FAMILY_SPEND_THRESHOLDS_RUB = FAMILY_SPEND_PER_MEMBER_THRESHOLDS_RUB;
/** @deprecated */ export const SQUAD_SPEND_THRESHOLDS_RUB = FAMILY_SPEND_THRESHOLDS_RUB;

export const FAMILY_LEVEL_BONUSES = [
  "1 категория повышенного кэшбэка на выбор",
  "2 категории повышенного кэшбэка на выбор",
  "2 категории повышенного кэшбэка на выбор + 1 категория бонуса на выбор",
  "3 категории повышенного кэшбэка на выбор + 2 категории бонуса на выбор",
] as const;

/** HttpOnly-cookie с id пользователя (демо) */
export const SESSION_COOKIE = "apelsin_uid";

export const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;
