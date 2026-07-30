const { useState, useEffect, useMemo, useRef } = React;

// ============================================================
//   DEFAULT DATA — stratégie complète @miamcherie
// ============================================================
const DEFAULT_TIERS = [
  {
    id: "5k",
    target: 5000,
    label: "5K",
    name: "L'amorçage",
    tagline: "Clarté éditoriale avant tout — pas de revenus à ce stade.",
    rewardMin: 0,
    rewardMax: 0,
    objectives: [
      { id: "5k-1", text: "Verrouiller la ligne édito : 3 piliers max (resto / sortie / bon plan)", done: true },
      { id: "5k-2", text: "Trouver le ton signature (tutoiement, emojis 🎁📍, CTA explicite)", done: true },
      { id: "5k-3", text: "Établir un rythme tenable : 3 Reels par semaine minimum", done: true },
      { id: "5k-4", text: "Géolocaliser systématiquement chaque post (gros levier de découverte)", done: true },
    ],
  },
  {
    id: "10k",
    target: 10000,
    label: "10K",
    name: "Le seuil de crédibilité",
    tagline: "Passer de « compte perso » à « créatrice identifiée » par les marques.",
    rewardMin: 0,
    rewardMax: 0,
    objectives: [
      { id: "10k-1", text: "Premières invitations en collab non rémunérée (resto, expo) — tester le volume", done: true },
      { id: "10k-2", text: "Créer 2-3 formats récurrents reconnaissables (« Le burger du mois », « Sortie insolite »)", done: true },
      { id: "10k-3", text: "Optimiser le profil : bio claire, highlights thématiques, lien Beacons/Linktree", done: true },
      { id: "10k-4", text: "Atteindre un taux d'engagement >5% sur Reels (benchmark micro-influence FR)", done: true },
      { id: "10k-5", text: "Construire un fichier Notion de suivi des collabs (date, marque, prestation, valorisation)", done: true },
    ],
  },
  {
    id: "15k",
    target: 15000,
    label: "15K",
    name: "La légitimité",
    tagline: "Premier vrai cap monétisable. Les marques te démarchent au lieu de l'inverse.",
    rewardMin: 0,
    rewardMax: 0,
    objectives: [
      { id: "15k-1", text: "Construire un media kit PDF (audience, engagement, exemples de collabs, tarifs indicatifs)", done: true },
      { id: "15k-2", text: "S'inscrire sur 2-3 plateformes d'influence FR (Reech, Kolsquare, Hivency, Brandsmeetcreators)", done: true },
      { id: "15k-3", text: "Mettre en place la mécanique concours (1 par mois avec marque partenaire)", done: true },
      { id: "15k-4", text: "Filtrer les invitations : refuser ce qui dévalorise (mauvais resto, marque off-brand)", done: true },
      { id: "15k-5", text: "Premiers honoraires : 100-200€ par Reel sponsorisé", done: true },
    ],
  },
  // ─── à partir d'ici : monétisation, revenus mensuels ───
  {
    id: "20k",
    target: 20000,
    label: "20K",
    name: "Premier salaire",
    tagline: "L'addition des leviers doit couvrir un salaire d'appoint. Chaque objectif = un flux.",
    rewardMin: 1500,
    rewardMax: 2000,
    objectives: [
      { id: "20k-1", text: "Grille tarifaire publique : Reel 300-500€ / Post 200-300€ / Story 100-150€ / Pack 600-800€", done: false },
      { id: "20k-2", text: "Affiliation activée : GetYourGuide, Fever, Booking, TheFork — cible 200-400€/mois passifs", done: false },
      { id: "20k-3", text: "Signer 2 contrats récurrents (3-6 mois) avec restos ou hôtels parisiens", done: false },
      { id: "20k-4", text: "Lancer l'UGC : créer du contenu pour marques sans diffuser (300-600€/livraison)", done: false },
      { id: "20k-5", text: "Démarchage actif : 5 propositions sortantes / semaine (cold DM + email pro)", done: false },
    ],
  },
  {
    id: "25k",
    target: 25000,
    label: "25K",
    name: "Diversification",
    tagline: "Arrêter de dépendre uniquement des marques — créer tes propres actifs.",
    rewardMin: 3000,
    rewardMax: 4000,
    objectives: [
      { id: "25k-1", text: "Premier produit digital : guide PDF « 50 meilleurs restos pas chers à Paris » (15-25€)", done: false },
      { id: "25k-2", text: "Carte Notion / Google Maps premium : abonnement 3€/mois aux adresses à jour", done: false },
      { id: "25k-3", text: "Augmenter la grille : Reel 500-700€, contrats annuels à 5-8K€", done: false },
      { id: "25k-4", text: "Devenir affiliée officielle (Fever Creator Program, GetYourGuide Partner)", done: false },
      { id: "25k-5", text: "Cross-poster sur TikTok : même contenu, audience différente, Creator Fund + collabs", done: false },
    ],
  },
  {
    id: "30k",
    target: 30000,
    label: "30K",
    name: "Activité principale",
    tagline: "À 30K, c'est ton métier. Structuration administrative obligatoire.",
    rewardMin: 5000,
    rewardMax: 6000,
    objectives: [
      { id: "30k-1", text: "Statut juridique : micro-entreprise ou EURL selon CA (consulter expert-comptable)", done: false },
      { id: "30k-2", text: "Contrat d'ambassadrice : signer 1 marque en engagement 6-12 mois (10-20K€)", done: false },
      { id: "30k-3", text: "Boutique digitale (Stan Store, Beacons Premium, Shopify) : centraliser guide + carte", done: false },
      { id: "30k-4", text: "Tarification haute : Reel 700-1000€, packages à 1 500€+", done: false },
      { id: "30k-5", text: "Newsletter premium (Substack, Kessel) : 5€/mois, viser 100 abonnés = 500€/mois récurrent", done: false },
    ],
  },
  {
    id: "40k",
    target: 40000,
    label: "40K",
    name: "Effet de levier",
    tagline: "L'audience devient un asset monétisé par paquets, pas à l'unité.",
    rewardMin: 7000,
    rewardMax: 9000,
    objectives: [
      { id: "40k-1", text: "Format « Tour gastronomique » : visites guidées Paris (10 pers × 35€ × 2/sem = 2 800€/mois)", done: false },
      { id: "40k-2", text: "Masterclass / formation : « Monétiser un compte food Paris » (149-299€)", done: false },
      { id: "40k-3", text: "Sous-traiter l'opérationnel : 1 freelance montage + 1 prospection commerciale", done: false },
      { id: "40k-4", text: "Partenariats events : co-organiser 1 événement annuel avec 3-5 marques (5-10K€)", done: false },
      { id: "40k-5", text: "Tarification : Reel 1000-1500€, pack annuel marque 25-40K€", done: false },
    ],
  },
  {
    id: "50k",
    target: 50000,
    label: "50K",
    name: "Studio personnel",
    tagline: "Tu n'es plus une créatrice, tu es une marque média.",
    rewardMin: 10000,
    rewardMax: 15000,
    objectives: [
      { id: "50k-1", text: "Marque propre : lancer un produit physique en marque blanche (sauce, granola, merch)", done: false },
      { id: "50k-2", text: "Recruter une assistante éditoriale (~2K€/mois) pour doubler la cadence", done: false },
      { id: "50k-3", text: "Contrats d'image : 2-3 grandes marques en exclusivité sectorielle (15-25K€/an chacune)", done: false },
      { id: "50k-4", text: "Spin-off de compte : @miamcherie_voyage ou @miamcherie_bonsplans", done: false },
      { id: "50k-5", text: "Tarification : Reel 1500-2000€, package 360° (story+post+reel+blog) 3-5K€", done: false },
    ],
  },
];

