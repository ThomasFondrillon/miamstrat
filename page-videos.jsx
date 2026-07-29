const { useState, useEffect, useMemo } = React;

function VideosPage({ plan, setPlan }) {
  const videos = plan.videos || [];
  const tags = plan.tags || [];
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [stFilter, setStFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [newVideoModal, setNewVideoModal] = useState(false);
  const createVideo = ({ title, tags: vTags, openDetail }) => {
    const id = uid();
    setPlan(p => ({ ...p, videos: [...p.videos, { id, title, status: "contacter", date: null, tags: vTags }] }));
    setNewVideoModal(false);
    if (openDetail) setDetailId(id);
  };
  const [newTag, setNewTag] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const detailVideo = videos.find(v => v.id === detailId) || null;

  const toggleIn = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
  // ignore les ids d'étiquettes supprimées/migrées encore présents dans le filtre
  const activeTagFilter = useMemo(() => tagFilter.filter(id => tags.some(t => t.id === id)), [tagFilter, tags]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...videos]
      .filter(v =>
        (!q || v.title.toLowerCase().includes(q)) &&
        (stFilter.length === 0 || stFilter.includes(v.status)) &&
        (tagFilter.length === 0 || activeTagFilter.length === 0 || activeTagFilter.some(t => (v.tags || []).includes(t))) &&
        (!dateFrom || (v.date && v.date >= dateFrom)) &&
        (!dateTo || (v.date && v.date <= dateTo)))
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return -1;
        if (!b.date) return 1;
        return b.date.localeCompare(a.date);
      });
  }, [videos, query, stFilter, activeTagFilter, dateFrom, dateTo]);

  const cycleStatus = (id) => setPlan(p => ({
    ...p,
    videos: p.videos.map(v => {
      if (v.id !== id) return v;
      const i = PLAN_STATUSES.findIndex(s => s.id === v.status);
      return { ...v, status: PLAN_STATUSES[(i + 1) % PLAN_STATUSES.length].id };
    }),
  }));
  const removeVideo = (id) => setPlan(p => ({ ...p, videos: p.videos.filter(v => v.id !== id) }));
  const updateVideo = (id, patch) => setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, ...patch } : v) }));

  const addTag = () => {
    const name = newTag.trim();
    if (!name || tags.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
    setPlan(p => ({ ...p, tags: [...(p.tags || []), { id: uid(), name, color: TAG_COLORS[(p.tags || []).length % TAG_COLORS.length] }] }));
    setNewTag("");
  };
  const removeTag = (id) => {
    const t = tags.find(x => x.id === id);
    if (!confirm(`Supprimer l'étiquette « ${t ? t.name : ""} » ? Elle sera retirée de toutes les vidéos.`)) return;
    setPlan(p => ({
      ...p,
      tags: (p.tags || []).filter(x => x.id !== id),
      videos: p.videos.map(v => v.tags ? { ...v, tags: v.tags.filter(x => x !== id) } : v),
    }));
    setTagFilter(f => f.filter(x => x !== id));
  };
  const tagDragRef = React.useRef(null);
  const moveTag = (from, to) => {
    if (from == null || to == null || from === to) return;
    setPlan(p => { const a = [...(p.tags || [])]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return { ...p, tags: a }; });
  };

  return (
    <div>
      <div style={vidStyles.pageHead}>
        <div>
          <div style={vidStyles.pageTitle} className="display">Vidéos</div>
          <div style={vidStyles.pageSub}>{videos.length} vidéo{videos.length > 1 ? "s" : ""} · triées de la plus récente à la plus ancienne</div>
        </div>
        <button style={vidStyles.newVideoBtn} onClick={() => setNewVideoModal(true)}>+ Nouvelle vidéo</button>
      </div>

      {/* FILTRES */}
      <div style={vidStyles.toolbar}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une vidéo…" style={vidStyles.search} />
        <div style={vidStyles.filterRow}>
          <span style={vidStyles.filterLabel}>Période</span>
          <label style={vidStyles.dateLabel}>du <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={vidStyles.dateInput} /></label>
          <label style={vidStyles.dateLabel}>au <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={vidStyles.dateInput} /></label>
          {(dateFrom || dateTo) && <button style={vidStyles.clearBtn} onClick={() => { setDateFrom(""); setDateTo(""); }}>effacer</button>}
        </div>
        <div style={vidStyles.filterRow}>
          <span style={vidStyles.filterLabel}>État</span>
          {PLAN_STATUSES.map(s => (
            <button key={s.id} onClick={() => setStFilter(f => toggleIn(f, s.id))}
              style={{ ...vidStyles.filterChip, color: s.color, background: s.bg, ...(stFilter.includes(s.id) ? { boxShadow: `0 0 0 1.5px ${s.color === "var(--muted)" ? "var(--muted)" : s.color} inset` } : { opacity: stFilter.length ? 0.45 : 1 }) }}>
              {s.label}
            </button>
          ))}
          {stFilter.length > 0 && <button style={vidStyles.clearBtn} onClick={() => setStFilter([])}>effacer</button>}
        </div>
        {tags.length > 0 && (
          <div style={{ ...vidStyles.filterRow, alignItems: "flex-start" }}>
            <button style={vidStyles.tagFilterToggle} onClick={() => setTagFilterOpen(o => !o)} aria-expanded={tagFilterOpen}>
              <span style={{ ...vidStyles.tagCaret, transform: tagFilterOpen ? "rotate(90deg)" : "none", fontSize: 12 }}>›</span>
              Étiquettes{activeTagFilter.length > 0 ? ` · ${activeTagFilter.length}` : ""}
            </button>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
              {(tagFilterOpen ? tags : tags.filter(t => activeTagFilter.includes(t.id))).map(t => (
                <button key={t.id} onClick={() => setTagFilter(f => toggleIn(f, t.id))}
                  style={{ ...vidStyles.filterChip, color: activeTagFilter.includes(t.id) ? "#fff" : t.color, background: activeTagFilter.includes(t.id) ? t.color : "transparent", border: `1px solid ${t.color}`, ...(activeTagFilter.length && !activeTagFilter.includes(t.id) ? { opacity: 0.5 } : {}) }}>
                  {t.name}
                </button>
              ))}
              {activeTagFilter.length > 0 && <button style={vidStyles.clearBtn} onClick={() => setTagFilter([])}>effacer</button>}
            </div>
          </div>
        )}
      </div>

      {/* LISTE */}
      <div style={vidStyles.listCard}>
        {filtered.map(v => {
          const st = statusOf(v.status);
          const vTags = (v.tags || []).map(id => tags.find(t => t.id === id)).filter(Boolean);
          return (
            <div key={v.id} className="obj-row" style={vidStyles.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button style={vidStyles.rowTitle} onClick={() => setDetailId(v.id)} title="Ouvrir la fiche">{v.title}</button>
                <div style={vidStyles.rowMeta}>
                  <button style={{ ...vidStyles.statusChip, color: st.color, background: st.bg }} onClick={() => cycleStatus(v.id)} title="Cliquer pour changer le statut">{st.label}</button>
                  {vTags.map(t => <span key={t.id} style={{ ...vidStyles.tagChip, color: t.color, border: `1px solid ${t.color}` }}>{t.name}</span>)}
                  {v.date
                    ? <span style={vidStyles.dateTag} className="mono">📅 {v.date.slice(8)}/{v.date.slice(5, 7)}/{v.date.slice(0, 4)}</span>
                    : <span style={{ ...vidStyles.dateTag, fontStyle: "italic" }}>sans date</span>}
                </div>
              </div>
              <button className="obj-remove-btn" style={vidStyles.remove} onClick={() => { if (confirm(`Supprimer « ${v.title} » ?`)) removeVideo(v.id); }} aria-label="Supprimer" title="Supprimer"><Icon.Trash /></button>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={vidStyles.empty}>{videos.length === 0 ? "Aucune vidéo — crée-les depuis le Planning ou les Idées." : "Aucune vidéo ne correspond aux filtres."}</div>}
      </div>

      {/* GESTION DES ÉTIQUETTES */}
      <div style={vidStyles.tagCard}>
        <button style={vidStyles.tagToggle} onClick={() => setTagsOpen(o => !o)} aria-expanded={tagsOpen}>
          <span style={{ ...vidStyles.tagCaret, transform: tagsOpen ? "rotate(90deg)" : "none" }}>›</span>
          <span style={vidStyles.tagTitle} className="display">Étiquettes disponibles</span>
          <span style={vidStyles.tagCount} className="mono">{tags.length}</span>
        </button>
        {tagsOpen && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={vidStyles.tagList}>
          {tags.map((t, i) => (
            <span key={t.id} draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); tagDragRef.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); moveTag(tagDragRef.current, i); tagDragRef.current = null; }}
              style={{ ...vidStyles.tagManageChip, color: t.color, border: `1px solid ${t.color}`, cursor: "grab" }} title="Glisser pour réorganiser">
              {t.name}
              <button style={vidStyles.tagX} onClick={() => removeTag(t.id)} aria-label={`Supprimer ${t.name}`} title="Supprimer l'étiquette">×</button>
            </span>
          ))}
          {tags.length === 0 && <span style={{ color: "var(--muted)", fontSize: 13, fontStyle: "italic" }}>Aucune étiquette</span>}
        </div>
        <div style={vidStyles.tagAddRow}>
          <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTag(); }} placeholder="Nouvelle étiquette…" style={vidStyles.tagInput} />
          <button style={vidStyles.tagAddBtn} onClick={addTag} disabled={!newTag.trim()}>+ Ajouter</button>
        </div>
        </div>}
      </div>

      {newVideoModal && (
        <NewVideoModal tags={tags} onCreate={createVideo} onClose={() => setNewVideoModal(false)} />
      )}

      {detailVideo && (
        <VideoDetailModal
          video={detailVideo}
          tags={tags}
          onClose={() => setDetailId(null)}
          onUpdate={(patch) => updateVideo(detailVideo.id, patch)} />
      )}
    </div>
  );
}

