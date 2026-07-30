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
// Patch immutable pour poser/effacer la date d'un état donné.
// video.date (date de publication, utilisée par stats/objectifs/archives) reste synchronisée sur publiee puis publier.
function stateDatePatch(video, stateId, day) {
  const sd = { ...(video.stateDates || {}) };
  if (day) sd[stateId] = day; else delete sd[stateId];
  return { stateDates: sd, date: sd.publiee || sd.publier || null };
}
// États associés à une vidéo : état courant + tous les états datés
function videoStates(v) {
  return [v.status, ...Object.keys(v.stateDates || {})];
}
// Fait passer une entrée datée à l'état suivant LIBRE (jamais d'écrasement d'un état déjà daté) ; le statut interne = état le plus avancé
function cycleStateDatePatch(video, sid) {
  const sd = { ...(video.stateDates || {}) };
  const d = sd[sid];
  if (!d) return null;
  delete sd[sid];
  const n = PLAN_STATUSES.length;
  let i = PLAN_STATUSES.findIndex(s => s.id === sid);
  let next = null;
  for (let step = 1; step < n; step++) {
    const cand = PLAN_STATUSES[(i + step) % n].id;
    if (!sd[cand]) { next = cand; break; }
  }
  if (!next) return null; // tous les autres états sont déjà datés : on ne bouge pas
  sd[next] = d;
  const order = PLAN_STATUSES.map(s => s.id);
  const keys = Object.keys(sd);
  const status = keys.length ? keys.sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] : video.status;
  return { stateDates: sd, status, date: sd.publiee || sd.publier || null };
}

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
    // migration : date unique → date portée par l'état de la vidéo au moment de la migration
    p.videos = p.videos.map(v => {
      if (v.date && !v.stateDates) {
        return { ...v, stateDates: { [v.status]: v.date } };
      }
      return v;
    });
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

  const [selectedId, setSelectedId] = useState(null); // click-to-place fallback (mobile)
  const [dragOverDay, setDragOverDay] = useState(null);
  const [evOpen, setEvOpen] = useState(false);
  const [videosOpen, setVideosOpen] = useState(true);

  const events = plan.events || [];
  const [editEventId, setEditEventId] = useState(null);
  const editEvent = events.find(e => e.id === editEventId) || null;
  const newEventIdRef = useRef(null);
  const closeEventModal = () => {
    const ev = events.find(e => e.id === editEventId);
    if (ev && !(ev.name || "").trim()) {
      removeEvent(ev.id);
    }
    newEventIdRef.current = null;
    setEditEventId(null);
  };
  const addEvent = () => { setEvOpen(true); const id = uid(); newEventIdRef.current = id; setPlan(p => ({ ...p, events: [{ id, name: "", start: planToday(), end: planToday(), remind: 14 }, ...(p.events || [])] })); setEditEventId(id); };
  const patchEvent = (id, patch) => setPlan(p => ({ ...p, events: (p.events || []).map(e => e.id === id ? { ...e, ...patch } : e) }));
  const removeEvent = (id) => setPlan(p => ({ ...p, events: (p.events || []).filter(e => e.id !== id) }));

  const dragVideoRef = useRef(null);
  const moveVideo = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setPlan(p => {
      const a = [...p.videos];
      const from = a.findIndex(v => v.id === fromId);
      const to = a.findIndex(v => v.id === toId);
      if (from < 0 || to < 0) return p;
      const [x] = a.splice(from, 1);
      a.splice(to, 0, x);
      return { ...p, videos: a };
    });
  };

  const cells = useMemo(() => monthCells(plan.month), [plan.month]);
  const today = planToday();

  const [listStFilter, setListStFilter] = useState([]);
  const [listQuery, setListQuery] = useState("");
  const toggleListSt = (id) => setListStFilter(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const lq = listQuery.trim().toLowerCase();
  // Visibles = sans date, datées d'aujourd'hui/futur, ou passées mais pas encore publiées (en retard).
  // Seules les vidéos publiées à date passée sortent de la liste (historique dans la page Vidéos).
  const activeVideos = plan.videos.filter(v => (!v.date || v.date >= today || v.status !== "publiee") && (listStFilter.length === 0 || listStFilter.some(id => videoStates(v).includes(id))) && (!lq || v.title.toLowerCase().includes(lq)));
  // Tri par état : Collab confirmée → À tourner → À monter → À publier → À contacter → Publiée (stable : l'ordre manuel est conservé au sein d'un même état)
  const STATUS_ORDER = { confirmee: 0, tourner: 1, monter: 2, publier: 3, contacter: 4, publiee: 5 };
  const sortedVideos = [...activeVideos].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  const [newVideoModal, setNewVideoModal] = useState(false);
  const createVideo = ({ title, tags, openDetail }) => {
    const id = uid();
    setPlan(p => ({ ...p, videos: [...p.videos, { id, title, status: "contacter", date: null, tags }] }));
    setNewVideoModal(false);
    if (openDetail) setDetailId(id);
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
  const [stateDatesId, setStateDatesId] = useState(null);
  const stateDatesVideo = plan.videos.find(v => v.id === stateDatesId) || null;
  const detailVideo = plan.videos.find(v => v.id === detailId) || null;
  // pose la date de l'état stateId (par défaut : l'état courant de la vidéo)
  const scheduleVideo = (id, date, stateId) => {
    setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === id ? { ...v, ...stateDatePatch(v, stateId || v.status, date) } : v) }));
    setSelectedId(null);
  };

  const onDropDay = (e, day) => {
    e.preventDefault();
    setDragOverDay(null);
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    const [id, stateId] = raw.split("|");
    if (id) scheduleVideo(id, day, stateId || undefined);
  };
  const onDayClick = (day) => {
    if (selectedId) { scheduleVideo(selectedId, day); return; }
    setDayChooser(day);
  };
  // popup de création au clic sur un jour
  const [dayChooser, setDayChooser] = useState(null);
  const createVideoOnDay = ({ title, tags, openDetail }) => {
    const id = uid();
    setPlan(p => ({ ...p, videos: [...p.videos, { id, title, status: "contacter", tags, ...stateDatePatch({}, "contacter", dayChooser) }] }));
    setDayChooser(null);
    if (openDetail) setDetailId(id);
  };
  const createEventOnDay = () => {
    const id = uid();
    newEventIdRef.current = id;
    setPlan(p => ({ ...p, events: [{ id, name: "", start: dayChooser, end: dayChooser, remind: 14 }, ...(p.events || [])] }));
    setDayChooser(null);
    setEvOpen(true);
    setEditEventId(id);
  };
  const [newVideoOnDay, setNewVideoOnDay] = useState(false);

  return (
    <div>
      <div style={planStyles.pageHead}>
        <div>
          <div style={planStyles.pageTitle} className="display">Planning des vidéos</div>
          <div style={planStyles.pageSub}>Glisse une vidéo sur un jour du calendrier — ou clique la vidéo puis le jour</div>
        </div>
        <button style={planStyles.newVideoBtn} onClick={() => setNewVideoModal(true)}>+ Nouvelle vidéo</button>
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
          <div style={{ ...planStyles.legendBox, marginTop: 0, paddingTop: 0, borderTop: "none" }}>
            {PLAN_STATUSES.map(s => {
              const on = listStFilter.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleListSt(s.id)} title="Filtrer la liste par cet état"
                  style={{ ...planStyles.legendChip, border: "none", cursor: "pointer", color: s.color, background: s.bg, ...(on ? { boxShadow: `0 0 0 1.5px currentColor inset` } : listStFilter.length ? { opacity: 0.45 } : {}) }}>
                  {s.label}
                </button>
              );
            })}
            {listStFilter.length > 0 && <button style={planStyles.legendClear} onClick={() => setListStFilter([])}>effacer</button>}
          </div>
          <input value={listQuery} onChange={(e) => setListQuery(e.target.value)} placeholder="Rechercher une vidéo…" style={planStyles.listSearch} />
          <ul style={planStyles.list}>
            {sortedVideos.map(v => {
              const st = statusOf(v.status);
              const isSel = selectedId === v.id;
              return (
                <VideoRow key={v.id} video={v} st={st} isSel={isSel}
                  onSelect={() => setSelectedId(isSel ? null : v.id)}
                  onCycle={() => cycleStatus(v.id)}
                  onCycleState={(sid) => setPlan(p => ({ ...p, videos: p.videos.map(x => x.id === v.id ? { ...x, ...(cycleStateDatePatch(x, sid) || {}) } : x) }))}
                  onAddState={() => setStateDatesId(v.id)}
                  onRemove={() => removeVideo(v.id)}
                  onEdit={(t) => editTitle(v.id, t)}
                  onDetail={() => setDetailId(v.id)}
                  onDragStartRow={() => { dragVideoRef.current = v.id; }}
                  onDropRow={() => { moveVideo(dragVideoRef.current, v.id); dragVideoRef.current = null; }}
                  onSendToIdeas={(vd) => { if (sendVideoToIdeas(vd)) setPlan(p => ({ ...p, videos: p.videos.filter(x => x.id !== vd.id) })); }}
                  onUnschedule={() => scheduleVideo(v.id, null)} />
              );
            })}
            {activeVideos.length === 0 && <li style={planStyles.empty}>{lq ? "Aucun résultat pour cette recherche" : listStFilter.length ? "Aucune vidéo pour ce filtre" : "Aucune vidéo. Ajoute la première ↑"}</li>}
          </ul>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={planStyles.calTitle} className="display">{monthLabel(plan.month)}</div>
              {plan.month !== planToday().slice(0, 7) && (
                <button style={planStyles.calTodayBtn} onClick={() => setPlan(p => ({ ...p, month: planToday().slice(0, 7) }))} title="Revenir au mois en cours">Aujourd'hui</button>
              )}
            </div>
            <button style={planStyles.calNav} onClick={() => setPlan(p => ({ ...p, month: shiftMonth(p.month, 1) }))} aria-label="Mois suivant">›</button>
          </div>
          <div style={planStyles.dowRow}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} style={planStyles.dow}>{d}</div>)}
          </div>
          <div style={planStyles.calGrid}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} style={planStyles.cellEmpty}></div>;
              const dayVideos = plan.videos.flatMap(v =>
                Object.entries(v.stateDates || {}).filter(([, d]) => d === day).map(([sid]) => ({ v, sid }))
              );
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
                    {dayVideos.map(({ v, sid }) => {
                      const st = statusOf(sid);
                      return (
                        <div key={v.id + sid} draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", v.id + "|" + sid)}
                          onClick={(e) => { e.stopPropagation(); setDetailId(v.id); }}
                          style={{ ...planStyles.chip, color: st.color, background: st.bg }}
                          title={`${v.title} — ${st.label} · clic : détail`}>
                          <span style={planStyles.chipText}>{v.title}</span>
                          <button style={planStyles.chipX} onClick={(e) => { e.stopPropagation(); scheduleVideo(v.id, null, sid); }} aria-label="Déplanifier" title="Retirer du calendrier">×</button>
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

      {dayChooser && !newVideoOnDay && (
        <div style={planStyles.overlay}>
          <div style={{ ...planStyles.modal, width: "min(360px, 100%)" }} role="dialog" aria-label="Créer sur ce jour">
            <div style={planStyles.modalHead}>
              <div style={planStyles.modalTitle} className="display">{(() => { const d = new Date(dayChooser + "T12:00:00"); return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); })()}</div>
              <button style={planStyles.modalClose} onClick={() => setDayChooser(null)} aria-label="Fermer">×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={planStyles.newVideoValidate} onClick={() => setNewVideoOnDay(true)}>🎬 Créer une vidéo ce jour</button>
              <button style={{ ...planStyles.newVideoValidate, background: "transparent", border: `1px solid ${EV_COLOR}`, color: EV_COLOR, marginTop: 0 }} onClick={createEventOnDay}>🗓️ Créer un événement ce jour</button>
            </div>
          </div>
        </div>
      )}

      {dayChooser && newVideoOnDay && (
        <NewVideoModal tags={plan.tags || []} onCreate={(v) => { createVideoOnDay(v); setNewVideoOnDay(false); }} onClose={() => { setNewVideoOnDay(false); setDayChooser(null); }} />
      )}

      {newVideoModal && (
        <NewVideoModal tags={plan.tags || []} onCreate={createVideo} onClose={() => setNewVideoModal(false)} />
      )}

      {stateDatesVideo && (
        <StateDatesModal
          video={stateDatesVideo}
          onClose={() => setStateDatesId(null)}
          onUpdate={(patch) => setPlan(p => ({ ...p, videos: p.videos.map(v => v.id === stateDatesVideo.id ? { ...v, ...patch } : v) }))} />
      )}

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
          onClose={closeEventModal}
          onUpdate={(patch) => patchEvent(editEvent.id, patch)} />
      )}
    </div>
  );
}

