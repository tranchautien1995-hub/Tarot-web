"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import PricingModal from "@/components/PricingModal";
import { AccessProvider } from "@/components/AccessContext";
import { getPlanAccess } from "@/lib/plans";

type AuthMode = "login" | "register";

type Props = {
  children: ReactNode;
};

function authErrorMessage(err: unknown): string {
  const code = typeof err === "object" && err !== null && "code" in err ? String(err.code) : "";
  switch (code) {
    case "email_address_not_authorized":
      return "Supabase chưa cho phép gửi email xác nhận tới địa chỉ này. Chủ website cần cấu hình SMTP riêng trong Supabase Auth.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Supabase đang giới hạn số lần gửi hoặc yêu cầu. Hãy thử lại sau; nếu nhiều người gặp lỗi, chủ website cần kiểm tra giới hạn email trong Supabase.";
    case "email_provider_disabled":
    case "signup_disabled":
      return "Đăng ký bằng email đang bị tắt trong Supabase. Chủ website cần bật đăng ký ở Auth → Providers → Email.";
    case "email_not_confirmed":
      return "Tài khoản chưa xác nhận email. Hãy mở thư xác nhận rồi đăng nhập lại.";
    case "provider_disabled":
      return "Phương thức đăng nhập này chưa được bật trong Supabase Auth.";
    default:
      return err instanceof Error ? err.message : "Không thể xác thực tài khoản.";
  }
}

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
  const [pricingOpen, setPricingOpen] = useState(false);
  // Chỉ local hoàn toàn không cấu hình Supabase mới có quyền thử nghiệm.
  // Khi Supabase đã cấu hình, localhost cũng phải dùng đúng quyền của tài khoản.
  const localMode = !configured && localPreview;
  const { isAdmin, plan: currentPlan, access } = getPlanAccess(user?.app_metadata, localMode);

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

  useEffect(() => {
    const openPricing = () => setPricingOpen(true);
    window.addEventListener("tarot-open-pricing", openPricing);
    return () => window.removeEventListener("tarot-open-pricing", openPricing);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (!params.has("error")) return;
    const description = params.get("error_description") ?? "Đăng nhập không thành công. Hãy thử lại.";
    const oauthError = new Error(description) as Error & { code?: string };
    oauthError.code = params.get("error_code") ?? undefined;
    setError(authErrorMessage(oauthError));
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
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
          setNotice("Yêu cầu đăng ký đã được gửi. Nếu bật xác nhận email, hãy mở thư xác nhận rồi đăng nhập. Không thấy thư? Kiểm tra Spam hoặc liên hệ chủ website để kiểm tra cấu hình gửi email.");
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
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function signInWithGoogle() {
    if (!supabase) return;
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function signInWithFacebook() {
    if (!supabase) return;
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: { redirectTo: window.location.origin }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(authErrorMessage(err));
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
          <div className="auth-divider"><span>hoặc</span></div>
          <button className="auth-google" type="button" disabled={submitting} onClick={signInWithGoogle}>
            <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.81 7.26l7.69 5.96c4.49-4.14 7.16-10.25 7.16-17.69Z"/><path fill="#FBBC05" d="M10.53 28.59A14.37 14.37 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.76l-7.69-5.96c-2.13 1.43-4.86 2.22-8.2 2.22-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
            Tiếp tục với Google
          </button>
          <button className="auth-facebook" type="button" disabled={submitting} onClick={signInWithFacebook}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>
            Tiếp tục với Facebook
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AccessProvider value={{
        plan: currentPlan,
        isAdmin,
        access,
        userId: user?.id || (localMode ? "local-preview" : "guest"),
        localMode
      }}>
        {children}
      </AccessProvider>
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
                  <div className="account-info-row">
                    <span>Gói dịch vụ</span>
                    <strong>{isAdmin ? "Admin · Toàn quyền" : currentPlan === "pro_max" ? "Pro Max" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</strong>
                  </div>
                  {isAdmin && (
                    <div className="account-admin-note">Tài khoản quản trị được mở toàn bộ dịch vụ để quản lý và thử nghiệm.</div>
                  )}
                  <button className="account-plan-button" type="button" onClick={() => { setAccountPanelOpen(false); setPricingOpen(true); }}>Xem và nâng cấp gói</button>
                  <button className="account-signout" type="button" onClick={signOut}>Đăng xuất</button>
                </>
              ) : (
                <>
                  <div className="account-info-row">
                    <span>Trạng thái</span>
                    <strong>Chế độ local</strong>
                  </div>
                  <div className="account-info-row">
                    <span>Quyền thử nghiệm</span>
                    <strong>Admin · Toàn quyền</strong>
                  </div>
                  <div className="account-admin-note">Quyền Admin này chỉ dùng để kiểm tra trên máy local. Khi đưa lên web, tài khoản vẫn phải được cấp quyền bằng Supabase.</div>
                  <button className="account-plan-button" type="button" onClick={() => { setAccountPanelOpen(false); setPricingOpen(true); }}>Xem các gói dịch vụ</button>
                  <p className="account-local-note">Bản local đang bỏ qua đăng nhập để phục vụ chỉnh giao diện và thử nghiệm toàn bộ dịch vụ.</p>
                </>
              )}
            </div>
          </section>
        </div>
      )}
      <PricingModal open={pricingOpen} currentPlan={currentPlan} isAdmin={isAdmin} onClose={() => setPricingOpen(false)} />
    </>
  );
}
