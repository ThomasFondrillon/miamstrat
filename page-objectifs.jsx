const { useState, useEffect, useMemo } = React;

const DAILY_KEY = "miamstrat_daily_v1";
const DEFAULT_DAILIES = [
  { id: "d1", text: "Poster 1 story (coulisses, sondage ou bon plan)" },
  { id: "d2", text: "Répondre à tous les commentaires & DM du jour" },
  { id: "d3", text: "Interagir 15 min avec des comptes de ta niche" },
  { id: "d4", text: "Avancer sur le Reel de la semaine (repérage, tournage ou montage)" },
];

function pad2(n) { return String(n).padStart(2, "0"); }
function dateToStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
function todayStr() { return dateToStr(new Date()); }
function nextDayStr(s) { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + 1); return dateToStr(d); }

function loadDaily() {
  const today = todayStr();
  const base = { dailies: DEFAULT_DAILIES, log: {}, points: 0, streak: 0, lives: 3, livesMonth: today.slice(0, 7), lastProcessed: today };
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.dailies)) return base;
    return { ...base, ...p };
  } catch (e) { return base; }
}

// Settle every day strictly before today: streak bonus if 100%,
// point loss + 1 life per incomplete day. Lives refill monthly.
function processDays(d) {
  const today = todayStr();
  const out = { ...d, log: { ...d.log } };
  if (!out.lastProcessed) out.lastProcessed = today;
  let guard = 0;
  let cur = out.lastProcessed;
  while (cur < today && guard < 400) {
    guard++;
    const checks = out.log[cur] || {};
    const total = out.dailies.length;
    const done = out.dailies.filter(o => checks[o.id]).length;
    if (total > 0) {
      const month = cur.slice(0, 7);
      if (out.livesMonth !== month) { out.livesMonth = month; out.lives = 3; }
      if (done === total) {
        out.streak += 1;
        out.points += 25 * out.streak;
      } else {
        out.streak = 0;
        out.points = Math.max(0, out.points - 5 * (total - done));
        if (out.lives > 0) out.lives -= 1;
        else out.points = Math.max(0, out.points - 25);
      }
    }
    cur = nextDayStr(cur);
  }
  out.lastProcessed = today;
  const m = today.slice(0, 7);
  if (out.livesMonth !== m) { out.livesMonth = m; out.lives = 3; }
  return out;
}

const OPIcon = {
  Heart: ({ filled, ...p }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} {...p}>
      <path d="M12 20.5s-7.2-4.4-9.6-8.9C1 8.9 2.7 5.5 6.1 5.5c2.1 0 3.5 1.1 4.4 2.5L12 9.3l1.5-1.3c.9-1.4 2.3-2.5 4.4-2.5 3.4 0 5.1 3.4 3.7 6.1-2.4 4.5-9.6 8.9-9.6 8.9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Flame: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 2.5s5.5 4.8 5.5 9.7a5.5 5.5 0 01-11 0c0-1.9.8-3.6 1.8-5 .3 1.1 1 2.1 2 2.7C10.2 7.4 11 4.6 12 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  Star: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
};

