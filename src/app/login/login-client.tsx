"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "./actions";

type LoginTab = "doktor" | "admin";

function SubmitButton({ activeTab }: { activeTab: LoginTab }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        activeTab === "admin"
          ? "bg-accent hover:bg-accent/90 shadow-accent/20"
          : "bg-success hover:bg-success/90 shadow-success/20"
      }`}
    >
      {pending ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Giriş yapılıyor...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          {activeTab === "admin" ? "Yönetici Girişi" : "Doktor Girişi"}
        </>
      )}
    </button>
  );
}

export function LoginClient({ error }: { error: boolean }) {
  const [activeTab, setActiveTab] = useState<LoginTab>("admin");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-4 sm:p-8">
      {/* Arka plan dekoratif elementler */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-ai/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] space-y-6">
        {/* Logo / Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-white shadow-lg shadow-accent/20 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold text-text">TimelyFlow</h1>
          <p className="text-sm text-muted">Klinik Operasyon Yönetim Sistemi</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-2xl shadow-lg shadow-black/5 border border-border overflow-hidden">
          {/* Tab Seçimi */}
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold transition-all duration-200 relative ${
                activeTab === "admin"
                  ? "text-accent bg-accent/5"
                  : "text-muted hover:text-text hover:bg-bg/50"
              }`}
            >
              {/* Admin ikonu */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Yönetici Girişi
              {activeTab === "admin" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-t-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("doktor")}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 text-sm font-semibold transition-all duration-200 relative ${
                activeTab === "doktor"
                  ? "text-success bg-success/5"
                  : "text-muted hover:text-text hover:bg-bg/50"
              }`}
            >
              {/* Doktor ikonu */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
              Doktor Girişi
              {activeTab === "doktor" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-success rounded-t-full" />
              )}
            </button>
          </div>

          {/* Form */}
          <form
            action={signInAction}
            className="p-6 space-y-5"
          >
            {error && (
              <div className="rounded-lg bg-danger/5 p-3.5 text-sm text-danger text-center font-medium border border-danger/15 flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                E-posta veya şifre hatalı. Lütfen tekrar deneyin.
              </div>
            )}

            {/* Rol bilgi bandı */}
            <div className={`rounded-lg p-3 text-xs font-medium flex items-center gap-2 ${
              activeTab === "admin" 
                ? "bg-accent/5 text-accent border border-accent/10"
                : "bg-success/5 text-success border border-success/10"
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {activeTab === "admin"
                ? "Yönetici hesabınızla sisteme giriş yapabilirsiniz."
                : "Doktor hesabınızla giriş yaparak randevularınızı ve takviminizi yönetebilirsiniz."
              }
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-text mb-1.5"
                >
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                  placeholder={activeTab === "admin" ? "admin@klinik.com" : "doktor@klinik.com"}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text mb-1.5"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-surface text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <SubmitButton activeTab={activeTab} />
          </form>
        </div>

        {/* Alt bilgi */}
        <p className="text-center text-xs text-muted">
          © {new Date().getFullYear()} TimelyFlow — Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