const HORIZON = [
  { label: "75K", title: "Agent / agence", text: "Signer avec Wymi, Follow ou Influence4You (commission 15-25%) — ils débloquent les gros budgets : Galeries Lafayette, Carrefour, BNP." },
  { label: "100K", title: "Multi-canal", text: "Lancer un podcast food/Paris, publier un livre chez Marabout / Solar / Hachette Pratique, ouvrir les passerelles TV et presse." },
  { label: "150K+", title: "Empire", text: "Passer en SAS, embaucher des salariés, envisager une revente partielle du compte ou un fonds de commerce digital (multiplicateur ×2-4 du revenu annuel)." },
];

const RULES = [
  { num: "01", title: "Tracker chaque euro", text: "Revenus par source dans un Notion mensuel. Sans data, pas de scaling." },
  { num: "02", title: "Refuser ≥ Accepter", text: "À partir de 20K, le pouvoir de dire non est ton meilleur levier de prix." },
  { num: "03", title: "Réinvestir 20%", text: "Matos (micro Rode, ring light, trépied), formations, freelances." },
  { num: "04", title: "Audit trimestriel", text: "Engagement, croissance nette, CA, top 5 Reels → ajuster la stratégie." },
  { num: "05", title: "Diversifier les plateformes", text: "Dès 25K, ouvrir TikTok / YouTube Shorts pour ne plus dépendre d'un seul algo." },
];

const DEFAULT_STATE = {
  handle: "@miamcherie",
  followers: 16000,
  tiers: DEFAULT_TIERS,
};

const STORAGE_KEY = "miamstrat_v2";

// ============================================================
//   PERSISTENCE
// ============================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tiers)) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...parsed };
  } catch (e) {
    return DEFAULT_STATE;
  }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

