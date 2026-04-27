"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MobileShell } from "@/components/apelsin/mobile-shell";
import { apiJson, ApiError } from "@/lib/api-client";

const errRu: Record<string, string> = {
  login_taken: "Такой e-mail уже зарегистрирован",
  login_invalid: "E-mail: 5–100 символов, формат как в банке (user@example.ru)",
  first_name_invalid: "Имя: 1–50 символов, буквы и типичные знаки",
  last_name_invalid: "Фамилия: 1–50 символов, буквы и типичные знаки",
  password_length: "Пароль: от 8 до 128 символов",
  password_letter: "В пароле нужна буква (латиница или кириллица)",
  password_digit: "В пароле нужна цифра (0–9; с телефона подойдут и полноширинные ０-９)",
  invalid_credentials: "Неверный логин или пароль",
  action: "Ошибка запроса",
  network: "Нет связи с приложением. Проверьте подключение к сети и обновите страницу.",
  server: "Сейчас не получается войти. Попробуйте ещё раз через минуту или обновите страницу.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/family";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function goNext() {
    router.replace(next);
    router.refresh();
  }

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      await apiJson<{ ok: boolean }>("/api/auth", {
        method: "POST",
        body: JSON.stringify(
          mode === "register"
            ? {
                action: "register" as const,
                login: login.trim(),
                password,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
              }
            : {
                action: "login" as const,
                login: login.trim(),
                password,
              }
        ),
      });
      await goNext();
    } catch (e) {
      const key = e instanceof ApiError ? (e.code ?? e.message) : e instanceof Error ? e.message : "";
      setMsg(
        errRu[key] ??
          (key && key.length < 200 ? key : "Неизвестная ошибка — обнови страницу (Ctrl+Shift+R)")
      );
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin() {
    setMsg(null);
    setBusy(true);
    try {
      const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await apiJson<{ ok: boolean }>("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          login: `demo${suffix}@apelsin.test`,
          password: "Demo1234",
          firstName: "Демо",
          lastName: "Участник",
        }),
      });
      await goNext();
    } catch (e) {
      const key = e instanceof ApiError ? (e.code ?? e.message) : e instanceof Error ? e.message : "";
      setMsg(errRu[key] ?? "Не получилось открыть демо. Обновите страницу и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobileShell className="gradient-hero">
      <p className="mb-4">
        <Link href="/" className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-primary">
          ← На главную
        </Link>
      </p>

      <div className="mb-5 overflow-hidden rounded-[2rem] border border-white/70 bg-graphite p-5 text-white shadow-premium">
        <div className="mb-8 flex items-start justify-between">
          <div className="rounded-2xl bg-white/10 p-2.5 backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-orange-200" />
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-100/80">
            demo access
          </div>
        </div>
        <h1 className="max-w-xs text-3xl font-black leading-[0.95] tracking-[-0.06em]">
          Быстрый вход для защиты
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-orange-50/70">
          Лучший сценарий для показа: один клик, новый демо-профиль и сразу экран семьи.
        </p>
      </div>

      <Button type="button" size="lg" className="mb-5 w-full" disabled={busy} onClick={() => void demoLogin()}>
        <Sparkles className="h-5 w-5" />
        Войти в демо за 1 клик
        <ArrowRight className="h-5 w-5" />
      </Button>

      <div className="mb-4 flex gap-2 rounded-2xl border border-white/70 bg-white/60 p-1 shadow-sm backdrop-blur-xl">
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            mode === "login" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
          }`}
          onClick={() => setMode("login")}
        >
          Вход
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
            mode === "register" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"
          }`}
          onClick={() => setMode("register")}
        >
          Регистрация
        </button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">E-mail</label>
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="name@mail.ru"
              type="email"
              autoComplete="email"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">Тот же формат, что в профиле / выписке.</p>
          </div>
          {mode === "register" ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Имя</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Фамилия</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Петров"
                  autoComplete="family-name"
                />
              </div>
            </>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="например, MyPass42"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
            {mode === "register" ? (
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                Как обычно: <strong className="font-medium text-zinc-500">не короче 8 символов</strong>, есть{" "}
                <strong className="font-medium text-zinc-500">буква</strong> и{" "}
                <strong className="font-medium text-zinc-500">цифра</strong> (пример: <span className="font-mono">Keks2024</span>).
              </p>
            ) : null}
          </div>
          <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => void submit()}>
            {busy ? "…" : mode === "register" ? "Создать аккаунт" : "Войти"}
          </Button>
        </CardContent>
      </Card>

      {msg ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-red-600"
        >
          {msg}
        </motion.p>
      ) : null}

      <p className="mt-6 text-center text-xs text-zinc-500">
        После входа откроется <span className="font-medium text-zinc-700">Семья</span> — один человек создаёт группу и
        шлёт код остальным.
      </p>
    </MobileShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
