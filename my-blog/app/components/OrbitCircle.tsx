"use client";
import { useEffect, useId, useState } from "react";

type OrbitCircleProps = {
  size?: number;
  color?: string;
  duration?: number;
  glitch?: number;
  label?: string;
  lineLength?: number;
  waviness?: number;
  leftLabel?: string;
  leftLineLength?: number;
  leftFontSize?: number;
  leftColor?: string;
  highlight?: string;
  typeMessage?: string;
  typeTop?: string;
  typeLeft?: string;
  typeFontSize?: number;
};

const SEG = 22; // ring segments, so parts can break red

export default function OrbitCircle({
  size = 260,
  color = "#46577a",
  duration = 5,
  glitch = 6,
  label = "This is You",
  lineLength = 70,
  waviness = 6,
  leftLabel = "Everything You ever done, or will do you gonna do over and over again",
  leftLineLength = 120,
  leftFontSize = 15,
  leftColor = "#141414",
  highlight = "#c0392b",
  typeMessage = "You can not break the loop!\nEvery time, you make the same mistakes.\nAnd every time, you loose Hope\nBecause you can't get rid of your emotions",
  typeTop = "5%",
  typeLeft = "66%",
  typeFontSize = 13,
}: OrbitCircleProps) {
  const uid = useId().replace(/:/g, "");
  const glitchId = `glitch-${uid}`;
  const inkId = `ink-${uid}`;

  // --- animated state ---
  const [thisOpacity, setThisOpacity] = useState(0);
  const [leftOpacity, setLeftOpacity] = useState(0);
  const [typeOpacity, setTypeOpacity] = useState(0);
  const [typed, setTyped] = useState("");
  const [caretOn, setCaretOn] = useState(false);
  const [redSet, setRedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => timers.push(window.setTimeout(res, ms)));

    // BEAT 1 — "This is You", its own random timer
    const loopThis = async () => {
      while (!cancelled) {
        await wait(2000 + Math.random() * 5000);
        if (cancelled) break;
        setThisOpacity(1);
        await wait(3000 + Math.random() * 1500);
        setThisOpacity(0);
        await wait(1200);
      }
    };

    // BEAT 2 — left recurrence line, its own random timer
    const loopLeft = async () => {
      while (!cancelled) {
        await wait(3000 + Math.random() * 6000);
        if (cancelled) break;
        setLeftOpacity(1);
        await wait(4000 + Math.random() * 2000);
        setLeftOpacity(0);
        await wait(1200);
      }
    };

    // BEAT 3 — typed warning + red shake, its own random timer
    const loopType = async () => {
      while (!cancelled) {
        await wait(4000 + Math.random() * 6000);
        if (cancelled) break;
        setTypeOpacity(1);
        setCaretOn(true);
        for (let i = 1; i <= typeMessage.length; i++) {
          if (cancelled) break;
          setTyped(typeMessage.slice(0, i));
          await wait(16 + Math.random() * 22);
        }
        if (cancelled) break;
        const s = new Set<number>();
        while (s.size < 6) s.add(Math.floor(Math.random() * SEG));
        setRedSet(s);
        await wait(1700);
        setRedSet(new Set());
        setCaretOn(false);
        setTypeOpacity(0);
        await wait(1100);
        setTyped("");
      }
    };

    loopThis();
    loopLeft();
    loopType();
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [typeMessage]);

  // --- geometry ---
  const d = 10;
  const leftLine = Math.max(leftLineLength, lineLength + 50);

  // wrap left message
  const maxChars = 20;
  const lines: string[] = [];
  let cur = "";
  for (const w of leftLabel.split(" ")) {
    if ((cur + " " + w).trim().length > maxChars) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  const maxLineLen = Math.max(...lines.map((l) => l.length));
  const textWidth = maxLineLen * leftFontSize * 0.5;

  // symmetric canvas (circle centered)
  const labelHalf = (label.length * 14 * 0.62) / 2;
  const orbitPad = lineLength + labelHalf + 24;
  const gap = 8;
  const leftNeeded = leftLine + gap + textWidth + 12;
  const horizPad = Math.max(orbitPad, leftNeeded);

  const r = size / 2 - 8;
  const W = 2 * horizPad + 2 * r;
  const H = 2 * orbitPad + 2 * r;
  const cx = W / 2;
  const cy = orbitPad + r;
  const dotY = cy - r;

  // ring segments
  const segs = Array.from({ length: SEG }, (_, i) => {
    const a0 = (i / SEG) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / SEG) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  });

  // wavy orbit tether
  const y0 = dotY - d / 2;
  const labelY = dotY - lineLength;
  const waves = 3;
  const seg = (y0 - labelY) / waves;
  let wavy = `M ${cx} ${y0}`;
  for (let i = 0; i < waves; i++) {
    const cyq = y0 - seg * (i + 0.5);
    const ey = y0 - seg * (i + 1);
    const dir = i % 2 === 0 ? 1 : -1;
    wavy += ` Q ${cx + waviness * dir} ${cyq} ${cx} ${ey}`;
  }

  // messy ink line (left)
  const lx0 = cx - r, lx1 = cx - r - leftLine;
  let ink = `M ${lx0} ${cy}`;
  for (let i = 1; i <= 14; i++) {
    const x = lx0 + (lx1 - lx0) * (i / 14);
    const j = Math.sin(i * 1.7) * 1.6 + Math.cos(i * 3.3) * 1.0;
    ink += ` L ${x.toFixed(1)} ${(cy + j).toFixed(1)}`;
  }

  // left message layout + red first "You"
  const messageRight = cx - r - leftLine - gap;
  const startX = messageRight - textWidth;
  const lineH = leftFontSize * 1.45;
  const startY = cy - ((lines.length - 1) * lineH) / 2;
  let redUsed = false;
  const lineNodes = (line: string) => {
    if (!redUsed) {
      const m = line.match(/\bYou\b/);
      if (m && m.index !== undefined) {
        redUsed = true;
        return (
          <>
            {line.slice(0, m.index)}
            <tspan fill={highlight}>You</tspan>
            {line.slice(m.index + 3)}
          </>
        );
      }
    }
    return line;
  };

  return (
    <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <style>{`
        @keyframes shake-${uid} {0%{transform:translate(0,0)}20%{transform:translate(-5px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,-4px)}80%{transform:translate(4px,5px)}100%{transform:translate(0,0)}}
        @keyframes blink-${uid} {0%,50%{opacity:1}51%,100%{opacity:0}}
      `}</style>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%", height: "auto", display: "block" }} aria-hidden="true">
        <defs>
          <filter id={glitchId} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="1" result="noise">
              <animate attributeName="seed" values="1;6;2;9;3;7;1" dur="0.55s" repeatCount="indefinite" calcMode="discrete" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={glitch} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={inkId} x="-20%" y="-200%" width="140%" height="500%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.35" numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* ring (breaks red on the climax) */}
        <g filter={`url(#${glitchId})`}>
          {segs.map((path, i) => {
            const red = redSet.has(i);
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={red ? "#e02424" : color}
                strokeWidth={red ? 2.6 : 2}
                opacity={red ? 0.95 : 0.5}
                style={red ? { animation: `shake-${uid} 0.09s infinite`, animationDelay: `-${(i * 0.017).toFixed(3)}s` } : undefined}
              />
            );
          })}
        </g>

        {/* left annotation */}
        <g style={{ opacity: leftOpacity, transition: "opacity 0.9s ease" }}>
          <path d={ink} fill="none" stroke="#1a1a1a" strokeWidth="2.4" strokeLinecap="round" filter={`url(#${inkId})`} />
          {lines.map((line, i) => (
            <text key={i} x={startX} y={startY + i * lineH} textAnchor="start" dominantBaseline="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontSize={leftFontSize} fill={leftColor}>
              {lineNodes(line)}
            </text>
          ))}
        </g>

        {/* the orbiting pixel (always) + "This is You" tag */}
        <g>
          <rect x={cx - d / 2} y={dotY - d / 2} width={d} height={d} fill={color}>
            <animate attributeName="opacity" values="1;0.4;1" dur="1.4s" repeatCount="indefinite" />
          </rect>
          <g style={{ opacity: thisOpacity, transition: "opacity 0.9s ease" }}>
            <path d={wavy} fill="none" stroke={color} strokeWidth="1.5" />
            <g>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${labelY}`} to={`-360 ${cx} ${labelY}`} dur={`${duration}s`} repeatCount="indefinite" />
              <text x={cx} y={labelY - 8} textAnchor="middle" fill={color} fontFamily="monospace" fontSize="14" letterSpacing="1">
                {label}
              </text>
            </g>
          </g>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={`${duration}s`} repeatCount="indefinite" />
        </g>
      </svg>

      {/* typed warning */}
      <div
        style={{
          position: "absolute",
          top: typeTop,
          left: typeLeft,
          width: "max-content",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontSize: `${typeFontSize}px`,
          lineHeight: 1.8,
          color: "#28324c",
          whiteSpace: "pre",
          opacity: typeOpacity,
          transition: "opacity 0.9s ease",
          pointerEvents: "none",
        }}
      >
        {typed}
        {caretOn && <span style={{ fontStyle: "normal", animation: `blink-${uid} 1s steps(1) infinite` }}>▋</span>}
      </div>
    </div>
  );
}
