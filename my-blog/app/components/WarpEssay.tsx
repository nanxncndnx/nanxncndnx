"use client";
import { useEffect, useRef } from "react";

/* ─────────────────────────  TWEAK ME  ───────────────────────── */

// Text reveal
const REVEAL_THRESHOLD = 0.3; // how much of a paragraph must be visible before it reveals
const LINE_DURATION = 0.9;    // seconds for the wipe to cross one line
const LINE_STAGGER = 0.12;    // seconds between one line starting and the next
const REVEAL_EASING = "cubic-bezier(0.22, 0.61, 0.36, 1)";

// Warp starfield
const SPEED = 0.9;                 // how fast you travel (0.3 calm … 2 frantic)
const STREAKS_DESKTOP = 220;       // number of streaks on wide screens
const STREAKS_MOBILE = 90;         // number of streaks on screens < 640px wide
const STREAK_OPACITY = 0.35;       // overall strength of the starfield (0–1)
const CENTER_OPACITY = 0.15;       // how visible streaks stay directly behind the text (0–1)
const GLITCH = 1;                  // 0 = clean, 1 = default mess, 2 = very glitchy
const PIXEL = 2;                   // pixel grid the streaks snap to (bigger = chunkier)
const COLORS = ["#46577a", "#5d6a85", "#f4f2ea", "#2f3a52"]; // streak colors
const RGB_SPLIT = ["#c0392b", "#3b8ea5"]; // colors for the occasional RGB offset
const REDUCED_MOTION_SPEED = 0.03; // drift speed when the visitor prefers reduced motion

/* ───────────────────────────────────────────────────────────── */

const PARAGRAPHS = [
  "Looking back is not always healthy. It can be a stubborn old man, chasing a life gone to waste with regret, and this critical gaze is all too common in the days of old age. He sees only the endings, because he is searching for achievements!",
  "He counts his victories one by one and sets his failures apart. He doesn’t even see the stories that happened if their weight in achievement is small, and he grades everything in a table of good and bad. Even if the victories outnumber the rest, the sentence “none of them were worth anything” calls everything into question!",
  "And with the question “Did we even live at all?”, the brain presses the tired old man’s face hard into the wet mud, and the world turns dark and hollow for him.",
  "This old man has no place in the irreplaceable turn of the wheel. We wanted neither better nor worse, neither depth nor surface; we wanted breadth, with stories that are one of a kind!",
  "And creating a part of your version in the past is something that will never be repeated. Youth, with all it had and had not, and all its problems, drives and hopes, leaves a part of its existence behind for your old age…",
  "You don’t need to grade this existence; look at how unique it is. That part is yours…",
  "Have you ever looked at a drawing from your childhood and wanted to set it on fire, because you colored outside the lines? That drawing is a part of your childhood; what makes it unique is exactly those lines you crossed. Don’t do this to your stories; there’s no need for that torment.",
];

const HIDDEN = "inset(0 100% 0 0)";
const SHOWN = "inset(0 -2px 0 0)";

