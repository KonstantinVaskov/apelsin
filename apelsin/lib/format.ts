/** Format rubles: "12 847,50 ₽" */
export function formatMoney(amount: number) {
  const sign = amount < 0 ? "−" : "";
  const abs = Math.abs(amount);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${withSpaces},${decPart} ₽`;
}

const MONTHS_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

/** Relative time in Russian */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()) {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, nowMs - d);
  const min = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(iso);
  startOfTarget.setHours(0, 0, 0, 0);
  const daysApart = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / 86_400_000
  );

  if (min < 1) return "только что";
  if (min < 60) return `${min} мин. назад`;
  if (hours < 24) {
    if (hours === 1) return "1 час назад";
    if (hours >= 2 && hours <= 4) return `${hours} часа назад`;
    return `${hours} часов назад`;
  }
  if (daysApart === 1) return "вчера";
  if (daysApart < 7) {
    if (daysApart === 2) return "2 дня назад";
    if (daysApart >= 3 && daysApart <= 4) return `${daysApart} дня назад`;
    return `${daysApart} дней назад`;
  }
  const dt = new Date(iso);
  return `${dt.getDate()} ${MONTHS_RU[dt.getMonth()] ?? ""}`;
}

/** Дата-время из SQLite `datetime('now')` в локаль для журнала */
export function formatSqliteDateTime(s: string) {
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskPhone(phone: string) {
  const p = phone.replace(/\D/g, "");
  if (p.length === 11 && p[0] === "7")
    return `+7 ••• ${p.slice(3, 6)}–${p.slice(6, 8)}–${p.slice(8, 10)}`;
  if (p.length >= 4) return `+${p.slice(0, 2)} ••• ${p.slice(-2)}–${p.slice(-2)}`;
  return phone;
}
