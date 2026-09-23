"use client";

import { useEffect, useState } from "react";
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans";

type Props = {
  open: boolean;
  currentPlan: PlanId;
  isAdmin?: boolean;
  onClose: () => void;
};

export default function PricingModal({ open, currentPlan, isAdmin = false, onClose }: Props) {
  const [billingMode, setBillingMode] = useState<"flexible" | "week" | "month">("week");
  const [creditAmount, setCreditAmount] = useState(20);
  const creditUnitPrice = 1050;
  const creditTotal = creditAmount * creditUnitPrice;

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

  if (!open) return null;

  return (
    <div className="pricing-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="pricing-modal" role="dialog" aria-modal="true" aria-labelledby="pricing-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="pricing-header">
          <div>
            <span className="pricing-kicker">GÓI DỊCH VỤ</span>
            <h2 id="pricing-title">Chọn cách bạn muốn dùng TTarot</h2>
            <p>Nâng cấp model, kiểu trải và dung lượng lịch sử theo nhu cầu của bạn.</p>
          </div>
          <button className="pricing-close" type="button" onClick={onClose} aria-label="Đóng bảng gói">×</button>
        </header>

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
                <button className={`pricing-action ${isCurrent ? "current-action" : ""}`} type="button" disabled>
                  {isCurrent ? "Gói hiện tại" : plan.id === "free" ? "Miễn phí" : "Đăng ký gói"}
                </button>
              </article>
            );
          })}
        </div>
        )}
        <p className="pricing-footnote">{billingMode === "flexible" ? "Credit đã mua không hết hạn và sẽ được trừ theo lượt đọc bài sau khi hệ thống thanh toán được kích hoạt." : `Các gói trả phí được tính theo ${billingMode === "month" ? "tháng" : "tuần"}.`} Thanh toán sẽ được bật sau khi cấu hình hệ thống thuê bao.</p>
      </section>
    </div>
  );
}
