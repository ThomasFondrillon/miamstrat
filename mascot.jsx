// Mascotte hamster — 20 évolutions (1 tous les 500 pts). Silhouette constante :
// tête ronde + oreilles ; à partir du niv. 4 le hamster gagne un corps.
const MASCOT_STAGES = [null,
  { name: "Miette", body: "#f6dcbc", belly: "#fdf3e3", ear: "#f2c9a0" },
  { name: "Noisette", body: "#f6dcbc", belly: "#fdf3e3", ear: "#f2c9a0" },
  { name: "Pompon", body: "#f6dcbc", belly: "#fdf3e3", ear: "#f2c9a0" },
  { name: "Trotteur", body: "#eec08f", belly: "#fbeed8", ear: "#e3a86e" },
  { name: "Foulard", body: "#eec08f", belly: "#fbeed8", ear: "#e3a86e" },
  { name: "Câlin", body: "#eec08f", belly: "#fbeed8", ear: "#e3a86e" },
  { name: "Bonnet", body: "#e2a565", belly: "#f9e8ce", ear: "#d18f4c" },
  { name: "Baskets", body: "#e2a565", belly: "#f9e8ce", ear: "#d18f4c" },
  { name: "Cape", body: "#e2a565", belly: "#f9e8ce", ear: "#d18f4c" },
  { name: "Champion", body: "#c98a52", belly: "#f3ddc0", ear: "#b8763e" },
  { name: "Médaillé", body: "#c98a52", belly: "#f3ddc0", ear: "#b8763e" },
  { name: "Étincelle", body: "#c98a52", belly: "#f3ddc0", ear: "#b8763e" },
  { name: "Moufles", body: "#c9a98f", belly: "#f0e4d8", ear: "#b28f72" },
  { name: "Lumi", body: "#c9a98f", belly: "#f0e4d8", ear: "#b28f72" },
  { name: "Astral", body: "#c9a98f", belly: "#f0e4d8", ear: "#b28f72" },
  { name: "Col Royal", body: "#ff9ec4", belly: "#ffe3ef", ear: "#f27fae" },
  { name: "Couronné", body: "#ff9ec4", belly: "#ffe3ef", ear: "#f27fae" },
  { name: "Sage", body: "#ff9ec4", belly: "#ffe3ef", ear: "#f27fae" },
  { name: "Ailé", body: "#f2e8fa", belly: "#ffffff", ear: "#d9c3ef" },
  { name: "Hamster Suprême", body: "#ffc857", belly: "#ffedc2", ear: "#eaa832" },
];
const MASCOT_MAX = 20;
const MASCOT_EMOTIONS = ["neutre", "content", "triste", "fete"];

const HAM_DARK = "#4a2c1a";
const HAM_PINK = "#ff8fb5";
const HAM_ACCENT = "#ff3d92";