function ObjectifsPage({ strat, setStrat, plan, setPlan, tweaks = {}, onOpenStrategy }) {
  const [data, setData] = useState(() => processDays(loadDaily()));
  useEffect(() => { try { localStorage.setItem(DAILY_KEY, JSON.stringify(data)); } catch (e) {} }, [data]);

  const today = todayStr();
  const checks = data.log[today] || {};
  const doneCount = data.dailies.filter(o => checks[o.id]).length;
  const total = data.dailies.length;
  const allDone = total > 0 && doneCount === total;
  const [newText, setNewText] = useState("");

  const dateLabel = useMemo(() => {
    const s = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);
  const monthLabel = useMemo(() => new Date().toLocaleDateString("fr-FR", { month: "long" }), []);

  const toggle = (id) => setData(d => {
    const dayLog = { ...(d.log[today] || {}) };
    const was = !!dayLog[id];
    if (was) delete dayLog[id]; else dayLog[id] = true;
    return { ...d, points: Math.max(0, d.points + (was ? -10 : 10)), log: { ...d.log, [today]: dayLog } };
  });
  const addDaily = () => {
    const t = newText.trim();
    if (!t) return;
    setData(d => ({ ...d, dailies: [...d.dailies, { id: uid(), text: t }] }));
    setNewText("");
  };
  const removeDaily = (id) => setData(d => {
    const wasChecked = !!(d.log[today] || {})[id];
    const dayLog = { ...(d.log[today] || {}) };
    delete dayLog[id];
    return { ...d, dailies: d.dailies.filter(o => o.id !== id), points: Math.max(0, d.points - (wasChecked ? 10 : 0)), log: { ...d.log, [today]: dayLog } };
  });
  const editDaily = (id, text) => setData(d => ({ ...d, dailies: d.dailies.map(o => o.id === id ? { ...o, text } : o) }));
  const dragIdxRef = React.useRef(null);
  const moveDaily = (from, to) => {
    if (from == null || to == null || from === to) return;
    setData(d => { const a = [...d.dailies]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return { ...d, dailies: a }; });
  };

  // ─── mascotte : évolution tous les 500 pts, émotions selon l'activité ───
  const stageFromPoints = Math.min(MASCOT_MAX, Math.floor(data.points / 500) + 1);
  const [evolving, setEvolving] = useState(false);
  useEffect(() => {
    const seen = data.mascotStage || 1;
    if (stageFromPoints > seen) {
      setEvolving(true);
      const to = setTimeout(() => { setEvolving(false); setData(d => ({ ...d, mascotStage: stageFromPoints })); }, 1900);
      return () => clearTimeout(to);
    }
    if (stageFromPoints < seen) setData(d => ({ ...d, mascotStage: stageFromPoints }));
  }, [stageFromPoints]);
  useEffect(() => {
    const h = () => { setEvolving(false); requestAnimationFrame(() => { setEvolving(true); setTimeout(() => setEvolving(false), 1900); }); };
    window.addEventListener("mascot-evolve", h);
    return () => window.removeEventListener("mascot-evolve", h);
  }, []);
  const autoEmotion = (total > 0 && doneCount === total) ? "fete" : doneCount > 0 ? "content" : data.lives < 3 ? "triste" : "neutre";
  const mStage = tweaks.mascotStage && tweaks.mascotStage !== "auto" ? +tweaks.mascotStage : stageFromPoints;
  const mEmotion = tweaks.mascotEmotion && tweaks.mascotEmotion !== "auto" ? tweaks.mascotEmotion : autoEmotion;

  // vidéos « À publier » planifiées aujourd'hui
  const toPublish = ((plan && plan.videos) || []).filter(v => v.status === "publier" && v.date === today);
  const markPublished = (id) => setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, status: "publiee" } : v) }));

  // rappels d'événements à venir (dans leur fenêtre de rappel)
  const eventReminders = ((plan && plan.events) || []).map(ev => {
    if (!ev.name || !ev.start) return null;
    const d = Math.round((new Date(ev.start + "T12:00:00") - new Date(today + "T12:00:00")) / 86400000);
    const remind = ev.remind == null ? 14 : +ev.remind;
    if (d < 0 || d > remind) return null;
    return { ev, d };
  }).filter(Boolean).sort((a, b) => a.d - b.d);

  // ─── current tier from strategy: first tier not fully completed
  // (a reached-but-unfinished tier takes priority over the next locked one) ───
  const currentTier = strat.tiers.find(t => t.objectives.some(o => !o.done))
    || strat.tiers.find(t => t.target > strat.followers)
    || strat.tiers[strat.tiers.length - 1];
  const tierDone = currentTier.objectives.filter(o => o.done).length;
  const toggleTierObj = (objId) => setStrat(s => ({
    ...s,
    tiers: s.tiers.map(t => t.id === currentTier.id ? { ...t, objectives: t.objectives.map(o => o.id === objId ? { ...o, done: !o.done } : o) } : t),
  }));

  return (
    <div>
      <div style={opStyles.pageHead}>
        <div>
          <div style={opStyles.pageTitle} className="display">Objectifs du jour</div>
          <div style={opStyles.pageSub}>{dateLabel}</div>
        </div>
      </div>

      <MascotCard stage={mStage} emotion={mEmotion} points={data.points} evolving={evolving} />

      {eventReminders.length > 0 && (
        <div style={opStyles.evBox}>
          {eventReminders.map(({ ev, d }) => (
            <div key={ev.id} style={opStyles.evReminder}>
              🗓️ {d === 0 ? `C'est aujourd'hui : ${ev.name} !` : d === 1 ? `1 jour restant avant ${ev.name}` : `${d} jours restants avant ${ev.name}`}
            </div>
          ))}
        </div>
      )}

      {/* STATS */}
      <div className="op-stats" style={opStyles.stats}>
        <div style={opStyles.statCard}>
          <div style={opStyles.statLabel}><OPIcon.Star style={{ color: "var(--gold)" }} /> Points</div>
          <div style={{ ...opStyles.statValue, color: "var(--gold)" }} className="display">{data.points.toLocaleString("fr-FR")}</div>
          <div style={opStyles.statSub}>+10 pts par objectif coché</div>
        </div>
        <div style={opStyles.statCard}>
          <div style={opStyles.statLabel}><OPIcon.Flame style={{ color: "var(--pink)" }} /> Série</div>
          <div style={{ ...opStyles.statValue, color: data.streak > 0 ? "var(--pink)" : "var(--muted-2)" }} className="display">
            {data.streak}<span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}> jour{data.streak > 1 ? "s" : ""}</span>
          </div>
          <div style={opStyles.statSub}>journée 100% → bonus +{25 * (data.streak + 1)} pts</div>
        </div>
        <div style={opStyles.statCard}>
          <div style={opStyles.statLabel}><OPIcon.Heart filled style={{ color: "var(--pink)", width: 15, height: 15 }} /> Vies · {monthLabel}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0" }}>
            {[0, 1, 2].map(i => (
              <OPIcon.Heart key={i} filled={i < data.lives} style={{ color: i < data.lives ? "var(--pink)" : "var(--muted-2)", width: 26, height: 26 }} />
            ))}
          </div>
          <div style={opStyles.statSub}>{data.lives > 0 ? "1 ❤ perdu par journée incomplète" : "0 vie — journée manquée : −25 pts"}</div>
        </div>
      </div>

      <div className="op-grid" style={opStyles.grid}>
        {/* DAILY CHECKLIST */}
        <div style={opStyles.card}>
          <div style={opStyles.cardHead}>
            <div>
              <div style={opStyles.cardTitle} className="display">Routine quotidienne</div>
              <div style={opStyles.cardSub}>À recocher chaque jour — remise à zéro à minuit</div>
            </div>
            <div style={{ ...opStyles.dayBadge, ...(allDone ? opStyles.dayBadgeDone : {}) }}>
              {doneCount}/{total} {allDone && "✓"}
            </div>
          </div>
          <div style={opStyles.barTrack}>
            <div style={{ ...opStyles.barFill, width: `${total > 0 ? (doneCount / total) * 100 : 0}%`, background: allDone ? "var(--green)" : "linear-gradient(90deg, var(--pink), var(--pink-2))" }}></div>
          </div>
          {toPublish.length > 0 && (
            <div style={opStyles.publishBox}>
              <div style={opStyles.publishTitle}>📣 À publier aujourd'hui</div>
              {toPublish.map(v => (
                <div key={v.id} style={opStyles.publishRow}>
                  <span style={opStyles.publishName}>{v.title}</span>
                  <button style={opStyles.publishBtn} onClick={() => markPublished(v.id)} title="Passer la vidéo au statut « Publiée »">Marquer publiée ✓</button>
                </div>
              ))}
            </div>
          )}
          <ul style={opStyles.list}>
            {data.dailies.map((o, i) => (
              <DailyRow key={o.id} obj={o} checked={!!checks[o.id]}
                onToggle={() => toggle(o.id)} onRemove={() => removeDaily(o.id)} onEdit={(t) => editDaily(o.id, t)}
                onDragStartRow={() => { dragIdxRef.current = i; }}
                onDropRow={() => { moveDaily(dragIdxRef.current, i); dragIdxRef.current = null; }} />
            ))}
            {data.dailies.length === 0 && <li style={opStyles.empty}>Aucun objectif journalier. Ajoute le premier ↓</li>}
          </ul>
          <div style={opStyles.addRow}>
            <input value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addDaily(); }} placeholder="Ajouter un objectif journalier…" style={opStyles.addInput} />
            <button style={opStyles.addBtn} onClick={addDaily} disabled={!newText.trim()}>+ Ajouter</button>
          </div>
          {allDone && (
            <div style={opStyles.congrats}>🎉 Journée complète ! Bonus de série ce soir : <b>+{25 * (data.streak + 1)} pts</b></div>
          )}
        </div>

        {/* CURRENT TIER REMINDER */}
        <div style={opStyles.sideCard}>
          <div style={opStyles.sideEyebrow}>Palier en cours</div>
          <div style={opStyles.sideTitle} className="display">
            <span style={{ color: "var(--pink)" }}>{currentTier.label}</span> · {currentTier.name}
          </div>
          <div style={opStyles.sideSub}>{tierDone}/{currentTier.objectives.length} objectifs de palier validés</div>
          <ul style={{ ...opStyles.list, marginTop: 14 }}>
            {currentTier.objectives.map(o => (
              <li key={o.id} style={{ ...opStyles.sideRow, ...(o.done ? opStyles.sideRowDone : {}) }}>
                <button style={{ ...opStyles.checkbox, ...(o.done ? opStyles.checkboxDone : {}) }} onClick={() => toggleTierObj(o.id)} aria-label="Basculer l'objectif">
                  {o.done && <Icon.Check />}
                </button>
                <span style={{ ...opStyles.sideText, ...(o.done ? opStyles.sideTextDone : {}) }}>{o.text}</span>
              </li>
            ))}
          </ul>
          <button style={opStyles.sideLink} onClick={onOpenStrategy}>Voir la stratégie complète →</button>
        </div>
      </div>

      <div style={opStyles.legend}>
        +10 pts / objectif coché · journée 100% = bonus de série croissant · −5 pts par objectif manqué en fin de journée · 1 ❤ par journée incomplète, 3 ❤ rechargés le 1er du mois
      </div>
    </div>
  );
}

