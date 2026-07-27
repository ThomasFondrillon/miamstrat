const { useState, useEffect, useRef } = React;

const MSG_KEY = "miamstrat_msgs_v1";
const DEFAULT_MSGS = [
  { id: "m1", title: "Démarchage — première prise de contact", body: "Hello [NOM] ! 👋\nJe suis la créatrice du compte @miamcherie (16K abonnés, food, sorties & bons plans à Paris).\nJ'adore ce que vous faites et j'aimerais vous proposer une collaboration : je viens découvrir [LIEU/PRODUIT] et je crée un Reel + des stories pour le faire découvrir à ma communauté (20-35 ans, parisiens, très réactifs aux bons plans).\nJe vous envoie mon media kit avec plaisir. Dispo pour en parler ? 🫶" },
  { id: "m2", title: "Veille de l'arrivée", body: "Hello ! 👋\nPetit message pour confirmer ma venue demain [DATE] à [HEURE] chez [LIEU].\nHâte de découvrir tout ça ! Si besoin de me joindre d'ici là : [TÉLÉPHONE].\nÀ demain ! 😊" },
  { id: "m3", title: "Après départ — remerciement", body: "Merci encore pour l'accueil aujourd'hui, c'était top ! 🫶\nJe monte le contenu cette semaine — publication prévue le [DATE]. Je vous envoie le lien dès que c'est en ligne, n'hésitez pas à le repartager en story.\nÀ très vite !" },
  { id: "m4", title: "Demande de concours", body: "Hello [NOM] ! 🎁\nEt si on organisait un concours ensemble ?\nLe principe : vous offrez [LOT], je m'occupe de tout (Reel dédié + mécanique « suivre + commenter + identifier + partager »).\nRésultat : de la visibilité pour vous, de l'engagement pour les deux comptes. Mes derniers concours ont généré [X] commentaires.\nOn en parle ?" },
  { id: "m5", title: "Relance sans réponse", body: "Hello ! 😊\nJe me permets de revenir vers vous suite à mon message du [DATE] — je serais toujours ravie de collaborer avec [NOM].\nJe sais que vous êtes très sollicités : si ce n'est pas le bon moment, dites-le moi simplement.\nBelle journée ! 🫶" },
  { id: "s1", kind: "script", title: "Script Reel — découverte d'un lieu", body: "HOOK (0-3s) : [PHRASE CHOC — ex : « Ce resto à [QUARTIER] ne paie pas de mine, et pourtant… »]\n\nCORPS (3-20s) :\n- Plan d'ambiance du lieu\n- 2-3 plats/moments forts avec prix à l'écran\n- Détail insolite qui fait la différence\n\nCTA (20-30s) : « L'adresse est en commentaire — enregistre pour ta prochaine sortie ! »" },
];

function loadMsgs() {
  try {
    const raw = localStorage.getItem(MSG_KEY);
    if (!raw) return DEFAULT_MSGS;
    const p = JSON.parse(raw);
    if (!Array.isArray(p)) return DEFAULT_MSGS;
    // migration : ajoute le script d'exemple si aucun script n'existe encore
    if (!p.some(x => x.kind === "script")) return [...p, ...DEFAULT_MSGS.filter(x => x.kind === "script")];
    return p;
  } catch (e) { return DEFAULT_MSGS; }
}

