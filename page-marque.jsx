const { useState: useStateBP, useEffect: useEffectBP } = React;

const BRAND_KEY = "miamstrat_brand_v1";
const DEFAULT_BRAND = {
  positioning: "Créatrice food & sorties à Paris. Je fais découvrir des restos, activités et bons plans testés et approuvés, pour sortir sans se ruiner ni se tromper.",
  audience: "20-35 ans, majoritairement parisiens et franciliens, très réactifs aux bons plans. Cherchent des idées concrètes pour le week-end.",
  tone: "Tutoiement, enthousiaste mais honnête (je dis quand c'est décevant), emojis avec parcimonie (🎁📍🫶), CTA explicite à la fin de chaque vidéo.",
  formats: "Reels 20-40s avec hook fort dans les 3 premières secondes · stories coulisses/sondages · 1 concours par mois avec marque partenaire.",
  pillars: [
    { id: "p1", name: "Restos & food", pct: 40 },
    { id: "p2", name: "Sorties & activités", pct: 30 },
    { id: "p3", name: "Bons plans & petits budgets", pct: 20 },
    { id: "p4", name: "Coulisses & vie de créatrice", pct: 10 },
  ],
  taboos: "Jamais de fausse recommandation (je ne recommande que ce que j'ai testé et aimé) · pas de contenu polémique/politique · pas de marque en contradiction avec la ligne (malbouffe industrielle, arnaques) · pas plus d'1 collab sponsorisée sur 3 vidéos.",
  personas: [
    { id: "pe1", name: "Léa, 26 ans — la copine du samedi", desc: "Parisienne, sort chaque week-end entre copines. Cherche le brunch ou le bar sympa pas trop cher. Enregistre mes Reels pour plus tard. Sensible aux bons plans et aux concours." },
    { id: "pe2", name: "Thomas & Chloé, 30 ans — le couple qui découvre", desc: "En couple, cherchent des idées de sorties originales (date night, expo, resto romantique). Budget moyen-élevé, prêts à réserver directement depuis ma story." },
    { id: "pe3", name: "Sarah, 34 ans — la maman organisée", desc: "En famille avec 2 enfants, planifie ses sorties à l'avance (vacances scolaires, dimanches). Cherche des activités kids-friendly et des adresses testées fiables." },
  ],
  scoring: [
    { id: "s1", name: "Potentiel viral", desc: "Le sujet peut-il être partagé/enregistré massivement ? (lieu insolite, bon plan rare, nouveauté)" },
    { id: "s2", name: "Alignement pilier", desc: "Rentre clairement dans un de mes piliers, avec le bon ratio de répartition." },
    { id: "s3", name: "Effort de production", desc: "Tournage + montage réalistes dans ma semaine (moins d'une demi-journée = bon score)." },
    { id: "s4", name: "Monétisable", desc: "Peut déboucher sur une collab, de l'affiliation ou du contenu UGC réutilisable." },
    { id: "s5", name: "Parle à un persona", desc: "Je sais dire précisément lequel de mes personas va enregistrer cette vidéo." },
  ],
};

function loadBrand() {
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return DEFAULT_BRAND;
    const p = JSON.parse(raw);
    return p && p.positioning !== undefined ? { ...DEFAULT_BRAND, ...p } : DEFAULT_BRAND;
  } catch (e) { return DEFAULT_BRAND; }
}

// ─── extraction : fichier de contexte IA (markdown) ───
function buildContextFile(brand, strat) {
  const L = [];
  L.push("# Contexte — Stratégie Instagram " + (strat.handle || "@miamcherie"));
  L.push("");
  L.push("Ce document décrit ma stratégie de créatrice de contenu. Utilise-le comme contexte de référence pour toutes tes réponses : reste strictement dans ce cadre (positionnement, ton, piliers, tabous) et aide-moi à ne pas m'en disperser.");
  L.push("");
  L.push("## Positionnement");
  L.push(brand.positioning);
  L.push("");
  L.push("## Audience");
  L.push(brand.audience);
  L.push("");
  L.push("## Ton & style");
  L.push(brand.tone);
  L.push("");
  L.push("## Formats");
  L.push(brand.formats);
  L.push("");
  L.push("## Piliers de contenu (répartition cible)");
  brand.pillars.forEach(p => L.push(`- ${p.name} : ${p.pct}%`));
  L.push("");
  L.push("## Tabous (à ne JAMAIS faire)");
  L.push(brand.taboos);
  L.push("");
  L.push("## Personas d'audience");
  brand.personas.forEach(p => { L.push(`### ${p.name}`); L.push(p.desc); L.push(""); });
  L.push("## Grille de scoring des idées");
  L.push("Chaque idée de contenu est notée de 1 à 5 sur ces critères ; en dessous de 15/25, l'idée n'est pas prioritaire.");
  brand.scoring.forEach(s => L.push(`- **${s.name}** : ${s.desc}`));
  L.push("");
  return L.join("\n");
}

