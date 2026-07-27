const { useState, useEffect } = React;

const NAV_PAGES = [
  { id: "objectifs", label: "Objectifs" },
  { id: "strategie", label: "Stratégie" },
  { id: "planning", label: "Planning" },
  { id: "videos", label: "Vidéos" },
  { id: "idees", label: "Idées" },
  { id: "messages", label: "Modèles" },
];

function Shell() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => { document.body.setAttribute("data-theme", t.theme || "dark"); }, [t.theme]);

  // Auto-scroll de la page pendant un glisser-déposer (haut/bas de l'écran)
  useEffect(() => {
    let raf = null, dy = 0;
    const step = () => { if (dy) { window.scrollBy(0, dy); raf = requestAnimationFrame(step); } else raf = null; };
    const onDrag = (e) => {
      const EDGE = 90, MAX = 18;
      if (e.clientY < EDGE) dy = -Math.ceil((EDGE - e.clientY) / EDGE * MAX);
      else if (window.innerHeight - e.clientY < EDGE) dy = Math.ceil((EDGE - (window.innerHeight - e.clientY)) / EDGE * MAX);
      else dy = 0;
      if (dy && !raf) raf = requestAnimationFrame(step);
    };
    const onEnd = () => { dy = 0; };
    document.addEventListener("dragover", onDrag);
    document.addEventListener("drop", onEnd);
    document.addEventListener("dragend", onEnd);
    return () => { document.removeEventListener("dragover", onDrag); document.removeEventListener("drop", onEnd); document.removeEventListener("dragend", onEnd); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const DATA_KEYS = ["miamstrat_v2", "miamstrat_daily_v1", "miamstrat_plan_v1", "miamstrat_msgs_v1", "miamstrat_ideas_v1", "miamstrat_page"];
  const fileRef = React.useRef(null);
  const [importMsg, setImportMsg] = useState(null);
  const [installHelp, setInstallHelp] = useState(false);
  const deferredPromptRef = React.useRef(null);

  useEffect(() => {
    // PWA : service worker + capture du prompt d'installation (Android/Chrome)
    try { if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) {}
    const onPrompt = (e) => { e.preventDefault(); deferredPromptRef.current = e; };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installApp = () => {
    const p = deferredPromptRef.current;
    if (p) { p.prompt(); deferredPromptRef.current = null; }
    else setInstallHelp(true);
  };

  const exportData = () => {
    const payload = { app: "miamstrat", version: 1, exportedAt: new Date().toISOString(), data: {} };
    DATA_KEYS.forEach(k => { try { const v = localStorage.getItem(k); if (v !== null) payload.data[k] = v; } catch (e) {} });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `miamstrat-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    try { localStorage.setItem("miamstrat_lastexport", String(Date.now())); } catch (e) {}
    setExportDue(false);
  };

  // Rappel hebdomadaire d'export
  const [exportDue, setExportDue] = useState(() => {
    try {
      const last = +localStorage.getItem("miamstrat_lastexport") || 0;
      if (!last) { localStorage.setItem("miamstrat_lastexport", String(Date.now())); return false; }
      return Date.now() - last > 7 * 86400000;
    } catch (e) { return false; }
  });
  const snoozeExport = () => {
    try { localStorage.setItem("miamstrat_lastexport", String(Date.now())); } catch (e) {}
    setExportDue(false);
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (!payload || payload.app !== "miamstrat" || !payload.data) throw new Error("format");
        if (!confirm("Importer ces données écrasera ta stratégie, tes objectifs et ton planning actuels. Continuer ?")) return;
        Object.entries(payload.data).forEach(([k, v]) => { if (DATA_KEYS.includes(k)) try { localStorage.setItem(k, v); } catch (e) {} });
        location.reload();
      } catch (e) {
        setImportMsg("Fichier invalide — exporte d'abord depuis une autre instance Miamstrat.");
        setTimeout(() => setImportMsg(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const [page, setPage] = useState(() => {
    try { return localStorage.getItem("miamstrat_page") || "objectifs"; } catch (e) { return "objectifs"; }
  });
  useEffect(() => { try { localStorage.setItem("miamstrat_page", page); } catch (e) {} }, [page]);

  const [strat, setStrat] = useState(loadState);
  useEffect(() => { saveState(strat); }, [strat]);

  // État du planning centralisé ici : une seule source de vérité, partagée entre pages
  const [plan, setPlan] = useState(loadPlan);
  useEffect(() => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); } catch (e) {} }, [plan]);
  const addVideoFromIdea = (title) => { setPlan(p => ({ ...p, videos: [...p.videos, { id: uid(), title, status: "contacter", date: null }] })); return true; };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-root" style={shellStyles.root}>
      <nav className="shell-nav" style={shellStyles.nav}>
        <div style={shellStyles.brand}>
          <div style={shellStyles.avatarWrap}>
            <img src="assets/logo.png" alt="" style={shellStyles.avatar} />
          </div>
          <div>
            <div className="display" style={shellStyles.brandTitle}>Miamstrat</div>
            <div style={shellStyles.brandSub}>@miamcherie</div>
          </div>
        </div>
        <button className="shell-burger" style={shellStyles.burger} onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
          <span style={{ ...shellStyles.burgerBar, ...(menuOpen ? { transform: "translateY(6px) rotate(45deg)" } : {}) }}></span>
          <span style={{ ...shellStyles.burgerBar, ...(menuOpen ? { opacity: 0 } : {}) }}></span>
          <span style={{ ...shellStyles.burgerBar, ...(menuOpen ? { transform: "translateY(-6px) rotate(-45deg)" } : {}) }}></span>
        </button>
        <div className={"shell-tabs" + (menuOpen ? " open" : "")} style={shellStyles.tabs}>
          {NAV_PAGES.map(p => (
            <button key={p.id} className="display" onClick={() => { setPage(p.id); setMenuOpen(false); }}
              style={{ ...shellStyles.tab, ...(page === p.id ? shellStyles.tabActive : {}) }}>
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      {page === "objectifs" && exportDue && (
        <div style={shellStyles.exportReminder}>
          <span style={{ flex: 1, minWidth: 200 }}>💾 Plus d'une semaine sans sauvegarde — pense à exporter tes données !</span>
          <button style={shellStyles.exportNowBtn} onClick={exportData}>Exporter maintenant</button>
          <button style={shellStyles.exportLaterBtn} onClick={snoozeExport} title="Me le rappeler dans une semaine">Plus tard</button>
        </div>
      )}
      {page === "objectifs" && <ObjectifsPage strat={strat} setStrat={setStrat} plan={plan} setPlan={setPlan} tweaks={t} onOpenStrategy={() => setPage("strategie")} />}
      {page === "strategie" && <StrategyPage state={strat} setState={setStrat} />}
      {page === "planning" && <PlanningPage plan={plan} setPlan={setPlan} />}
      {page === "videos" && <VideosPage plan={plan} setPlan={setPlan} />}
      {page === "idees" && <IdeasPage onSendToPlan={addVideoFromIdea} />}
      {page === "messages" && <MessagesPage />}

      <footer style={shellStyles.footer}>
        <span style={{ color: "var(--muted-2)" }}>Sauvegardé automatiquement</span>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--green)", boxShadow: "0 0 8px var(--green)" }}></span>
        <span style={{ color: "var(--line-strong)" }}>·</span>
        <button style={shellStyles.dataBtn} onClick={exportData} title="Télécharger toutes tes données en JSON">Exporter</button>
        <button style={shellStyles.dataBtn} onClick={() => fileRef.current && fileRef.current.click()} title="Restaurer des données exportées depuis une autre instance">Importer</button>
        <button style={shellStyles.dataBtn} onClick={installApp} title="Installer l'app sur ton téléphone ou ton bureau">📱 Raccourci</button>
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ""; }} />
      </footer>
      {importMsg && <div style={shellStyles.importErr}>{importMsg}</div>}

      {installHelp && (
        <div style={shellStyles.installOverlay} onClick={() => setInstallHelp(false)}>
          <div style={shellStyles.installModal} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ajouter un raccourci">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>📱 Ajouter à l'écran d'accueil</div>
              <button style={shellStyles.installClose} onClick={() => setInstallHelp(false)} aria-label="Fermer">×</button>
            </div>
            {window.location.protocol === "file:" && (
              <div style={{ ...shellStyles.installStep, border: "1px solid rgba(255,138,61,0.5)", color: "#ff8a3d" }}>
                ⚠️ Cette page est ouverte depuis un fichier téléchargé : les navigateurs n'autorisent pas l'installation d'app depuis un fichier local. Pour une vraie installation, ouvre la version hébergée en ligne (le projet sur claude.ai) et utilise ce bouton depuis là. Les étapes ci-dessous créent quand même un raccourci vers le fichier quand le navigateur le permet.
              </div>
            )}
            <div style={shellStyles.installStep}><b>iPhone / iPad (Safari)</b><br/>Bouton Partager <span style={{ opacity: 0.7 }}>□↑</span> → « Sur l'écran d'accueil »</div>
            <div style={shellStyles.installStep}><b>Android (Chrome)</b><br/>Menu ⋮ en haut à droite → « Ajouter à l'écran d'accueil »</div>
            <div style={shellStyles.installStep}><b>Ordinateur (Chrome / Edge)</b><br/>Icône d'installation dans la barre d'adresse, ou menu ⋮ → « Installer Miamstrat »</div>
            <div style={{ color: "var(--muted-2)", fontSize: 11.5, marginTop: 10 }}>L'app s'ouvrira en plein écran avec l'icône Miamcherie. Tes données restent locales à cet appareil — pense à Exporter pour les transférer.</div>
          </div>
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Apparence" />
        <TweakRadio label="Thème" value={t.theme} options={["dark", "light"]} onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Mascotte (page Objectifs)" />
        <TweakSelect label="Évolution" value={t.mascotStage} options={["auto", ...Array.from({ length: 20 }, (_, i) => String(i + 1))]} onChange={(v) => setTweak("mascotStage", v)} />
        <TweakSelect label="Émotion" value={t.mascotEmotion} options={["auto", "neutre", "content", "triste", "fete"]} onChange={(v) => setTweak("mascotEmotion", v)} />
        <TweakButton label="Rejouer l'animation d'évolution" onClick={() => { setPage("objectifs"); window.dispatchEvent(new Event("mascot-evolve")); }} />
      </TweaksPanel>
    </div>
  );
}

const shellStyles = {
  root: { position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "26px 28px 80px" },
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 30, flexWrap: "wrap" },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  avatarWrap: {
    width: 46, height: 46, borderRadius: 99, background: "var(--surface-2)",
    border: "1px solid var(--line-strong)", overflow: "hidden", flexShrink: 0,
    boxShadow: "0 0 0 1px var(--pink-soft), 0 0 22px var(--pink-soft)",
  },
  avatar: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  brandTitle: { fontSize: 18, fontWeight: 700, lineHeight: 1.1 },
  brandSub: { fontSize: 11.5, color: "var(--muted)", marginTop: 2 },
  burger: { display: "none", flexDirection: "column", justifyContent: "center", gap: 4, width: 42, height: 42, background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 12, padding: 10, cursor: "pointer", flexShrink: 0 },
  burgerBar: { display: "block", height: 2, borderRadius: 2, background: "var(--text)", transition: "all 0.2s" },
  tabs: {
    display: "flex", flexWrap: "wrap", gap: 4, padding: 4,
    background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 14,
  },
  tab: {
    background: "transparent", border: "none", color: "var(--muted)",
    fontSize: 13.5, fontWeight: 600, padding: "8px 18px", borderRadius: 10,
    cursor: "pointer", transition: "all 0.15s", letterSpacing: "-0.01em",
  },
  tabActive: {
    background: "var(--pink)", color: "#fff",
    boxShadow: "0 2px 12px var(--pink-glow)",
  },
  footer: {
    marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap",
    gap: 8, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
  },
  dataBtn: {
    background: "transparent", border: "1px solid var(--line)", color: "var(--muted)",
    fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
    padding: "4px 10px", borderRadius: 99, cursor: "pointer", transition: "all 0.15s",
  },
  importErr: {
    marginTop: 10, textAlign: "center", color: "#ff6b6b", fontSize: 12,
  },
  exportReminder: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14, padding: "11px 16px", background: "var(--gold-soft)", border: "1px solid var(--gold)", borderRadius: 12, color: "var(--gold)", fontSize: 13.5, fontWeight: 600 },
  exportNowBtn: { background: "var(--gold)", border: "none", color: "#1a1405", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 9, cursor: "pointer", flexShrink: 0 },
  exportLaterBtn: { background: "transparent", border: "none", color: "var(--gold)", fontSize: 12, textDecoration: "underline", cursor: "pointer", padding: "4px 2px", flexShrink: 0 },
  installOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 },
  installModal: { width: "min(420px, 100%)", background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 18, padding: "20px 22px", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" },
  installClose: { width: 30, height: 30, borderRadius: 9, background: "var(--surface-2)", border: "1px solid var(--line-strong)", color: "var(--text)", fontSize: 16, cursor: "pointer", lineHeight: 1 },
  installStep: { padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 11, fontSize: 13, lineHeight: 1.5, color: "var(--text)", marginBottom: 7 },
};

// shell + pages responsive css
const shellStyleEl = document.createElement("style");
shellStyleEl.textContent = `
  @media (max-width: 900px) {
    .op-grid { grid-template-columns: 1fr !important; }
    .plan-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 640px) {
    .op-stats { grid-template-columns: 1fr !important; }
    .shell-nav { flex-wrap: wrap !important; justify-content: space-between !important; gap: 10px !important; }
    .shell-burger { display: flex !important; }
    .shell-tabs { display: none !important; }
    .shell-tabs.open { display: flex !important; flex-direction: column !important; width: 100% !important; flex-basis: 100% !important; order: 10; margin-top: 10px; }
    .shell-tabs.open button { padding: 12px 10px !important; font-size: 14.5px !important; text-align: left !important; }
  }
`;
document.head.appendChild(shellStyleEl);

ReactDOM.createRoot(document.getElementById("root")).render(<Shell />);
