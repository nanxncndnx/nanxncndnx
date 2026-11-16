"use client";
import { useEffect, useRef, type CSSProperties } from "react";

/* ─────────────────────────  TWEAK ME  ───────────────────────── */

// Text reveal
const REVEAL_THRESHOLD = 0.3; // how much of a paragraph must be visible before it reveals
const LINE_DURATION = 1.6;    // seconds for the wipe to cross one line (bigger = slower)
const LINE_STAGGER = 0.25;    // seconds between one line starting and the next
const REVEAL_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

// Last paragraph tremble
const TREMBLE_PX = 1.6;       // how far each word shakes (px)
const TREMBLE_SPEED = 0.28;   // seconds per shake cycle (smaller = more nervous)

// When the streaks appear, measured against the orbit section above.
// The orbit is at full shake from ~50% of its scroll, and dissolves at the end.
const WARP_START = 1.25; // streaks begin when this section's top is 1.25 screens below the top (orbit ≈ 75% scrolled)
const WARP_RAMP = 0.25;  // …and reach full strength 0.25 screens later (orbit fully dissolved)

// Warp starfield
const SPEED = 0.9;                 // how fast you travel (0.3 calm … 2 frantic)
const STREAKS_DESKTOP = 220;       // number of streaks on wide screens
const STREAKS_MOBILE = 90;         // number of streaks on screens < 640px wide
const STREAK_OPACITY = 0.3;        // overall strength of the starfield (0–1)
const CENTER_OPACITY = 0.2;        // how visible streaks stay near the vanishing point (0–1)
const GLITCH = 1;                  // 0 = clean, 1 = default mess, 2 = very glitchy
const PIXEL = 2;                   // pixel grid the streaks snap to (bigger = chunkier)
const COLORS = ["#46577a", "#5d6a85", "#f4f2ea", "#2f3a52"]; // streak colors
const RGB_SPLIT = ["#c0392b", "#3b8ea5"]; // colors for the occasional RGB offset
const REDUCED_MOTION_SPEED = 0.03; // drift speed when the visitor prefers reduced motion

/* ───────────────────────────────────────────────────────────── */

// left / width are % of the wide layout (desktop only); gap is space above, in vh
const PARAGRAPHS: { text: string; left: number; width: number; gap: number; tremble?: boolean }[] = [
  {
    left: 48, width: 32, gap: 0,
    text: "Looking back is not always healthy. It can be a stubborn old man, chasing a life gone to waste with regret, and this critical gaze is all too common in the days of old age. He sees only the endings, because he is searching for achievements!",
  },
  {
    left: 16, width: 34, gap: 6,
    text: "He counts his victories one by one and sets his failures apart. He doesn’t even see the stories that happened if their weight in achievement is small, and he grades everything in a table of good and bad. Even if the victories outnumber the rest, the sentence “none of them were worth anything” calls everything into question!",
  },
  {
    left: 36, width: 30, gap: 7,
    text: "And with the question “Did we even live at all?”, the brain presses the tired old man’s face hard into the wet mud, and the world turns dark and hollow for him.",
  },
  {
    left: 60, width: 34, gap: 5,
    text: "This old man has no place in the irreplaceable turn of the wheel. We wanted neither better nor worse, neither depth nor surface; we wanted breadth, with stories that are one of a kind!",
  },
  {
    left: 8, width: 36, gap: 8,
    text: "And creating a part of your version in the past is something that will never be repeated. Youth, with all it had and had not, and all its problems, drives and hopes, leaves a part of its existence behind for your old age…",
  },
  {
    left: 54, width: 24, gap: 6,
    text: "You don’t need to grade this existence; look at how unique it is. That part is yours…",
  },
  {
    left: 24, width: 44, gap: 10, tremble: true,
    text: "Have you ever looked at a drawing from your childhood and wanted to set it on fire, because you colored outside the lines? That drawing is a part of your childhood; what makes it unique is exactly those lines you crossed. Don’t do this to your stories; there’s no need for that torment.",
  },
];

const HIDDEN = "inset(0 100% 0 0)";
const SHOWN = "inset(-4px -4px -4px 0)";

