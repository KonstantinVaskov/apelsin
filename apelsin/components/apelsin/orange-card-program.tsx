"use client";

import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { CreditCard, Gift, Home, ShoppingBag, Sparkles, UserPlus, Users2, Zap } from "lucide-react";
import { FAMILY_LEVEL_BONUSES } from "@/lib/constants";

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, ease },
};

/** Блок механики «Апельсиновая карта» — только контент по ТЗ, визуал современный, mobile-first */
export function OrangeCardProgram() {
  return (
    <motion.section
      aria-labelledby="apelsin-card-h"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
      className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-premium backdrop-blur-2xl"
    >
      {/* mesh / glow */}
      <div
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-primary/35 via-savings/20 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-gradient-to-tr from-amber-200/30 to-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,0,0.12),transparent)]"
        aria-hidden
      />

      <div className="premium-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />

      <div className="relative px-4 py-7 sm:px-6">
        {/* 1. Краткое описание */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Бонусная программа
          </div>
          <h2 id="apelsin-card-h" className="text-3xl font-black tracking-[-0.06em] text-graphite sm:text-4xl">
            Апельсиновая карта
          </h2>
          <p className="mx-auto mt-3 max-w-[26rem] text-sm leading-relaxed text-zinc-600">
            Создавай Семью, приглашай близких и складывай покупки участников в общий счёт, чтобы всем получать больше
            кэшбэка и бонусов.
          </p>
          <p className="mx-auto mt-2 text-xs leading-relaxed text-zinc-500">
            Участие через группу «Семья»: <span className="font-medium text-zinc-700">нулевой уровень по карте</span> и{" "}
            <span className="font-medium text-zinc-700">3 уровня по тратам на человека</span>.
          </p>
        </div>

        {/* 2. Как это работает — 4 шага */}
        <motion.div {...reveal} className="mb-10">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Zap className="h-4 w-4 text-primary" />
            Как это работает
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <StepCard
              n={1}
              title="Создайте Семью"
              body="Один пользователь создаёт Семью и отправляет приглашение другим участникам."
              icon={UserPlus}
              accent="from-amber-400/80 to-orange-500"
            />
            <StepCard
              n={2}
              title="Оформите карты"
              body="Нулевой уровень фиксируется, когда у всех членов Семьи есть карта Апельсин."
              icon={CreditCard}
              accent="from-orange-500 to-primary"
            />
            <StepCard
              n={3}
              title="Складывайте покупки"
              body="Все покупки участников суммируются в общий семейный счёт за месяц."
              icon={ShoppingBag}
              accent="from-primary to-red-500/90"
            />
            <StepCard
              n={4}
              title="Получайте больше"
              body="Чем выше общий объём трат на человека, тем выше уровень кэшбэка и бонусов для всех."
              icon={Users2}
              accent="from-violet-500/90 to-primary"
            />
          </div>
        </motion.div>

        <motion.div {...reveal} className="mb-10 rounded-[1.6rem] border border-white/70 bg-graphite p-4 text-white shadow-premium">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-100/60">уровни семьи</p>
              <p className="mt-1 text-xl font-black tracking-tight">От карты до максимума</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-2 text-right backdrop-blur">
              <p className="font-mono text-2xl font-black text-orange-200">0 → 3</p>
              <p className="text-[10px] text-orange-100/60">уровня</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((level) => (
              <div key={level} className="rounded-2xl border border-white/10 bg-white/10 p-2 text-center backdrop-blur">
                <p className="font-mono text-lg font-black text-orange-200">L{level}</p>
                <div className="mt-2 flex h-16 items-end overflow-hidden rounded-full bg-white/10">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-primary to-orange-200"
                    style={{ height: `${28 + level * 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. Условия участия */}
        <motion.div {...reveal} className="mb-10">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Gift className="h-4 w-4 text-primary" />
            Условия программы
          </h3>
          <div className="space-y-3">
            <RoleRow
              step={1}
              title="Карта Апельсин у каждого"
              desc="Это условие нулевого уровня: семья участвует в программе, когда карту оформили все участники."
              pct="L0"
              bar="w-[33%]"
            />
            <RoleRow
              step={2}
              title="Общий семейный счёт"
              desc="Покупки всех членов семьи складываются в одну месячную сумму."
              pct="сумма"
              bar="w-[66%]"
            />
            <RoleRow step={3} title="Расчёт на человека" desc="Порог уровня равен тратам на человека, умноженным на число участников." pct="₽/чел." bar="w-full" />
          </div>
          <p className="mt-4 rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 text-center text-[11px] leading-relaxed text-zinc-500">
            Уровень семьи повышается только от <span className="font-medium text-zinc-700">общих покупок</span> и
            количества участников.
          </p>
        </motion.div>

        {/* 4. Уровни Семьи */}
        <motion.div {...reveal} className="mb-10">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            <Home className="h-4 w-4 text-primary" />
            Уровни Семьи
          </h3>
          <div className="grid gap-3">
            <FamilyTier
              tier={0}
              title="Семья 0 уровня"
              desc={`Все участники оформили карту Апельсин: ${FAMILY_LEVEL_BONUSES[0]}.`}
            />
            <FamilyTier
              tier={1}
              title="Семья 1 уровня"
              desc={`От 3 000 ₽ на человека: ${FAMILY_LEVEL_BONUSES[1]}.`}
            />
            <FamilyTier
              tier={2}
              title="Семья 2 уровня"
              desc={`От 5 000 ₽ на человека: ${FAMILY_LEVEL_BONUSES[2]}.`}
            />
            <FamilyTier
              tier={3}
              title="Семья 3 уровня"
              desc={`От 10 000 ₽ на человека: ${FAMILY_LEVEL_BONUSES[3]}.`}
            />
          </div>
          <p className="mt-4 rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 text-center text-[11px] leading-relaxed text-zinc-500">
            Для семьи из 4 человек пороги будут 12 000 ₽, 20 000 ₽ и 40 000 ₽ общего счёта за месяц.
          </p>
        </motion.div>

        {/* 5. Главное правило — спокойный блок, без лишнего декора */}
        <motion.div
          {...reveal}
          className="rounded-2xl border border-zinc-200/90 bg-zinc-50/90 px-4 py-4 text-center sm:px-5"
        >
          <p className="text-sm font-semibold leading-snug text-zinc-900 sm:text-base">
            Все покупки участников суммируются.
            <br />
            Уровень семьи определяет кэшбэк и бонусы для всех.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-600 sm:mt-3 sm:text-sm">
            Чем больше общий объём трат на человека, тем выше общий уровень программы.
          </p>
          <p className="mt-3 text-[11px] text-zinc-500 sm:text-xs">
            карта у всех · 3 000 ₽ · 5 000 ₽ · 10 000 ₽ на человека
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}

function StepCard({
  n,
  title,
  body,
  icon: Icon,
  accent,
}: {
  n: number;
  title: string;
  body: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="group relative flex gap-3 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/75 p-3.5 shadow-[0_18px_46px_-34px_rgba(24,17,12,0.65)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90">
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-graphite text-[10px] font-black text-white">
            {n}
          </span>
          <p className="text-sm font-bold leading-tight text-zinc-900">{title}</p>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{body}</p>
      </div>
    </div>
  );
}

function RoleRow({
  step,
  title,
  desc,
  pct,
  bar,
}: {
  step: 1 | 2 | 3;
  title: string;
  desc: string;
  pct: string;
  bar: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-white/75 p-3.5 shadow-[0_16px_40px_-34px_rgba(24,17,12,0.7)] backdrop-blur-xl sm:p-4">
      <div className="flex gap-3 sm:gap-3.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-graphite text-sm font-bold text-white shadow-sm"
          aria-hidden
        >
          {step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 min-[400px]:flex-row min-[400px]:items-start min-[400px]:justify-between min-[400px]:gap-3">
            <p className="text-sm font-bold leading-tight text-zinc-900">{title}</p>
            <span className="inline-flex w-fit shrink-0 rounded-xl bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-primary ring-1 ring-primary/10">
              {pct}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600 sm:mt-2">{desc}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200/80 sm:ml-[3.25rem]">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease }}
          style={{ transformOrigin: "left" }}
          className={`h-full rounded-full bg-gradient-to-r from-amber-400 via-primary to-red-500 ${bar}`}
        />
      </div>
    </div>
  );
}

function FamilyTier({ tier, title, desc }: { tier: 0 | 1 | 2 | 3; title: string; desc: string }) {
  const heights = ["h-4", "h-8", "h-12", "h-16"] as const;
  return (
    <div className="group flex gap-3 overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/80 p-3.5 shadow-[0_18px_48px_-36px_rgba(24,17,12,0.7)] backdrop-blur-xl transition-transform hover:-translate-y-0.5">
      <div className="flex w-14 shrink-0 flex-col items-center justify-end gap-1 rounded-2xl bg-gradient-to-b from-cream to-white py-2 shadow-inner">
        <div className={`w-6 rounded-t-md bg-gradient-to-t from-primary to-orange-200 shadow-glow ${heights[tier]}`} />
        <span className="text-[9px] font-black text-primary">L{tier}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-900">{title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">{desc}</p>
      </div>
    </div>
  );
}
