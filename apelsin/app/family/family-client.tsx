"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Link2,
  LogOut,
  QrCode,
  RotateCcw,
  Share2,
  Sparkles,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { MobileShell } from "@/components/apelsin/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatBankPersonName } from "@/lib/person-name";
import { formatMoney, formatSqliteDateTime } from "@/lib/format";
import { apiJson, ApiError } from "@/lib/api-client";
import { FAMILY_SPEND_PER_MEMBER_THRESHOLDS_RUB } from "@/lib/constants";

type Me = { id: string; login: string; firstName: string; lastName: string };

type Member = {
  id: string;
  label: string;
  isYou: boolean;
  isLeader: boolean;
  monthQrSpendRub: number;
};

type FamilyIn = {
  id: string;
  leaderId: string;
  inviteCode: string;
  inviteLink: string;
  createdAt: string;
  members: Member[];
  openSlots: number;
  totalMonthQrSpendRub: number;
  avgMonthSpendPerMemberRub: number;
  memberCount: number;
  closedToJoins: boolean;
  familyLevel: 0 | 1 | 2 | 3;
  familyLine: string;
};

type StateOut = {
  inFamily: false;
  maxMembers: number;
  thresholdsRub: number[];
};

type StateIn = {
  inFamily: true;
  maxMembers: number;
  thresholdsRub: number[];
  family: FamilyIn;
};

type FamilyState = StateOut | StateIn;

type ActivityRow = { id: number; at: string; line: string };

const errRu: Record<string, string> = {
  not_in_family: "Сначала вступи в семью или создай её",
  not_in_squad: "Сначала вступи в семью или создай её",
  already_in_family: "Ты уже в семье",
  already_in_squad: "Ты уже в семье",
  action: "Неверный запрос",
  amount: "Сумма не подходит",
  code_not_found: "Код не найден",
  family_full: "Семья заполнена (5 участников)",
  family_closed: "Семья закрыта для вступлений по коду",
  squad_full: "Семья заполнена (5 участников)",
  already_member: "Уже в списке",
  unauthorized: "Нужен вход",
  user: "Профиль не найден",
  network: "Нет связи с приложением. Проверьте сеть и обновите страницу.",
  server: "Не удалось загрузить данные. Попробуйте обновить страницу.",
};

function nextThreshold(total: number, thresholds: number[]) {
  for (const x of thresholds) {
    if (total < x) return x;
  }
  return null;
}