function DailyRow({ obj, checked, onToggle, onRemove, onEdit, onDragStartRow, onDropRow }) {
  const [isEditing, setEditing] = useState(false);
  return (
    <li className="obj-row" draggable={!isEditing}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", obj.id); onDragStartRow(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropRow(); }}
      style={{ ...opStyles.row, ...(checked ? opStyles.rowDone : {}) }}>
      <span style={opStyles.grip} title="Glisser pour réorganiser">⋮⋮</span>
      <button style={{ ...opStyles.checkbox, ...(checked ? opStyles.checkboxDone : {}) }} onClick={onToggle} aria-label={checked ? "Décocher" : "Cocher"}>
        {checked && <Icon.Check />}
      </button>
      {isEditing ? (
        <input autoFocus defaultValue={obj.text}
          onBlur={(e) => { onEdit(e.target.value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onEdit(e.target.value); setEditing(false); } }}
          style={opStyles.editInput} />
      ) : (
        <button style={{ ...opStyles.rowText, ...(checked ? opStyles.rowTextDone : {}) }} onClick={() => setEditing(true)} title="Cliquer pour modifier">{obj.text}</button>
      )}
      <span style={{ ...opStyles.pts, color: checked ? "var(--green)" : "var(--muted-2)" }} className="mono">+10</span>
      <button className="obj-remove-btn" style={opStyles.remove} onClick={onRemove} aria-label="Supprimer" title="Supprimer">
        <Icon.Trash />
      </button>
    </li>
  );
}