const CSS = `
.warp-p { width: 100%; margin: 0 0 3em; }
@media (min-width: 768px) {
  .warp-p { margin-left: var(--l); width: var(--w); margin-top: var(--g); }
}
@keyframes warp-tremble {
  0%   { transform: translate(0, 0) rotate(0deg); }
  20%  { transform: translate(calc(var(--t) * -1), calc(var(--t) * 0.6)) rotate(-0.6deg); }
  40%  { transform: translate(var(--t), calc(var(--t) * -0.4)) rotate(0.4deg); }
  60%  { transform: translate(calc(var(--t) * -0.5), calc(var(--t) * -0.8)) rotate(0deg); }
  80%  { transform: translate(calc(var(--t) * 0.7), var(--t)) rotate(-0.3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}
.warp-tremble [data-w] {
  display: inline-block;
  animation: warp-tremble var(--d) steps(5, end) infinite;
  animation-delay: var(--dl);
}
@media (prefers-reduced-motion: reduce) {
  .warp-tremble [data-w] { animation: none; }
}
`;

type Star = { x: number; y: number; z: number; len: number; color: string };

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Groups a paragraph's words into visual lines and gives each word a delay so the
   wipe sweeps left→right across each line, one line after another. */
function revealParagraph(p: HTMLElement) {
  const words = Array.from(p.querySelectorAll<HTMLElement>("[data-w]"));
  if (!words.length) return;
  const lines: HTMLElement[][] = [];
  let lastTop = -Infinity;
  for (const w of words) {
    if (w.offsetTop > lastTop + 4) { lines.push([]); lastTop = w.offsetTop; }
    lines[lines.length - 1].push(w);
  }
  const width = p.clientWidth || 1;
  lines.forEach((line, li) => {
    for (const w of line) {
      const start = ((w.offsetLeft - p.offsetLeft) / width) * LINE_DURATION;
      const dur = Math.max(0.2, (w.offsetWidth / width) * LINE_DURATION);
      w.style.transition = `clip-path ${dur}s ${REVEAL_EASING} ${li * LINE_STAGGER + start}s`;
      w.style.clipPath = SHOWN;
    }
  });
}