// ============================================================
//   HELPERS
// ============================================================
function formatK(n) {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1).replace(".", ",")}K`;
  }
  return String(n);
}
function formatEUR(n) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function formatRange(min, max) {
  if (!min && !max) return null;
  if (min === max) return formatEUR(min);
  return `${formatEUR(min)} – ${formatEUR(max)}`;
}
function tierStatus(tier, followers) {
  const allDone = tier.objectives.length > 0 && tier.objectives.every(o => o.done);
  if (followers >= tier.target && allDone) return "complete";
  if (followers >= tier.target) return "reached";
  return "locked";
}
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
// Copie robuste : API clipboard (peut échouer en iframe) puis fallback execCommand
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

// ============================================================
//   ICONS
// ============================================================
const Icon = {
  Check: (p) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Plus: (p) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  Trash: (p) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}><path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Lock: (p) => (<svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4"/></svg>),
  Coin: (p) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6.5C6 5.7 6.7 5 8 5s2 .7 2 1.5S9.3 8 8 8s-2 .7-2 1.5S6.7 11 8 11s2-.7 2-1.5M8 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  Edit: (p) => (<svg width="12" height="12" viewBox="0 0 16 16" fill="none" {...p}><path d="M11 2.5l2.5 2.5M3 13l1-3 7-7 3 3-7 7-3 1z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  Telescope: (p) => (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" {...p}><path d="M2 9l8-5 3 5-8 5z M5 13.5l2-1M9 13.5l-2-1M7 12.5V15" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>),
};

// ============================================================
//   APP
// ============================================================
function StrategyPage({ state, setState }) {
  const [selectedId, setSelectedId] = useState(() => {
    const next = state.tiers.find(t => t.target > state.followers) || state.tiers.find(t => t.objectives.some(o => !o.done));
    return next ? next.id : state.tiers[0].id;
  });
  const [editingFollowers, setEditingFollowers] = useState(false);

  const tiers = state.tiers;
  const followers = state.followers;
  const selectedTier = tiers.find(t => t.id === selectedId) || tiers[0];
  const selectedIdx = tiers.findIndex(t => t.id === selectedId);

  const nextTier = tiers.find(t => t.target > followers);
  const prevReached = [...tiers].reverse().find(t => t.target <= followers);
  const progressPct = useMemo(() => {
    if (!nextTier) return 100;
    const from = prevReached ? prevReached.target : 0;
    const span = nextTier.target - from;
    const pos = followers - from;
    return Math.max(0, Math.min(100, (pos / span) * 100));
  }, [followers, nextTier, prevReached]);

  // Highest completed monetizable tier = current monthly revenue ceiling
  const currentRevenue = useMemo(() => {
    const completed = tiers.filter(t => t.rewardMax > 0 && t.objectives.length > 0 && t.objectives.every(o => o.done));
    if (completed.length === 0) return { min: 0, max: 0 };
    const top = completed[completed.length - 1];
    return { min: top.rewardMin, max: top.rewardMax };
  }, [tiers]);

  const targetRevenue = useMemo(() => {
    const last = [...tiers].reverse().find(t => t.rewardMax > 0);
    return last ? { min: last.rewardMin, max: last.rewardMax } : { min: 0, max: 0 };
  }, [tiers]);

  // mutations
  const updateTier = (tierId, fn) => setState(s => ({ ...s, tiers: s.tiers.map(t => t.id === tierId ? fn(t) : t) }));
  const toggleObj = (tierId, objId) => updateTier(tierId, t => ({ ...t, objectives: t.objectives.map(o => o.id === objId ? { ...o, done: !o.done } : o) }));
  const addObj = (tierId, text) => { if (!text.trim()) return; updateTier(tierId, t => ({ ...t, objectives: [...t.objectives, { id: uid(), text: text.trim(), done: false }] })); };
  const removeObj = (tierId, objId) => updateTier(tierId, t => ({ ...t, objectives: t.objectives.filter(o => o.id !== objId) }));
  const editObj = (tierId, objId, text) => updateTier(tierId, t => ({ ...t, objectives: t.objectives.map(o => o.id === objId ? { ...o, text } : o) }));
  const moveObj = (tierId, from, to) => {
    if (from == null || to == null || from === to) return;
    updateTier(tierId, t => { const a = [...t.objectives]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return { ...t, objectives: a }; });
  };
  const setRewardRange = (tierId, min, max) => updateTier(tierId, t => ({ ...t, rewardMin: min, rewardMax: max }));
  const setFollowers = (n) => setState(s => ({ ...s, followers: Math.max(0, Math.floor(n)) }));
  const resetAll = () => {
    if (confirm("Réinitialiser toute la stratégie ? Tu perdras tes objectifs personnalisés.")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(DEFAULT_STATE);
      setSelectedId("20k");
    }
  };

  return (
    <div>
      <Header
        handle={state.handle}
        followers={followers}
        editingFollowers={editingFollowers}
        setEditingFollowers={setEditingFollowers}
        setFollowers={setFollowers}
        currentRevenue={currentRevenue}
        targetRevenue={targetRevenue}
        nextTier={nextTier}
        progressPct={progressPct}
        prevReached={prevReached}
        onReset={resetAll}
      />

      <QuestPath
        tiers={tiers}
        followers={followers}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <TierDetail
        key={selectedTier.id}
        tier={selectedTier}
        index={selectedIdx}
        followers={followers}
        onToggleObj={(oid) => toggleObj(selectedTier.id, oid)}
        onAddObj={(text) => addObj(selectedTier.id, text)}
        onRemoveObj={(oid) => removeObj(selectedTier.id, oid)}
        onEditObj={(oid, text) => editObj(selectedTier.id, oid, text)}
        onMoveObj={(from, to) => moveObj(selectedTier.id, from, to)}
        onSetRewardRange={(min, max) => setRewardRange(selectedTier.id, min, max)}
      />

      <BrandStrategyPanel strat={state} />
      <HorizonPanel />
      <RulesPanel />
    </div>
  );
}

// ============================================================
//   HEADER
// ============================================================
function Header({ handle, followers, editingFollowers, setEditingFollowers, setFollowers, currentRevenue, targetRevenue, nextTier, progressPct, prevReached, onReset }) {
  return (
    <header className="header" style={headerStyles.root}>
      <div className="h-top" style={headerStyles.topRow}>
        <div className="h-brand" style={headerStyles.brand}>
          <div>
            <div style={headerStyles.brandTitle} className="display">Stratégie</div>
            <div style={headerStyles.brandHandle}>{handle} · Roadmap de croissance</div>
          </div>
        </div>
        <div className="h-earned" style={headerStyles.earned}>
          <div style={{ color: "var(--muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Revenu mensuel débloqué</div>
          <div style={headerStyles.earnedAmount} className="display">
            {currentRevenue.max > 0 ? (
              <span style={{ color: "var(--gold)" }}>{formatRange(currentRevenue.min, currentRevenue.max)}</span>
            ) : (
              <span style={{ color: "var(--muted-2)" }}>—</span>
            )}
            <span style={{ color: "var(--muted-2)", fontSize: 13, fontWeight: 500 }}>/mois</span>
          </div>
          <div style={{ color: "var(--muted-2)", fontSize: 11, marginTop: 2 }}>
            cible long-terme · {formatRange(targetRevenue.min, targetRevenue.max)}
          </div>
          <button onClick={onReset} style={headerStyles.resetBtn} title="Tout réinitialiser">reset</button>
        </div>
      </div>

      <div className="h-hero" style={headerStyles.heroRow}>
        <div className="h-follower" style={headerStyles.followerBlock}>
          <div style={{ color: "var(--muted)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Abonnés actuels
          </div>
          {editingFollowers ? (
            <input
              autoFocus
              type="number"
              defaultValue={followers}
              onBlur={(e) => { setFollowers(+e.target.value); setEditingFollowers(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setFollowers(+e.target.value); setEditingFollowers(false); } }}
              style={headerStyles.followerInput}
              className="display"
            />
          ) : (
            <button style={headerStyles.followerNumber} className="display follower-number" onClick={() => setEditingFollowers(true)} title="Cliquer pour modifier">
              {formatK(followers)}
              <span style={headerStyles.editHint}><Icon.Edit /></span>
            </button>
          )}
        </div>

        <div className="h-progress" style={headerStyles.progressBlock}>
          <div style={headerStyles.progressLabels}>
            <span style={{ color: "var(--muted)" }}>
              {prevReached ? `Depuis ${prevReached.label}` : "Depuis 0"}
            </span>
            {nextTier ? (
              <span style={{ color: "var(--pink)", fontWeight: 600 }}>
                Prochain palier · {nextTier.label} {nextTier.name}
              </span>
            ) : (
              <span style={{ color: "var(--gold)", fontWeight: 600 }}>Tous les paliers déverrouillés 🏆</span>
            )}
          </div>
          <div style={headerStyles.progressTrack}>
            <div style={{ ...headerStyles.progressFill, width: `${progressPct}%` }}></div>
            <div style={{ ...headerStyles.progressMarker, left: `${progressPct}%` }}></div>
          </div>
          <div style={headerStyles.progressFooter}>
            <span className="mono" style={{ color: "var(--muted)" }}>{progressPct.toFixed(0)}%</span>
            {nextTier && <span className="mono" style={{ color: "var(--muted)" }}>{formatK(nextTier.target - followers)} restants</span>}
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
//   QUEST PATH
// ============================================================
function QuestPath({ tiers, followers, selectedId, onSelect }) {
  const scrollerRef = useRef(null);
  useEffect(() => {
    const el = scrollerRef.current?.querySelector(`[data-tier="${selectedId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  return (
    <section style={pathStyles.root}>
      <div style={pathStyles.header}>
        <h2 style={pathStyles.title} className="display">Parcours</h2>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          {tiers.filter(t => tierStatus(t, followers) === "complete").length}/{tiers.length} paliers complétés
        </span>
      </div>

      <div style={pathStyles.scrollerWrap}>
        <div style={pathStyles.scroller} ref={scrollerRef}>
          {tiers.map((tier, i) => {
            const status = tierStatus(tier, followers);
            const isSelected = tier.id === selectedId;
            const isCurrent = !!(tier.target > followers && (i === 0 || tiers[i-1].target <= followers));
            const doneCount = tier.objectives.filter(o => o.done).length;
            const total = tier.objectives.length;
            return (
              <React.Fragment key={tier.id}>
                <button
                  data-tier={tier.id}
                  onClick={() => onSelect(tier.id)}
                  style={{ ...pathStyles.node, ...(isSelected ? pathStyles.nodeSelected : {}) }}
                >
                  <div style={{
                    ...pathStyles.nodeCircle,
                    ...(status === "complete" ? pathStyles.nodeCircleComplete : {}),
                    ...(status === "reached" ? pathStyles.nodeCircleReached : {}),
                    ...(status === "locked" ? pathStyles.nodeCircleLocked : {}),
                    ...(isCurrent ? pathStyles.nodeCircleCurrent : {}),
                  }}>
                    {status === "complete" && <Icon.Check style={{ color: "var(--check-fg)" }} />}
                    {status === "reached" && <span className="display" style={{ fontSize: 11, fontWeight: 700, color: "var(--pink)" }}>{doneCount}/{total}</span>}
                    {status === "locked" && <Icon.Lock style={{ color: "var(--muted-2)" }} />}
                  </div>
                  <div style={pathStyles.nodeLabel} className="display">{tier.label}</div>
                  <div style={pathStyles.nodeName}>{tier.name}</div>
                  {tier.rewardMax > 0 && (
                    <div style={{
                      ...pathStyles.nodeReward,
                      ...(status === "complete" ? { color: "var(--gold)", background: "var(--gold-soft)" } : {}),
                    }}>
                      <Icon.Coin /> {formatEUR(tier.rewardMin)}–{formatEUR(tier.rewardMax).replace(/\s?€/, "")}/mois
                    </div>
                  )}
                </button>
                {i < tiers.length - 1 && (
                  <div style={{
                    ...pathStyles.connector,
                    ...(tier.target <= followers ? pathStyles.connectorActive : {}),
                  }}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
//   TIER DETAIL
// ============================================================
function TierDetail({ tier, index, followers, onToggleObj, onAddObj, onRemoveObj, onEditObj, onMoveObj, onSetRewardRange }) {
  const [newText, setNewText] = useState("");
  const [editingReward, setEditingReward] = useState(false);
  const dragIdxRef = useRef(null);
  const status = tierStatus(tier, followers);
  const doneCount = tier.objectives.filter(o => o.done).length;
  const total = tier.objectives.length;
  const allDone = total > 0 && doneCount === total;
  const objProgress = total > 0 ? (doneCount / total) * 100 : 0;
  const isMonetizable = tier.rewardMax > 0;

  const handleAdd = () => {
    if (newText.trim()) { onAddObj(newText); setNewText(""); }
  };

  return (
    <section style={detailStyles.root}>
      <div className="detail-card" style={detailStyles.card}>
        {/* HEADER */}
        <div className="detail-header" style={detailStyles.cardHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={detailStyles.eyebrow}>
              <span className="mono">Palier #{String(index + 1).padStart(2, "0")}</span>
              <StatusBadge status={status} />
            </div>
            <h1 className="tier-title display" style={detailStyles.tierTitle}>
              <span style={{ color: "var(--pink)" }}>{tier.label}</span>{" "}
              <span>· {tier.name}</span>
            </h1>
            <div style={detailStyles.tagline}>{tier.tagline}</div>
          </div>

          {isMonetizable && (
            <div className="reward-card" style={{
              ...detailStyles.rewardCard,
              ...(allDone ? detailStyles.rewardCardActive : {}),
            }}>
              <div style={detailStyles.rewardLabel}>
                <Icon.Coin /> {allDone ? "Revenu débloqué" : "Revenu cible"}
              </div>
              {editingReward ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    autoFocus
                    type="number"
                    defaultValue={tier.rewardMin}
                    onBlur={(e) => { const v = +e.target.value; onSetRewardRange(v, tier.rewardMax); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    style={{ ...detailStyles.rewardInput, width: 70 }}
                    className="display"
                  />
                  <span style={{ color: "var(--gold)", fontWeight: 700 }}>–</span>
                  <input
                    type="number"
                    defaultValue={tier.rewardMax}
                    onBlur={(e) => { const v = +e.target.value; onSetRewardRange(tier.rewardMin, v); setEditingReward(false); }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                    style={{ ...detailStyles.rewardInput, width: 70 }}
                    className="display"
                  />
                </div>
              ) : (
                <button
                  className="display"
                  style={detailStyles.rewardAmount}
                  onClick={() => setEditingReward(true)}
                  title="Modifier la fourchette"
                >
                  {formatEUR(tier.rewardMin)}<span style={{ color: "var(--muted-2)" }}>–</span>{formatEUR(tier.rewardMax)}
                  <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>/mois</span>
                </button>
              )}
              <div style={detailStyles.rewardSub}>
                {allDone ? "Tous les objectifs validés 🎉" : `${total - doneCount} objectif${total - doneCount > 1 ? "s" : ""} pour débloquer`}
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS */}
        <div className="obj-header" style={detailStyles.objHeader}>
          <div style={detailStyles.objCount}>
            <span className="display" style={{ fontSize: 28, fontWeight: 700, color: allDone ? "var(--green)" : "var(--text)" }}>
              {doneCount}
            </span>
            <span style={{ color: "var(--muted-2)", fontSize: 18 }}>/ {total}</span>
            <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>objectifs validés</span>
          </div>
          <div style={detailStyles.objBarTrack}>
            <div style={{
              ...detailStyles.objBarFill,
              width: `${objProgress}%`,
              background: allDone ? "var(--green)" : "linear-gradient(90deg, var(--pink), var(--pink-2))",
              boxShadow: allDone ? "0 0 14px var(--green)" : "0 0 14px var(--pink-glow)",
            }}></div>
          </div>
        </div>

        {/* OBJECTIVES */}
        <ul style={detailStyles.objList}>
          {tier.objectives.map((obj, i) => (
            <ObjectiveRow
              key={obj.id}
              obj={obj}
              index={i}
              isMoney={isMonetizable}
              onToggle={() => onToggleObj(obj.id)}
              onRemove={() => onRemoveObj(obj.id)}
              onEdit={(text) => onEditObj(obj.id, text)}
              onDragStartRow={() => { dragIdxRef.current = i; }}
              onDropRow={() => { onMoveObj(dragIdxRef.current, i); dragIdxRef.current = null; }}
            />
          ))}
          {tier.objectives.length === 0 && (
            <li style={detailStyles.empty}>Aucun objectif pour ce palier. Ajoute le premier ↓</li>
          )}
        </ul>

        {/* ADD ROW */}
        <div style={detailStyles.addRow}>
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Ajouter un objectif…"
            style={detailStyles.addInput}
          />
          <button style={detailStyles.addBtn} onClick={handleAdd} disabled={!newText.trim()}>
            <Icon.Plus /> Ajouter
          </button>
        </div>
      </div>
    </section>
  );
}

function ObjectiveRow({ obj, index, isMoney, onToggle, onRemove, onEdit, onDragStartRow, onDropRow }) {
  const [isEditing, setEditing] = useState(false);

  return (
    <li
      className="obj-row"
      draggable={!isEditing}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", obj.id); onDragStartRow(); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDropRow(); }}
      style={{ ...detailStyles.objRow, ...(obj.done ? detailStyles.objRowDone : {}) }}
    >
      <span style={detailStyles.grip} title="Glisser pour réorganiser">⋮⋮</span>
      <button
        style={{ ...detailStyles.checkbox, ...(obj.done ? detailStyles.checkboxDone : {}) }}
        onClick={onToggle}
        aria-label={obj.done ? "Marquer comme à faire" : "Marquer comme validé"}
      >
        {obj.done && <Icon.Check />}
      </button>

      <div style={detailStyles.objIndex} className="mono">
        {isMoney ? <Icon.Coin style={{ color: obj.done ? "var(--green)" : "var(--gold)" }} /> : String(index + 1).padStart(2, "0")}
      </div>

      {isEditing ? (
        <input
          autoFocus
          defaultValue={obj.text}
          onBlur={(e) => { onEdit(e.target.value); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onEdit(e.target.value); setEditing(false); } }}
          style={detailStyles.objEditInput}
        />
      ) : (
        <button
          style={{ ...detailStyles.objText, ...(obj.done ? detailStyles.objTextDone : {}) }}
          onClick={() => setEditing(true)}
          title="Cliquer pour modifier"
        >
          {obj.text}
        </button>
      )}

      <button
        className="obj-remove-btn"
        style={detailStyles.objRemove}
        onClick={onRemove}
        aria-label="Supprimer l'objectif"
        title="Supprimer"
      >
        <Icon.Trash />
      </button>
    </li>
  );
}

function StatusBadge({ status }) {
  const map = {
    complete: { label: "Complété", color: "var(--green)", bg: "var(--green-soft)" },
    reached:  { label: "Atteint · à finaliser", color: "var(--pink)", bg: "var(--pink-soft)" },
    locked:   { label: "À débloquer", color: "var(--muted)", bg: "rgba(255,255,255,0.05)" },
  };
  const m = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px", borderRadius: 99,
      background: m.bg, color: m.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: m.color }}></span>
      {m.label}
    </span>
  );
}

// ============================================================
//   HORIZON PANEL
// ============================================================
function HorizonPanel() {
  return (
    <section style={horizonStyles.root}>
      <div style={horizonStyles.header}>
        <div style={horizonStyles.titleWrap}>
          <Icon.Telescope style={{ color: "var(--muted)" }} />
          <h2 style={horizonStyles.title} className="display">Horizon long</h2>
        </div>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>75K → 150K · à arbitrer selon ton appétence</span>
      </div>
      <div style={horizonStyles.grid}>
        {HORIZON.map(h => (
          <div key={h.label} style={horizonStyles.card}>
            <div style={horizonStyles.cardLabel} className="display">{h.label}</div>
            <div style={horizonStyles.cardTitle}>{h.title}</div>
            <div style={horizonStyles.cardText}>{h.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
//   RULES PANEL
// ============================================================
function RulesPanel() {
  return (
    <section style={rulesStyles.root}>
      <div style={rulesStyles.header}>
        <h2 style={rulesStyles.title} className="display">Règles transverses</h2>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Valables à tous les paliers</span>
      </div>
      <div style={rulesStyles.grid}>
        {RULES.map(r => (
          <div key={r.num} style={rulesStyles.card}>
            <div style={rulesStyles.num} className="mono">{r.num}</div>
            <div style={rulesStyles.cardTitle}>{r.title}</div>
            <div style={rulesStyles.cardText}>{r.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
//   STYLES
// ============================================================
const appStyles = {
  root: { position: "relative", zIndex: 1, maxWidth: 1180, margin: "0 auto", padding: "32px 28px 80px" },
  footer: {
    marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
  },
};

const headerStyles = {
  root: { marginBottom: 36 },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 },
  brand: { display: "flex", alignItems: "center", gap: 14 },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 99,
    background: "var(--surface-2)", border: "1px solid var(--line-strong)",
    overflow: "hidden", flexShrink: 0,
    boxShadow: "0 0 0 1px rgba(255,61,146,0.2), 0 0 25px rgba(255,61,146,0.18)",
  },
  avatar: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  brandTitle: { fontSize: 20, fontWeight: 700, lineHeight: 1.1 },
  brandHandle: { fontSize: 12, color: "var(--muted)", marginTop: 3, letterSpacing: "0.02em" },
  earned: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  earnedAmount: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", display: "flex", alignItems: "baseline", gap: 4 },
  resetBtn: {
    marginTop: 6, background: "transparent", border: "1px solid var(--line)", color: "var(--muted-2)",
    fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
    padding: "4px 10px", borderRadius: 99, transition: "all 0.15s",
  },
  heroRow: {
    display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "stretch",
    background: "linear-gradient(135deg, rgba(255,61,146,0.05), rgba(255,61,146,0.01) 40%, transparent)",
    border: "1px solid var(--line-strong)", borderRadius: 24, padding: "26px 28px",
    position: "relative", overflow: "hidden",
  },
  followerBlock: { display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid var(--line)", paddingRight: 28 },
  followerNumber: {
    background: "transparent", border: "none", color: "var(--text)", fontSize: 56, fontWeight: 700,
    lineHeight: 1, padding: 0, display: "flex", alignItems: "center", gap: 10, letterSpacing: "-0.03em",
  },
  followerInput: {
    background: "var(--surface)", border: "1px solid var(--pink)", borderRadius: 12,
    color: "var(--text)", fontSize: 48, fontWeight: 700, padding: "4px 12px", width: 200,
    outline: "none", letterSpacing: "-0.03em",
  },
  editHint: { color: "var(--muted-2)", display: "inline-flex" },
  progressBlock: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 10, minWidth: 0 },
  progressLabels: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 },
  progressTrack: {
    position: "relative", height: 10, background: "var(--surface-2)", borderRadius: 99,
    overflow: "visible", border: "1px solid var(--line)",
  },
  progressFill: {
    height: "100%", background: "linear-gradient(90deg, var(--pink), var(--pink-2))",
    borderRadius: 99, boxShadow: "0 0 14px var(--pink-glow)", transition: "width 0.4s ease",
  },
  progressMarker: {
    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
    width: 16, height: 16, borderRadius: 99, background: "#fff", border: "3px solid var(--pink)",
    boxShadow: "0 0 0 4px rgba(255,61,146,0.18), 0 0 14px var(--pink-glow)", transition: "left 0.4s ease",
  },
  progressFooter: { display: "flex", justifyContent: "space-between", fontSize: 11 },
};

const pathStyles = {
  root: { marginBottom: 28 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, padding: "0 4px" },
  title: { fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 },
  scrollerWrap: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 20, padding: "20px 4px", overflow: "hidden" },
  scroller: { display: "flex", alignItems: "flex-start", overflowX: "auto", overflowY: "visible", padding: "8px 20px 12px", gap: 0, scrollbarWidth: "thin" },
  node: {
    flex: "0 0 auto", minWidth: 130, background: "transparent", border: "none",
    padding: "8px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    cursor: "pointer", borderRadius: 14, transition: "background 0.15s",
  },
  nodeSelected: { background: "rgba(255,61,146,0.06)" },
  nodeCircle: {
    width: 48, height: 48, borderRadius: 99,
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid var(--line-strong)", background: "var(--surface-2)", transition: "all 0.2s",
  },
  nodeCircleComplete: { background: "var(--pink)", border: "2px solid var(--pink)", boxShadow: "0 0 18px var(--pink-glow)" },
  nodeCircleReached: { background: "var(--pink-soft)", border: "2px solid var(--pink)" },
  nodeCircleLocked: { background: "var(--surface-2)", border: "2px dashed rgba(255,255,255,0.12)" },
  nodeCircleCurrent: { animation: "pulse-glow 2.4s ease-in-out infinite" },
  nodeLabel: { fontSize: 16, fontWeight: 700, color: "var(--text)" },
  nodeName: { fontSize: 11, color: "var(--muted)", marginTop: -4, maxWidth: 120, textAlign: "center" },
  nodeReward: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 7px", background: "rgba(255,200,87,0.06)", color: "var(--gold)",
    borderRadius: 99, fontSize: 10, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap",
  },
  connector: { flex: "0 0 auto", width: 24, height: 2, background: "var(--line)", marginTop: 31, borderRadius: 99 },
  connectorActive: { background: "linear-gradient(90deg, var(--pink), var(--pink-2))", boxShadow: "0 0 8px var(--pink-glow)" },
};

const detailStyles = {
  root: { animation: "slide-up 0.3s ease" },
  card: { background: "var(--surface)", border: "1px solid var(--line-strong)", borderRadius: 24, padding: "32px 32px 28px", position: "relative", overflow: "hidden" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 28, flexWrap: "wrap" },
  eyebrow: { display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 12, letterSpacing: "0.06em", marginBottom: 8 },
  tierTitle: { fontSize: 40, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.05 },
  tagline: { color: "var(--muted)", fontSize: 15, maxWidth: 560, lineHeight: 1.4 },
  rewardCard: {
    background: "linear-gradient(135deg, rgba(255,200,87,0.06), rgba(255,200,87,0.01))",
    border: "1px solid rgba(255,200,87,0.18)", borderRadius: 18, padding: "16px 20px",
    minWidth: 260, flexShrink: 0,
  },
  rewardCardActive: {
    background: "linear-gradient(135deg, rgba(255,200,87,0.18), rgba(255,200,87,0.04))",
    border: "1px solid var(--gold)", boxShadow: "0 0 30px rgba(255,200,87,0.2)",
  },
  rewardLabel: {
    display: "flex", alignItems: "center", gap: 6,
    color: "var(--gold)", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
  },
  rewardAmount: {
    background: "transparent", border: "none", color: "var(--gold)",
    fontSize: 26, fontWeight: 700, padding: 0, letterSpacing: "-0.02em",
    cursor: "pointer", lineHeight: 1.1, display: "flex", alignItems: "baseline", gap: 6,
    textAlign: "left",
  },
  rewardInput: {
    background: "var(--surface-2)", border: "1px solid var(--gold)", borderRadius: 10,
    color: "var(--gold)", fontSize: 18, fontWeight: 700, padding: "4px 8px", outline: "none",
  },
  rewardSub: { color: "var(--muted)", fontSize: 12, marginTop: 8 },
  objHeader: { display: "flex", alignItems: "center", gap: 18, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" },
  objCount: { display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 },
  objBarTrack: { flex: 1, height: 8, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--line)" },
  objBarFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  objList: { listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: 6 },
  empty: { color: "var(--muted)", fontSize: 14, padding: "20px 0", textAlign: "center", fontStyle: "italic" },
  objRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 14px", background: "var(--surface-2)",
    border: "1px solid var(--line)", borderRadius: 12, transition: "all 0.15s", cursor: "grab",
  },
  grip: { color: "var(--muted-2)", fontSize: 11, letterSpacing: "-2px", flexShrink: 0, userSelect: "none" },
  objRowDone: { background: "rgba(91,229,132,0.04)", border: "1px solid rgba(91,229,132,0.12)" },
  checkbox: {
    flexShrink: 0, width: 24, height: 24, borderRadius: 8,
    background: "var(--surface-3)", border: "1.5px solid var(--line-strong)",
    color: "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  },
  checkboxDone: { background: "var(--green)", border: "1.5px solid var(--green)", color: "var(--check-fg)", boxShadow: "0 0 12px rgba(91,229,132,0.4)" },
  objIndex: { flexShrink: 0, color: "var(--muted-2)", fontSize: 11, fontWeight: 500, width: 24, display: "flex", alignItems: "center", justifyContent: "center" },
  objText: {
    flex: 1, background: "transparent", border: "none",
    color: "var(--text)", fontSize: 15, textAlign: "left", padding: "4px 0",
    cursor: "text", fontFamily: "inherit", lineHeight: 1.35,
  },
  objTextDone: { color: "var(--muted)", textDecoration: "line-through", textDecorationColor: "var(--muted-2)", textDecorationThickness: "1px" },
  objEditInput: {
    flex: 1, background: "var(--bg)", border: "1px solid var(--pink)",
    borderRadius: 8, color: "var(--text)", fontSize: 15, padding: "6px 10px", outline: "none",
  },
  objRemove: {
    flexShrink: 0, background: "transparent", border: "1px solid var(--line)", color: "var(--muted)",
    padding: 6, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s", cursor: "pointer",
  },
  addRow: {
    display: "flex", gap: 8, padding: 4,
    background: "var(--surface-2)", border: "1px dashed var(--line-strong)", borderRadius: 12,
  },
  addInput: { flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: 14, padding: "10px 12px", outline: "none" },
  addBtn: {
    background: "var(--pink)", border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
    padding: "8px 16px", borderRadius: 9, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.15s",
  },
};

const horizonStyles = {
  root: { marginTop: 32 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, padding: "0 4px", flexWrap: "wrap", gap: 8 },
  titleWrap: { display: "flex", alignItems: "center", gap: 8 },
  title: { fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
  card: {
    background: "var(--surface)", border: "1px dashed var(--line-strong)",
    borderRadius: 16, padding: "20px 22px",
    position: "relative", overflow: "hidden",
  },
  cardLabel: { fontSize: 24, fontWeight: 700, color: "var(--muted-2)", letterSpacing: "-0.02em", marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 },
  cardText: { fontSize: 13, color: "var(--muted)", lineHeight: 1.5 },
};

const rulesStyles = {
  root: { marginTop: 32 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, padding: "0 4px", flexWrap: "wrap", gap: 8 },
  title: { fontSize: 13, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 },
  card: {
    background: "var(--surface)", border: "1px solid var(--line)",
    borderRadius: 14, padding: "16px 18px",
  },
  num: { color: "var(--pink)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 },
  cardText: { fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45 },
};

// hover + responsive stylesheet
const styleEl = document.createElement("style");
styleEl.textContent = `
  button { transition: all 0.15s; }
  button:hover:not(:disabled) { filter: brightness(1.1); }
  button:disabled { opacity: 0.35; cursor: not-allowed; }
  [data-tier]:hover { background: rgba(255,255,255,0.03); }
  [data-tier]:hover > div:first-child { transform: scale(1.05); }
  .obj-row:hover { border-color: var(--line-strong) !important; background: var(--surface-3) !important; }
  .obj-remove-btn:hover { color: #ff6b6b !important; border-color: #ff6b6b !important; background: rgba(255,107,107,0.08) !important; }
  input::placeholder { color: var(--muted-2); }

  /* ────────── TABLET ≤ 860px ────────── */
  @media (max-width: 860px) {
    .app-root { padding: 20px 18px 60px !important; }
    .h-top { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
    .h-earned { align-items: flex-start !important; }
    .h-hero { padding: 20px 20px !important; gap: 18px !important; }
    .follower-number { font-size: 44px !important; }
    .tier-title { font-size: 30px !important; }
    .detail-card { padding: 22px 20px 20px !important; }
    .reward-card { min-width: 0 !important; width: 100% !important; }
  }

  /* ────────── PHONE ≤ 640px ────────── */
  @media (max-width: 640px) {
    .h-hero {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
      padding: 18px !important;
    }
    .h-follower {
      border-right: none !important;
      border-bottom: 1px solid var(--line) !important;
      padding-right: 0 !important;
      padding-bottom: 16px !important;
    }
    .follower-number { font-size: 40px !important; }
    .obj-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 10px !important;
    }
    .obj-row {
      padding: 11px 12px !important;
      gap: 10px !important;
    }
    .obj-row .obj-text-btn,
    .obj-row > button[style*="text-align: left"] {
      font-size: 14px !important;
    }
    .tier-title { font-size: 26px !important; line-height: 1.1 !important; }
    .detail-card { padding: 20px 16px 18px !important; border-radius: 18px !important; }
    .reward-card { padding: 14px 16px !important; }
  }

  /* ────────── SMALL PHONE ≤ 420px ────────── */
  @media (max-width: 420px) {
    .app-root { padding: 16px 12px 60px !important; }
    .follower-number { font-size: 34px !important; }
    .tier-title { font-size: 22px !important; }
    .h-hero { padding: 14px !important; border-radius: 18px !important; }
    .detail-card { padding: 16px 14px !important; }
    .obj-row { padding: 10px !important; }
  }

  /* touch devices: hide hover-scale of tier nodes so taps feel stable */
  @media (hover: none) {
    [data-tier]:hover > div:first-child { transform: none !important; }
  }
`;
document.head.appendChild(styleEl);

Object.assign(window, { StrategyPage, Icon, formatK, formatEUR, formatRange, tierStatus, uid, copyText, loadState, saveState, DEFAULT_STATE });
