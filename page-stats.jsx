const { useState, useEffect, useMemo } = React;

// Page Statistiques : lit le planning (prop) et les données journalières (localStorage)
function StatsPage({ plan }) {
  const videos = plan.videos || [];
  const tags = plan.tags || [];
  const published = videos.filter(v => v.status === "publiee");

  // ─── publications par mois (6 derniers mois) ───
  const perMonth = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: d.toLocaleDateString("fr-FR", { month: "short" }), count: published.filter(v => v.date && v.date.slice(0, 7) === key).length });
    }
    return months;
  }, [published]);
  const maxMonth = Math.max(1, ...perMonth.map(m => m.count));

  // ─── répartition par état ───
  const byStatus = PLAN_STATUSES.map(s => ({ st: s, count: videos.filter(v => v.status === s.id).length })).filter(x => x.count > 0);
  const totalVideos = videos.length;
  const inProgress = videos.filter(v => ["tourner", "monter", "publier"].includes(v.status)).length;
  // date locale (pas UTC) pour comparer aux dates du calendrier
  const _n = new Date();
  const todayStr2 = `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`;
  const upcoming = videos.filter(v => v.date && v.date >= todayStr2 && v.status !== "publiee").length;

  // ─── KPI développement ───
  const dateNDaysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const pubIn = (from, to) => published.filter(v => v.date && v.date >= from && v.date < to).length;
  const last4w = pubIn(dateNDaysAgo(28), todayStr2 + "z");
  const prev4w = pubIn(dateNDaysAgo(56), dateNDaysAgo(28));
  const rate = (last4w / 4);
  const trend = last4w > prev4w ? "↗" : last4w < prev4w ? "↘" : "→";
  const trendColor = last4w > prev4w ? "var(--green)" : last4w < prev4w ? "#ff6b6b" : "var(--muted)";
  const late = videos.filter(v => v.date && v.date < todayStr2 && v.status !== "publiee").length;
  // stock = à publier + publiées planifiées après aujourd'hui (publication auto à venir)
  const stock = videos.filter(v => v.status === "publier" || (v.status === "publiee" && v.date && v.date > todayStr2)).length;
  const stockWeeks = rate > 0 ? (stock / rate) : null;

  // ─── stats étiquettes (vidéos publiées) ───
  const tagStats = useMemo(() => {
    const counts = tags.map(t => ({ tag: t, count: published.filter(v => (v.tags || []).includes(t.id)).length }));
    const used = counts.filter(c => c.count > 0).sort((a, b) => b.count - a.count);
    return { used, unused: counts.filter(c => c.count === 0), max: Math.max(1, ...used.map(c => c.count)) };
  }, [tags, published]);

  return (
    <div>
      <div style={stStyles.pageHead}>
        <div style={stStyles.pageTitle} className="display">Statistiques</div>
        <div style={stStyles.pageSub}>Ta production vidéo en un coup d'œil</div>
      </div>

      {/* ENTONNOIR DE PRODUCTION */}
      <div style={stStyles.card}>
        <div style={stStyles.funnel} className="st-funnel">
          {[
            { label: "À tourner", count: videos.filter(v => v.status === "tourner").length, color: "var(--pink)", bg: "var(--pink-soft)" },
            { label: "À monter", count: videos.filter(v => v.status === "monter").length, color: "var(--gold)", bg: "var(--gold-soft)" },
            { label: "Publiée", count: published.length, color: "var(--green)", bg: "var(--green-soft)" },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div style={stStyles.funnelStep}>
                <div style={{ ...stStyles.funnelBubble, background: s.bg, border: `2px solid ${s.color}`, boxShadow: `0 0 22px color-mix(in srgb, ${s.color} 25%, transparent)` }}>
                  <span style={{ ...stStyles.funnelCount, color: s.color }} className="display">{s.count}</span>
                </div>
                <div style={{ ...stStyles.funnelLabel, color: s.color }}>{s.label}</div>
              </div>
              {i < arr.length - 1 && <div style={stStyles.funnelArrow} className="st-funnel-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>

        {/* BANDE KPI */}
        <div style={stStyles.kpiStrip} className="op-stats">
          {/* rythme : jauge circulaire */}
          <div style={stStyles.miniKpi}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="var(--surface-3)" strokeWidth="7"></circle>
              <circle cx="32" cy="32" r="26" fill="none" stroke={trendColor === "var(--muted)" ? "var(--pink)" : trendColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${Math.min(1, rate / 7) * 163.4} 163.4`} transform="rotate(-90 32 32)"></circle>
              <text x="32" y="30" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">{rate.toFixed(1).replace(".", ",")}</text>
              <text x="32" y="43" textAnchor="middle" fill={trendColor} fontSize="12" fontWeight="700">{trend}</text>
            </svg>
            <div>
              <div style={stStyles.miniKpiLabel}>Publiées / semaine</div>
              <div style={stStyles.miniKpiSub}>{last4w} sur 4 sem. (avant : {prev4w})</div>
            </div>
          </div>
          {/* retard : pastille d'alerte */}
          <div style={stStyles.miniKpi}>
            <div style={{ ...stStyles.alertDot, background: late > 0 ? "rgba(255,107,107,0.14)" : "var(--green-soft)", border: `2px solid ${late > 0 ? "#ff6b6b" : "var(--green)"}`, color: late > 0 ? "#ff6b6b" : "var(--green)" }} className="display">
              {late > 0 ? late : "✓"}
            </div>
            <div>
              <div style={stStyles.miniKpiLabel}>En retard</div>
              <div style={stStyles.miniKpiSub}>{late > 0 ? "date passée, non publiées" : "rien en retard 🎉"}</div>
            </div>
          </div>
          {/* stock : jauge de remplissage */}
          <div style={stStyles.miniKpi}>
            <div style={{ flexShrink: 0, width: 64, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#7a9bff" }} className="display">{stock}</div>
              <div style={stStyles.stockTrack}>
                <div style={{ ...stStyles.stockFill, width: `${stockWeeks != null ? Math.min(100, (stockWeeks / 4) * 100) : stock > 0 ? 15 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div style={stStyles.miniKpiLabel}>Stock</div>
              <div style={stStyles.miniKpiSub}>à publier + planifiées à venir{stockWeeks != null ? ` · ≈ ${stockWeeks.toFixed(1).replace(".", ",")} sem. d'avance` : ""}</div>
            </div>
          </div>
        </div>
      </div>

      {/* PUBLICATIONS PAR MOIS */}
      <div style={stStyles.card}>
        <div style={stStyles.cardTitle} className="display">Publications par mois</div>
        <div style={stStyles.barChart}>
          {perMonth.map(m => (
            <div key={m.key} style={stStyles.barCol}>
              <div style={stStyles.barValue} className="mono">{m.count || ""}</div>
              <div style={{ ...stStyles.bar, height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count ? 6 : 2, background: m.count ? "linear-gradient(180deg, var(--pink), var(--pink-2))" : "var(--surface-3)" }}></div>
              <div style={stStyles.barLabel}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RÉPARTITION PAR ÉTAT */}
      <div style={stStyles.card}>
        <div style={stStyles.cardTitle} className="display">Pipeline des vidéos</div>
        {totalVideos > 0 ? (
          <div>
            <div style={stStyles.stackBar}>
              {byStatus.map(({ st, count }) => (
                <div key={st.id} style={{ width: `${(count / totalVideos) * 100}%`, background: st.bg, position: "relative" }} title={`${st.label} : ${count}`}>
                  <div style={{ position: "absolute", inset: 0, background: st.color, opacity: 0.55 }}></div>
                </div>
              ))}
            </div>
            <div style={stStyles.stackLegend}>
              {byStatus.map(({ st, count }) => (
                <span key={st.id} style={{ ...stStyles.stackChip, color: st.color, background: st.bg }}>{st.label} · {count}</span>
              ))}
            </div>
          </div>
        ) : <div style={stStyles.empty}>Aucune vidéo pour l'instant.</div>}
      </div>

      {/* ÉTIQUETTES */}
      <div style={stStyles.card}>
        <div style={stStyles.cardTitle} className="display">Étiquettes — vidéos publiées</div>
        {tagStats.used.length > 0 ? (
          <div style={stStyles.statList}>
            {tagStats.used.map(({ tag, count }) => (
              <div key={tag.id} style={stStyles.statRow}>
                <span style={{ ...stStyles.statName, color: tag.color }}>{tag.name}</span>
                <div style={stStyles.statBarTrack}><div style={{ ...stStyles.statBarFill, width: `${(count / tagStats.max) * 100}%`, background: tag.color }}></div></div>
                <span style={stStyles.statCount} className="mono">{count}</span>
              </div>
            ))}
          </div>
        ) : <div style={stStyles.empty}>Aucune vidéo publiée étiquetée pour l'instant.</div>}
        {tagStats.unused.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={stStyles.gapLabel}>À couvrir · {tagStats.unused.length} étiquette{tagStats.unused.length > 1 ? "s" : ""} sans contenu publié</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {tagStats.unused.map(({ tag }) => (
                <span key={tag.id} style={stStyles.gapChip}>{tag.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const stStyles = {
  pageHead: { marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 },
  kpiCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 16, padding: "14px 16px", textAlign: "center" },
  kpiValue: { fontSize: 28, fontWeight: 700, lineHeight: 1.1 },
  kpiLabel: { color: "var(--muted)", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 4 },
  kpiSub: { color: "var(--muted-2)", fontSize: 10.5, marginTop: 3 },
  funnel: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", padding: "6px 0 14px" },
  funnelStep: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  funnelBubble: { width: 86, height: 86, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  funnelCount: { fontSize: 30, fontWeight: 700, lineHeight: 1 },
  funnelLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" },
  funnelArrow: { color: "var(--muted-2)", fontSize: 26, fontWeight: 700, marginBottom: 22 },
  kpiStrip: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, borderTop: "1px solid var(--line)", paddingTop: 14 },
  miniKpi: { display: "flex", alignItems: "center", gap: 12 },
  miniKpiLabel: { color: "var(--text)", fontSize: 12.5, fontWeight: 700 },
  miniKpiSub: { color: "var(--muted)", fontSize: 11, marginTop: 2 },
  alertDot: { flexShrink: 0, width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 },
  stockTrack: { marginTop: 4, height: 8, background: "var(--surface-3)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" },
  stockFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #7a9bff, #a8bdff)" },
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "16px 18px", marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 14 },
  barChart: { display: "flex", alignItems: "flex-end", gap: 10, height: 140 },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: 4 },
  barValue: { color: "var(--muted)", fontSize: 11 },
  bar: { width: "100%", maxWidth: 46, borderRadius: "7px 7px 3px 3px", transition: "height 0.3s ease" },
  barLabel: { color: "var(--muted)", fontSize: 10.5, fontWeight: 600, textTransform: "capitalize" },
  heatRow: { display: "flex", gap: 5 },
  heatCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  heatCell: { width: "100%", maxWidth: 34, aspectRatio: "1", borderRadius: 7, border: "1px solid var(--line)" },
  heatDay: { color: "var(--muted-2)", fontSize: 9.5 },
  heatLegend: { display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: "var(--muted)", fontSize: 11 },
  heatDot: { display: "inline-block", width: 10, height: 10, borderRadius: 3 },
  stackBar: { display: "flex", height: 22, borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)" },
  stackLegend: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
  stackChip: { fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 99 },
  statList: { display: "flex", flexDirection: "column", gap: 6 },
  statRow: { display: "flex", alignItems: "center", gap: 10 },
  statName: { flexShrink: 0, width: 150, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" },
  statBarTrack: { flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" },
  statBarFill: { height: "100%", borderRadius: 99, opacity: 0.85, transition: "width 0.3s ease" },
  statCount: { flexShrink: 0, width: 26, color: "var(--muted)", fontSize: 11, textAlign: "right" },
  gapLabel: { color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 },
  gapChip: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: "var(--muted)", border: "1px dashed var(--line-strong)" },
  empty: { color: "var(--muted)", fontSize: 13, fontStyle: "italic" },
};

Object.assign(window, { StatsPage });