function MessagesPage() {
  const [msgs, setMsgs] = useState(loadMsgs);
  useEffect(() => { try { localStorage.setItem(MSG_KEY, JSON.stringify(msgs)); } catch (e) {} }, [msgs]);
  const [copiedId, setCopiedId] = useState(null);
  const [mode, setMode] = useState("message"); // "message" | "script"
  const isScript = mode === "script";
  const shown = msgs.filter(x => (x.kind === "script") === isScript);

  const addMsg = () => setMsgs(m => [{ id: uid(), kind: mode, title: isScript ? "Nouveau script type" : "Nouveau message type", body: "" }, ...m]);
  const removeMsg = (id) => setMsgs(m => m.filter(x => x.id !== id));
  const patchMsg = (id, patch) => setMsgs(m => m.map(x => x.id === id ? { ...x, ...patch } : x));
  const copyMsg = (msg) => {
    copyText(msg.body);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(c => c === msg.id ? null : c), 1800);
  };

  return (
    <div>
      <div style={msgStyles.pageHead}>
        <div>
          <div style={msgStyles.pageTitle} className="display">Modèles</div>
          <div style={msgStyles.pageSub}>Tes messages et scripts prêts à copier — [CROCHETS] à personnaliser</div>
        </div>
        <button style={msgStyles.addBtn} onClick={addMsg}>{isScript ? "+ Nouveau script" : "+ Nouveau message"}</button>
      </div>
      <div style={msgStyles.modeTabs}>
        <button style={{ ...msgStyles.modeTab, ...(mode === "message" ? msgStyles.modeTabOn : {}) }} onClick={() => setMode("message")}>Messages</button>
        <button style={{ ...msgStyles.modeTab, ...(mode === "script" ? msgStyles.modeTabOn : {}) }} onClick={() => setMode("script")}>Scripts</button>
      </div>
      <div className="msg-grid" style={msgStyles.grid}>
        {shown.map(m => (
          <div key={m.id} style={msgStyles.card}>
            <input
              value={m.title}
              onChange={(e) => patchMsg(m.id, { title: e.target.value })}
              style={msgStyles.title}
              className="display"
              placeholder={isScript ? "Titre du script…" : "Titre du message…"} />
            <textarea
              value={m.body}
              onChange={(e) => patchMsg(m.id, { body: e.target.value })}
              placeholder={isScript ? "Rédige ton script type (hook, corps, CTA…)" : "Rédige ton message type…"}
              style={msgStyles.body} />
            <div style={msgStyles.foot}>
              <button style={{ ...msgStyles.copyBtn, ...(copiedId === m.id ? msgStyles.copyBtnDone : {}) }} onClick={() => copyMsg(m)}>
                {copiedId === m.id ? "✓ Copié !" : "Copier"}
              </button>
              <button className="obj-remove-btn" style={msgStyles.remove} onClick={() => { if (confirm(`Supprimer « ${m.title} » ?`)) removeMsg(m.id); }} aria-label="Supprimer" title="Supprimer">
                <Icon.Trash />
              </button>
            </div>
          </div>
        ))}
        {shown.length === 0 && <div style={msgStyles.empty}>{isScript ? "Aucun script type. Crée le premier ↑" : "Aucun message type. Crée le premier ↑"}</div>}
      </div>
    </div>
  );
}

const msgStyles = {
  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 },
  pageTitle: { fontSize: 32, fontWeight: 700, lineHeight: 1.1 },
  pageSub: { color: "var(--muted)", fontSize: 14, marginTop: 4 },
  addBtn: { background: "var(--pink)", border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600, padding: "10px 18px", borderRadius: 11, cursor: "pointer" },
  modeTabs: { display: "flex", gap: 4, padding: 3, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 11, width: "fit-content", marginBottom: 16 },
  modeTab: { background: "transparent", border: "none", color: "var(--muted)", fontSize: 12.5, fontWeight: 700, padding: "7px 20px", borderRadius: 8, cursor: "pointer" },
  modeTabOn: { background: "var(--pink)", color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14, alignItems: "start" },
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 10 },
  title: { background: "transparent", border: "none", borderBottom: "1px dashed transparent", color: "var(--text)", fontSize: 16, fontWeight: 700, padding: "2px 0", outline: "none", width: "100%" },
  body: { width: "100%", boxSizing: "border-box", minHeight: 150, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--text)", fontSize: 13, lineHeight: 1.55, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit" },
  foot: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  copyBtn: { background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--pink)", fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 9, cursor: "pointer", transition: "all 0.15s" },
  copyBtnDone: { background: "var(--green-soft)", border: "1px solid var(--green)", color: "var(--green)" },
  remove: { background: "transparent", border: "1px solid var(--line)", color: "var(--muted)", padding: 6, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  empty: { color: "var(--muted)", fontSize: 14, padding: "24px 0", textAlign: "center", fontStyle: "italic", gridColumn: "1 / -1" },
};

Object.assign(window, { MessagesPage });