function MascotFace({ emotion }) {
  const d = HAM_DARK;
  const nose = <path d="M57.5 78.5 q2.5 -2.5 5 0 q-1 3 -2.5 3 q-1.5 0 -2.5 -3z" fill={HAM_PINK} stroke={d} strokeWidth="1.2" strokeLinejoin="round"/>;
  if (emotion === "content") return (
    <g>
      <path d="M42 71 q5 -6.5 10 0" stroke={d} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M68 71 q5 -6.5 10 0" stroke={d} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      {nose}
      <path d="M54.5 84 q2.75 3.2 5.5 0 q2.75 3.2 5.5 0" stroke={d} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="38" cy="80" r="4.5" fill={HAM_PINK} opacity="0.5"/><circle cx="82" cy="80" r="4.5" fill={HAM_PINK} opacity="0.5"/>
    </g>
  );
  if (emotion === "triste") return (
    <g>
      <circle cx="47" cy="71" r="4.2" fill={d}/><circle cx="73" cy="71" r="4.2" fill={d}/>
      <circle cx="48.5" cy="69.5" r="1.4" fill="#fff"/><circle cx="74.5" cy="69.5" r="1.4" fill="#fff"/>
      <path d="M41 64 q5 -3 10 -1" stroke={d} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M79 64 q-5 -3 -10 -1" stroke={d} strokeWidth="2" fill="none" strokeLinecap="round"/>
      {nose}
      <path d="M55 86.5 q5 -4 10 0" stroke={d} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <ellipse cx="43" cy="79" rx="2.2" ry="4" fill="#8fd0ff"/>
      <circle cx="38" cy="81" r="4" fill={HAM_PINK} opacity="0.35"/><circle cx="82" cy="81" r="4" fill={HAM_PINK} opacity="0.35"/>
    </g>
  );
  if (emotion === "fete") return (
    <g>
      <path d="M47 62 q4 3.5 4 7.5 a4.6 4.6 0 01-9.2 0 c0 -2 .9 -3.4 2 -4.6 .2 1 .8 1.9 1.6 2.3 -.4 -1.8 .5 -3.6 1.6 -5.2z" fill="#ff7a1a" stroke="#e04a00" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M47 66.5 q1.8 1.8 1.8 3.4 a2.1 2.1 0 01-4.2 0 c0 -1.4 1 -2.4 2.4 -3.4z" fill="#ffd23e"/>
      <path d="M73 62 q4 3.5 4 7.5 a4.6 4.6 0 01-9.2 0 c0 -2 .9 -3.4 2 -4.6 .2 1 .8 1.9 1.6 2.3 -.4 -1.8 .5 -3.6 1.6 -5.2z" fill="#ff7a1a" stroke="#e04a00" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M73 66.5 q1.8 1.8 1.8 3.4 a2.1 2.1 0 01-4.2 0 c0 -1.4 1 -2.4 2.4 -3.4z" fill="#ffd23e"/>
      {nose}
      <path d="M53.5 84 a6.5 6.5 0 0013 0 q-6.5 -2 -13 0z" fill={d}/>
      <path d="M56.5 88.5 q3.5 3 7 0 a3.5 3.2 0 00-7 0z" fill="#ff8fb5"/>
      <circle cx="37" cy="80" r="5" fill={HAM_PINK} opacity="0.55"/><circle cx="83" cy="80" r="5" fill={HAM_PINK} opacity="0.55"/>
    </g>
  );
  return (
    <g>
      <circle cx="47" cy="71" r="4.2" fill={d}/><circle cx="73" cy="71" r="4.2" fill={d}/>
      <circle cx="48.5" cy="69.5" r="1.4" fill="#fff"/><circle cx="74.5" cy="69.5" r="1.4" fill="#fff"/>
      {nose}
      <path d="M54.5 84.5 q2.75 2.6 5.5 0 q2.75 2.6 5.5 0" stroke={d} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <circle cx="38" cy="80" r="4" fill={HAM_PINK} opacity="0.4"/><circle cx="82" cy="80" r="4" fill={HAM_PINK} opacity="0.4"/>
    </g>
  );
}

