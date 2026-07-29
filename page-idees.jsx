const { useState, useEffect } = React;

const IDEAS_KEY = "miamstrat_ideas_v1";
const DEFAULT_IDEAS = [
  { id: "i1", text: "Tester les restos de gare : peut-on bien manger à moins de 15€ à Gare de Lyon ?" },
  { id: "i2", text: "Série « Paris gratuit » : 5 sorties stylées sans dépenser un centime" },
];

function loadIdeas() {
  try {
    const raw = localStorage.getItem(IDEAS_KEY);
    if (!raw) return DEFAULT_IDEAS;
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : DEFAULT_IDEAS;
  } catch (e) { return DEFAULT_IDEAS; }
}

function IdeasPage({ onSendToPlan }) {
  const [ideas, setIdeas] = useState(loadIdeas);
  useEffect(() => { try { localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas)); } catch (e) {} }, [ideas]);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shownIdeas = ideas.filter(i => !q || (i.title || "").toLowerCase().includes(q) || i.text.toLowerCase().includes(q));

  const addIdea = () => setIdeas(l => [{ id: uid(), title: "", text: "" }, ...l]);
  const patchIdea = (id, patch) => setIdeas(l => l.map(i => i.id === id ? { ...i, ...patch } : i));
  const removeIdea = (id) => setIdeas(l => l.filter(i => i.id !== id));
  const ideaTitle = (idea) => ((idea.title || "").trim() || (idea.text.split("\n")[0] || "").trim()).slice(0, 90);
  const sendToPlan = (idea) => {
    const title = ideaTitle(idea);
    if (!title) return;
    if (onSendToPlan(title)) {
      removeIdea(idea.id);
      setToast(`« ${title} » ajoutée au Planning ✓`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div>
      <div style={ideaStyles.pageHead}>
        <div>
          <div style={ideaStyles.pageTitle} className="display">Idées</div>
          <div style={ideaStyles.pageSub}>Ton vivier de contenus à creuser — bascule une idée dans le Planning quand elle est prête</div>
        </div>
        <button style={ideaStyles.addBtn} onClick={addIdea}>+ Nouvelle idée</button>
      </div>
      {toast && <div style={ideaStyles.toast}>{toast}</div>}
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une idée…" style={ideaStyles.search} />
      <div className="msg-grid" style={ideaStyles.grid}>
        {shownIdeas.map(idea => (
          <div key={idea.id} style={ideaStyles.card}>
            <input
              value={idea.title || ""}
              autoFocus={!idea.title && !idea.text}
              onChange={(e) => patchIdea(idea.id, { title: e.target.value })}
              placeholder="Titre de l'idée…"
              style={ideaStyles.title}
              className="display" />
            <textarea
              value={idea.text}
              onChange={(e) => patchIdea(idea.id, { text: e.target.value })}
              placeholder="Note ton idée de vidéo…"
              style={ideaStyles.body} />
            <div style={ideaStyles.foot}>
              <button
                style={{ ...ideaStyles.planBtn, ...(ideaTitle(idea) ? {} : { opacity: 0.4, cursor: "not-allowed" }) }}
                disabled={!ideaTitle(idea)}
                onClick={() => sendToPlan(idea)}
                title="Créer une vidéo dans le Planning et retirer l'idée d'ici">
                → Basculer au Planning
              </button>
              <button className="obj-remove-btn" style={ideaStyles.remove} onClick={() => { if ((!ideaTitle(idea) && !idea.text.trim()) || confirm("Supprimer cette idée ?")) removeIdea(idea.id); }} aria-label="Supprimer" title="Supprimer">
                <Icon.Trash />
              </button>
            </div>
          </div>
        ))}
        {ideas.length === 0 && <div style={ideaStyles.empty}>Aucune idée pour l'instant. Note la prochaine qui te passe par la tête ↑</div>}
        {ideas.length > 0 && shownIdeas.length === 0 && <div style={ideaStyles.empty}>Aucun résultat pour cette recherche</div>}
      </div>
    </div>
  );
}

const ideaStyles = {
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  search: { display: "block", width: "100%", boxSizing: "border-box", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 11, color: "var(--text)", fontSize: 14, padding: "10px 13px", outline: "none", marginBottom: 14 },
  addBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600, padding: "10px 18px", borderRadius: 11, cursor: "pointer" },
  toast: { marginBottom: 14, padding: "10px 16px", background: "var(--green-soft)", border: "1px solid var(--green)", borderRadius: 12, color: "var(--green)", fontSize: 13.5 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, alignItems: "start" },
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 10 },
  title: { background: "transparent", border: "none", borderBottom: "1px dashed var(--line-strong)", color: "var(--text)", fontSize: 15.5, fontWeight: 700, padding: "2px 2px 6px", outline: "none", width: "100%" },
  body: { width: "100%", boxSizing: "border-box", minHeight: 100, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)", fontSize: 13.5, lineHeight: 1.5, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit" },
  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  planBtn: { background: "var(--pink-soft)", border: "1px solid var(--pink)", color: "var(--pink)", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" },
  remove: { background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 6, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  empty: { color: "var(--muted)", fontSize: 14, padding: "24px 0", textAlign: "center", fontStyle: "italic", gridColumn: "1 / -1" },
};

Object.assign(window, { IdeasPage });