export default function WarpEssay() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. text reveal
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const paras = Array.from(section.querySelectorAll<HTMLElement>("[data-p]"));
    if (prefersReducedMotion()) {
      paras.forEach((p) => p.querySelectorAll<HTMLElement>("[data-w]").forEach((w) => (w.style.clipPath = SHOWN)));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // also fire for paragraphs taller than the screen, which can never reach 30%
          const tallEnough = e.intersectionRect.height >= window.innerHeight * REVEAL_THRESHOLD;
          if (e.isIntersecting && (e.intersectionRatio >= REVEAL_THRESHOLD || tallEnough)) {
            revealParagraph(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: [0, 0.1, 0.2, REVEAL_THRESHOLD, 0.5, 1] }
    );
    paras.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  // 2. warp-speed starfield (a fixed full-screen layer, faded in/out by scroll position)
  useEffect(() => {
    const section = sectionRef.current, canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    let w = 0, h = 0, raf = 0, running = false, last = 0;
    const stars: Star[] = [];

    const spawn = (fresh = false): Star => ({
      x: (Math.random() * 2 - 1) * 1.2,
      y: (Math.random() * 2 - 1) * 1.2,
      z: fresh ? Math.random() * 0.95 + 0.05 : 1,
      len: 0.5 + Math.random() * 1.8, // uneven streak lengths
      color: COLORS[(Math.random() * COLORS.length) | 0],
    });

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    const snap = (v: number) => Math.round(v / PIXEL) * PIXEL;
    const smooth = (a: number, b: number, x: number) => {
      const t = clamp01((x - a) / (b - a));
      return t * t * (3 - 2 * t);
    };

    // 0 before the orbit peaks, 1 while reading, back to 0 once the essay has scrolled away
    const intensity = () => {
      const r = section.getBoundingClientRect(), vh = window.innerHeight;
      const fadeIn = clamp01((WARP_START * vh - r.top) / (WARP_RAMP * vh));
      const fadeOut = clamp01(r.bottom / vh);
      return smooth(0, 1, fadeIn) * fadeOut;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? STREAKS_MOBILE : STREAKS_DESKTOP;
      while (stars.length < count) stars.push(spawn(true));
      stars.length = count;
      if (!running) draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const k = intensity();
      if (k <= 0.001) return;

      const cx = w / 2, cy = h / 2, scale = Math.max(w, h) * 0.5;
      // streaks build up as the warp kicks in: fewer and slower at first
      const visible = Math.ceil(stars.length * (0.15 + 0.85 * k));
      const speed = (reduced ? REDUCED_MOTION_SPEED : SPEED * (0.35 + 0.65 * k)) * dt;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= speed * (0.6 + s.len * 0.3);
        if (s.z <= 0.02) { Object.assign(s, spawn()); continue; }
        if (i >= visible) continue;

        const x = cx + (s.x / s.z) * scale, y = cy + (s.y / s.z) * scale;
        const tz = Math.min(1, s.z + (reduced ? 0.01 : 0.05 * s.len * SPEED * k));
        const px = cx + (s.x / tz) * scale, py = cy + (s.y / tz) * scale;
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { Object.assign(s, spawn()); continue; }

        // quieter near the vanishing point, so the middle of the screen stays calm
        const dist = Math.hypot(x - cx, y - cy);
        const quiet = smooth(0, scale * 0.7, dist);
        let a = k * STREAK_OPACITY * (CENTER_OPACITY + (1 - CENTER_OPACITY) * quiet) * (1 - s.z * 0.6);
        if (Math.random() < 0.04 * GLITCH) a *= 0.2; // flicker
        if (a < 0.01) continue;

        const j = GLITCH * (Math.random() < 0.1 ? PIXEL : 0); // occasional jitter
        const x1 = snap(px + j), y1 = snap(py), x2 = snap(x - j), y2 = snap(y);
        const lw = Math.max(1, snap((1 - s.z) * 3));

        ctx.lineWidth = lw;
        if (GLITCH > 0 && Math.random() < 0.03 * GLITCH) {
          // RGB offset: red and cyan ghosts a few pixels apart
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = RGB_SPLIT[0];
          ctx.beginPath(); ctx.moveTo(x1 - PIXEL, y1); ctx.lineTo(x2 - PIXEL, y2); ctx.stroke();
          ctx.strokeStyle = RGB_SPLIT[1];
          ctx.beginPath(); ctx.moveTo(x1 + PIXEL, y1); ctx.lineTo(x2 + PIXEL, y2); ctx.stroke();
        }
        ctx.globalAlpha = a;
        ctx.strokeStyle = s.color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = s.color; // chunky "pixel" head
        ctx.fillRect(x2 - lw / 2, y2 - lw / 2, lw + PIXEL, lw);
      }
      ctx.globalAlpha = 1;
    };

    const tick = (ts: number) => {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts;
      draw(dt);
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // only animate while the essay (or the end of the orbit above it) is near the screen
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { rootMargin: `0px 0px ${Math.round(WARP_START * 100)}% 0px` }
    );
    io.observe(section);

    return () => { stop(); io.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <section ref={sectionRef} style={{ position: "relative" }}>
      <style>{CSS}</style>
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none", display: "block" }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1400px", margin: "0 auto", padding: "4vh 4vw 40vh" }}>
        {PARAGRAPHS.map((p, i) => (
          <p
            key={i}
            data-p
            className={`warp-p${p.tremble ? " warp-tremble" : ""}`}
            style={{
              "--l": `${p.left}%`,
              "--w": `${p.width}%`,
              "--g": `${p.gap}vh`,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "18px",
              lineHeight: 1.8,
              color: "#2f3a52",
            } as CSSProperties}
          >
            {p.text.split(" ").map((word, j) => (
              <span key={j}>
                <span
                  data-w
                  style={{
                    clipPath: HIDDEN,
                    ...(p.tremble && {
                      "--t": `${TREMBLE_PX * (0.5 + ((j * 37) % 10) / 10)}px`,
                      "--d": `${TREMBLE_SPEED * (0.7 + ((j * 53) % 7) / 10)}s`,
                      "--dl": `${-((j * 0.13) % 1)}s`,
                    }),
                  } as CSSProperties}
                >
                  {word}
                </span>{" "}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
