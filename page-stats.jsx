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
  const upcoming = videos.filter(v => v.date && v.date >= new Date().toISOString().slice(0, 10) && v.status !== "publiee").length;

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

      {/* CHIFFRES CLÉS */}
      <div className="op-stats" style={stStyles.kpis}>
        <div style={stStyles.kpiCard}><div style={{ ...stStyles.kpiValue, color: "var(--green)" }} className="display">{published.length}</div><div style={stStyles.kpiLabel}>vidéos publiées</div></div>
        <div style={stStyles.kpiCard}><div style={stStyles.kpiValue} className="display">{totalVideos}</div><div style={stStyles.kpiLabel}>vidéos au total</div></div>
        <div style={stStyles.kpiCard}><div style={{ ...stStyles.kpiValue, color: "var(--pink)" }} className="display">{inProgress}</div><div style={stStyles.kpiLabel}>en production</div></div>
        <div style={stStyles.kpiCard}><div style={{ ...stStyles.kpiValue, color: "var(--gold)" }} className="display">{upcoming}</div><div style={stStyles.kpiLabel}>planifiées à venir</div></div>
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
