"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, TrendingDown, Users } from "lucide-react";
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
    <div className="gradient-hero relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-savings/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[520px] flex-col px-5 pb-12 pt-14">
        <motion.header
          className="mb-6 flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-xl shadow-glow">
            🍊
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-zinc-900">Апельсин</p>
            <p className="text-xs text-zinc-500">Пэй в X5 · Семья</p>
          </div>
        </motion.header>

        <motion.h1
          className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900"
          custom={0}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          Меньше эквайринга — больше бонусов
        </motion.h1>
        <motion.p
          className="mb-8 text-base leading-relaxed text-zinc-600"
          custom={1}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          «Апельсин Пэй» переводит оплату с картовского эквайринга (≈1,5–3%) на СБП по QR (≈0,4–0,7%). Разница
          в комиссиях X5 — в бонусы. Семья суммирует покупки участников: чем выше траты
          на человека за месяц, тем выше общий уровень кэшбэка и бонусов.
        </motion.p>

        <motion.div custom={2} initial="initial" animate="animate" variants={fadeUp} className="mb-6 space-y-3">
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
              className="flex gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light">
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

        <motion.div custom={3} initial="initial" animate="animate" variants={fadeUp} className="mt-auto">
          <Button asChild size="lg" className="w-full text-base shadow-glow">
            <Link href="/login?next=/family">Войти и открыть семью</Link>
          </Button>
          <p className="mt-3 text-center text-[11px] text-zinc-400">
            Сначала короткий вход (e-mail, имя и фамилия при регистрации, пароль — демо). Несколько человек — несколько
            аккаунтов, один орг. шлёт код в семью.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