export function FamilyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<FamilyState | null>(null);
  const [bootErr, setBootErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const q = searchParams.get("code");
    if (q) setJoinCode(q.toUpperCase().trim());
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootErr(null);
      try {
        const m = await apiJson<{ user: Me | null }>("/api/auth");
        if (cancelled) return;
        if (!m.user) {
          router.replace(`/login?next=${encodeURIComponent("/family")}`);
          return;
        }
        setMe(m.user);
        try {
          const r = await apiJson<{ state: FamilyState; activity?: ActivityRow[] }>("/api/family");
          if (!cancelled) {
            setState(r.state);
            setActivity(r.activity ?? []);
          }
        } catch (e) {
          if (cancelled) return;
          if (e instanceof ApiError && (e.status === 401 || e.message === "unauthorized")) {
            router.replace(`/login?next=${encodeURIComponent("/family")}`);
            return;
          }
          const k = e instanceof ApiError ? (e.code ?? e.message) : "";
          setBootErr(
            errRu[k] ?? (e instanceof Error ? e.message : "Не удалось загрузить семью")
          );
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && (e.status === 401 || e.message === "unauthorized")) {
          router.replace(`/login?next=${encodeURIComponent("/family")}`);
          return;
        }
        const k = e instanceof ApiError ? (e.code ?? e.message) : "";
        setBootErr(errRu[k] ?? (e instanceof Error ? e.message : "Ошибка сети"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function post(body: { action: string; amountRub?: number; code?: string }) {
    setMsg(null);
    setBusy(true);
    try {
      const r = await apiJson<{ state: FamilyState; activity?: ActivityRow[] }>("/api/family", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setState(r.state);
      setActivity(r.activity ?? []);
    } catch (e) {
      const key = e instanceof ApiError ? (e.code ?? e.message) : e instanceof Error ? e.message : "";
      setMsg(errRu[key] ?? (key && key.length < 200 ? key : "Ошибка"));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await apiJson("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      });
      router.replace("/login");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink(link: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Апельсин — Семья",
          text: "Оплата в X5 через QR (СБП), общий бонус семьи",
          url: link,
        });
      } catch {
        void copyLink(link);
      }
    } else void copyLink(link);
  }

  if (bootErr) {
    return (
      <MobileShell className="family-page">
        <p className="mb-2">
          <Link href="/" className="text-sm text-zinc-500 hover:text-primary">
            ← На главную
          </Link>
        </p>
        <h1 className="mb-2 text-lg font-bold text-zinc-900">Не загрузилось</h1>
        <p className="mb-4 text-sm text-red-600">{bootErr}</p>
        <Button type="button" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </MobileShell>
    );
  }

  if (!me || !state) {
    return (
      <div className="family-page flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const thresholds = state.thresholdsRub?.length
    ? state.thresholdsRub
    : FAMILY_SPEND_PER_MEMBER_THRESHOLDS_RUB.map((x) => x * (state.inFamily ? state.family.memberCount : 1));

  return (
    <MobileShell className="family-page">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="mb-2">
          <Link href="/" className="text-sm text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-primary">
            ← На главную
          </Link>
        </p>
        <div className="text-right text-xs text-zinc-600">
          <p className="max-w-[14rem] truncate text-[11px] font-semibold leading-tight text-zinc-800">
            {formatBankPersonName(me)}
          </p>
          <p className="max-w-[14rem] truncate font-mono text-[10px] text-zinc-500">{me.login}</p>
          <button
            type="button"
            className="mt-0.5 inline-flex items-center gap-1 text-zinc-500 hover:text-primary"
            onClick={() => void logout()}
            disabled={busy}
          >
            <LogOut className="h-3.5 w-3.5" />
            выйти
          </button>
        </div>
      </div>
      <div className="mb-4 inline-block rounded border border-slate-300/80 bg-slate-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-700">
        Апельсин · X5
      </div>
      <h1 className="mb-1 font-black tracking-tight text-zinc-900" style={{ fontSize: "clamp(1.75rem, 6vw, 2rem)" }}>
        Семья
      </h1>
      <p className="mb-2 text-sm leading-relaxed text-zinc-700">Семейный счёт, уровень кэшбэка и бонусы для всех.</p>
      <details className="mb-5 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-xs text-zinc-600">
        <summary className="cursor-pointer list-none font-medium text-zinc-700 outline-none marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-zinc-300 underline-offset-2">Подробности и демо</span>
        </summary>
        <p className="mt-2 border-t border-zinc-200/80 pt-2 leading-relaxed">
          Создайте семью, пригласите участников и суммируйте покупки. Уровень считается по средним тратам на человека:
          3 000 ₽, 5 000 ₽ и 10 000 ₽.
        </p>
      </details>

      {state.inFamily ? (
        <FamilyView
          family={state.family}
          maxMembers={state.maxMembers}
          thresholds={thresholds}
          activity={activity}
          busy={busy}
          copied={copied}
          onCopy={copyLink}
          onShare={shareLink}
          onLeave={() => {
            if (window.confirm("Покинуть семью?")) void post({ action: "leave" });
          }}
          onSimQr={(amountRub) => void post({ action: "qr", amountRub })}
          onDemoPeers={() => void post({ action: "demo_peers" })}
          onResetMySpend={() => void post({ action: "reset_my_spend" })}
          onDemoResetFull={() => {
            if (
              window.confirm(
                "Сбросить демо целиком: твои траты → 0 и выкинуть накрученных демо-участников? Реальные люди в семье не трогаются."
              )
            ) {
              void post({ action: "demo_reset" });
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center text-4xl" aria-hidden>
            🧾
          </div>
          <Card className="border-2 border-zinc-800/10 bg-white shadow-brutal">
            <CardContent className="p-4">
              <p className="text-sm font-black text-zinc-900">Создать семью</p>
              <p className="text-sm text-zinc-600">Вы станете организатором, остальным отправите приглашение по коду.</p>
              <Button
                type="button"
                className="mt-3 w-full gap-2 font-bold shadow-brutalSm"
                disabled={busy}
                onClick={() => void post({ action: "create" })}
              >
                <Users className="h-4 w-4" />
                Создать
              </Button>
            </CardContent>
          </Card>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed border-zinc-400/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="rounded bg-slate-100/90 px-2 text-zinc-500">или</span>
            </div>
          </div>
          <Card className="border-2 border-dashed border-primary/40 bg-primary-light/40 shadow-brutalSm">
            <CardContent className="p-4">
              <p className="text-sm font-black text-zinc-900">Вступить по коду</p>
              <p className="text-xs text-zinc-600">Шесть символов из приглашения</p>
              <div className="mt-2 flex gap-2">
                <Input
                  className="border-2 font-mono font-bold"
                  placeholder="КОД"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  className="shrink-0 font-bold shadow-brutalSm"
                  disabled={busy || !joinCode.trim()}
                  onClick={() => void post({ action: "join", code: joinCode.trim() })}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {msg ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-red-600"
        >
          {msg}
        </motion.p>
      ) : null}
    </MobileShell>
  );
}

function FamilyView({
  family,
  maxMembers,
  thresholds,
  activity,
  busy,
  copied,
  onCopy,
  onShare,
  onLeave,
  onSimQr,
  onDemoPeers,
  onResetMySpend,
  onDemoResetFull,
}: {
  family: FamilyIn;
  maxMembers: number;
  thresholds: number[];
  activity: ActivityRow[];
  busy: boolean;
  copied: boolean;
  onCopy: (l: string) => void;
  onShare: (l: string) => void;
  onLeave: () => void;
  onSimQr: (amountRub: number) => void;
  onDemoPeers: () => void;
  onResetMySpend: () => void;
  onDemoResetFull: () => void;
}) {
  const [qrAmount, setQrAmount] = useState("");
  const t = nextThreshold(family.totalMonthQrSpendRub, thresholds);
  const pct = t ? Math.min(100, (family.totalMonthQrSpendRub / t) * 100) : 100;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Card className="overflow-hidden border border-slate-200/90 bg-white/95 shadow-brutal">
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-slate-500">Семейный счёт за текущий календарный месяц</p>
            <p className="mt-1 font-mono text-3xl font-black tabular-nums leading-none text-primary">
              {formatMoney(family.totalMonthQrSpendRub)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-600">
              <span className="rounded-lg bg-primary/10 px-2 py-1 font-semibold text-primary">
                Уровень {family.familyLevel}
              </span>
              <span className="rounded-lg bg-zinc-100 px-2 py-1">
                на человека: <span className="font-mono text-zinc-800">{formatMoney(family.avgMonthSpendPerMemberRub)}</span>
              </span>
            </div>
            {t ? (
              <>
                <p className="mb-1.5 mt-3 text-[11px] text-zinc-600">
                  до порога <span className="font-semibold text-zinc-800">{formatMoney(t)}</span>
                </p>
                <Progress
                  value={pct}
                  className="h-2.5 rounded-sm border border-zinc-200/80"
                  indicatorClassName="from-slate-500 to-slate-400"
                />
              </>
            ) : (
              <p className="mt-3 text-xs font-medium text-slate-700">Семья достигла верхнего уровня в демо</p>
            )}
            <p className="mt-4 flex items-start gap-2 border-t border-dashed border-zinc-200 pt-3 text-sm leading-snug text-zinc-800">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              {family.familyLine}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-black text-zinc-800">
          Участники <span className="font-mono text-primary">({family.memberCount}/{maxMembers})</span>
        </p>
        <ul className="space-y-2">
          {family.members.map((m, idx) => {
            const fake = /-d\d+$/.test(m.id);
            return (
              <li
                key={m.id}
                className={`flex items-center justify-between border-2 border-zinc-800/10 p-3 shadow-brutalSm ${
                  idx % 2 === 0 ? "bg-white" : "bg-zinc-50/90"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900">{m.label}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {m.isLeader ? "Организатор" : "Участник"} · покупки{" "}
                    <span className="font-mono tabular-nums text-zinc-800">{formatMoney(m.monthQrSpendRub)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {m.isLeader ? (
                    <Badge className="border border-slate-300/80 bg-slate-200/90 text-[10px] font-bold text-slate-800">
                      орг
                    </Badge>
                  ) : null}
                  {fake ? (
                    <span className="rounded border border-slate-300/80 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                      демо
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
          {Array.from({ length: family.openSlots }).map((_, i) => (
            <li
              key={`open-${i}`}
              className="border-2 border-dashed border-zinc-300/80 bg-zinc-100/50 p-3 text-sm text-zinc-500"
            >
              Свободное место — отправьте приглашение ниже
            </li>
          ))}
        </ul>
      </div>

      <Card className="border border-slate-200/90 bg-white shadow-brutalSm">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-black text-zinc-900">Код и ссылка</p>
          <p className="font-mono text-sm font-bold tracking-wide text-zinc-800">{family.inviteCode}</p>
          <p className="break-all font-mono text-[10px] leading-relaxed text-zinc-500">{family.inviteLink}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" className="gap-2 shadow-brutalSm" onClick={() => onCopy(family.inviteLink)}>
              <Link2 className="h-4 w-4" />
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </Button>
            <Button type="button" size="sm" variant="secondary" className="gap-2 shadow-brutalSm" onClick={() => onShare(family.inviteLink)}>
              <Share2 className="h-4 w-4" />
              Поделиться
            </Button>
          </div>
        </CardContent>
      </Card>

      {activity.length > 0 ? (
        <details className="group rounded-xl border border-slate-200/90 bg-white/90 shadow-brutalSm open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-zinc-800 marker:hidden [&::-webkit-details-marker]:hidden">
            <span>Журнал <span className="font-mono text-zinc-500">({activity.length})</span></span>
            <span className="text-xs font-normal text-zinc-500 group-open:rotate-180 motion-safe:transition-transform" aria-hidden>
              ▼
            </span>
          </summary>
          <div className="border-t border-slate-100 px-2 pb-2">
            <ul className="max-h-48 space-y-0 overflow-y-auto scrollbar-thin sm:max-h-64">
              {activity.map((row) => (
                <li
                  key={row.id}
                  className="flex gap-2 border-b border-slate-100 py-2 text-xs last:border-b-0"
                >
                  <span className="w-[4.5rem] shrink-0 font-mono text-[10px] text-slate-400">
                    {formatSqliteDateTime(row.at)}
                  </span>
                  <span className="min-w-0 leading-snug text-slate-700">{row.line}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      <details className="group rounded-xl border border-dashed border-slate-300/90 bg-slate-50/95 shadow-brutalSm open:border-solid">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700 marker:hidden [&::-webkit-details-marker]:hidden">
          <span>
            Тестовые действия{" "}
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold normal-case tracking-normal text-slate-100">
              демо
            </span>
          </span>
          <span className="text-slate-500 group-open:rotate-180 motion-safe:transition-transform" aria-hidden>
            ▼
          </span>
        </summary>
        <div className="border-t border-slate-200/80 p-3 pt-2">
          <div className="flex flex-col gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-slate-600">Сумма операции, ₽ (как в выписке / пуше банка)</label>
              <Input
                className="h-10 border-2 font-mono tabular-nums"
                inputMode="decimal"
                placeholder="например 1888 или пусто = случайная для теста"
                value={qrAmount}
                onChange={(e) => setQrAmount(e.target.value)}
              />
              <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                В демо вы задаёте сумму сами. В продукте она придёт из данных банка по факту покупки. Сумма добавляется
                к вашим личным тратам за месяц и учитывается в семейном счёте.
              </p>
            </div>
            <Button
              type="button"
              className="h-11 w-full gap-2 border-2 border-primary/30 bg-primary font-bold text-white shadow-brutalSm transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              disabled={busy}
              onClick={() => {
                const raw = qrAmount.trim().replace(/\s/g, "").replace(",", ".");
                const n = parseFloat(raw);
                const amount =
                  Number.isFinite(n) && n > 0
                    ? Math.max(0.01, Math.round(n * 100) / 100)
                    : 300 + Math.floor(Math.random() * 1700);
                onSimQr(amount);
              }}
            >
              <QrCode className="h-4 w-4" />
              Симулировать оплату по QR
            </Button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" className="h-10 gap-1 font-semibold shadow-brutalSm" disabled={busy} onClick={onDemoPeers}>
                +3 демо-участника
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-1 border-2 border-zinc-400/50 font-semibold text-zinc-800 shadow-brutalSm"
                disabled={busy}
                onClick={onResetMySpend}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Обнулить мои траты
              </Button>
            </div>
            <Button
              type="button"
              className="h-10 w-full gap-2 border-2 border-red-900/20 bg-red-50/90 font-bold text-red-950 shadow-brutalSm hover:bg-red-100/90"
              disabled={busy}
              onClick={onDemoResetFull}
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить демо целиком
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
            Полный сброс: ваши траты обнуляются, тестовые персонажи удаляются. Реальные участники не затрагиваются.
          </p>
        </div>
      </details>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-2 border-zinc-400 font-semibold text-zinc-800 shadow-brutalSm"
        disabled={busy}
        onClick={onLeave}
      >
        <UserMinus className="mr-2 h-4 w-4" />
        Покинуть семью
      </Button>
    </div>
  );
}