function VideoRow({ video, st, isSel, onSelect, onCycle, onCycleState, onAddState, onRemove, onEdit, onDetail, onUnschedule, onDragStartRow, onDropRow, onSendToIdeas }) {
  const [isEditing, setEditing] = useState(false);
  return (
    <li className="obj-row" draggable={!isEditing}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", video.id); onDragStartRow && onDragStartRow(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropRow && onDropRow(); }}
      style={{ ...planStyles.row, ...(isSel ? planStyles.rowSel : {}) }}>
      <span style={planStyles.grip} title="Glisser pour réorganiser ou planifier">⋮⋮</span>
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
          {Object.keys(video.stateDates || {}).length === 0 && (
            <button style={{ ...planStyles.statusChip, color: st.color, background: st.bg }} onClick={onCycle} title="Cliquer pour changer le statut">{st.label}</button>
          )}
          {Object.entries(video.stateDates || {}).map(([sid, d]) => {
            const s = statusOf(sid);
            return <button key={sid} style={{ ...planStyles.statusChip, color: s.color, background: s.bg }} onClick={() => onCycleState(sid)} title="Cliquer pour passer à l'état suivant (la date suit)">{s.label} · {d.slice(8)}/{d.slice(5, 7)}</button>;
          })}
          <button style={planStyles.addStateChip} onClick={onAddState} title="Gérer les états et leurs dates">+</button>
        </div>
      </div>
      <button style={planStyles.detailBtn} onClick={onDetail} aria-label="Détail de la vidéo" title="Scripts, descriptions & message CM">📄</button>
      {onSendToIdeas && <button style={planStyles.detailBtn} onClick={() => { if (confirmSendToIdeas(video)) onSendToIdeas(video); }} aria-label="Renvoyer dans les Idées" title="Renvoyer dans les Idées (titre + script FR conservés)">↩</button>}
      <button className="obj-remove-btn" style={planStyles.remove} onClick={onRemove} aria-label="Supprimer" title="Supprimer">
        <Icon.Trash />
      </button>
    </li>
  );
}

