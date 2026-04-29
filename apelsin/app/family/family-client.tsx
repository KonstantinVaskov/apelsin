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
import { FAMILY_SPEND_THRESHOLDS_RUB } from "@/lib/constants";

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

const errRu: Record<string, string> = {
  not_in_family: "Сначала вступи в семью или создай её",
  not_in_squad: "Сначала вступи в семью или создай её",
  already_in_family: "Ты уже в семье",
  already_in_squad: "Ты уже в семье",
  action: "Неверный запрос",
  amount: "Сумма не подходит",
  code_not_found: "Код не найден",
  family_full: "Семья заполнена (12 участников)",
  family_closed: "Семья закрыта для вступлений по коду",
  squad_full: "Семья заполнена (12 участников)",
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
          const r = await apiJson<{ state: FamilyState }>("/api/family");
          if (!cancelled) {
            setState(r.state);
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

  async function post(body: { action: string; amountRub?: number; code?: string; targetUserId?: string }) {
    setMsg(null);
    setBusy(true);
    try {
      const r = await apiJson<{ state: FamilyState }>("/api/family", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setState(r.state);
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
    : [...FAMILY_SPEND_THRESHOLDS_RUB];

  return (
    <MobileShell className="family-page">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="mb-2">
          <Link href="/" className="text-sm font-medium text-orange-600 underline decoration-orange-500/30 underline-offset-4 hover:text-orange-500">
            ← На главную
          </Link>
        </p>
        <div className="rounded-2xl border border-orange-500/20 bg-white/80 px-3 py-2 text-right text-xs text-zinc-600 backdrop-blur-xl">
          <p className="max-w-[14rem] truncate text-[11px] font-semibold leading-tight text-zinc-900">
            {formatBankPersonName(me)}
          </p>
          <p className="max-w-[14rem] truncate font-mono text-[10px] text-zinc-500">{me.login}</p>
          <button
            type="button"
            className="mt-0.5 inline-flex items-center gap-1 text-zinc-400 hover:text-orange-500"
            onClick={() => void logout()}
            disabled={busy}
          >
            <LogOut className="h-3.5 w-3.5" />
            выйти
          </button>
        </div>
      </div>
      <div className="mb-4 inline-flex items-center rounded-full border border-orange-500/20 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 backdrop-blur-xl">
        Апельсин · X5
      </div>
      <h1 className="mb-1 font-black tracking-[-0.06em] text-zinc-900" style={{ fontSize: "clamp(2.4rem, 11vw, 3.5rem)" }}>
        Семья
      </h1>
      <p className="mb-3 text-sm font-medium leading-relaxed text-zinc-600">Семейный счёт, уровень кэшбэка и бонусы для всех.</p>
      <details className="mb-5 rounded-2xl border border-orange-500/20 bg-white/80 px-3 py-2 text-xs text-zinc-600 shadow-sm backdrop-blur-xl">
        <summary className="cursor-pointer list-none font-semibold text-zinc-900 outline-none marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-orange-500/30 underline-offset-2">Как работает программа</span>
        </summary>
        <p className="mt-2 border-t border-orange-500/10 pt-2 leading-relaxed">
          Создайте семью, пригласите участников (до 12 человек) и суммируйте покупки. Уровень считается по общим тратам семьи:
          10 000 ₽, 30 000 ₽ и 50 000 ₽. Чем больше общие траты — тем выше кэшбэк у всех! Баллы бессрочные, никаких скрытых списаний.
        </p>
      </details>

      {state.inFamily ? (
        <FamilyView
          family={state.family}
          maxMembers={state.maxMembers}
          thresholds={thresholds}
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
                "Сбросить тестовые данные: ваши траты → 0 и убрать тестовых участников? Реальные люди в семье не трогаются."
              )
            ) {
              void post({ action: "demo_reset" });
            }
          }}
          onKick={(targetUserId) => {
            if (window.confirm("Исключить участника из семьи?")) {
              void post({ action: "kick", targetUserId });
            }
          }}
          onTransferLeadership={() => {
            if (window.confirm("Организатор неактивен. Передать роль самого активному участнику?")) {
              void post({ action: "transfer_leadership" });
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          <Card className="bg-white/90">
            <CardContent className="p-4">
              <p className="text-sm font-black text-zinc-900">Создать семью</p>
              <p className="text-sm text-zinc-600">Вы станете организатором, остальным отправите приглашение по коду.</p>
              <Button
                type="button"
                className="mt-3 w-full gap-2 font-bold"
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
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-orange-100/70 backdrop-blur">или</span>
            </div>
          </div>
          <Card className="border-primary/20 bg-primary-light/90">
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
  busy,
  copied,
  onCopy,
  onShare,
  onLeave,
  onSimQr,
  onDemoPeers,
  onResetMySpend,
  onDemoResetFull,
  onKick,
  onTransferLeadership,
}: {
  family: FamilyIn;
  maxMembers: number;
  thresholds: number[];
  busy: boolean;
  copied: boolean;
  onCopy: (l: string) => void;
  onShare: (l: string) => void;
  onLeave: () => void;
  onSimQr: (amountRub: number) => void;
  onDemoPeers: () => void;
  onResetMySpend: () => void;
  onDemoResetFull: () => void;
  onKick: (userId: string) => void;
  onTransferLeadership: () => void;
}) {
  const [qrAmount, setQrAmount] = useState("");
  const t = nextThreshold(family.totalMonthQrSpendRub, thresholds);
  const pct = t ? Math.min(100, (family.totalMonthQrSpendRub / t) * 100) : 100;

  const isViewerLeader = family.members.find((m) => m.isYou)?.isLeader ?? false;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Card className="overflow-hidden border-orange-500/20 bg-white shadow-premium">
          <CardContent className="relative p-4">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 left-4 h-56 w-56 rounded-full bg-savings/10 blur-3xl" />
            <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Семейный счёт за месяц</p>
            <p className="mt-2 font-mono text-4xl font-black tabular-nums leading-none text-zinc-900">
              {formatMoney(family.totalMonthQrSpendRub)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-600">
              <span className="rounded-full bg-primary px-3 py-1 font-black text-white shadow-glow">
                Уровень {family.familyLevel}
              </span>
              <span className="rounded-full border border-orange-500/20 bg-orange-50 px-3 py-1 text-orange-800 backdrop-blur">
                общий счёт: <span className="font-mono text-orange-600">{formatMoney(family.totalMonthQrSpendRub)}</span>
              </span>
            </div>
            {t ? (
              <>
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-zinc-500">
                  до следующего уровня осталось <span className="font-mono font-semibold text-zinc-900">{formatMoney(t - family.totalMonthQrSpendRub)}</span>
                </p>
                <Progress
                  value={pct}
                  className="h-3 rounded-full border border-orange-500/10 bg-orange-500/10"
                  indicatorClassName="from-orange-400 via-primary to-savings"
                />
              </>
            ) : (
              <p className="mt-4 text-xs font-semibold text-primary">Семья достигла верхнего уровня</p>
            )}
            <p className="mt-4 flex items-start gap-2 rounded-2xl border border-orange-500/20 bg-orange-50 p-3 text-sm font-medium leading-snug text-zinc-800 backdrop-blur">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {family.familyLine}
            </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-black text-zinc-900">
          Участники <span className="font-mono text-primary">({family.memberCount}/{maxMembers})</span>
        </p>
        <ul className="space-y-2">
          {family.members.map((m, idx) => {
            const fake = /-d\d+$/.test(m.id);
            return (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-[1.35rem] border border-orange-500/20 bg-white p-3 shadow-sm backdrop-blur-xl"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 font-black text-orange-900 shadow-sm">
                    {m.label.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900">{m.label}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {m.isLeader ? "Организатор" : "Участник"}
                    {m.isYou && (
                      <>
                        {" · ваши покупки "}
                        <span className="font-mono tabular-nums text-zinc-800">{formatMoney(m.monthQrSpendRub)}</span>
                      </>
                    )}
                  </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {m.isLeader ? (
                    <Badge className="border border-orange-500/20 bg-orange-50 text-[10px] font-bold text-primary">
                      орг
                    </Badge>
                  ) : null}
                  {fake ? (
                    <span className="rounded-full border border-orange-500/20 bg-orange-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                      тест
                    </span>
                  ) : null}
                  {isViewerLeader && !m.isYou ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onKick(m.id)}
                      className="mt-1 text-[10px] font-medium text-red-600 hover:text-red-700 underline decoration-red-200 underline-offset-2"
                    >
                      исключить
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
          {Array.from({ length: family.openSlots }).map((_, i) => (
            <li
              key={`open-${i}`}
              className="rounded-[1.35rem] border border-dashed border-orange-500/30 bg-orange-50/50 p-3 text-sm text-zinc-400"
            >
              Свободное место — отправьте приглашение ниже
            </li>
          ))}
        </ul>
      </div>

      <Card className="border-orange-500/20 bg-white shadow-sm">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-black text-zinc-900">Код и ссылка</p>
          <p className="font-mono text-2xl font-black tracking-wide text-primary">{family.inviteCode}</p>
          <p className="break-all font-mono text-[10px] leading-relaxed text-zinc-500">{family.inviteLink}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" size="sm" className="gap-2" onClick={() => onCopy(family.inviteLink)}>
              <Link2 className="h-4 w-4" />
              {copied ? "Скопировано" : "Скопировать ссылку"}
            </Button>
            <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => onShare(family.inviteLink)}>
              <Share2 className="h-4 w-4" />
              Поделиться
            </Button>
          </div>
        </CardContent>
      </Card>


      <details className="group rounded-[1.35rem] border border-dashed border-orange-500/30 bg-orange-50/50 shadow-sm backdrop-blur-xl open:border-solid">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 marker:hidden [&::-webkit-details-marker]:hidden">
          <span>
            Тестовые действия{" "}
            <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold normal-case tracking-normal text-primary">
              тест
            </span>
          </span>
          <span className="text-zinc-400 group-open:rotate-180 motion-safe:transition-transform" aria-hidden>
            ▼
          </span>
        </summary>
        <div className="border-t border-orange-500/10 p-3 pt-2">
          <div className="flex flex-col gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-zinc-600">Сумма операции, ₽ (как в выписке / пуше банка)</label>
              <Input
                className="h-10 font-mono tabular-nums bg-white border-orange-500/20"
                inputMode="decimal"
                placeholder="например 1888 или пусто = случайная для теста"
                value={qrAmount}
                onChange={(e) => setQrAmount(e.target.value)}
              />
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
                Здесь можно задать сумму вручную. В продукте она придёт из данных банка по факту покупки. Сумма добавляется
                к вашим личным тратам за месяц и учитывается в семейном счёте.
              </p>
            </div>
            <Button
              type="button"
              className="h-11 w-full gap-2 font-bold"
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
              <Button type="button" variant="secondary" className="h-10 gap-1 font-semibold" disabled={busy} onClick={onDemoPeers}>
                +3 тестовых участника
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-1 font-semibold border-orange-500/20 text-zinc-700 hover:bg-orange-50"
                disabled={busy}
                onClick={onResetMySpend}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Обнулить мои траты
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full gap-2 font-semibold border-orange-500/20 text-zinc-700 hover:bg-orange-50"
              disabled={busy}
              onClick={onTransferLeadership}
            >
              <Users className="h-4 w-4" />
              Сменить организатора (тест)
            </Button>
            <Button
              type="button"
              className="h-10 w-full gap-2 border border-red-200/30 bg-red-50/90 font-bold text-red-700 hover:bg-red-100/90"
              disabled={busy}
              onClick={onDemoResetFull}
            >
              <RotateCcw className="h-4 w-4" />
              Сбросить тестовые данные
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Полный сброс: ваши траты обнуляются, тестовые персонажи удаляются. Реальные участники не затрагиваются.
          </p>
        </div>
      </details>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-orange-500/20 bg-white font-semibold text-zinc-900 hover:bg-orange-50"
        disabled={busy}
        onClick={onLeave}
      >
        <UserMinus className="mr-2 h-4 w-4 text-zinc-500" />
        Покинуть семью
      </Button>
    </div>
  );
}
