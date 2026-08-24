"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "login" | "register";

type Props = {
  children: ReactNode;
};

export default function AuthGate({ children }: Props) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(configured);
  const [localPreview, setLocalPreview] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);

  useEffect(() => {
    if (!configured || !supabase) {
      setChecking(false);
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured, supabase]);

  useEffect(() => {
    const openAccount = () => setAccountPanelOpen(true);
    window.addEventListener("tarot-open-account", openAccount);
    return () => window.removeEventListener("tarot-open-account", openAccount);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;

    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Hãy nhập email.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Hai mật khẩu chưa trùng nhau.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
          }
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setUser(data.user ?? null);
        } else {
          setNotice("Đăng ký thành công. Hãy mở email và xác nhận tài khoản, sau đó quay lại đăng nhập.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) throw signInError;
        setUser(data.user ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xác thực tài khoản.");
    } finally {
      setSubmitting(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setAccountPanelOpen(false);
  }

  if (checking) {
    return (
      <div className="auth-shell auth-loading-screen">
        <div className="auth-orb" aria-hidden="true">✦</div>
        <p>Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (!configured && !localPreview) {
    return (
      <div className="auth-shell">
        <div className="auth-card auth-setup-card">
          <div className="auth-symbol">✦</div>
          <div className="auth-eyebrow">TAROT PRACTICE · AUTH READY</div>
          <h1>Chuẩn bị cho phiên bản online.</h1>
          <p>
            Supabase Auth đã được tích hợp vào code nhưng chưa có biến môi trường trên máy này.
            Khi bạn thêm URL và Publishable Key, web sẽ tự yêu cầu đăng ký / đăng nhập.
          </p>
          <div className="auth-setup-code">
            <code>NEXT_PUBLIC_SUPABASE_URL</code>
            <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
          </div>
          <button className="auth-primary" type="button" onClick={() => setLocalPreview(true)}>
            Xem bản local để tiếp tục chỉnh giao diện
          </button>
          <small>Chế độ local chỉ để phát triển. Khi deploy và có Supabase, nút bỏ qua này sẽ không xuất hiện.</small>
        </div>
      </div>
    );
  }

  if (configured && !user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-symbol">✦</div>
          <div className="auth-eyebrow">TAROT PRACTICE</div>
          <h1>{mode === "login" ? "Chào mừng bạn trở lại." : "Tạo không gian Tarot của bạn."}</h1>
          <p>
            {mode === "login"
              ? "Đăng nhập để tiếp tục trải bài và sử dụng các tính năng đọc bài."
              : "Tạo tài khoản bằng email và mật khẩu. Tùy cấu hình Supabase, bạn có thể cần xác nhận email."}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>
              Đăng nhập
            </button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); setNotice(""); }}>
              Đăng ký
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label>
              <span>Email</span>
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              <span>Mật khẩu</span>
              <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" />
            </label>
            {mode === "register" && (
              <label>
                <span>Nhập lại mật khẩu</span>
                <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" />
              </label>
            )}

            {error && <div className="auth-message auth-error">{error}</div>}
            {notice && <div className="auth-message auth-notice">{notice}</div>}

            <button className="auth-primary" type="submit" disabled={submitting}>
              {submitting ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {accountPanelOpen && (
        <div className="account-panel-backdrop" role="presentation" onMouseDown={() => setAccountPanelOpen(false)}>
          <section className="account-panel" role="dialog" aria-modal="true" aria-labelledby="account-panel-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="account-panel-head">
              <div>
                <span className="account-panel-kicker">TÀI KHOẢN</span>
                <h2 id="account-panel-title">Thông tin tài khoản</h2>
              </div>
              <button type="button" onClick={() => setAccountPanelOpen(false)} aria-label="Đóng">×</button>
            </header>
            <div className="account-panel-body">
              {configured && user ? (
                <>
                  <div className="account-info-row">
                    <span>Trạng thái</span>
                    <strong>Đã đăng nhập</strong>
                  </div>
                  <div className="account-info-row">
                    <span>Email</span>
                    <strong>{user.email}</strong>
                  </div>
                  <button className="account-signout" type="button" onClick={signOut}>Đăng xuất</button>
                </>
              ) : (
                <>
                  <div className="account-info-row">
                    <span>Trạng thái</span>
                    <strong>Chế độ local</strong>
                  </div>
                  <p className="account-local-note">Bản local đang bỏ qua đăng nhập để phục vụ chỉnh giao diện. Khi cấu hình Supabase, thông tin tài khoản sẽ hiển thị tại đây.</p>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
