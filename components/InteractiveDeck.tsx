"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PointerEvent as ReactPointerEvent } from "react";
import CardArtwork from "@/components/CardArtwork";
import { getCardImageCandidates } from "@/lib/card-images";
import { TAROT_DECK, randomOrientation } from "@/lib/deck";
import type { DrawnCard, TarotCard } from "@/lib/types";

type Props = {
  count: number;
  positions: string[];
  spreadLabel?: string;
  onComplete: (cards: DrawnCard[]) => void;
  actions?: ReactNode;
};

type Phase = "idle" | "shuffling" | "fan" | "ready" | "revealing" | "done";
type ShuffleStep = "cut" | "riffle" | "gather";
type DragState = {
  deckIndex: number;
  fromSlot: number | null;
  startX: number;
  startY: number;
};

function shuffleDeck(): TarotCard[] {
  const next = [...TAROT_DECK];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function firstEmptySlot(slots: Array<number | undefined>) {
  return slots.findIndex((value) => value === undefined);
}


export default function InteractiveDeck({ count, positions, spreadLabel, onComplete, actions }: Props) {
  const [deck, setDeck] = useState<TarotCard[]>(() => shuffleDeck());
  const [phase, setPhase] = useState<Phase>("idle");
  const [shuffleStep, setShuffleStep] = useState<ShuffleStep>("cut");
  const [slots, setSlots] = useState<Array<number | undefined>>(() => Array(count).fill(undefined));
  const [preparedCards, setPreparedCards] = useState<DrawnCard[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>(() => Array(count).fill(false));
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [shuffleRound, setShuffleRound] = useState(0);
  const timers = useRef<number[]>([]);
  const completionScheduled = useRef(false);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const dragPointerRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number | null>(null);
  const hoverSlotRef = useRef<number | null>(null);
  const fanZoneRef = useRef<HTMLDivElement | null>(null);
  const fanGuideRef = useRef<HTMLDivElement | null>(null);
  const fanCardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const hoveredFanDeckIndexRef = useRef<number | null>(null);
  const fanTouchStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const pickedSet = useMemo(() => new Set(slots.filter((value): value is number => value !== undefined)), [slots]);
  // Keep all 78 Tarot cards in the spread. They overlap densely so every card remains
  // available to select without requiring all 78 card faces to be fully exposed at once.
  const visibleFanCards = useMemo(
    () => deck.map((card, deckIndex) => ({ card, deckIndex })),
    [deck]
  );
  const fanLayout = useMemo(() => visibleFanCards.map(({ card, deckIndex }, visualIndex) => {
    const progress = visibleFanCards.length <= 1 ? 0 : visualIndex / (visibleFanCards.length - 1);
    const normal = progress * 2 - 1;
    const left = 50 + normal * 45;
    const bottom = 8 + (1 - normal * normal) * 68;
    const rotate = normal * 33;
    return { card, deckIndex, visualIndex, left, bottom, rotate };
  }), [visibleFanCards]);
  const filledCount = pickedSet.size;
  const revealedCount = revealed.filter(Boolean).length;

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    if (dragRafRef.current !== null) window.cancelAnimationFrame(dragRafRef.current);
    if (typeof document !== "undefined") delete document.documentElement.dataset.tarotDeckBusy;
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    // Only mark the deck busy while cards are actually moving/being selected.
    // Once all slots are filled, the 78-card fan is removed from the DOM, so the
    // browser can release those paint/compositor resources immediately.
    const busy = phase === "shuffling" || phase === "fan" || phase === "revealing" || Boolean(drag);
    if (busy) document.documentElement.dataset.tarotDeckBusy = "true";
    else delete document.documentElement.dataset.tarotDeckBusy;
  }, [phase, drag]);

  useEffect(() => {
    if (!preparedCards || typeof window === "undefined") return;
    preparedCards.forEach((card) => {
      const image = new Image();
      image.decoding = "async";
      image.src = getCardImageCandidates(card.id)[0];
    });
  }, [preparedCards]);

  useEffect(() => {
    const clearHover = () => {
      const index = hoveredFanDeckIndexRef.current;
      if (index !== null) fanCardRefs.current.get(index)?.classList.remove("fan-card-targeted", "fan-card-edge-targeted");
      hoveredFanDeckIndexRef.current = null;
      fanGuideRef.current?.classList.remove("is-visible", "is-edge-target", "edge-left");
    };
    window.addEventListener("scroll", clearHover, true);
    window.addEventListener("resize", clearHover);
    return () => {
      window.removeEventListener("scroll", clearHover, true);
      window.removeEventListener("resize", clearHover);
    };
  }, []);

  // The pointer layer can stop receiving leave events when the cursor crosses
  // a gap or another element. Clear the lifted card wherever the pointer goes.
  useEffect(() => {
    if (phase !== "fan" || drag) return;

    const clearHover = () => {
      const index = hoveredFanDeckIndexRef.current;
      if (index === null) return;
      fanCardRefs.current.get(index)?.classList.remove("fan-card-targeted", "fan-card-edge-targeted");
      hoveredFanDeckIndexRef.current = null;
      fanGuideRef.current?.classList.remove("is-visible", "is-edge-target", "edge-left");
    };
    const clearOutsideCard = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".fan-pointer-card")) return;
      clearHover();
    };

    document.addEventListener("pointermove", clearOutsideCard);
    window.addEventListener("blur", clearHover);
    return () => {
      document.removeEventListener("pointermove", clearOutsideCard);
      window.removeEventListener("blur", clearHover);
    };
  }, [phase, drag]);

  function setFanTarget(deckIndex: number | null) {
    const previous = hoveredFanDeckIndexRef.current;
    if (previous === deckIndex) return;

    if (previous !== null) {
      const previousNode = fanCardRefs.current.get(previous);
      previousNode?.classList.remove("fan-card-targeted", "fan-card-edge-targeted");
    }

    const guide = fanGuideRef.current;
    guide?.classList.remove("is-visible", "is-edge-target", "edge-left");

    if (deckIndex !== null) {
      const item = fanLayout.find((entry) => entry.deckIndex === deckIndex);
      const node = fanCardRefs.current.get(deckIndex);

      if (item && node) {
        const leftGhostCount = Math.min(5, fanLayout.length);
        const isLeftGhostCard = item.visualIndex < leftGhostCount;

        // Every targeted real card only moves upward. Its original stacking order
        // is preserved so it never pops out as a separate full card.
        node.classList.add("fan-card-targeted");
        if (isLeftGhostCard) node.classList.add("fan-card-edge-targeted");

        // The outline-only helper exists ONLY for the five hardest-to-pick cards
        // at the far left. There is intentionally no right-edge ghost anymore.
        if (guide && isLeftGhostCard) {
          const zone = fanZoneRef.current;
          if (!zone) return;
          const rect = zone.getBoundingClientRect();
          guide.style.left = `${rect.left + rect.width * item.left / 100}px`;
          guide.style.top = `${rect.bottom - parseFloat(window.getComputedStyle(node).bottom) - node.offsetHeight}px`;
          guide.style.setProperty("--ghost-width", `${node.offsetWidth}px`);
          guide.style.setProperty("--ghost-height", `${node.offsetHeight}px`);
          guide.style.transform = `translateX(-50%) rotate(${item.rotate}deg) translateY(-36px)`;
          guide.classList.add("is-visible", "is-edge-target", "edge-left");
        }
      }
    }

    hoveredFanDeckIndexRef.current = deckIndex;
  }

  function handleFanPointerDown(event: ReactPointerEvent<HTMLElement>, deckIndex: number) {
    if (event.pointerType === "touch") return;
    setFanTarget(deckIndex);
    beginDrag(event, deckIndex);
  }

  function handleFanCardPointerDown(event: ReactPointerEvent<HTMLElement>, deckIndex: number) {
    if (event.pointerType === "touch") {
      fanTouchStartRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
      return;
    }
    beginDrag(event, deckIndex);
  }

  function scrollMobileFan(direction: -1 | 1) {
    const zone = fanZoneRef.current;
    if (!zone) return;
    zone.scrollBy({
      left: direction * Math.max(180, zone.clientWidth * 0.72),
      behavior: "smooth"
    });
  }

  function handleFanPointerLeave() {
    if (drag) return;
    setFanTarget(null);
  }

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    timers.current.push(timer);
  }

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function makePrepared(nextSlots: Array<number | undefined>): DrawnCard[] {
    return nextSlots.map((deckIndex, index) => ({
      ...deck[deckIndex as number],
      orientation: randomOrientation(),
      position: positions[index] || `Vị trí ${index + 1}`
    }));
  }

  function startShuffle() {
    if (phase === "shuffling" || phase === "revealing") return;
    clearTimers();
    completionScheduled.current = false;
    setSlots(Array(count).fill(undefined));
    setPreparedCards(null);
    setRevealed(Array(count).fill(false));
    setDrag(null);
    setHoverSlot(null);
    setFanTarget(null);
    setShuffleStep("cut");
    setShuffleRound((value) => value + 1);
    setPhase("shuffling");

    schedule(() => setShuffleStep("riffle"), 850);
    schedule(() => setShuffleStep("gather"), 2250);
    schedule(() => {
      setDeck(shuffleDeck());
      setPhase("fan");
    }, 3350);
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, deckIndex: number, fromSlot: number | null = null) {
    if ((phase !== "fan" && phase !== "ready") || drag) return;
    if (fromSlot === null && pickedSet.has(deckIndex)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragPointerRef.current = { x: event.clientX, y: event.clientY };
    hoverSlotRef.current = null;
    setDrag({
      deckIndex,
      fromSlot,
      startX: event.clientX,
      startY: event.clientY
    });
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    event.preventDefault();
    dragPointerRef.current = { x: event.clientX, y: event.clientY };

    if (dragRafRef.current !== null) return;
    dragRafRef.current = window.requestAnimationFrame(() => {
      dragRafRef.current = null;
      const { x, y } = dragPointerRef.current;
      if (dragGhostRef.current) {
        dragGhostRef.current.style.setProperty("--drag-x", `${x}px`);
        dragGhostRef.current.style.setProperty("--drag-y", `${y}px`);
      }
      const target = document.elementFromPoint(x, y) as HTMLElement | null;
      const slot = target?.closest<HTMLElement>("[data-drop-slot]");
      const nextHover = slot ? Number(slot.dataset.dropSlot) : null;
      if (nextHover !== hoverSlotRef.current) {
        hoverSlotRef.current = nextHover;
        setHoverSlot(nextHover);
      }
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!drag) return;
    event.preventDefault();
    const currentDrag = drag;
    if (dragRafRef.current !== null) {
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const slotElement = target?.closest<HTMLElement>("[data-drop-slot]");
    const dropSlot = slotElement ? Number(slotElement.dataset.dropSlot) : null;
    const moved = Math.hypot(event.clientX - currentDrag.startX, event.clientY - currentDrag.startY) > 7;

    if (!moved && currentDrag.fromSlot !== null && phase === "ready") {
      flipOne(currentDrag.fromSlot);
    } else if (dropSlot !== null) {
      placeIntoSlot(currentDrag.deckIndex, dropSlot, currentDrag.fromSlot);
    } else if (!moved && currentDrag.fromSlot === null) {
      const empty = firstEmptySlot(slots);
      if (empty >= 0) placeIntoSlot(currentDrag.deckIndex, empty, null);
    }

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    hoverSlotRef.current = null;
    setDrag(null);
    setHoverSlot(null);
    setFanTarget(null);
  }

  function cancelDrag(event: ReactPointerEvent<HTMLElement>) {
    fanTouchStartRef.current = null;
    if (dragRafRef.current !== null) {
      window.cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    hoverSlotRef.current = null;
    setDrag(null);
    setHoverSlot(null);
    setFanTarget(null);
  }

  function touchPickFromFan(event: ReactPointerEvent<HTMLElement>, deckIndex: number) {
    if (drag) {
      endDrag(event);
      return;
    }
    if (event.pointerType !== "touch") {
      endDrag(event);
      return;
    }
    const touchStart = fanTouchStartRef.current;
    fanTouchStartRef.current = null;
    if (!touchStart || touchStart.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 9) return;
    if (phase !== "fan" && phase !== "ready") return;
    if (pickedSet.has(deckIndex)) return;
    const empty = firstEmptySlot(slots);
    if (empty >= 0) placeIntoSlot(deckIndex, empty, null);
  }

  function touchUseSlot(event: ReactPointerEvent<HTMLElement>, slotIndex: number) {
    if (drag) {
      endDrag(event);
      return;
    }
    if (event.pointerType !== "touch") {
      endDrag(event);
      return;
    }
    if (phase === "ready") flipOne(slotIndex);
  }

  function placeIntoSlot(deckIndex: number, targetSlot: number, fromSlot: number | null) {
    if (targetSlot < 0 || targetSlot >= count) return;

    setSlots((current) => {
      const next = [...current];

      if (fromSlot !== null) {
        const sourceCard = next[fromSlot];
        if (sourceCard === undefined) return current;
        const targetCard = next[targetSlot];
        next[targetSlot] = sourceCard;
        next[fromSlot] = targetCard;
      } else {
        if (next[targetSlot] !== undefined || current.includes(deckIndex)) return current;
        next[targetSlot] = deckIndex;
      }

      setRevealed(Array(count).fill(false));
      completionScheduled.current = false;
      const done = next.every((value) => value !== undefined);
      if (done) {
        setPreparedCards(makePrepared(next));
        setPhase("ready");
      } else {
        setPreparedCards(null);
        setPhase("fan");
      }
      return next;
    });
  }

  function removeFromSlot(slotIndex: number) {
    if (phase === "revealing") return;
    setSlots((current) => current.map((value, index) => index === slotIndex ? undefined : value));
    setPreparedCards(null);
    setRevealed(Array(count).fill(false));
    completionScheduled.current = false;
    setPhase("fan");
  }

  function finishAfterAnimation(cards: DrawnCard[], delay: number) {
    if (completionScheduled.current) return;
    completionScheduled.current = true;
    schedule(() => {
      setPhase("done");
      onComplete(cards);
    }, delay);
  }

  function flipOne(slotIndex: number) {
    if (!preparedCards || revealed[slotIndex]) return;
    setPhase("revealing");
    setRevealed((current) => {
      const next = [...current];
      next[slotIndex] = true;
      if (next.every(Boolean)) {
        finishAfterAnimation(preparedCards, 900);
      } else {
        schedule(() => setPhase("ready"), 720);
      }
      return next;
    });
  }

  function flipNext() {
    if (!preparedCards || phase === "shuffling") return;
    const nextIndex = revealed.findIndex((value) => !value);
    if (nextIndex >= 0) flipOne(nextIndex);
  }

  function flipAll() {
    if (!preparedCards || revealed.every(Boolean) || phase === "shuffling") return;
    setPhase("revealing");
    const pending = revealed.map((value, index) => value ? -1 : index).filter((index) => index >= 0);
    pending.forEach((slotIndex, order) => {
      schedule(() => {
        setRevealed((current) => current.map((value, index) => index === slotIndex ? true : value));
      }, order * 220);
    });
    finishAfterAnimation(preparedCards, Math.max(900, pending.length * 220 + 760));
  }

  function resetDraw() {
    clearTimers();
    completionScheduled.current = false;
    setSlots(Array(count).fill(undefined));
    setPreparedCards(null);
    setRevealed(Array(count).fill(false));
    setDrag(null);
    setHoverSlot(null);
    setFanTarget(null);
    setPhase("idle");
  }

  const instruction = phase === "idle"
    ? "Tập trung vào câu hỏi, sau đó bấm Xáo bài ở ngay dưới bộ bài."
    : phase === "shuffling"
      ? shuffleStep === "cut"
        ? "Đang tách bộ bài thành hai nửa…"
        : shuffleStep === "riffle"
          ? "Đang đan hai nửa bài vào nhau…"
          : "Đang gom bộ bài lại…"
      : phase === "fan"
        ? `Kéo ${count - filledCount} lá còn lại vào đúng vị trí bạn muốn.`
        : phase === "revealing"
          ? `Đang lật bài tại chỗ · ${revealedCount}/${count} lá đã mở.`
          : phase === "done"
            ? `Đã lật đủ ${count} lá. Các lá được giữ nguyên vị trí và kích thước trong ô.`
            : `Đã đủ bài. Kéo đổi vị trí hoặc bấm vào từng lá để lật.`;

  const hoverIsBlocked = hoverSlot !== null && slots[hoverSlot] !== undefined && drag?.fromSlot === null;
  const canReveal = Boolean(preparedCards) && revealedCount < count;

  return (
    <section className="interactive-draw panel v26-draw v27-draw" aria-label="Khu vực xáo, kéo và lật bài">
      <div className="interactive-draw-head v26-head v34-actions-head">
        <div>
          <div className="panel-kicker">04 · TRẢI BÀI{spreadLabel ? ` · ${spreadLabel}` : ""}</div>
          <h2>{filledCount}/{count} lá đã có</h2>
          <p>{instruction}</p>
        </div>
        {actions && <div className="v34-reading-actions-slot">{actions}</div>}
      </div>

      <div className={`draw-table v25-table v26-table v27-table phase-${phase}`}>
        <div className={`picked-slots draggable-slots v26-slots v27-slots count-${count > 6 ? "many" : count}`}>
          {Array.from({ length: count }, (_, index) => {
            const deckIndex = slots[index];
            const drawn = preparedCards?.[index];
            const isRevealed = revealed[index];
            const isHover = hoverSlot === index;
            const isBlocked = isHover && hoverIsBlocked;
            return (
              <div className="spread-slot-item" key={index}>
                <div className="slot-position-heading">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className="slot-position-name">{positions[index] || `Vị trí ${index + 1}`}</span>
                </div>
                <div
                  className={`picked-slot drop-slot v26-slot ${deckIndex !== undefined ? "filled" : ""} ${isHover ? "drop-hover" : ""} ${isBlocked ? "drop-blocked" : ""} ${isRevealed ? "revealed-slot" : ""}`}
                  data-drop-slot={index}
                >
                  {deckIndex !== undefined && (
                    <button
                      type="button"
                      className={`slot-flip-card ${isRevealed ? "is-revealed" : ""} ${drawn?.orientation === "reversed" ? "is-orientation-reversed" : ""}`}
                      aria-label={isRevealed ? `Lá ${index + 1} đã lật` : `Kéo hoặc bấm để lật lá ở vị trí ${index + 1}`}
                      onPointerDown={(event) => beginDrag(event, deckIndex, index)}
                      onPointerMove={moveDrag}
                      onPointerUp={(event) => touchUseSlot(event, index)}
                      onPointerCancel={cancelDrag}
                    >
                      <span className="slot-flip-inner">
                        <span className="slot-flip-face slot-flip-back ethereal-card-back"><i>✦</i></span>
                        <span className="slot-flip-face slot-flip-front">
                          {drawn && (
                            <span className={`slot-front-art ${drawn.orientation === "reversed" ? "reversed-art" : ""}`}>
                              <CardArtwork card={drawn} className="slot-rider-image" fallbackClassName="slot-rider-fallback" eager />
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  )}

                  {deckIndex !== undefined && !isRevealed && phase !== "revealing" && (
                    <button type="button" className="slot-remove" onClick={() => removeFromSlot(index)} aria-label="Bỏ lá khỏi vị trí">×</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(phase === "idle" || phase === "shuffling" || phase === "fan") && (
        <div className="v27-deck-stage low-gpu-deck-stage">
          {(phase === "idle" || phase === "shuffling") && (
            <div className={`riffle-zone v27-riffle-zone ${phase === "shuffling" ? "is-shuffling" : ""} step-${shuffleStep}`} key={shuffleRound}>
              {Array.from({ length: 24 }, (_, index) => {
                const packetIndex = Math.floor(index / 2);
                const side = index % 2 === 0 ? "left" : "right";
                return (
                  <div
                    className={`riffle-card packet-${side} ethereal-card-back`}
                    key={index}
                    style={{ "--packet-index": packetIndex, "--stack-index": index } as CSSProperties}
                  >
                    <span>✦</span>
                  </div>
                );
              })}
              <div className="riffle-shadow" />
              {phase === "shuffling" && (
                <div className="shuffle-progress-label v27-shuffle-label">
                  <b>{shuffleStep === "cut" ? "TÁCH BÀI" : shuffleStep === "riffle" ? "ĐAN BÀI" : "GOM BÀI"}</b>
                  <span>Đang xáo bài</span>
                </div>
              )}
              <div className="v27-inline-shuffle">
                {phase === "idle"
                  ? <button className="gold-button deck-shuffle-button" onClick={startShuffle}>✦ Xáo bài</button>
                  : <button className="gold-button deck-shuffle-button" disabled>Đang xáo bài…</button>}
              </div>
            </div>
          )}

          {phase === "fan" && (
            <div ref={fanZoneRef} className="fan-zone v25-fan v27-fan" aria-label="Bộ bài đang được trải úp" onPointerLeave={handleFanPointerLeave}>
              {fanLayout.map(({ card, deckIndex, visualIndex, left, bottom, rotate }) => {
                const isPicked = pickedSet.has(deckIndex);
                const isDragging = drag?.deckIndex === deckIndex && drag.fromSlot === null;
                return (
                  <button
                    type="button"
                    aria-label={`Kéo lá ${visualIndex + 1} vào vị trí trải bài`}
                    title="Giữ chuột và kéo lá này vào một ô phía trên"
                    key={card.id}
                    disabled={isPicked}
                    ref={(node) => {
                      if (node) fanCardRefs.current.set(deckIndex, node);
                      else fanCardRefs.current.delete(deckIndex);
                    }}
                    className={`fan-card ${isPicked ? "picked" : ""} ${isDragging ? "source-dragging" : ""}`}
                    style={{
                      "--fan-bottom": `${bottom}px`,
                      left: `${left}%`,
                      bottom: `${bottom}px`,
                      transform: `translateX(-50%) rotate(${rotate}deg)`,
                      zIndex: visualIndex + 1,
                      "--fan-stack": visualIndex + 1
                    } as CSSProperties}
                    onPointerDown={(event) => handleFanCardPointerDown(event, deckIndex)}
                    onPointerMove={moveDrag}
                    onPointerUp={(event) => touchPickFromFan(event, deckIndex)}
                    onPointerCancel={cancelDrag}
                  >
                    <span className="fan-card-visual ethereal-card-back" aria-hidden="true"><i>✦</i></span>
                  </button>
                );
              })}

              {typeof document !== "undefined" && createPortal(
                <div
                  ref={fanGuideRef}
                  className="fan-selection-guide fan-ghost-portal"
                  aria-hidden="true"
                />,
                document.body
              )}

              <div className="fan-pointer-layer" aria-hidden="true" onPointerLeave={handleFanPointerLeave}>
                {fanLayout.map(({ deckIndex, left, bottom, rotate, visualIndex }) => !pickedSet.has(deckIndex) && (
                  <div
                    key={deckIndex}
                    className="fan-pointer-card"
                    style={{
                      left: `${left}%`,
                      bottom: `${bottom}px`,
                      "--fan-bottom": `${bottom}px`,
                      transform: `translateX(-50%) rotate(${rotate}deg)`,
                      zIndex: visualIndex + 1
                    } as CSSProperties}
                    onPointerEnter={() => { if (!drag) setFanTarget(deckIndex); }}
                    onPointerMove={(event) => { if (drag) moveDrag(event); else setFanTarget(deckIndex); }}
                    onPointerDown={(event) => handleFanPointerDown(event, deckIndex)}
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                  />
                ))}
              </div>

              <div className="fan-shadow" />
            </div>
          )}
          {phase === "fan" && (
            <>
              <button
                type="button"
                className="mobile-fan-scroll mobile-fan-scroll-left"
                aria-label="Xem các lá phía trước"
                onClick={() => scrollMobileFan(-1)}
              >‹</button>
              <button
                type="button"
                className="mobile-fan-scroll mobile-fan-scroll-right"
                aria-label="Xem các lá tiếp theo"
                onClick={() => scrollMobileFan(1)}
              >›</button>
            </>
          )}
        </div>
        )}

        {drag && typeof document !== "undefined" && createPortal(
          <div
            ref={dragGhostRef}
            className="drag-card-ghost ethereal-card-back performance-drag-ghost"
            style={{ "--drag-x": `${drag.startX}px`, "--drag-y": `${drag.startY}px` } as CSSProperties}
            aria-hidden="true"
          >
            <span>✦</span>
          </div>,
          document.body
        )}
      </div>

      {(phase === "fan" || phase === "ready" || phase === "revealing" || phase === "done") && (
        <div className="deck-bottom-actions v27-deck-actions">
          {phase === "fan" && <button className="ghost-button" onClick={startShuffle}>Xáo lại</button>}
          {(phase === "ready" || phase === "revealing") && (
            <>
              <button className="gold-button" disabled={!canReveal || phase === "revealing"} onClick={flipNext}>Lật lá tiếp theo</button>
              <button className="gold-button soft-gold-button" disabled={!canReveal || phase === "revealing"} onClick={flipAll}>Lật tất cả</button>
              <button className="ghost-button" disabled={phase === "revealing"} onClick={startShuffle}>Xáo lại</button>
            </>
          )}
          {phase === "done" && <button className="ghost-button" onClick={startShuffle}>Xáo lại</button>}
          <button className="ghost-button" disabled={phase === "revealing"} onClick={resetDraw}>Thu bài</button>
        </div>
      )}

      {(phase === "fan" || phase === "ready" || phase === "revealing" || phase === "done") && (
        <p className="fan-tip v25-tip v26-tip">
          {phase === "fan"
            ? "Giữ chuột vào một lá úp rồi kéo vào đúng ô bạn muốn."
            : phase === "ready"
              ? "Bạn có thể kéo đổi vị trí. Bấm nhanh vào một lá trong ô để lật riêng, hoặc dùng nút Lật lá tiếp theo / Lật tất cả."
              : phase === "done"
                ? "Đã lật xong. Các lá vẫn nằm nguyên trong đúng ô, không phóng to và không chuyển sang layout khác."
                : "Các lá đang nằm nguyên trong ô và lật tại chỗ. Không kéo bài trong lúc animation đang chạy."}
        </p>
      )}
    </section>
  );
}
