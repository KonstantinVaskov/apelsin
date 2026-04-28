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
    <div className="relative min-h-screen bg-[#F8F9FA] overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[520px] flex-col px-5 pb-12 pt-14">
        <motion.header
          className="mb-7 flex items-center justify-between"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-primary text-xl text-white shadow-sm">
              <span className="font-black">A</span>
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-zinc-900">Апельсин</p>
              <p className="text-xs font-medium text-zinc-500">от Альфа-Банка</p>
            </div>
          </div>
        </motion.header>

        <motion.div
          custom={0}
          initial="initial"
          animate="animate"
          variants={fadeUp}
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary"
        >
          <Sparkles className="h-3.5 w-3.5" />
          семейная бонусная программа
        </motion.div>

        <motion.h1
          className="mb-3 text-[2.65rem] font-black leading-[0.92] tracking-[-0.075em] text-zinc-900 sm:text-5xl"
          custom={1}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          Карта Апельсин<br />и общая Семья
        </motion.h1>
        <motion.p
          className="mb-5 text-base font-medium leading-relaxed text-zinc-600"
          custom={2}
          initial="initial"
          animate="animate"
          variants={fadeUp}
        >
          Кэшбэк до 5000 ₽ каждый месяц в Пятёрочке и Перекрёстке. Семья суммирует покупки участников: чем выше общие траты
          за месяц, тем выше общий уровень кэшбэка и бонусов. Баллы бессрочные, без скрытых списаний.
        </motion.p>

        <motion.div custom={3} initial="initial" animate="animate" variants={fadeUp} className="mb-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm border border-zinc-100">
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">общий счёт семьи</p>
                  <p className="mt-1 font-mono text-3xl font-black tabular-nums text-zinc-900">40 000 ₽</p>
                </div>
                <div className="rounded-2xl bg-orange-50 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-primary">уровень</p>
                  <p className="text-2xl font-black text-primary">L3</p>
                </div>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full w-[92%] rounded-full bg-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["3 категории", "+2 бонуса", "вся семья"].map((x) => (
                  <div key={x} className="rounded-2xl bg-zinc-50 px-2.5 py-2 text-center text-[11px] font-bold text-zinc-700">
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
              t: "Семья и пороги 10/30/50 тыс. ₽",
              d: "Уровень открывает категории повышенного кэшбэка и бонусы партнеров (DDX, Билайн) для всех",
            },
          ].map((row) => (
            <div
              key={row.t}
              className="group flex gap-3 rounded-[1.35rem] bg-white p-4 shadow-sm border border-zinc-100"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                <row.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-zinc-900">{row.t}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{row.d}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <OrangeCardProgram />

        <motion.div custom={5} initial="initial" animate="animate" variants={fadeUp} className="mb-8">
          <h3 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            Бонусы от партнёров
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.35rem] border border-orange-500/20 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
              <p className="font-black text-zinc-900">DDX Fitness</p>
              <ul className="mt-2 space-y-1 text-[11px] text-zinc-600">
                <li>• Скидки на абонементы</li>
                <li>• Протеиновые батончики</li>
              </ul>
            </div>
            <div className="rounded-[1.35rem] border border-orange-500/20 bg-white/75 p-4 shadow-sm backdrop-blur-xl">
              <p className="font-black text-zinc-900">Билайн</p>
              <ul className="mt-2 space-y-1 text-[11px] text-zinc-600">
                <li>• Бесплатные ГБ и минуты</li>
                <li>• Скидки на тарифы</li>
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.div custom={6} initial="initial" animate="animate" variants={fadeUp} className="mt-auto">
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
