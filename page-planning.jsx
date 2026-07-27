const { useState, useEffect, useMemo } = React;

const PLAN_KEY = "miamstrat_plan_v1";
const PLAN_STATUSES = [
  { id: "contacter", label: "À contacter", color: "var(--muted)", bg: "var(--surface-3)" },
  { id: "confirmee", label: "Collab confirmée", color: "#7a9bff", bg: "rgba(122,155,255,0.14)" },
  { id: "tourner", label: "À tourner", color: "var(--pink)", bg: "var(--pink-soft)" },
  { id: "monter", label: "À monter", color: "var(--gold)", bg: "var(--gold-soft)" },
  { id: "publier", label: "À publier", color: "#ff8a3d", bg: "rgba(255,138,61,0.14)" },
  { id: "publiee", label: "Publiée", color: "var(--green)", bg: "var(--green-soft)" },
];
const PLAN_STATUS_MIGRATION = { planifier: "contacter", faire: "tourner" };
const EV_COLOR = "#b07aff";
const TAG_COLORS = ["#ff3d92", "#ffc857", "#5be584", "#7a9bff", "#b07aff", "#ff8a3d"];
const LOC = "Lieu", TYP = "Type de contenu";
const DEFAULT_TAGS = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `loc${i + 1}`, name: `Paris ${i === 0 ? "1er" : (i + 1) + "e"}`, color: "#7a9bff" })),
  { id: "locB", name: "Banlieue parisienne", color: "#5be584" },
  { id: "locH", name: "Hors Paris", color: "#ffc857" },
  { id: "locE", name: "Étranger", color: "#b07aff" },
  ...["Restaurant", "Activité", "Brunch", "Musée", "Balade", "Hôtel", "Monument", "Gastronomique", "Petit budget", "Luxe", "En couple", "En famille", "Entre amis", "Entre copines", "Avec des enfants", "Romantique"]
    .map((name, i) => ({ id: `typ${i + 1}`, name, color: TAG_COLORS[i % TAG_COLORS.length] })),
  // Métros & RER (couleurs officielles des lignes)
  ...[["1", "#FFCD00"], ["2", "#003CA6"], ["3", "#837902"], ["3bis", "#6EC4E8"], ["4", "#CF009E"], ["5", "#FF7E2E"], ["6", "#6ECA97"], ["7", "#FA9ABA"], ["7bis", "#6ECA97"], ["8", "#E19BDF"], ["9", "#B6BD00"], ["10", "#C9910D"], ["11", "#704B1C"], ["12", "#007852"], ["13", "#6EC4E8"], ["14", "#62259D"]]
    .map(([n, color]) => ({ id: `metro${n}`, name: `Métro ${n}`, color })),
  ...[["A", "#E3051C"], ["B", "#5291CE"], ["C", "#FFCC30"], ["D", "#00814F"], ["E", "#A0006E"]]
    .map(([n, color]) => ({ id: `rer${n}`, name: `RER ${n}`, color })),
];
const TAGS_VERSION = 3;
const DEFAULT_EVENTS = [
  { id: "e1", name: "Vacances de la Toussaint", start: "2026-10-17", end: "2026-11-02", remind: 14 },
  { id: "e2", name: "Halloween", start: "2026-10-31", end: "2026-10-31", remind: 14 },
  { id: "e3", name: "Marchés de Noël", start: "2026-11-20", end: "2026-12-24", remind: 14 },
  { id: "e4", name: "Nouvel An lunaire", start: "2027-02-06", end: "2027-02-06", remind: 14 },
  { id: "e5", name: "Ramadan", start: "2027-02-08", end: "2027-03-09", remind: 14 },
  { id: "e6", name: "Saint-Valentin", start: "2027-02-14", end: "2027-02-14", remind: 14 },
  { id: "e7", name: "Pâques", start: "2027-03-28", end: "2027-03-28", remind: 14 },
  { id: "e8", name: "Roland-Garros", start: "2027-05-24", end: "2027-06-06", remind: 14 },
  { id: "e9", name: "Fête de la musique", start: "2027-06-21", end: "2027-06-21", remind: 14 },
];
function statusOf(id) { return PLAN_STATUSES.find(s => s.id === id) || PLAN_STATUSES[0]; }

