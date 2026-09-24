"use client";

import { useEffect, useState } from "react";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";
import { getApiAuthHeaders } from "@/lib/supabase/auth-fetch";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  currentPlan: PlanId;
  isAdmin?: boolean;
  pageMode?: boolean;
  onClose: () => void;
};

const PLAN_RANK: Record<PlanId, number> = { free: 0, plus: 1, pro: 2, pro_max: 3 };

type SePayCheckout = {
  orderCode: number;
  paymentCode: string;
  amount: number;
  qrUrl: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
};

export default function PricingModal({ open, currentPlan, isAdmin = false, pageMode = false, onClose }: Props) {
  const [billingMode, setBillingMode] = useState<"flexible" | "week" | "month">("week");
  const [creditAmount, setCreditAmount] = useState(20);
  const creditUnitPrice = 1050;
  const creditTotal = creditAmount * creditUnitPrice;
  const [purchasingPlan, setPurchasingPlan] = useState<PlanId | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [checkout, setCheckout] = useState<SePayCheckout | null>(null);

  function changeCredit(next: number) {
    setCreditAmount(Math.max(1, Math.min(999, Math.floor(Number.isFinite(next) ? next : 20))));
  }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !checkout) return;
    let stopped = false;
    let attempts = 0;
    setPaymentMessage("Đang chờ ngân hàng xác nhận giao dịch…");

    const check = async () => {
      attempts += 1;
      try {
        const authHeaders = await getApiAuthHeaders();
        const response = await fetch(`/api/payments/status?orderCode=${encodeURIComponent(checkout.orderCode)}`, {
          headers: authHeaders,
          cache: "no-store"
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không kiểm tra được đơn hàng.");
        if (data.status === "paid") {
          stopped = true;
          setPaymentMessage("Thanh toán thành công. Gói đã được kích hoạt; trang sẽ tự tải lại…");
          const supabase = getSupabaseBrowserClient();
          if (supabase) await supabase.auth.refreshSession();
          window.setTimeout(() => window.location.replace("/"), 1600);
          return;
        }
        if (data.status === "failed" || data.status === "cancelled") {
          stopped = true;
          setPaymentError("Đơn hàng không hoàn tất. Tài khoản chưa được nâng cấp.");
          return;
        }
        if (attempts >= 450) {
          stopped = true;
          setPaymentMessage("Mã thanh toán đã hết thời gian chờ. Nếu đã chuyển khoản, hãy tải lại trang sau ít phút.");
        }
      } catch (error) {
        if (attempts >= 450) {
          stopped = true;
          setPaymentError(error instanceof Error ? error.message : "Không kiểm tra được thanh toán.");
        }
      }
    };
    void check();
    const timer = window.setInterval(() => {
      if (stopped) window.clearInterval(timer);
      else void check();
    }, 2000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [open, checkout]);

  async function startCheckout(plan: PlanId) {
    if (plan === "free" || billingMode === "flexible" || purchasingPlan) return;
    setPurchasingPlan(plan);
    setPaymentError("");
    setPaymentMessage("Đang tạo mã VietQR an toàn…");
    try {
      const authHeaders = await getApiAuthHeaders();
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ plan, period: billingMode })
      });
      const data = await response.json();
      if (!response.ok || !data.qrUrl || !data.paymentCode) throw new Error(data.error || "Không tạo được thanh toán.");
      setCheckout(data as SePayCheckout);
      setPaymentMessage("Quét mã hoặc chuyển khoản đúng số tiền và nội dung bên dưới.");
    } catch (error) {
      setPaymentMessage("");
      setPaymentError(error instanceof Error ? error.message : "Không tạo được thanh toán VietQR.");
      setPurchasingPlan(null);
    }
  }

  async function copyPaymentCode() {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.paymentCode);
    setPaymentMessage("Đã sao chép nội dung chuyển khoản.");
  }

  function closeCheckout() {
    setCheckout(null);
    setPurchasingPlan(null);
    setPaymentMessage("");
    setPaymentError("");
  }

  if (!open) return null;

  return (
    <div className={pageMode ? "pricing-page-shell" : "pricing-backdrop"} role="presentation" onMouseDown={pageMode ? undefined : onClose}>
      <section className={pageMode ? "pricing-modal pricing-page" : "pricing-modal"} role="dialog" aria-modal={!pageMode} aria-labelledby="pricing-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="pricing-header">
          <div>
            <span className="pricing-kicker">GÓI DỊCH VỤ</span>
            <h2 id="pricing-title">Chọn cách bạn muốn dùng TTarot</h2>
            <p>Nâng cấp model, kiểu trải và dung lượng lịch sử theo nhu cầu của bạn.</p>
          </div>
          <button className="pricing-close" type="button" onClick={onClose} aria-label={pageMode ? "Quay lại trang chủ" : "Đóng bảng gói"}>{pageMode ? "←" : "×"}</button>
        </header>

        {(paymentMessage || paymentError) && (
          <div className={`payment-status-banner ${paymentError ? "error" : ""}`} role="status">
            {paymentError || paymentMessage}
          </div>
        )}

        {checkout && (
          <div className="sepay-checkout-backdrop" role="presentation" onMouseDown={closeCheckout}>
            <section className="sepay-checkout" role="dialog" aria-modal="true" aria-labelledby="sepay-title" onMouseDown={(event) => event.stopPropagation()}>
              <button className="sepay-close" type="button" onClick={closeCheckout} aria-label="Đóng mã thanh toán">×</button>
              <span className="pricing-kicker">THANH TOÁN SEPAY</span>
              <h3 id="sepay-title">Quét mã VietQR</h3>
              <p className="sepay-intro">Gói được kích hoạt tự động sau khi ngân hàng ghi nhận giao dịch.</p>
              <div className="sepay-qr-frame">
                <img src={checkout.qrUrl} alt={`VietQR thanh toán ${checkout.amount.toLocaleString("vi-VN")} đồng`} />
              </div>
              <dl className="sepay-details">
                <div><dt>Số tiền</dt><dd>{checkout.amount.toLocaleString("vi-VN")}đ</dd></div>
                <div><dt>Ngân hàng</dt><dd>{checkout.bankCode}</dd></div>
                <div><dt>Số tài khoản</dt><dd>{checkout.accountNumber}</dd></div>
                {checkout.accountName && <div><dt>Chủ tài khoản</dt><dd>{checkout.accountName}</dd></div>}
                <div className="sepay-content-row"><dt>Nội dung bắt buộc</dt><dd>{checkout.paymentCode}</dd></div>
              </dl>
              <button className="sepay-copy" type="button" onClick={() => void copyPaymentCode()}>Sao chép nội dung</button>
              <div className={`sepay-waiting ${paymentError ? "error" : ""}`}>
                <span aria-hidden="true" />{paymentError || paymentMessage || "Đang chờ thanh toán…"}
              </div>
              <p className="sepay-warning">Không sửa nội dung chuyển khoản. Sai nội dung hoặc sai số tiền sẽ không tự kích hoạt gói.</p>
            </section>
          </div>
        )}

        <div className="pricing-toolbar">
          <div className="pricing-status" aria-label="Gói hiện tại">
            <span>{isAdmin ? "Vai trò" : "Gói hiện tại"}</span>
            <strong>{isAdmin ? "Admin · Toàn quyền" : PLANS[currentPlan].name}</strong>
          </div>
          <div className="billing-switch" role="tablist" aria-label="Chu kỳ gói dịch vụ">
            <button type="button" role="tab" aria-selected={billingMode === "flexible"} className={billingMode === "flexible" ? "active" : ""} onClick={() => setBillingMode("flexible")}>Linh hoạt</button>
            <button type="button" role="tab" aria-selected={billingMode === "week"} className={billingMode === "week" ? "active" : ""} onClick={() => setBillingMode("week")}>Tuần</button>
            <button type="button" role="tab" aria-selected={billingMode === "month"} className={billingMode === "month" ? "active" : ""} onClick={() => setBillingMode("month")}>Tháng</button>
          </div>
        </div>

        {billingMode === "flexible" ? (
          <div className="credit-pricing-shell">
            <article className="credit-pricing-card">
              <div className="pricing-card-head">
                <h3>Credit</h3>
                <p>Mua credit để tiếp tục sử dụng khi hết lượt đọc bài trong gói.</p>
              </div>
              <div className="pricing-price">{creditTotal.toLocaleString("vi-VN")}đ</div>
              <label className="credit-label" htmlFor="credit-amount">Số lượng credit</label>
              <div className="credit-stepper">
                <button type="button" onClick={() => changeCredit(creditAmount - 1)} aria-label="Giảm một credit">−</button>
                <input id="credit-amount" type="number" min="1" max="999" value={creditAmount} onChange={(event) => changeCredit(Number(event.target.value))} />
                <button type="button" onClick={() => changeCredit(creditAmount + 1)} aria-label="Tăng một credit">+</button>
              </div>
              <div className="credit-expiry">Không hết hạn</div>
              <button className="pricing-action" type="button" disabled>Mua {creditAmount} credit ({creditTotal.toLocaleString("vi-VN")}đ)</button>
            </article>
          </div>
        ) : (
        <div className="pricing-grid">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = !isAdmin && planId === currentPlan;
            const isDowngrade = PLAN_RANK[planId] < PLAN_RANK[currentPlan];
            const priceLabel = billingMode === "month" ? plan.monthlyPriceLabel : plan.weeklyPriceLabel;
            return (
              <article className={`pricing-card ${plan.featured ? "featured" : ""} ${isCurrent ? "current" : ""}`} key={plan.id}>
                {plan.featured && <span className="pricing-popular">PHỔ BIẾN</span>}
                <div className="pricing-card-head">
                  <h3>{plan.name}</h3>
                  <p>{plan.shortDescription}</p>
                </div>
                <div className={`pricing-price ${plan.id === "free" ? "free-price" : ""}`}>{priceLabel}</div>
                <div className="pricing-model">{plan.modelLabel}</div>
                <ul className="pricing-features">
                  {plan.features.map((feature) => <li className="included" key={feature}><span>✓</span>{feature}</li>)}
                  {plan.unavailable.map((feature) => <li className="excluded" key={feature}><span>×</span>{feature}</li>)}
                </ul>
                <button
                  className={`pricing-action ${isCurrent ? "current-action" : ""}`}
                  type="button"
                  disabled={isAdmin || plan.id === "free" || isDowngrade || Boolean(purchasingPlan)}
                  onClick={() => void startCheckout(plan.id)}
                >
                  {purchasingPlan === plan.id
                    ? "Đang tạo VietQR…"
                    : isAdmin
                      ? "Admin · Toàn quyền"
                      : plan.id === "free"
                        ? "Miễn phí"
                        : isDowngrade
                          ? "Gói thấp hơn"
                          : isCurrent
                            ? "Gia hạn gói"
                            : "Mua bằng VietQR"}
                </button>
              </article>
            );
          })}
        </div>
        )}
        <p className="pricing-footnote">{billingMode === "flexible" ? "Credit chưa được mở bán trong phiên bản này." : `Thanh toán qua VietQR. Gói ${billingMode === "month" ? "tháng có hiệu lực 30 ngày" : "tuần có hiệu lực 7 ngày"}; tài khoản tự cập nhật sau khi ngân hàng xác nhận.`}</p>
      </section>
    </div>
  );
}