const opStyles = {
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  stats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 22 },
  statCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "16px 20px" },
  statLabel: { display: "flex", alignItems: "center", gap: 7, color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 },
  statValue: { fontSize: 34, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em" },
  statSub: { color: "var(--muted-2)", fontSize: 11.5, marginTop: 8 },
  grid: { display: "grid", gridTemplateColumns: "1fr 360px", gap: 14, alignItems: "start" },
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "24px 24px 20px" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  cardTitle: { fontSize: 20, fontWeight: 700 },
  cardSub: { color: "var(--muted)", fontSize: 12.5, marginTop: 3 },
  dayBadge: { flexShrink: 0, padding: "5px 12px", borderRadius: 99, background: "var(--pink-soft)", color: "var(--pink)", fontSize: 13, fontWeight: 700 },
  dayBadgeDone: { background: "var(--green-soft)", color: "var(--green)" },
  barTrack: { height: 7, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)", marginBottom: 16 },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.3s ease" },
  publishBox: { marginBottom: 14, padding: "12px 14px", background: "rgba(255,138,61,0.09)", border: "1px solid rgba(255,138,61,0.35)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 8 },
  publishTitle: { color: "#ff8a3d", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" },
  publishRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  publishName: { flex: 1, minWidth: 0, fontSize: 13.5, color: "var(--text)", fontWeight: 500 },
  publishBtn: { flexShrink: 0, background: "transparent", border: "1px solid var(--green)", color: "var(--green)", fontSize: 11.5, fontWeight: 700, padding: "5px 10px", borderRadius: 8, cursor: "pointer" },
  evBox: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  evReminder: { padding: "10px 16px", background: "rgba(176,122,255,0.10)", border: "1px solid rgba(176,122,255,0.35)", borderRadius: 12, color: "#b07aff", fontSize: 13.5, fontWeight: 600 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 },
  empty: { color: "var(--muted)", fontSize: 14, padding: "16px 0", textAlign: "center", fontStyle: "italic" },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, transition: "all 0.15s", cursor: "grab" },
  grip: { color: "var(--muted-2)", fontSize: 11, letterSpacing: "-2px", flexShrink: 0, userSelect: "none" },
  rowDone: { background: "var(--green-soft)", border: "1px solid rgba(91,229,132,0.15)" },
  rowText: { flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: 14.5, textAlign: "left", padding: "3px 0", cursor: "text", lineHeight: 1.35 },
  rowTextDone: { color: "var(--muted)", textDecoration: "line-through", textDecorationThickness: "1px" },
  pts: { flexShrink: 0, fontSize: 11, fontWeight: 600 },
  editInput: { flex: 1, background: "var(--bg)", border: "1px solid var(--pink)", borderRadius: 8, color: "var(--text)", fontSize: 14.5, padding: "5px 9px", outline: "none" },
  remove: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 6, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", cursor: "pointer" },
  checkbox: { flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: "var(--surface-3)", border: "1.5px solid var(--line-strong)", color: "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s", cursor: "pointer" },
  checkboxDone: { background: "var(--green)", border: "1.5px solid var(--green)", color: "var(--check-fg)", boxShadow: "0 0 12px rgba(91,229,132,0.35)" },
  addRow: { display: "flex", gap: 8, padding: 4, background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 12, marginTop: 10 },
  addInput: { flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: 14, padding: "9px 12px", outline: "none" },
  addBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 9, cursor: "pointer" },
  congrats: { marginTop: 14, padding: "12px 16px", background: "var(--green-soft)", border: "1px solid rgba(91,229,132,0.2)", borderRadius: 12, color: "var(--green)", fontSize: 13.5 },
  sideCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "22px 22px 18px" },
  sideEyebrow: { color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 },
  sideTitle: { fontSize: 22, fontWeight: 700, lineHeight: 1.15 },
  sideSub: { color: "var(--muted)", fontSize: 12.5, marginTop: 5 },
  sideRow: { display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10 },
  sideRowDone: { background: "var(--green-soft)", border: "1px solid rgba(91,229,132,0.12)" },
  sideText: { flex: 1, fontSize: 13, lineHeight: 1.4, color: "var(--text)", paddingTop: 2 },
  sideTextDone: { color: "var(--muted)", textDecoration: "line-through", textDecorationThickness: "1px" },
  sideLink: { marginTop: 14, width: "100%", background: "transparent", border: "1px solid var(--line-strong)", color: "var(--pink)", fontSize: 13, fontWeight: 600, padding: "9px 12px", borderRadius: 10, cursor: "pointer" },
  legend: { marginTop: 18, color: "var(--muted-2)", fontSize: 11.5, lineHeight: 1.5, textAlign: "center", maxWidth: 720, marginLeft: "auto", marginRight: "auto" },
};

Object.assign(window, { ObjectifsPage });