function planPad2(n) { return String(n).padStart(2, "0"); }
function planToday() { const d = new Date(); return d.getFullYear() + "-" + planPad2(d.getMonth() + 1) + "-" + planPad2(d.getDate()); }
function curMonth() { return planToday().slice(0, 7); }

function loadPlan() {
  const base = {
    videos: [
      { id: "v1", title: "Top 3 brunchs à moins de 20€ (75011)", status: "tourner", date: null },
      { id: "v2", title: "Concours été — 2 places expo immersive", status: "contacter", date: null },
    ],
    month: curMonth(),
    events: DEFAULT_EVENTS,
    tags: DEFAULT_TAGS,
    tagsVersion: TAGS_VERSION,
  };
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw);
    if (!p || !Array.isArray(p.videos)) return base;
    // migration des anciens statuts + des plans sans événements
    p.videos = p.videos.map(v => PLAN_STATUS_MIGRATION[v.status] ? { ...v, status: PLAN_STATUS_MIGRATION[v.status] } : v);
    if (!Array.isArray(p.events)) p.events = DEFAULT_EVENTS;
    if (!Array.isArray(p.tags) || p.tagsVersion !== TAGS_VERSION) {
      p.tags = DEFAULT_TAGS;
      p.tagsVersion = TAGS_VERSION;
      const valid = new Set(DEFAULT_TAGS.map(t => t.id));
      p.videos = p.videos.map(v => v.tags ? { ...v, tags: v.tags.filter(id => valid.has(id)) } : v);
    }
    return { ...base, ...p };
  } catch (e) { return base; }
}

