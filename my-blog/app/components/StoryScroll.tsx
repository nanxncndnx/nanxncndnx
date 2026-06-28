"use client";
import { useEffect, useRef } from "react";
import OrbitCircle, { OrbitHandle } from "./OrbitCircle";

type Voice = "a" | "b" | "n";
const STORY: { v: Voice; t: string }[] = [
  { v: "a", t: "Last time it was like this too." },
  { v: "a", t: "Don't we remember, or did we just not pay attention?" },
  { v: "b", t: "You're taking it too hard…" },
  { v: "a", t: "No. The look on their faces doesn't lie." },
  { v: "b", t: "Who are you even talking about?" },
  { v: "a", t: "Everyone. People. Me. You…" },
  { v: "a", t: "It starts with fear." },
  { v: "a", t: "I didn't want to be afraid — but I froze. Everything in me went numb." },
  { v: "a", t: "I felt like it was getting late." },
  { v: "b", t: "Late for what?" },
  { v: "a", t: "For everything." },
  { v: "a", t: "Some part of me already knows the time runs out." },
  { v: "a", t: "That part sees death clearer than I ever could." },
  { v: "n", t: "He said nothing. Just stared." },
  { v: "a", t: "A few nights ago I had a dream." },
  { v: "a", t: "You weren't like you are now. You were a kid." },
  { v: "a", t: "High school. Those same clothes." },
  { v: "a", t: "You came and sat down. Your back was to me." },
  { v: "a", t: "Then you turned your head, slow. Looked at me from the corner of your eye. And smiled." },
  { v: "a", t: "Like you knew. Like you were trying to tell me: take it easy. It was never in your hands." },
  { v: "a", t: "When I woke up, I remembered those days. Do you remember them too?" },
  { v: "b", t: "Yeah. We had so many plans." },
  { v: "b", t: "We never even moved toward them. Let alone got close." },
  { v: "a", t: "But why?" },
  { v: "b", t: "We decided those thoughts were childish." },
  { v: "a", t: "You see it now? Every time, we do the exact same thing." },
  { v: "a", t: "We get scared. We say it's getting late. We swear we should've started sooner." },
  { v: "a", t: "We make the plans. We find the fire. We let ourselves hope." },
  { v: "a", t: "And then we say it won't work — and we put it down." },
  { v: "b", t: "Maybe that's just growing up. We don't have room for daydreams anymore." },
  { v: "a", t: "It's all fear." },
  { v: "a", t: "We opened the book out of fear that it was getting late. And out of that same fear, we closed it." },
  { v: "b", t: "So what — we shouldn't be afraid?" },
  { v: "a", t: "This was never about fear. Wake up." },
  { v: "a", t: "It isn't you and me living this. Something else is living it, and letting us believe it's us." },
  { v: "a", t: "Our hormones push us around the board like pawns. The hand isn't ours. It never was." },
  { v: "b", t: "Destiny…" },
  { v: "a", t: "Exactly. That's how it ends. Same as last time." },
  { v: "a", t: "We'll call what we said tonight childish. We'll burn with shame just remembering it." },
  { v: "a", t: "We'll say life got heavy, that we weren't ourselves. And we'll forget. We always forget." },
  { v: "a", t: "Next time the fear wakes me — will I remember?" },
  { v: "a", t: "No. That's the whole point. There's no escaping this loop." },
];

export default function StoryScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<OrbitHandle>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

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

        // shake while it strains, then dissolve into the story
        const a = smooth * 6;
        const op = pA < 0.82 ? 1 : Math.max(0, 1 - (pA - 0.82) / 0.18);
        shake.style.opacity = String(op);
        shake.style.transform = a > 0.1 ? `translate(${(Math.random() * 2 - 1) * a}px,${(Math.random() * 2 - 1) * a}px)` : "translate(0,0)";
      }

      const vh = window.innerHeight;
      lineRefs.current.forEach((el) => {
        if (!el) return;
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

      <section style={{ maxWidth: "620px", margin: "0 auto", padding: "2vh 24px 26vh" }}>
        {STORY.map((l, i) => (
          <p
            key={i}
            ref={(el) => { lineRefs.current[i] = el; }}
            style={{
              margin: l.v === "n" ? "30px 0" : "14px 0",
              marginLeft: l.v === "b" ? "44px" : 0,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: l.v === "n" ? "italic" : "normal",
              textAlign: l.v === "n" ? "center" : "left",
              fontSize: l.v === "n" ? "15px" : "17px",
              lineHeight: 1.7,
              color: l.v === "a" ? "#46577a" : l.v === "b" ? "#5b5340" : "#49454F",
              opacity: 0,
              transform: "translateY(16px)",
              willChange: "opacity, transform",
            }}
          >
            {l.t}
          </p>
        ))}
      </section>
    </>
  );
}