// Toast générique (bas de l'écran)
function showToastMsg(text) {
  let el = document.getElementById("saved-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "saved-toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2200);
}
// Toast « Sauvegardé ✓ » affiché à la fermeture des popups
function showSavedToast() { showToastMsg("Sauvegardé ✓"); }

function cmProposal(video) {
  if (video.date) {
    const d = new Date(video.date + "T12:00:00");
    const label = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return `Hello ! 👋 La vidéo « ${video.title} » est prévue pour le ${label}. Peux-tu programmer la publication ce jour-là (idéalement 18h-19h) + un partage en story à la sortie ? Script et descriptions FR/EN sont prêts dans la fiche. Merci ! 🙏`;
  }
  return `Hello ! 👋 La vidéo « ${video.title} » est prête côté contenu mais pas encore planifiée. Peux-tu me proposer un créneau de publication cette semaine ? Script et descriptions FR/EN sont dans la fiche. Merci ! 🙏`;
}

function VideoDetailModal({ video, tags = [], onClose: onCloseRaw, onUpdate }) {
  const onClose = React.useCallback(() => { showSavedToast(); onCloseRaw(); }, [onCloseRaw]);
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
  const [showStates, setShowStates] = useState(false);
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
              {Object.keys(video.stateDates || {}).length === 0 && (
                <button style={{ ...planStyles.statusChip, color: st.color, background: st.bg }} onClick={() => { const i = PLAN_STATUSES.findIndex(s => s.id === video.status); onUpdate({ status: PLAN_STATUSES[(i + 1) % PLAN_STATUSES.length].id }); }} title="Cliquer pour changer l'état">{st.label}</button>
              )}
              {Object.entries(video.stateDates || {}).map(([sid, d]) => {
                const s = statusOf(sid);
                return <button key={sid} style={{ ...planStyles.statusChip, color: s.color, background: s.bg }} onClick={() => onUpdate(cycleStateDatePatch(video, sid) || {})} title="Cliquer pour passer à l'état suivant (la date suit)">{s.label} · {d.slice(8)}/{d.slice(5, 7)}</button>;
              })}
              <button style={planStyles.addStateChip} onClick={() => setShowStates(true)} title="Gérer les états et leurs dates">+</button>
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
      {showStates && <StateDatesModal video={video} onUpdate={onUpdate} onClose={() => setShowStates(false)} />}
    </div>
  );
}