function Mascot({ stage = 1, emotion = "neutre", size = 116, evolving }) {
  const s = Math.max(1, Math.min(MASCOT_MAX, stage));
  const { body, belly, ear } = MASCOT_STAGES[s];
  const d = HAM_DARK;
  const hasBody = s >= 4;
  // accessoires par plage de niveaux
  const f = {
    seed: s >= 2,
    whiskers: s >= 3,
    tuft: s >= 3 && !(s >= 7 && s < 17),
    scarf: s >= 5 && s < 9,
    heart: s >= 6 && s < 11,
    bonnet: s >= 7 && s < 17,
    sneakers: s >= 8,
    cape: s >= 9 && s < 19,
    belt: s >= 10,
    medal: s >= 11,
    cheekStar: s >= 12,
    mittens: s >= 13,
    auraPink: s >= 14 && s < 20,
    stars: s >= 15,
    collar: s >= 16,
    staff: s >= 18,
    wings: s >= 19,
    crown: s >= 17,
    auraGold: s >= 20,
  };

  const head = (
    <g>
      <circle cx="38" cy="42" r="10" fill={body} stroke={d} strokeWidth="2"/>
      <circle cx="82" cy="42" r="10" fill={body} stroke={d} strokeWidth="2"/>
      <circle cx="38" cy="43" r="5" fill={HAM_PINK} opacity="0.7"/>
      <circle cx="82" cy="43" r="5" fill={HAM_PINK} opacity="0.7"/>
      <ellipse cx="60" cy="74" rx="36" ry="34" fill={body} stroke={d} strokeWidth="2"/>
      {f.tuft && <path d="M52 41 q8 -7 16 0 q-4 8 -8 8 q-4 0 -8 -8z" fill={ear} opacity="0.8"/>}
      {!hasBody && <ellipse cx="60" cy="92" rx="19" ry="14" fill={belly}/>}
      {f.whiskers && <g stroke={d} strokeWidth="1.2" strokeLinecap="round" opacity="0.65">
        <path d="M36 74 L24 71"/><path d="M36 78 L23 78"/>
        <path d="M84 74 L96 71"/><path d="M84 78 L97 78"/>
      </g>}
      {!hasBody && <g>
        <ellipse cx="49" cy="101" rx="6" ry="4.5" fill={body} stroke={d} strokeWidth="1.8"/>
        <ellipse cx="71" cy="101" rx="6" ry="4.5" fill={body} stroke={d} strokeWidth="1.8"/>
        {f.seed && <g transform="rotate(24 60 99)">
          <ellipse cx="60" cy="99" rx="4.2" ry="6.2" fill="#8a5a33" stroke={d} strokeWidth="1.4"/>
          <path d="M60 93.5 v11" stroke="#f3e0c0" strokeWidth="1.4" strokeLinecap="round"/>
        </g>}
      </g>}
      {f.bonnet && <g>
        <path d="M40 57 a20 16 0 0140 0 q0 5 -20 5 q-20 0 -20 -5z" fill={HAM_ACCENT} stroke={d} strokeWidth="1.8"/>
        <path d="M40 57 q20 6 40 0" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/>
        <circle cx="60" cy="38" r="5.5" fill="#fff" stroke={d} strokeWidth="1.6"/>
      </g>}
      {f.cheekStar && <path d="M33 60 l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.7 -2.9 1.7 .7 -3.2 -2.4 -2.2 3.2 -.4z" fill="#ffc857" stroke="#b88410" strokeWidth="0.8" strokeLinejoin="round"/>}
      {f.crown && <path d="M48 34 L52 21 L60 30 L68 21 L72 34 Z" fill="#ffc857" stroke="#b88410" strokeWidth="1.5" strokeLinejoin="round"/>}
      <MascotFace emotion={emotion}/>
    </g>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={evolving ? "mascot mascot-evolving" : "mascot"} aria-label={`Mascotte hamster niveau ${s}, ${emotion}`}>
      {f.auraGold && <circle cx="60" cy="62" r="55" fill="none" stroke="#ffc857" strokeWidth="2" strokeDasharray="4 10" className="mascot-aura"/>}
      {f.auraPink && <circle cx="60" cy="62" r="55" fill="none" stroke={HAM_ACCENT} strokeWidth="1.6" strokeDasharray="3 9" opacity="0.6" className="mascot-aura"/>}
      {f.stars && <g fill="#ffc857">
        <path d="M16 26 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z"/>
        <path d="M104 20 l1.2 3.2 3.2 1.2 -3.2 1.2 -1.2 3.2 -1.2 -3.2 -3.2 -1.2 3.2 -1.2z"/>
        <path d="M12 84 l1.2 3.2 3.2 1.2 -3.2 1.2 -1.2 3.2 -1.2 -3.2 -3.2 -1.2 3.2 -1.2z"/>
      </g>}
      {!hasBody ? head : (
        <g>
          {f.wings && <g fill="#fff" stroke={d} strokeWidth="1.6" strokeLinejoin="round" opacity="0.92">
            <path d="M30 64 Q8 54 6 74 Q16 75 12 85 Q24 85 30 78 Z"/>
            <path d="M90 64 Q112 54 114 74 Q104 75 108 85 Q96 85 90 78 Z"/>
          </g>}
          {f.cape && <g fill={HAM_ACCENT} stroke={d} strokeWidth="1.6" strokeLinejoin="round">
            <path d="M33 58 Q18 86 26 106 L42 98 Q34 80 37 62 Z"/>
            <path d="M87 58 Q102 86 94 106 L78 98 Q86 80 83 62 Z"/>
          </g>}
          {/* oreilles sur le sommet */}
          <circle cx="37" cy="31" r="10" fill={body} stroke={d} strokeWidth="2"/>
          <circle cx="83" cy="31" r="10" fill={body} stroke={d} strokeWidth="2"/>
          <circle cx="37" cy="32" r="5" fill={HAM_PINK} opacity="0.7"/>
          <circle cx="83" cy="32" r="5" fill={HAM_PINK} opacity="0.7"/>
          {/* silhouette d'une seule pièce : tête et corps fondus (poire arrondie) */}
          <path d="M60 24 C38 24 27 42 27 66 C27 96 40 111 60 111 C80 111 93 96 93 66 C93 42 82 24 60 24 Z" fill={body} stroke={d} strokeWidth="2"/>
          {f.tuft && <path d="M52 26 q8 -7 16 0 q-4 8 -8 8 q-4 0 -8 -8z" fill={ear} opacity="0.8"/>}
          <ellipse cx="60" cy="92" rx="18" ry="13" fill={belly}/>
          {/* bras */}
          <ellipse cx="31" cy="78" rx="6.5" ry="9" fill={f.mittens ? HAM_ACCENT : body} stroke={d} strokeWidth="1.8" transform="rotate(18 31 78)"/>
          <ellipse cx="89" cy="78" rx="6.5" ry="9" fill={f.mittens ? HAM_ACCENT : body} stroke={d} strokeWidth="1.8" transform="rotate(-18 89 78)"/>
          {/* pieds */}
          <ellipse cx="48" cy="108" rx="7.5" ry="4.8" fill={f.sneakers ? HAM_ACCENT : body} stroke={d} strokeWidth="1.8"/>
          <ellipse cx="72" cy="108" rx="7.5" ry="4.8" fill={f.sneakers ? HAM_ACCENT : body} stroke={d} strokeWidth="1.8"/>
          {f.sneakers && <g stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
            <path d="M43 110 h10"/><path d="M67 110 h10"/>
          </g>}
          {f.whiskers && <g stroke={d} strokeWidth="1.2" strokeLinecap="round" opacity="0.65">
            <path d="M38 61 L27 58"/><path d="M38 65 L26 65"/>
            <path d="M82 61 L93 58"/><path d="M82 65 L94 65"/>
          </g>}
          {f.scarf && <g>
            <path d="M34 73 q26 11 52 0 l0 8 q-26 10 -52 0z" fill="#ff5f9e" stroke={d} strokeWidth="1.5" strokeLinejoin="round"/>
            <rect x="70" y="79" width="7" height="14" rx="3" fill="#ff5f9e" stroke={d} strokeWidth="1.5"/>
          </g>}
          {f.collar && <path d="M36 72 q24 12 48 0 l-3 6.5 q-21 10 -42 0z" fill="#fff" stroke={d} strokeWidth="1.5" strokeLinejoin="round"/>}
          {f.heart && <path d="M60 96 q-7 -7 -3.5 -10.5 q3.5 -2.8 3.5 0 q0 -2.8 3.5 0 q3.5 3.5 -3.5 10.5z" fill={HAM_ACCENT} stroke={d} strokeWidth="1"/>}
          {f.medal && <g>
            <path d="M51 76 L60 89 L69 76" stroke="#e04a63" strokeWidth="3" fill="none" strokeLinejoin="round"/>
            <circle cx="60" cy="91" r="5.5" fill="#ffc857" stroke="#b88410" strokeWidth="1.5"/>
          </g>}
          {f.belt && <g>
            <rect x="36" y="98" width="48" height="7" rx="3.5" fill="#5a3a1a" stroke={d} strokeWidth="1.2"/>
            <rect x="54" y="96.5" width="12" height="10" rx="2" fill="#ffc857" stroke="#b88410" strokeWidth="1.2"/>
          </g>}
          {f.seed && <g transform="rotate(20 60 107)">
            <ellipse cx="60" cy="107" rx="3.4" ry="5" fill="#8a5a33" stroke={d} strokeWidth="1.2"/>
            <path d="M60 102.5 v9" stroke="#f3e0c0" strokeWidth="1.2" strokeLinecap="round"/>
          </g>}
          {f.staff && <g>
            <path d="M99 60 V106" stroke="#8a5a33" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M99 50 l1.8 4.5 4.5 1.8 -4.5 1.8 -1.8 4.5 -1.8 -4.5 -4.5 -1.8 4.5 -1.8z" fill="#ffc857" stroke="#b88410" strokeWidth="1"/>
          </g>}
          {f.bonnet && <g>
            <path d="M40 42 a20 16 0 0140 0 q0 5 -20 5 q-20 0 -20 -5z" fill={HAM_ACCENT} stroke={d} strokeWidth="1.8"/>
            <path d="M40 42 q20 6 40 0" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/>
            <circle cx="60" cy="23" r="5.5" fill="#fff" stroke={d} strokeWidth="1.6"/>
          </g>}
          {f.cheekStar && <path d="M33 50 l1.4 3 3.2 .4 -2.4 2.2 .7 3.2 -2.9 -1.7 -2.9 1.7 .7 -3.2 -2.4 -2.2 3.2 -.4z" fill="#ffc857" stroke="#b88410" strokeWidth="0.8" strokeLinejoin="round"/>}
          {f.crown && <path d="M48 22 L52 9 L60 18 L68 9 L72 22 Z" fill="#ffc857" stroke="#b88410" strokeWidth="1.5" strokeLinejoin="round"/>}
          <g transform="translate(0 -14)"><MascotFace emotion={emotion}/></g>
        </g>
      )}
    </svg>
  );
}

