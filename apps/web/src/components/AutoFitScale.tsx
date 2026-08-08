import { useLayoutEffect, useRef, type ReactNode } from 'react';

interface AutoFitScaleProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scales its children to fill the available width and height so every QR
 * type preview fits the phone screen edge-to-edge ("Live Dynamic" preview)
 * instead of being cut off or leaving empty space around it.
 *
 * Content that fits naturally is left untouched. Taller content is scaled
 * down (width compensated so it stays full-bleed, no side gaps).
 *
 * Styles are applied imperatively and re-applied whenever the outer box
 * resizes OR the inner content changes size (async fonts/images loading,
 * form edits in the wizard), so the preview always ends up fitted.
 */
export default function AutoFitScale({ children, className }: AutoFitScaleProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;

    const apply = () => {
      const availW = outer.clientWidth;
      const availH = outer.clientHeight;
      if (availW <= 0 || availH <= 0) return;

      // Measure natural height at 100% width (no transform, natural height).
      inner.style.transform = 'none';
      inner.style.transformOrigin = 'top left';
      inner.style.width = '100%';
      void inner.offsetHeight;
      const naturalH = inner.scrollHeight;
      if (naturalH <= 0) return;

      let s = availH / naturalH;
      let wPct = 100;

      if (s < 1) {
        // Converge width/height coupling: widening the layout keeps the preview
        // full-bleed once it is scaled down. Transform-origin is top-left so the
        // scaled content stays aligned (no right-side clipping).
        wPct = 100 / s;
        for (let i = 0; i < 8; i++) {
          if (wPct > 500) break;
          inner.style.width = `${wPct}%`;
          void inner.offsetHeight;
          const h = inner.scrollHeight;
          const next = availH / h;
          wPct = 100 / next;
          if (next >= 1 || Math.abs(next - s) < 0.002) {
            s = next;
            break;
          }
          s = next;
        }
        // Never upscale back beyond the natural size.
        if (s > 1) s = 1;
      }

      inner.style.width = s < 1 ? `${wPct}%` : '100%';
      inner.style.transform = s < 1 ? `scale(${s})` : 'none';
      inner.style.transformOrigin = 'top left';
      // When content fits (or is shorter than the screen), give the inner box a
      // definite height so flex previews (e.g. WhatsApp, social cards) stretch
      // down to the bottom of the phone instead of stopping part-way.
      inner.style.height = s < 1 ? 'auto' : '100%';
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    });
    ro.observe(outer);
    ro.observe(inner);

    apply();

    // Belt-and-suspenders: async fonts/images can change layout after paint,
    // and ResizeObserver may miss some very early/late reflows.
    const timers = [100, 300, 600, 1000, 1600, 2400, 3600].map((d) =>
      setTimeout(apply, d),
    );

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      className={['overflow-hidden', className].filter(Boolean).join(' ')}
      style={{ height: '100%' }}
    >
            <div ref={innerRef} className="w-full min-h-full">
        {children}
      </div>
    </div>
  );
}