function monthCells(ym) {
  const [y, m] = ym.split("-").map(Number);
  const startDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // lundi = 0
  const days = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${ym}-${planPad2(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function shiftMonth(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + "-" + planPad2(d.getMonth() + 1);
}

function PlanningPage({ plan, setPlan }) {

  const [newTitle, setNewTitle] = useState("");
  const [newVideoTags, setNewVideoTags] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // click-to-place fallback (mobile)
  const [dragOverDay, setDragOverDay] = useState(null);
  const [evOpen, setEvOpen] = useState(false);
  const [videosOpen, setVideosOpen] = useState(true);

  const events = plan.events || [];
  const [editEventId, setEditEventId] = useState(null);
  const editEvent = events.find(e => e.id === editEventId) || null;
  const addEvent = () => { setEvOpen(true); const id = uid(); setPlan(p => ({ ...p, events: [{ id, name: "", start: planToday(), end: planToday(), remind: 14 }, ...(p.events || [])] })); setEditEventId(id); };
  const patchEvent = (id, patch) => setPlan(p => ({ ...p, events: (p.events || []).map(e => e.id === id ? { ...e, ...patch } : e) }));
  const removeEvent = (id) => setPlan(p => ({ ...p, events: (p.events || []).filter(e => e.id !== id) }));

  const cells = useMemo(() => monthCells(plan.month), [plan.month]);
  const today = planToday();

  // Actives = sans date ou datées d'aujourd'hui/futur (l'historique complet est dans la page Vidéos).
  const activeVideos = plan.videos.filter(v => !v.date || v.date >= today);

  const addVideo = () => {
    const t = newTitle.trim();
    if (!t) return;
    setPlan(p => ({ ...p, videos: [...p.videos, { id: uid(), title: t, status: "contacter", date: null, tags: newVideoTags }] }));
    setNewTitle("");
    setNewVideoTags([]);
  };
  const removeVideo = (id) => setPlan(p => ({ ...p, videos: p.videos.filter(v => v.id !== id) }));
  const cycleStatus = (id) => setPlan(p => ({
    ...p,
    videos: p.videos.map(v => {
      if (v.id !== id) return v;
      const i = PLAN_STATUSES.findIndex(s => s.id === v.status);
      return { ...v, status: PLAN_STATUSES[(i + 1) % PLAN_STATUSES.length].id };
    }),
  }));
  const editTitle = (id, title) => setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, title } : v) }));
  const updateVideo = (id, patch) => setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, ...patch } : v) }));
  const [detailId, setDetailId] = useState(null);
  const detailVideo = plan.videos.find(v => v.id === detailId) || null;
  const scheduleVideo = (id, date) => { setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, date } : v) })); setSelectedId(null); };

  const onDropDay = (e, day) => {
    e.preventDefault();
    setDragOverDay(null);
    const id = e.dataTransfer.getData("text/plain");
    if (id) scheduleVideo(id, day);
  };
  const onDayClick = (day) => { if (selectedId) scheduleVideo(selectedId, day); };

  return (
    <div>
      <div style={planStyles.pageHead}>
        <div>
          <div style={planStyles.pageTitle} className="display">Planning des vidéos</div>
          <div style={planStyles.pageSub}>Glisse une vidéo sur un jour du calendrier — ou clique la vidéo puis le jour</div>
        </div>
      </div>

      <div className="plan-grid" style={planStyles.grid}>
        {/* VIDEO LIST */}
        <div style={planStyles.listCard}>
          <button style={{ ...planStyles.archToggle, padding: "0 0 4px" }} onClick={() => setVideosOpen(o => !o)} aria-expanded={videosOpen}>
            <span style={{ ...planStyles.archCaret, transform: videosOpen ? "rotate(90deg)" : "none" }}>›</span>
            <span style={planStyles.cardTitle} className="display">Vidéos</span>
            <span style={planStyles.archCount} className="mono">{activeVideos.length}</span>
          </button>
          {videosOpen && <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          <div style={planStyles.addRow}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addVideo(); }} placeholder="Nom de la vidéo…" style={planStyles.addInput} />
            <button style={planStyles.addBtn} onClick={addVideo} disabled={!newTitle.trim()}>+</button>
          </div>
          {newTitle.trim() && (plan.tags || []).length > 0 && (
            <TagPicker tags={plan.tags || []} selected={newVideoTags} onToggle={(id) => setNewVideoTags(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])} />
          )}
          <ul style={planStyles.list}>
            {activeVideos.map(v => {
              const st = statusOf(v.status);
              const isSel = selectedId === v.id;
              return (
                <VideoRow key={v.id} video={v} st={st} isSel={isSel}
                  onSelect={() => setSelectedId(isSel ? null : v.id)}
                  onCycle={() => cycleStatus(v.id)}
                  onRemove={() => removeVideo(v.id)}
                  onEdit={(t) => editTitle(v.id, t)}
                  onDetail={() => setDetailId(v.id)}
                  onUnschedule={() => scheduleVideo(v.id, null)} />
              );
            })}
            {activeVideos.length === 0 && <li style={planStyles.empty}>Aucune vidéo. Ajoute la première ↑</li>}
          </ul>
          <div style={planStyles.legendBox}>
            {PLAN_STATUSES.map(s => (
              <span key={s.id} style={{ ...planStyles.legendChip, color: s.color, background: s.bg }}>{s.label}</span>
            ))}
          </div>
          </div>}

          {/* ÉVÉNEMENTS */}
          <div style={planStyles.archBlock}>
            <button style={planStyles.archToggle} onClick={() => setEvOpen(o => !o)} aria-expanded={evOpen}>
              <span style={{ ...planStyles.archCaret, transform: evOpen ? "rotate(90deg)" : "none" }}>›</span>
              <span style={planStyles.archTitle} className="display">Événements</span>
              <span style={planStyles.archCount} className="mono">{events.length}</span>
            </button>
            {evOpen && (
              <div style={planStyles.archBody}>
                <button style={planStyles.evAddBtn} onClick={addEvent}>+ Ajouter un événement</button>
                {events.map(ev => (
                  <div key={ev.id} style={planStyles.evLine}>
                    <span style={{ ...planStyles.evDot }}></span>
                    <button style={planStyles.evLineName} onClick={() => setEditEventId(ev.id)} title="Modifier l'événement">
                      {ev.name || <i style={{ color: "var(--muted-2)" }}>Sans nom</i>}
                    </button>
                    {ev.start && <span style={planStyles.evLineDate} className="mono">{ev.start.slice(8)}/{ev.start.slice(5, 7)}{ev.end && ev.end !== ev.start ? `→${ev.end.slice(8)}/${ev.end.slice(5, 7)}` : ""}</span>}
                    <button className="obj-remove-btn" style={planStyles.remove} onClick={() => { if (!ev.name || confirm(`Supprimer « ${ev.name} » ?`)) removeEvent(ev.id); }} aria-label="Supprimer" title="Supprimer"><Icon.Trash /></button>
                  </div>
                ))}
                {events.length === 0 && <div style={planStyles.empty}>Aucun événement. Ajoute le premier ↑</div>}
              </div>
            )}
          </div>
        </div>

        {/* CALENDAR */}
        <div style={planStyles.calCard}>
          <div style={planStyles.calHead}>
            <button style={planStyles.calNav} onClick={() => setPlan(p => ({ ...p, month: shiftMonth(p.month, -1) }))} aria-label="Mois précédent">‹</button>
            <div style={planStyles.calTitle} className="display">{monthLabel(plan.month)}</div>
            <button style={planStyles.calNav} onClick={() => setPlan(p => ({ ...p, month: shiftMonth(p.month, 1) }))} aria-label="Mois suivant">›</button>
          </div>
          <div style={planStyles.dowRow}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} style={planStyles.dow}>{d}</div>)}
          </div>
          <div style={planStyles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} style={planStyles.cellEmpty}></div>;
              const dayVideos = plan.videos.filter(v => v.date === day);
              const isToday = day === today;
              const isOver = dragOverDay === day;
              return (
                <div key={i}
                  style={{
                    ...planStyles.cell,
                    ...(isToday ? planStyles.cellToday : {}),
                    ...(isOver ? planStyles.cellOver : {}),
                    ...(selectedId ? { cursor: "copy" } : {}),
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }}
                  onDragLeave={() => setDragOverDay(d => d === day ? null : d)}
                  onDrop={(e) => onDropDay(e, day)}
                  onClick={() => onDayClick(day)}>
                  <div style={{ ...planStyles.cellNum, ...(isToday ? { color: "var(--pink)", fontWeight: 700 } : {}) }} className="mono">{+day.slice(8)}</div>
                  <div style={planStyles.cellChips}>
                    {events.filter(ev => ev.name && ev.start && day >= ev.start && day <= (ev.end || ev.start)).map(ev => (
                      <div key={ev.id} style={planStyles.evBand} title={ev.name}>{ev.name}</div>
                    ))}
                    {dayVideos.map(v => {
                      const st = statusOf(v.status);
                      return (
                        <div key={v.id} draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", v.id)}
                          onClick={(e) => { e.stopPropagation(); setDetailId(v.id); }}
                          style={{ ...planStyles.chip, color: st.color, background: st.bg }}
                          title={`${v.title} — ${st.label} · clic : détail`}>
                          <span style={planStyles.chipText}>{v.title}</span>
                          <button style={planStyles.chipX} onClick={(e) => { e.stopPropagation(); scheduleVideo(v.id, null); }} aria-label="Déplanifier" title="Retirer du calendrier">×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedId && (
            <div style={planStyles.placeHint}>
              📌 Clique un jour pour planifier « {(plan.videos.find(v => v.id === selectedId) || {}).title} » — <button style={planStyles.cancelSel} onClick={() => setSelectedId(null)}>annuler</button>
            </div>
          )}
        </div>
      </div>

      {detailVideo && (
        <VideoDetailModal
          video={detailVideo}
          tags={plan.tags || []}
          onClose={() => setDetailId(null)}
          onUpdate={(patch) => updateVideo(detailVideo.id, patch)} />
      )}

      {editEvent && (
        <EventDetailModal
          event={editEvent}
          onClose={() => setEditEventId(null)}
          onUpdate={(patch) => patchEvent(editEvent.id, patch)} />
      )}
    </div>
  );
}

function VideoRow({ video, st, isSel, onSelect, onCycle, onRemove, onEdit, onDetail, onUnschedule }) {
  const [isEditing, setEditing] = useState(false);
  return (
    <li className="obj-row" draggable={!isEditing}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", video.id)}
      style={{ ...planStyles.row, ...(isSel ? planStyles.rowSel : {}) }}>
      <span style={planStyles.grip} title="Glisser vers le calendrier">⋮⋮</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <input autoFocus defaultValue={video.title}
            onBlur={(e) => { onEdit(e.target.value); setEditing(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { onEdit(e.target.value); setEditing(false); } }}
            style={planStyles.editInput} />
        ) : (
          <button style={planStyles.rowTitle} onClick={onSelect} onDoubleClick={() => setEditing(true)} title="Clic : sélectionner pour planifier · double-clic : renommer">{video.title}</button>
        )}
        <div style={planStyles.rowMeta}>
          <button style={{ ...planStyles.statusChip, color: st.color, background: st.bg }} onClick={onCycle} title="Cliquer pour changer le statut">{st.label}</button>
          {video.date && (
            <span style={planStyles.dateTag} className="mono">
              📅 {video.date.slice(8)}/{video.date.slice(5, 7)}
              <button style={planStyles.chipX} onClick={onUnschedule} aria-label="Déplanifier" title="Retirer du calendrier">×</button>
            </span>
          )}
        </div>
      </div>
      <button style={planStyles.detailBtn} onClick={onDetail} aria-label="Détail de la vidéo" title="Scripts, descriptions & message CM">📄</button>
      <button className="obj-remove-btn" style={planStyles.remove} onClick={onRemove} aria-label="Supprimer" title="Supprimer">
        <Icon.Trash />
      </button>
    </li>
  );
}

function cmProposal(video) {
  if (video.date) {
    const d = new Date(video.date + "T12:00:00");
    const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return `Hello ! 👋 La vidéo « ${video.title} » est prévue pour le ${label}. Peux-tu programmer la publication ce jour-là (idéalement 18h-19h) + un partage en story à la sortie ? Script et descriptions FR/EN sont prêts dans la fiche. Merci ! 🙏`;
  }
  return `Hello ! 👋 La vidéo « ${video.title} » est prête côté contenu mais pas encore planifiée. Peux-tu me proposer un créneau de publication cette semaine ? Script et descriptions FR/EN sont dans la fiche. Merci ! 🙏`;
}

function VideoDetailModal({ video, tags = [], onClose, onUpdate }) {
  const [lang, setLang] = useState("FR");
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const st = statusOf(video.status);
  const scriptKey = lang === "FR" ? "scriptFR" : "scriptENG";
  const descKey = lang === "FR" ? "descFR" : "descENG";
  const proposal = cmProposal(video);
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div style={planStyles.overlay}>
      <div style={planStyles.modal} role="dialog" aria-label={`Détail — ${video.title}`}>
        <div style={planStyles.modalHead}>
          <div style={{ minWidth: 0 }}>
            <div style={planStyles.modalTitle} className="display">{video.title}</div>
            <div style={planStyles.rowMeta}>
              <span style={{ ...planStyles.statusChip, color: st.color, background: st.bg, cursor: "default" }}>{st.label}</span>
              {video.date
                ? <span style={planStyles.dateTag} className="mono">📅 {video.date.slice(8)}/{video.date.slice(5, 7)}/{video.date.slice(0, 4)}</span>
                : <span style={planStyles.dateTag}>non planifiée</span>}
            </div>
          </div>
          <button style={planStyles.modalClose} onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <div style={planStyles.langTabs}>
          {["FR", "ENG"].map(l => (
            <button key={l} className="display" onClick={() => setLang(l)}
              style={{ ...planStyles.langTab, ...(lang === l ? planStyles.langTabActive : {}) }}>{l}</button>
          ))}
        </div>

        <label style={planStyles.fieldLabel}>Script {lang}</label>
        <textarea
          value={video[scriptKey] || ""}
          onChange={(e) => onUpdate({ [scriptKey]: e.target.value })}
          placeholder={lang === "FR" ? "Hook, déroulé, CTA…" : "Hook, main beats, CTA…"}
          style={{ ...planStyles.textarea, minHeight: 130 }} />

        <label style={planStyles.fieldLabel}>Description {lang}</label>
        <textarea
          value={video[descKey] || ""}
          onChange={(e) => onUpdate({ [descKey]: e.target.value })}
          placeholder={lang === "FR" ? "Caption, hashtags, mentions…" : "Caption, hashtags, mentions…"}
          style={{ ...planStyles.textarea, minHeight: 90 }} />

        <div style={planStyles.cmHead}>
          <label style={{ ...planStyles.fieldLabel, margin: 0 }}>Mes idées de story</label>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ ...planStyles.cmBtn, ...(copied ? { color: "var(--green)", borderColor: "var(--green)" } : {}) }} onClick={() => copy(video.storyIdeas || "")} title="Copier">{copied ? "✓ Copié !" : "Copier"}</button>
          </div>
        </div>
        <textarea
          value={video.storyIdeas || ""}
          onChange={(e) => onUpdate({ storyIdeas: e.target.value })}
          placeholder="Coulisses du tournage, sondage, compte à rebours avant publication…"
          style={{ ...planStyles.textarea, minHeight: 90 }} />

        {tags.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <label style={planStyles.fieldLabel}>Étiquettes</label>
            <TagPicker tags={tags} selected={video.tags || []} onToggle={(id) => onUpdate({ tags: (video.tags || []).includes(id) ? (video.tags || []).filter(x => x !== id) : [...(video.tags || []), id] })} />
          </div>
        )}
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose, onUpdate }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={planStyles.overlay}>
      <div style={{ ...planStyles.modal, width: "min(420px, 100%)" }} role="dialog" aria-label="Détail de l'événement">
        <div style={planStyles.modalHead}>
          <div style={planStyles.modalTitle} className="display">Événement</div>
          <button style={planStyles.modalClose} onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <label style={planStyles.fieldLabel}>Nom</label>
        <input value={event.name} autoFocus={!event.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="Nom de l'événement…" style={{ ...planStyles.textarea, minHeight: 0, fontWeight: 600 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={planStyles.fieldLabel}>Date de début</label>
            <input type="date" value={event.start || ""} onChange={(e) => onUpdate({ start: e.target.value })} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={{ ...planStyles.textarea, minHeight: 0, cursor: "pointer" }} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={planStyles.fieldLabel}>Date de fin</label>
            <input type="date" value={event.end || ""} onChange={(e) => onUpdate({ end: e.target.value })} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={{ ...planStyles.textarea, minHeight: 0, cursor: "pointer" }} />
          </div>
        </div>
        <label style={planStyles.fieldLabel}>Rappel (jours avant le début)</label>
        <input type="number" min="0" max="365" value={event.remind == null ? 14 : event.remind} onChange={(e) => onUpdate({ remind: Math.max(0, +e.target.value || 0) })} style={{ ...planStyles.textarea, minHeight: 0, width: 110 }} />
        <div style={planStyles.cmHint}>Le rappel s'affiche sur la page Objectifs à l'approche de l'événement.</div>
      </div>
    </div>
  );
}

// Étiquettes cliquables (création vidéo, fiche)
function TagPicker({ tags, selected = [], onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {tags.map(t => {
        const on = selected.includes(t.id);
        return (
          <button key={t.id} onClick={() => onToggle(t.id)}
            style={{ ...planStyles.newTagChip, color: on ? "#fff" : t.color, border: `1px solid ${t.color}`, background: on ? t.color : "transparent" }}>
            {t.name}
          </button>
        );
      })}
    </div>
  );
}

const planStyles = {
  pageHead: { marginBottom: 22 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  grid: { display: "grid", gridTemplateColumns: "330px 1fr", gap: 14, alignItems: "start" },
  listCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "20px 18px 16px" },
  cardTitle: { fontSize: 18, fontWeight: 700 },
  addRow: { display: "flex", gap: 6, padding: 3, background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 11, marginBottom: 12 },
  addInput: { flex: 1, minWidth: 0, background: "transparent", border: "none", color: "var(--text)", fontSize: 13.5, padding: "8px 10px", outline: "none" },
  addBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 16, fontWeight: 600, width: 34, borderRadius: 8, cursor: "pointer", flexShrink: 0 },
  newTagRow: { display: "flex", flexWrap: "wrap", gap: 5, padding: "0 2px" },
  newTagChip: { fontSize: 10.5, fontWeight: 700, padding: "4px 10px", borderRadius: 99, cursor: "pointer", transition: "all 0.12s" },
  tagGroupLabel: { color: "var(--muted-2)", fontSize: 9, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", margin: "0 0 4px 2px" },
  list: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 },
  empty: { color: "var(--muted)", fontSize: 13.5, padding: "14px 0", textAlign: "center", fontStyle: "italic" },
  row: { display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, cursor: "grab", transition: "all 0.15s" },
  rowSel: { border: "1px solid var(--pink)", boxShadow: "0 0 0 3px var(--pink-soft)" },
  grip: { color: "var(--muted-2)", fontSize: 11, letterSpacing: "-2px", paddingTop: 3, flexShrink: 0, userSelect: "none" },
  rowTitle: { display: "block", width: "100%", background: "transparent", border: "none", color: "var(--text)", fontSize: 13.5, fontWeight: 500, textAlign: "left", padding: 0, lineHeight: 1.35, cursor: "pointer" },
  rowMeta: { display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  statusChip: { border: "none", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 99, cursor: "pointer" },
  dateTag: { display: "inline-flex", alignItems: "center", gap: 3, color: "var(--muted)", fontSize: 10.5 },
  editInput: { width: "100%", background: "var(--bg)", border: "1px solid var(--pink)", borderRadius: 8, color: "var(--text)", fontSize: 13.5, padding: "5px 8px", outline: "none" },
  remove: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 5, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  legendBox: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" },
  legendChip: { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 99 },
  calCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "20px 20px 16px" },
  calHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calTitle: { fontSize: 19, fontWeight: 700 },
  calNav: { width: 34, height: 34, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--text)", fontSize: 18, cursor: "pointer", lineHeight: 1 },
  dowRow: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 },
  dow: { textAlign: "center", color: "var(--muted-2)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  cellEmpty: { minHeight: 84, borderRadius: 10, background: "transparent" },
  cell: { minHeight: 84, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "5px 5px 4px", display: "flex", flexDirection: "column", gap: 3, transition: "all 0.12s", overflow: "hidden" },
  cellToday: { border: "1px solid var(--pink)", boxShadow: "0 0 0 2px var(--pink-soft)" },
  cellOver: { border: "1px solid var(--pink)", background: "var(--pink-soft)" },
  cellNum: { fontSize: 10.5, color: "var(--muted)", paddingLeft: 2 },
  cellChips: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  chip: { display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, padding: "3px 5px", borderRadius: 6, cursor: "grab", minWidth: 0 },
  chipText: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  chipX: { flexShrink: 0, background: "transparent", border: "none", color: "inherit", opacity: 0.65, fontSize: 12, padding: "0 2px", cursor: "pointer", lineHeight: 1 },
  placeHint: { marginTop: 12, padding: "10px 14px", background: "var(--pink-soft)", border: "1px solid var(--pink)", borderRadius: 10, color: "var(--pink)", fontSize: 13 },
  cancelSel: { background: "transparent", border: "none", color: "var(--pink)", textDecoration: "underline", fontSize: 13, cursor: "pointer", padding: 0 },
  evBand: { fontSize: 8.5, fontWeight: 700, color: EV_COLOR, background: "rgba(176,122,255,0.16)", padding: "1.5px 4px", borderRadius: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" },
  evAddBtn: { background: "var(--pink-soft)", border: "1px dashed var(--pink)", color: "var(--pink)", fontSize: 12, fontWeight: 700, padding: "8px 12px", borderRadius: 10, cursor: "pointer" },
  evLine: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12 },
  evDot: { flexShrink: 0, width: 8, height: 8, borderRadius: 99, background: EV_COLOR },
  evLineName: { flex: 1, minWidth: 0, background: "transparent", border: "none", color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "left", padding: 0, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  evLineDate: { flexShrink: 0, color: "var(--muted)", fontSize: 10.5 },
  archBlock: { marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" },
  archToggle: { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "transparent", border: "none", padding: "4px 2px", cursor: "pointer", color: "var(--text)" },
  archCaret: { display: "inline-block", color: "var(--muted)", fontSize: 15, transition: "transform 0.15s", lineHeight: 1 },
  archTitle: { fontSize: 14, fontWeight: 700 },
  archCount: { marginLeft: "auto", color: "var(--muted)", fontSize: 11, background: "var(--surface-2)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: 99 },
  archBody: { marginTop: 10, display: "flex", flexDirection: "column", gap: 8 },
  archSearch: { width: "100%", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 10, color: "var(--text)", fontSize: 13, padding: "8px 11px", outline: "none" },
  archRow: { display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, opacity: 0.85 },
  archRowTitle: { color: "var(--muted)", fontSize: 13, fontWeight: 500, lineHeight: 1.35 },
  archRestore: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 13, lineHeight: 1 },
  detailBtn: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: "4px 7px", borderRadius: 8, cursor: "pointer", fontSize: 12, lineHeight: 1 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 },
  modal: { width: "min(620px, 100%)", maxHeight: "88vh", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 20, padding: "22px 24px 20px", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  modalTitle: { fontSize: 21, fontWeight: 700, lineHeight: 1.2, marginBottom: 7 },
  modalClose: { flexShrink: 0, width: 32, height: 32, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--text)", fontSize: 18, cursor: "pointer", lineHeight: 1 },
  langTabs: { display: "flex", gap: 4, padding: 3, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11, marginBottom: 14, width: "fit-content" },
  langTab: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 12.5, fontWeight: 700, padding: "6px 18px", borderRadius: 8, cursor: "pointer" },
  langTabActive: { background: "var(--pink)", color: "#fff" },
  fieldLabel: { display: "block", color: "var(--muted)", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "12px 0 6px" },
  textarea: { width: "100%", boxSizing: "border-box", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 12, color: "var(--text)", fontSize: 13.5, lineHeight: 1.5, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit" },
  cmHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "14px 0 6px", flexWrap: "wrap" },
  cmBtn: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--pink)", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, cursor: "pointer" },
  cmHint: { color: "var(--muted-2)", fontSize: 11, marginTop: 6 },
};

Object.assign(window, { PlanningPage, VideoDetailModal, TagPicker, PLAN_KEY, PLAN_STATUSES, TAG_COLORS, loadPlan, statusOf });