// Confirmation commune avant renvoi en Idées
function confirmSendToIdeas(video) {
  return confirm(`Renvoyer « ${video.title} » dans les Idées ?\n\nLa vidéo sera supprimée du Planning : étiquettes, date, statut, traduction ENG, description et idées de story seront PERDUS. Seuls le titre et le script FR (en description) seront conservés.`);
}

// Popup express de création : titre + étiquettes, sans scroll
function NewVideoModal({ tags, onCreate, onClose }) {
  const [title, setTitle] = useState("");
  const [selTags, setSelTags] = useState([]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const submit = () => { const t = title.trim(); if (t) onCreate({ title: t, tags: selTags }); };
  const submitFull = () => { const t = title.trim(); if (t) onCreate({ title: t, tags: selTags, openDetail: true }); };
  return (
    <div style={planStyles.overlay}>
      <div style={{ ...planStyles.modal, width: "min(480px, 100%)" }} role="dialog" aria-label="Nouvelle vidéo">
        <div style={planStyles.modalHead}>
          <div style={planStyles.modalTitle} className="display">Nouvelle vidéo</div>
          <button style={planStyles.modalClose} onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <label style={planStyles.fieldLabel}>Titre</label>
        <input value={title} autoFocus onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Nom de la vidéo…" style={{ ...planStyles.textarea, minHeight: 0, fontWeight: 600 }} />
        {tags.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <label style={planStyles.fieldLabel}>Étiquettes</label>
            <div style={{ maxHeight: "32vh", overflowY: "auto" }}>
              <TagPicker tags={tags} selected={selTags} onToggle={(id) => setSelTags(a => a.includes(id) ? a.filter(x => x !== id) : [...a, id])} />
            </div>
          </div>
        )}
        <button style={{ ...planStyles.newVideoValidate, ...(title.trim() ? {} : { opacity: 0.4, cursor: "not-allowed" }) }} disabled={!title.trim()} onClick={submit}>Créer ✓</button>
        <button style={{ ...planStyles.newVideoFullLink, ...(title.trim() ? {} : { opacity: 0.4, cursor: "not-allowed" }) }} disabled={!title.trim()} onClick={submitFull}>Créer et compléter la fiche (scripts, description…) →</button>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose: onCloseRaw, onUpdate }) {
  const onClose = React.useCallback(() => { if ((event.name || "").trim()) showSavedToast(); onCloseRaw(); }, [onCloseRaw, event.name]);
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
            <input type="date" value={event.start || ""} onChange={(e) => { const s = e.target.value; onUpdate(event.end && event.end < s ? { start: s, end: s } : { start: s }); }} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={{ ...planStyles.textarea, minHeight: 0, cursor: "pointer" }} />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={planStyles.fieldLabel}>Date de fin</label>
            <input type="date" value={event.end || ""} onChange={(e) => onUpdate({ end: e.target.value })} onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }} style={{ ...planStyles.textarea, minHeight: 0, cursor: "pointer" }} />
          </div>
        </div>
        <label style={{ ...planStyles.fieldLabel, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={event.remindOn !== false} onChange={(e) => onUpdate({ remindOn: e.target.checked })} style={{ accentColor: "var(--pink)", width: 15, height: 15 }} />
          Rappel activé
        </label>
        {event.remindOn !== false && (
          <div>
            <label style={planStyles.fieldLabel}>Rappel (jours avant le début)</label>
            <input type="number" min="0" max="365" value={event.remind == null ? 14 : event.remind} onChange={(e) => onUpdate({ remind: Math.max(0, +e.target.value || 0) })} style={{ ...planStyles.textarea, minHeight: 0, width: 110 }} />
            <div style={planStyles.cmHint}>Le rappel s'affiche sur la page Objectifs à l'approche de l'événement.</div>
          </div>
        )}
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

// Popup états & dates d'une vidéo : chaque état peut recevoir une date
function StateDatesModal({ video, onClose: onCloseRaw, onUpdate }) {
  const onClose = React.useCallback(() => { showSavedToast(); onCloseRaw(); }, [onCloseRaw]);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={planStyles.overlay}>
      <div style={{ ...planStyles.modal, width: "min(400px, 100%)" }} role="dialog" aria-label="États de la vidéo">
        <div style={planStyles.modalHead}>
          <div style={{ minWidth: 0 }}>
            <div style={planStyles.modalTitle} className="display">{video.title}</div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 3 }}>Associe une date à chaque état — les états datés apparaissent sur la carte et le calendrier</div>
          </div>
          <button style={planStyles.modalClose} onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PLAN_STATUSES.map(s => {
            const d = (video.stateDates || {})[s.id] || "";
            return (
              <div key={s.id} style={planStyles.stateModalRow}>
                <span style={{ ...planStyles.statusChip, color: s.color, background: s.bg, cursor: "default" }}>{s.label}</span>
                <input type="date" value={d}
                  onChange={(e) => onUpdate(stateDatePatch(video, s.id, e.target.value || null))}
                  onClick={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                  style={{ ...planStyles.stateDateInput, marginLeft: "auto" }} />
                {d && <button style={planStyles.modalDateClear} onClick={() => onUpdate(stateDatePatch(video, s.id, null))} title="Retirer cette date">×</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const planStyles = {
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 22 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  grid: { display: "grid", gridTemplateColumns: "330px 1fr", gap: 14, alignItems: "start" },
  listCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "20px 18px 16px" },
  cardTitle: { fontSize: 18, fontWeight: 700 },
  addRow: { display: "flex", gap: 6, padding: 3, background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 11, marginBottom: 12 },
  addInput: { flex: 1, minWidth: 0, background: "transparent", border: "none", color: "var(--text)", fontSize: 13.5, padding: "8px 10px", outline: "none" },
  addBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 16, fontWeight: 600, width: 34, borderRadius: 8, cursor: "pointer", flexShrink: 0 },
  newVideoBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "10px 18px", borderRadius: 11, cursor: "pointer", flexShrink: 0 },
  newVideoValidate: { marginTop: 14, width: "100%", background: "var(--pink)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, padding: "11px 14px", borderRadius: 11, cursor: "pointer" },
  newVideoFullLink: { marginTop: 8, width: "100%", background: "transparent", border: "none", color: "var(--muted)", fontSize: 12, textDecoration: "underline", cursor: "pointer", padding: "4px 2px" },
  backToIdeasBtn: { marginTop: 16, width: "100%", background: "transparent", border: "1px dashed var(--line-strong)", color: "var(--muted)", fontSize: 12.5, fontWeight: 600, padding: "9px 12px", borderRadius: 11, cursor: "pointer" },
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
  modalDateWrap: { display: "inline-flex", alignItems: "center", gap: 4, color: "var(--muted)", fontSize: 11 },
  modalDateInput: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 7, color: "var(--text)", fontSize: 11.5, padding: "3px 6px", outline: "none", cursor: "pointer" },
  modalDateClear: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1 },
  stateDatesGrid: { display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8 },
  stateDateItem: { display: "flex", flexDirection: "column", gap: 2 },
  stateDateLabel: { fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" },
  stateDateInput: { background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 7, color: "var(--text)", fontSize: 11, padding: "3px 6px", outline: "none", cursor: "pointer" },
  stateDateAdd: { alignSelf: "flex-end", background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 7, color: "var(--muted)", fontSize: 11, padding: "4px 6px", outline: "none", cursor: "pointer" },
  addStateChip: { border: "1px dashed var(--line-strong)", background: "transparent", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, cursor: "pointer", lineHeight: 1.4 },
  stateModalRow: { display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11 },
  editInput: { width: "100%", background: "var(--bg)", border: "1px solid var(--pink)", borderRadius: 8, color: "var(--text)", fontSize: 13.5, padding: "5px 8px", outline: "none" },
  remove: { flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 5, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  legendBox: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--line)" },
  legendChip: { fontSize: 9.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 99 },
  legendClear: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 10, textDecoration: "underline", cursor: "pointer", padding: "2px 4px" },
  listSearch: { width: "100%", boxSizing: "border-box", background: "var(--surface-2)", border: "1px solid var(--line-strong)", borderRadius: 10, color: "var(--text)", fontSize: 13, padding: "8px 11px", outline: "none" },
  calCard: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 22, padding: "20px 20px 16px" },
  calHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calTitle: { fontSize: 19, fontWeight: 700 },
  calNav: { width: 34, height: 34, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--text)", fontSize: 18, cursor: "pointer", lineHeight: 1 },
  calTodayBtn: { background: "transparent", border: "1px solid var(--line-strong)", color: "var(--muted)", fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap" },
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

Object.assign(window, { PlanningPage, VideoDetailModal, NewVideoModal, StateDatesModal, TagPicker, sendVideoToIdeas, confirmSendToIdeas, showToastMsg, stateDatePatch, videoStates, cycleStateDatePatch, PLAN_KEY, PLAN_STATUSES, TAG_COLORS, loadPlan, statusOf });

// Renvoie une vidéo vers la page Idées : crée l'idée (titre + script FR en description) dans le localStorage des idées
function sendVideoToIdeas(video) {
  try {
    const KEY = "miamstrat_ideas_v1";
    let ideas = [];
    try { const p = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(p)) ideas = p; } catch (e) {}
    ideas.unshift({ id: uid(), title: video.title, text: video.scriptFR || "" });
    localStorage.setItem(KEY, JSON.stringify(ideas));
    showToastMsg(`« ${video.title} » renvoyée dans les Idées ✓`);
    return true;
  } catch (e) { return false; }
}
