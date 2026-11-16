"use client";
import { useEffect, useRef } from "react";
import OrbitCircle, { OrbitHandle } from "./OrbitCircle";
import WarpEssay from "./WarpEssay";

export default function StoryScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<OrbitHandle>(null);

  useEffect(() => {
    let raf = 0, cancelled = false;
    const tick = (ts: number) => {
      if (cancelled) return;
      const wrap = wrapRef.current, shake = shakeRef.current;
      if (wrap && shake) {
        const rect = wrap.getBoundingClientRect();
        const total = Math.max(1, wrap.offsetHeight - window.innerHeight);
        const pA = Math.min(1, Math.max(0, -rect.top / total));

        // messages snap on and freeze the moment you scroll in
        orbitRef.current?.freeze(pA > 0.02);

        // distortion ramps up and HOLDS — never recovers to a clean circle
        const ramp = Math.min(1, Math.max(0, pA / 0.5));
        const smooth = ramp * ramp * (3 - 2 * ramp);
        const v = smooth * (0.7 + 0.3 * Math.abs(Math.sin(ts * 0.013)));
        orbitRef.current?.setDistort(v);

        // shake while it strains, then dissolve into the essay
        const a = smooth * 6;
        const op = pA < 0.82 ? 1 : Math.max(0, 1 - (pA - 0.82) / 0.18);
        shake.style.opacity = String(op);
        shake.style.transform = a > 0.1 ? `translate(${(Math.random() * 2 - 1) * a}px,${(Math.random() * 2 - 1) * a}px)` : "translate(0,0)";
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <section ref={wrapRef} style={{ height: "200vh", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
          <div style={{ transform: "translateY(-28vh)" }}>
            <div ref={shakeRef} style={{ willChange: "transform, opacity" }}>
              <OrbitCircle ref={orbitRef} />
            </div>
          </div>
        </div>
      </section>

      <WarpEssay />
    </>
  );
}