// Défini au niveau module (jamais dans le render : sinon le textarea est remonté à chaque frappe et perd le focus)
function BPField({ label, value, onChange, rows }) {
  return (
    <div>
      <label style={bpStyles.label}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ ...bpStyles.ta, minHeight: (rows || 2) * 26 }} />
    </div>
  );
}

function BrandStrategyPanel({ strat }) {
  const [brand, setBrand] = useStateBP(loadBrand);
  useEffectBP(() => { try { localStorage.setItem(BRAND_KEY, JSON.stringify(brand)); } catch (e) {} }, [brand]);
  const [open, setOpen] = useStateBP(false);

  const patch = (p) => setBrand(b => ({ ...b, ...p }));
  const patchItem = (listKey, id, p) => setBrand(b => ({ ...b, [listKey]: b[listKey].map(x => x.id === id ? { ...x, ...p } : x) }));
  const addItem = (listKey, item) => setBrand(b => ({ ...b, [listKey]: [...b[listKey], { id: uid(), ...item }] }));
  const removeItem = (listKey, id) => setBrand(b => ({ ...b, [listKey]: b[listKey].filter(x => x.id !== id) }));
  const pillarsTotal = brand.pillars.reduce((a, p) => a + (+p.pct || 0), 0);

  const exportContext = () => {
    const md = buildContextFile(brand, strat);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contexte-strategie-miamcherie.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div style={bpStyles.card}>
      <div style={bpStyles.toggle} onClick={() => setOpen(o => !o)} role="button" aria-expanded={open}>
        <span style={{ ...bpStyles.caret, transform: open ? "rotate(90deg)" : "none" }}>›</span>
        <span style={bpStyles.title} className="display">Ma marque</span>
        <span style={bpStyles.sub}>positionnement · personas · scoring</span>
        <button style={bpStyles.exportBtn} onClick={(e) => { e.stopPropagation(); exportContext(); }} title="Télécharge un fichier markdown à donner à une IA comme contexte">⤓ Extraire pour l'IA</button>
      </div>
      {open && (
        <div style={bpStyles.body}>
          <BPField label="Positionnement" value={brand.positioning} onChange={(v) => patch({ positioning: v })} rows={3} />
          <BPField label="Audience" value={brand.audience} onChange={(v) => patch({ audience: v })} />
          <BPField label="Ton & style" value={brand.tone} onChange={(v) => patch({ tone: v })} />
          <BPField label="Formats" value={brand.formats} onChange={(v) => patch({ formats: v })} />

          <div>
            <label style={bpStyles.label}>Piliers de contenu <span style={{ color: pillarsTotal === 100 ? "var(--green)" : "var(--gold)", textTransform: "none", letterSpacing: 0 }}>· total {pillarsTotal}%{pillarsTotal !== 100 ? " (viser 100%)" : ""}</span></label>
            <div style={bpStyles.list}>
              {brand.pillars.map(p => (
                <div key={p.id} style={bpStyles.itemRow}>
                  <input value={p.name} onChange={(e) => patchItem("pillars", p.id, { name: e.target.value })} style={{ ...bpStyles.input, flex: 1 }} placeholder="Nom du pilier…" />
                  <input type="number" min="0" max="100" value={p.pct} onChange={(e) => patchItem("pillars", p.id, { pct: Math.max(0, Math.min(100, +e.target.value || 0)) })} style={{ ...bpStyles.input, width: 58, textAlign: "right" }} />
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>%</span>
                  <button className="obj-remove-btn" style={bpStyles.remove} onClick={() => removeItem("pillars", p.id)} aria-label="Supprimer" title="Supprimer"><Icon.Trash /></button>
                </div>
              ))}
              <button style={bpStyles.addBtn} onClick={() => addItem("pillars", { name: "", pct: 0 })}>+ Ajouter un pilier</button>
            </div>
          </div>

          <BPField label="Tabous — ce que je ne fais jamais" value={brand.taboos} onChange={(v) => patch({ taboos: v })} rows={3} />

          <div>
            <label style={bpStyles.label}>Personas d'audience</label>
            <div style={bpStyles.list}>
              {brand.personas.map(p => (
                <div key={p.id} style={bpStyles.block}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={p.name} onChange={(e) => patchItem("personas", p.id, { name: e.target.value })} style={{ ...bpStyles.input, flex: 1, fontWeight: 700 }} placeholder="Prénom, âge — surnom du persona…" />
                    <button className="obj-remove-btn" style={bpStyles.remove} onClick={() => removeItem("personas", p.id)} aria-label="Supprimer" title="Supprimer"><Icon.Trash /></button>
                  </div>
                  <textarea value={p.desc} onChange={(e) => patchItem("personas", p.id, { desc: e.target.value })} style={{ ...bpStyles.ta, minHeight: 52 }} placeholder="Qui est-elle/il, ce qu'il cherche, comment il consomme mes contenus…" />
                </div>
              ))}
              <button style={bpStyles.addBtn} onClick={() => addItem("personas", { name: "", desc: "" })}>+ Ajouter un persona</button>
            </div>
          </div>

          <div>
            <label style={bpStyles.label}>Grille de scoring des idées <span style={{ color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>· chaque idée notée de 1 à 5 par critère</span></label>
            <div style={bpStyles.list}>
              {brand.scoring.map(s => (
                <div key={s.id} style={bpStyles.itemRow}>
                  <input value={s.name} onChange={(e) => patchItem("scoring", s.id, { name: e.target.value })} style={{ ...bpStyles.input, width: 150, fontWeight: 700, flexShrink: 0 }} placeholder="Critère…" />
                  <input value={s.desc} onChange={(e) => patchItem("scoring", s.id, { desc: e.target.value })} style={{ ...bpStyles.input, flex: 1 }} placeholder="Comment évaluer ce critère…" />
                  <button className="obj-remove-btn" style={bpStyles.remove} onClick={() => removeItem("scoring", s.id)} aria-label="Supprimer" title="Supprimer"><Icon.Trash /></button>
                </div>
              ))}
              <button style={bpStyles.addBtn} onClick={() => addItem("scoring", { name: "", desc: "" })}>+ Ajouter un critère</button>
            </div>
          </div>

          <div style={bpStyles.hint}>« ⤓ Extraire pour l'IA » télécharge un fichier <span className="mono">.md</span> avec tout ce bloc — colle-le au début d'une conversation IA (ou en instructions de projet) pour que chaque réponse respecte ta stratégie.</div>
        </div>
      )}
    </div>
  );
}

const bpStyles = {
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "16px 20px", marginTop: 18 },
  toggle: { display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "var(--text)", flexWrap: "wrap", userSelect: "none" },
  caret: { display: "inline-block", color: "var(--muted)", fontSize: 16, transition: "transform 0.15s", lineHeight: 1 },
  title: { fontSize: 18, fontWeight: 700 },
  sub: { color: "var(--muted)", fontSize: 12 },
  exportBtn: { marginLeft: "auto", background: "var(--pink-soft)", border: "1px solid var(--pink)", color: "var(--pink)", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" },
  body: { marginTop: 16, display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "block", color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 },
  ta: { width: "100%", boxSizing: "border-box", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11, color: "var(--text)", fontSize: 13, lineHeight: 1.5, padding: "9px 11px", outline: "none", resize: "vertical", fontFamily: "inherit" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  itemRow: { display: "flex", alignItems: "center", gap: 8 },
  block: { display: "flex", flexDirection: "column", gap: 6, padding: "10px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12 },
  input: { boxSizing: "border-box", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--text)", fontSize: 13, padding: "7px 10px", outline: "none", minWidth: 0 },
  addBtn: { alignSelf: "flex-start", background: "transparent", border: "1px dashed var(--line-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 9, cursor: "pointer" },
  remove: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 5, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  hint: { color: "var(--muted)", fontSize: 12, lineHeight: 1.5, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11 },
};

Object.assign(window, { BrandStrategyPanel, BRAND_KEY, loadBrand, buildContextFile });