function MascotCard({ stage, emotion, points, evolving }) {
  const s = Math.max(1, Math.min(MASCOT_MAX, stage));
  const meta = MASCOT_STAGES[s];
  const isMax = s >= MASCOT_MAX;
  const base = (s - 1) * 500;
  const prog = isMax ? 100 : Math.max(0, Math.min(100, ((points - base) / 500) * 100));
  const remaining = isMax ? 0 : Math.max(0, s * 500 - points);
  // easter egg : 20 clics d'affilée → pluie de cœurs
  const [hearts, setHearts] = React.useState(null);
  const clickRef = React.useRef({ n: 0, t: 0 });
  const onMascotClick = () => {
    const now = Date.now();
    if (now - clickRef.current.t > 1500) clickRef.current.n = 0;
    clickRef.current.t = now;
    clickRef.current.n += 1;
    if (clickRef.current.n >= 20) {
      clickRef.current.n = 0;
      setHearts(Array.from({ length: 16 }, (_, i) => ({
        id: i + "-" + now,
        dx: Math.round((Math.random() * 2 - 1) * 80),
        delay: +(Math.random() * 0.6).toFixed(2),
        size: Math.round(13 + Math.random() * 15),
        dur: +(1.3 + Math.random() * 1).toFixed(2),
      })));
      setTimeout(() => setHearts(null), 3000);
    }
  };
  return (
    <div className="mascot-card" style={mascotStyles.card}>
      <div style={{ ...mascotStyles.svgWrap, cursor: "pointer" }} onClick={onMascotClick} title="…">
        <Mascot stage={s} emotion={emotion} evolving={evolving}/>
        {evolving && <div style={mascotStyles.evoBadge} className="display">✨ Évolution !</div>}
        {hearts && hearts.map(p => (
          <span key={p.id} className="mascot-heart" style={{ left: "50%", bottom: "38%", fontSize: p.size, "--dx": p.dx + "px", animationDuration: p.dur + "s", animationDelay: p.delay + "s" }}>♥</span>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={mascotStyles.eyebrow}>Ta mascotte · Niv. {s}/{MASCOT_MAX}</div>
        <div style={mascotStyles.name} className="display">{meta.name}</div>
        <div style={mascotStyles.msg}>
          {evolving ? "Une évolution est en cours…" : isMax ? "Forme finale atteinte 👑" : `Encore ${remaining.toLocaleString("fr-FR")} pts avant la prochaine évolution`}
        </div>
        <div style={mascotStyles.barTrack}>
          <div style={{ ...mascotStyles.barFill, width: `${prog}%` }}></div>
        </div>
        <div style={mascotStyles.barLabels} className="mono">
          <span>{base.toLocaleString("fr-FR")}</span>
          <span>{isMax ? "MAX" : (s * 500).toLocaleString("fr-FR")} pts</span>
        </div>
      </div>
    </div>
  );
}

const mascotStyles = {
  card: {
    display: "flex", alignItems: "center", gap: 20,
    background: "linear-gradient(135deg, var(--pink-soft), transparent 55%), var(--surface)",
    border: "1px solid var(--line-strong)", borderRadius: 22, padding: "16px 22px", marginBottom: 14,
  },
  svgWrap: { position: "relative", flexShrink: 0 },
  evoBadge: {
    position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
    background: "var(--gold)", color: "#3a2500", fontSize: 11, fontWeight: 700,
    padding: "3px 10px", borderRadius: 99, whiteSpace: "nowrap",
    animation: "mascot-badge 1.9s ease",
  },
  eyebrow: { color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" },
  name: { fontSize: 24, fontWeight: 700, lineHeight: 1.15, marginTop: 2 },
  msg: { color: "var(--muted)", fontSize: 12.5, marginTop: 4 },
  barTrack: { height: 7, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)", marginTop: 10 },
  barFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg, var(--pink), var(--gold))", transition: "width 0.4s ease" },
  barLabels: { display: "flex", justifyContent: "space-between", color: "var(--muted-2)", fontSize: 10, marginTop: 4 },
};

const mascotStyleEl = document.createElement("style");
mascotStyleEl.textContent = `
  .mascot { display: block; }
  .mascot-aura { transform-origin: 60px 62px; animation: mascot-spin 14s linear infinite; }
  @keyframes mascot-spin { to { transform: rotate(360deg); } }
  .mascot-evolving { animation: mascot-evo 1.9s ease; }
  @keyframes mascot-evo {
    0% { filter: brightness(1); transform: scale(1); }
    20% { filter: brightness(2.6) saturate(0.1); transform: scale(0.88); }
    45% { filter: brightness(2.6) saturate(0.1); transform: scale(1.16) rotate(-4deg); }
    65% { filter: brightness(2.6) saturate(0.1); transform: scale(1.05) rotate(3deg); }
    85% { filter: brightness(1.5); transform: scale(1.08); }
    100% { filter: brightness(1); transform: scale(1); }
  }
  @keyframes mascot-badge { 0% { opacity: 0; transform: translateX(-50%) translateY(8px); } 25% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 1; } }
  .mascot-heart { position: absolute; color: var(--pink); pointer-events: none; opacity: 0; animation-name: heart-float; animation-timing-function: ease-out; animation-fill-mode: forwards; text-shadow: 0 0 10px var(--pink-glow); }
  @keyframes heart-float {
    0% { transform: translate(-50%, 0) scale(0.3) rotate(0deg); opacity: 0; }
    15% { opacity: 1; }
    100% { transform: translate(calc(-50% + var(--dx)), -140px) scale(1.2) rotate(14deg); opacity: 0; }
  }
  @media (max-width: 640px) { .mascot-card { flex-direction: column !important; text-align: center; } .mascot-card > div:last-child { width: 100%; } }
`;
document.head.appendChild(mascotStyleEl);

Object.assign(window, { Mascot, MascotCard, MASCOT_STAGES, MASCOT_EMOTIONS, MASCOT_MAX });
