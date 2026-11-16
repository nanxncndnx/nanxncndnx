"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import OrbitCircle, { OrbitHandle } from "./OrbitCircle";

type Block =
  | { kind: "title"; text: string }
  | { kind: "stanza"; lines: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "note"; title: string; lines: string[] };

const ESSAY: Block[] = [
  { kind: "title", text: "The Old Man and the Childhood Drawing" },
  { kind: "stanza", lines: ["Looking back is not always healthy."] },
  { kind: "stanza", lines: ["It can be a stubborn old man,", "chasing a wasted life with regret."] },
  { kind: "stanza", lines: ["He sees only the endings,", "because he is searching for achievements."] },
  { kind: "stanza", lines: ["He counts his victories one by one,", "and sets his failures apart."] },
  { kind: "stanza", lines: ["He doesn't even see the stories that happened", "if their weight in achievement is small."] },
  {
    kind: "stanza",
    lines: [
      "He grades everything in a table of good and bad.",
      "And even if the victories outnumber the rest,",
      "one sentence — \"none of it was worth anything\" —",
      "calls everything into question.",
    ],
  },
  {
    kind: "stanza",
    lines: [
      "Then the brain asks: \"Did we even live at all?\"",
      "It presses the tired old man's face into the wet mud,",
      "and the world turns dark and hollow.",
    ],
  },
  {
    kind: "quote",
    lines: [
      "This old man has no place in the irreplaceable turn of the wheel.",
      "We wanted neither better nor worse, neither depth nor surface.",
      "We wanted breadth — with stories that are one of a kind.",
    ],
  },
  { kind: "stanza", lines: ["The part of you that was made in the past", "will never be made again."] },
  {
    kind: "stanza",
    lines: [
      "Youth, with all it had and all it lacked,",
      "with its troubles, its drives, its hopes,",
      "leaves a part of its existence behind for your old age.",
    ],
  },
  { kind: "stanza", lines: ["You don't need to grade it.", "Look at how unique it is.", "That part is yours."] },
  {
    kind: "note",
    title: "The Drawing",
    lines: [
      "Have you ever looked at a drawing from your childhood",
      "and wanted to burn it, because you colored outside the lines?",
      "That drawing is a part of your childhood.",
      "What makes it unique is exactly the lines you crossed.",
      "Don't do this to your stories. There's no need for that torment.",
    ],
  },
];

const SERIF = "Georgia, 'Times New Roman', serif";
const INK = "#46577a";
const MUTED = "#5b5340";
const TERRACOTTA = "#b5654a";
const hidden = { opacity: 0, transform: "translateY(16px)", willChange: "opacity, transform" } as const;

export default function StoryScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<OrbitHandle>(null);
  const revealRefs = useRef<HTMLElement[]>([]);

  const track = (el: HTMLElement | null) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

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

      // reveal essay lines one by one as they scroll into view
      const vh = window.innerHeight;
      revealRefs.current.forEach((el) => {
        const r = el.getBoundingClientRect();
        const o = Math.min(1, Math.max(0, (vh * 0.82 - r.top) / 110));
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 16}px)`;
      });
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

      <section style={{ maxWidth: "620px", margin: "0 auto", padding: "2vh 24px 26vh", fontFamily: SERIF }}>
        {ESSAY.map((b, i) => {
          const line = (t: string, j: number, style: CSSProperties = {}) => (
            <span key={j} ref={track} style={{ display: "block", ...hidden, ...style }}>{t}</span>
          );
          switch (b.kind) {
            case "title":
              return (
                <h2 key={i} ref={track} style={{ ...hidden, fontFamily: SERIF, fontSize: "26px", fontWeight: 400, lineHeight: 1.35, color: "#49454F", margin: "0 0 48px" }}>
                  {b.text}
                </h2>
              );
            case "stanza":
              return (
                <p key={i} style={{ margin: "0 0 32px", fontSize: "17px", lineHeight: 1.7, color: INK }}>
                  {b.lines.map((t, j) => line(t, j))}
                </p>
              );
            case "quote":
              return (
                <blockquote key={i} style={{ margin: "56px 0", padding: "28px 0", borderTop: `1px solid ${TERRACOTTA}`, borderBottom: `1px solid ${TERRACOTTA}`, fontSize: "20px", lineHeight: 1.65, color: INK }}>
                  {b.lines.map((t, j) => line(t, j, { marginBottom: j < b.lines.length - 1 ? "10px" : 0 }))}
                </blockquote>
              );
            case "note":
              return (
                <aside key={i} style={{ margin: "64px 0 0", paddingLeft: "20px", borderLeft: `2px solid ${TERRACOTTA}`, fontSize: "15px", lineHeight: 1.7, color: MUTED }}>
                  {line(b.title, -1, { fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: TERRACOTTA, marginBottom: "10px" })}
                  {b.lines.map((t, j) => line(t, j))}
                </aside>
              );
          }
        })}
      </section>
    </>
  );
}
