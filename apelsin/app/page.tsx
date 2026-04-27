"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Crown, QrCode, Sparkles, TrendingDown, Users } from "lucide-react";
import { OrangeCardProgram } from "@/components/apelsin/orange-card-program";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.45 },
  }),
};

export default function LandingPage() {
  return (
    <div className="gradient-hero premium-noise relative min-h-screen overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-8 h-80 w-80 rounded-full bg-savings/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[34rem] -translate-x-1/2 rounded-full bg-white/45 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[520px] flex-col px-5 pb-12 pt-14">
        <motion.header
          className="mb-7 flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-primary via-orange-500 to-primary-dark text-xl shadow-glow">
              🍊
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-graphite">Апельсин</p>
              <p className="text-xs font-medium text-zinc-500">Пэй · Семья · Бонусы</p>
            </div>
          </div>
          <div className="rounded-full border border-primary/20 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-xl">
            online
          </div>
        </motion.header>

        <motion.div
          custom={0}
          initial="initial"
          animate="animate"
          variants={fadeUp}
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur-xl"
        >
          <Sparkles className="h-3.5 w-3.5" />
          семейная бонусная программа
        </motion.div>

        <motion.h1
          className="mb-3 text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-graphite sm:text-5xl"
          custom={1}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          Семейный кэшбэк, который хочется показать
        </motion.h1>
        <motion.p
          className="mb-5 text-base font-medium leading-relaxed text-zinc-700"
          custom={2}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          «Апельсин Пэй» переводит оплату с картовского эквайринга (≈1,5–3%) на СБП по QR (≈0,4–0,7%). Разница
          в комиссиях X5 — в бонусы. Семья суммирует покупки участников: чем выше траты
          на человека за месяц, тем выше общий уровень кэшбэка и бонусов.
        </motion.p>

        <motion.div custom={3} initial="initial" animate="animate" variants={fadeUp} className="mb-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-graphite p-4 text-white shadow-premium">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/45 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-savings/25 blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-100/70">общий счёт</p>
                  <p className="mt-1 font-mono text-3xl font-black tabular-nums">40 000 ₽</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-orange-100/60">уровень</p>
                  <p className="text-2xl font-black text-orange-200">L3</p>
                </div>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-orange-200 via-primary to-savings shadow-glow" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["3 категории", "+2 бонуса", "вся семья"].map((x) => (
                  <div key={x} className="rounded-2xl border border-white/10 bg-white/10 px-2.5 py-2 text-center text-[11px] font-bold text-orange-50 backdrop-blur">
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div custom={4} initial="initial" animate="animate" variants={fadeUp} className="mb-6 space-y-3">
          {[
            {
              icon: TrendingDown,
              t: "СБП вместо классического acquiring",
              d: "Ниже комиссия, устойчивая схема без гонки «процентов на проценты»",
            },
            { icon: QrCode, t: "Оплата в сети X5 по QR", d: "Один сценарий — проще согласовать в команде" },
            {
              icon: Users,
              t: "Семья и пороги 3/5/10 тыс. ₽",
              d: "Уровень открывает категории повышенного кэшбэка и бонусные категории для всех",
            },
          ].map((row) => (
            <div
              key={row.t}
              className="group flex gap-3 rounded-[1.35rem] border border-white/70 bg-white/75 p-3 shadow-[0_16px_44px_-34px_rgba(24,17,12,0.7)] backdrop-blur-xl transition-transform hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-savings/20">
                <row.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">{row.t}</p>
                <p className="text-xs text-zinc-500">{row.d}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <OrangeCardProgram />

        <motion.div custom={5} initial="initial" animate="animate" variants={fadeUp} className="mt-auto">
          <Button asChild size="lg" className="w-full text-base">
            <Link href="/login?next=/family">
              Открыть Апельсин
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-zinc-500">
            <Crown className="h-3.5 w-3.5 text-primary" />
            Создайте семью и пригласите участников по коду
          </p>
        </motion.div>
      </div>
    </div>
  );
}