const vidStyles = {
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 20 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  newVideoBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "10px 18px", borderRadius: 11, cursor: "pointer", flexShrink: 0 },
  toolbar: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  search: { width: "100%", boxSizing: "border-box", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 11, color: "var(--text)", fontSize: 14, padding: "10px 13px", outline: "none" },
  filterRow: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  filterLabel: { color: "var(--muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4, width: 68, flexShrink: 0 },
  tagFilterToggle: { display: "inline-flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: "var(--muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 0", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", marginRight: 4 },
  filterChip: { border: "none", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 99, cursor: "pointer", transition: "all 0.15s" },
  clearBtn: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 11, textDecoration: "underline", cursor: "pointer", padding: "2px 4px" },
  dateLabel: { display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 12 },
  dateInput: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--text)", fontSize: 12.5, padding: "6px 9px", outline: "none", cursor: "pointer" },
  listCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: 10, display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  row: { display: "flex", alignItems: "flex-start", gap: 8, padding: "11px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12 },
  rowTitle: { display: "block", width: "100%", background: "transparent", border: "none", color: "var(--text)", fontSize: 14.5, fontWeight: 600, textAlign: "left", padding: 0, lineHeight: 1.35, cursor: "pointer" },
  rowMeta: { display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  statusChip: { border: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 99, cursor: "pointer" },
  tagChip: { fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "transparent" },
  dateTag: { color: "var(--muted)", fontSize: 10.5 },
  remove: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 6, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  empty: { color: "var(--muted)", fontSize: 14, padding: "22px 0", textAlign: "center", fontStyle: "italic" },
  tagCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 },
  tagToggle: { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "var(--text)" },
  tagCaret: { display: "inline-block", color: "var(--muted)", fontSize: 15, transition: "transform 0.15s", lineHeight: 1 },
  tagCount: { marginLeft: "auto", color: "var(--muted)", fontSize: 11, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: 99 },
  tagTitle: { fontSize: 15, fontWeight: 700 },
  tagList: { display: "flex", flexWrap: "wrap", gap: 6 },
  tagManageChip: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 6px 4px 11px", borderRadius: 99 },
  tagX: { background: "transparent", border: "none", color: "inherit", opacity: 0.7, fontSize: 14, cursor: "pointer", padding: "0 3px", lineHeight: 1 },
  tagAddRow: { display: "flex", gap: 6, padding: 3, background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 11, maxWidth: 480, flexWrap: "wrap" },
  tagSelect: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 8, color: "var(--text)", fontSize: 12, padding: "6px 8px", outline: "none" },
  tagGroupLabel: { color: "var(--muted-2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 5 },
  statList: { display: "flex", flexDirection: "column", gap: 6 },
  statRow: { display: "flex", alignItems: "center", gap: 10 },
  statName: { flexShrink: 0, width: 150, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" },
  statBarTrack: { flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" },
  statBarFill: { height: "100%", borderRadius: 99, opacity: 0.85, transition: "width 0.3s ease" },
  statCount: { flexShrink: 0, width: 26, color: "var(--muted)", fontSize: 11, textAlign: "right" },
  statGapLabel: { color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 },
  tagInput: { flex: 1, minWidth: 0, background: "transparent", border: "none", color: "var(--text)", fontSize: 13, padding: "7px 10px", outline: "none" },
  tagAddBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0 },
};

Object.assign(window, { VideosPage });
