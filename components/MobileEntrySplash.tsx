"use client";

type Props = { onEnter: () => void };

export default function MobileEntrySplash({ onEnter }: Props) {
  return (
    <button className="mobile-entry-splash" type="button" onClick={onEnter} aria-label="Chạm vào màn hình để vào trang trải bài">
      <img className="mobile-entry-logo" src="/entry-v3/ttarot-logo.svg" alt="TTarot" width={309} height={424} loading="eager" decoding="async" />
      <span className="mobile-entry-hint">chạm vào màn hình</span>
    </button>
  );
}
