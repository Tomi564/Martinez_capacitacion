'use client';

/**
 * Selector tipo rueda (scroll táctil + snap) para evitar el teclado numérico en mobile.
 * Sin inputs editables: solo deslizar.
 */

import { useCallback, useEffect, useRef } from 'react';

const ITEM_H = 44;

function buildValues(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const nSteps = Math.max(0, Math.floor((max - min) / step + 1e-9));
  for (let i = 0; i <= nSteps; i++) {
    const v = min + i * step;
    if (v > max + 1e-9) break;
    out.push(Number.isInteger(step) ? Math.round(v) : Math.round(v * 100) / 100);
  }
  return out;
}

export interface NumberWheelPickerProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  formatDisplay?: (v: number) => string;
}

export function NumberWheelPicker({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
  formatDisplay,
}: NumberWheelPickerProps) {
  const values = buildValues(min, max, step);
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmatic = useRef(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const nearestIndex = useCallback(
    (v: number) => {
      let best = 0;
      let bestDist = Infinity;
      values.forEach((n, i) => {
        const d = Math.abs(n - v);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [values]
  );

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(valuesRef.current.length - 1, i));
    programmatic.current = true;
    el.scrollTop = clamped * ITEM_H;
    requestAnimationFrame(() => {
      programmatic.current = false;
    });
  }, []);

  useEffect(() => {
    const idx = nearestIndex(value);
    scrollToIndex(idx);
  }, [value, nearestIndex, scrollToIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let idle: ReturnType<typeof setTimeout>;

    const settle = () => {
      if (programmatic.current) return;
      clearTimeout(idle);
      idle = setTimeout(() => {
        if (programmatic.current) return;
        const idx = Math.round(el.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(valuesRef.current.length - 1, idx));
        const targetTop = clamped * ITEM_H;
        if (Math.abs(el.scrollTop - targetTop) > 2) {
          el.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
        const nv = valuesRef.current[clamped];
        if (nv !== undefined && nv !== value) {
          onChange(nv);
        }
      }, 100);
    };

    el.addEventListener('scroll', settle, { passive: true });
    return () => {
      clearTimeout(idle);
      el.removeEventListener('scroll', settle);
    };
  }, [value, onChange]);

  const pad = (ITEM_H * 2.5) / 2;

  const fmt = formatDisplay ?? ((n: number) => n.toLocaleString('es-AR'));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1">{label}</p>
      <div className="relative h-[176px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1/2 z-10 -translate-y-1/2 h-11 rounded-lg border border-[#C8102E]/40 bg-[#C8102E]/5"
        />
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll overscroll-y-contain snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          <div style={{ height: pad }} className="shrink-0" />
          {values.map((n) => (
            <div
              key={n}
              className="h-11 shrink-0 snap-center flex items-center justify-center text-lg font-bold text-gray-900 tabular-nums"
            >
              {fmt(n)}
              {suffix ? <span className="text-sm font-semibold text-gray-500 ml-1">{suffix}</span> : null}
            </div>
          ))}
          <div style={{ height: pad }} className="shrink-0" />
        </div>
      </div>
      <p className="text-[11px] text-center text-gray-400 px-4 pb-3 pt-1">Deslizá para elegir — sin teclado</p>
    </div>
  );
}