type Star = { x: number; y: number; z: number; pz: number; len: number; color: string };

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
    if (w.offsetTop > lastTop + 2) { lines.push([]); lastTop = w.offsetTop; }
    lines[lines.length - 1].push(w);
  }
  const width = p.clientWidth || 1;
  lines.forEach((line, li) => {
    for (const w of line) {
      const start = ((w.offsetLeft - p.offsetLeft) / width) * LINE_DURATION;
      const dur = Math.max(0.12, (w.offsetWidth / width) * LINE_DURATION);
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

  // 2. warp-speed starfield
  useEffect(() => {
    const section = sectionRef.current, canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!section || !canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    let w = 0, h = 0, raf = 0, running = false, last = 0;
    let stars: Star[] = [];

    const spawn = (s: Partial<Star> = {}, fresh = false): Star => {
      const z = fresh ? Math.random() * 0.95 + 0.05 : 1;
      return {
        x: (Math.random() * 2 - 1) * 1.2,
        y: (Math.random() * 2 - 1) * 1.2,
        z, pz: z,
        len: 0.5 + Math.random() * 1.8, // uneven streak lengths
        color: COLORS[(Math.random() * COLORS.length) | 0],
        ...s,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 640 ? STREAKS_MOBILE : STREAKS_DESKTOP;
      while (stars.length < count) stars.push(spawn({}, true));
      stars.length = count;
      if (!running) draw(0);
    };

    const snap = (v: number) => Math.round(v / PIXEL) * PIXEL;
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, scale = Math.max(w, h) * 0.5;
      const col = Math.min(w, 620) / 2; // half-width of the text column
      const speed = (reduced ? REDUCED_MOTION_SPEED : SPEED) * dt;

      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed * (0.6 + s.len * 0.3);
        if (s.z <= 0.02) { Object.assign(s, spawn()); continue; }

        const x = cx + (s.x / s.z) * scale, y = cy + (s.y / s.z) * scale;
        const tz = Math.min(1, s.z + (reduced ? 0.01 : 0.05 * s.len * SPEED));
        const px = cx + (s.x / tz) * scale, py = cy + (s.y / tz) * scale;
        if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { Object.assign(s, spawn()); continue; }

        // keep it quiet behind the text: fade near the column and the vanishing point
        const dx = Math.abs(x - cx), dist = Math.hypot(x - cx, y - cy);
        const quiet = Math.max(smooth(col * 0.6, col * 1.15, dx), smooth(0, scale * 0.9, dist) * 0.5);
        let a = STREAK_OPACITY * (CENTER_OPACITY + (1 - CENTER_OPACITY) * quiet) * (1 - s.z * 0.6);
        if (Math.random() < 0.04 * GLITCH) a *= 0.2; // flicker
        if (a < 0.01) continue;

        const j = GLITCH * (Math.random() < 0.1 ? PIXEL : 0); // occasional jitter
        const x1 = snap(px + j), y1 = snap(py), x2 = snap(x - j), y2 = snap(y);
        const lw = Math.max(1, snap((1 - s.z) * 3));

        ctx.lineWidth = lw;
        if (GLITCH > 0 && Math.random() < 0.03 * GLITCH) {
          // RGB offset: draw red and cyan ghosts a few pixels apart
          ctx.globalAlpha = a * 0.8;
          ctx.strokeStyle = RGB_SPLIT[0];
          ctx.beginPath(); ctx.moveTo(x1 - PIXEL, y1); ctx.lineTo(x2 - PIXEL, y2); ctx.stroke();
          ctx.strokeStyle = RGB_SPLIT[1];
          ctx.beginPath(); ctx.moveTo(x1 + PIXEL, y1); ctx.lineTo(x2 + PIXEL, y2); ctx.stroke();
        }
        ctx.globalAlpha = a;
        ctx.strokeStyle = s.color;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // chunky "pixel" head
        ctx.fillStyle = s.color;
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
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // only animate while the section is on screen
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(section);

    return () => { stop(); io.disconnect(); ro.disconnect(); };
  }, []);

  return (
    <section ref={sectionRef} style={{ position: "relative", overflow: "clip" }}>
      {/* the canvas sticks to the viewport while you scroll through the section */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <canvas ref={canvasRef} style={{ position: "sticky", top: 0, display: "block", width: "100%", height: "100vh" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: "620px", margin: "0 auto", padding: "30vh 24px 40vh" }}>
        {PARAGRAPHS.map((text, i) => (
          <p
            key={i}
            data-p
            style={{
              margin: "0 0 2.2em",
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "18px",
              lineHeight: 1.8,
              color: "#2f3a52",
            }}
          >
            {text.split(" ").map((word, j) => (
              <span key={j} data-w style={{ clipPath: HIDDEN }}>
                {word}{" "}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
