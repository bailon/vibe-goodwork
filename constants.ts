

import { ValouAreaItem, UserDataCollection, CategoryLabels, ProfileData, BigFiveTraitConfig, BigFiveDimensionScore, LogbookEntryValues, CareerPhase, FutureSkillDimensionScore } from './types';
import { VALOU_AREAS_EN } from './constants_en';
import { SupportedLanguage, getCurrentLanguage } from './i18n';

export const VALOU_AREAS_DE: ValouAreaItem[] = [
  {
    id: 'privatesLeben',
    name: 'Privates Leben',
    description: 'Wo, wie, womit und mit wem will ich leben?',
    color: '#7CB342', // Helles Grün
    tipps: [
      'Wohnumfeld und Wohnsituation (Stadt, Land, Größe)',
      'Private Beziehungen (Familie, Freunde, Partner)',
      'Tägliche Abläufe und organisatorische Bedingungen',
      'Work-Life-Balance'
    ]
  },
  {
    id: 'persoenlichkeitSkills',
    name: 'Persönlichkeit & Skills',
    description: 'Wer will ich sein? Wofür stehe ich?',
    color: '#FFC107', // Gelb
    tipps: [
      'Persönlichkeit & Eigenschaften (z.B. kreativ, strukturiert)',
      'Werte (z.B. Freiheit, Sicherheit, Nachhaltigkeit)',
      'Erfahrungen & Geschichte',
      'Fähigkeiten & Qualifikationen',
      'Interessen & Antriebe'
    ]
  },
  {
    id: 'taetigkeit',
    name: 'Arbeit & Tätigkeit',
    description: 'Wo, wie, mit wem und was arbeite ich?',
    color: '#A1887F', // Helles Braun
    tipps: [
      'Rahmenbedingungen (Arbeitszeit, Arbeitsort)',
      'Organisation & Regeln (Hierarchie, Entscheidungsfindung)',
      'Tätigkeit & Aufgaben (Was, wie, wofür)',
      'Menschen & Beziehungen im Arbeitskontext',
      'Kultur, Stil & Kommunikation am Arbeitsplatz'
    ]
  },
  {
    id: 'stilWirkung',
    name: 'Stil & Wirkung',
    description: 'Wie will ich wann wirken und wodurch?',
    color: '#EC407A', // Rosa
    tipps: [
      'Verhalten & Gewohnheiten',
      'Kommunikation & Kanäle (persönlich, digital)',
      'Kleidung und äußerer Eindruck',
      'Persönliche Marke und Positionierung'
    ]
  },
  {
    id: 'ressourcenMittel',
    name: 'Ressourcen & Mittel',
    description: 'Habe ich alles zum richtigen Zeitpunkt in der richtigen Menge?',
    color: '#42A5F5', // Blau
    tipps: [
      'Finanzen (Einkommen, Ausgaben, Vermögen)',
      'Soziale Ressourcen & Netzwerk (Unterstützung, Kontakte)',
      'Kulturelle Ressourcen (formale Qualifikation, Bildung)',
      'Zeit als Ressource',
      'Werkzeuge & Hilfsmittel'
    ]
  },
  {
    id: 'gesundheit',
    name: 'Gesundheit',
    description: 'Was brauche ich für meine Gesundheit?',
    color: '#EF5350', // Rot
    tipps: [
      'Körperliche Gesundheit',
      'Mentale und emotionale Gesundheit',
      'Gesundheitsverhalten: Bewegung, Schlaf, Ernährung',
      'Vorsorge und medizinische Betreuung',
      'Stressbewältigung und Erholung'
    ]
  }
];

// Helper to get VALOU areas depending on the selected language
export const getValouAreas = (
  lang: SupportedLanguage = getCurrentLanguage()
): ValouAreaItem[] => {
  return lang === 'en' ? VALOU_AREAS_EN : VALOU_AREAS_DE;
};

// Helper to get initial LogbookEntryValues based on VALOU area names
export const getInitialLogbookEntryValues = (
  lang: SupportedLanguage = getCurrentLanguage()
): LogbookEntryValues => {
  const initialValues: Partial<LogbookEntryValues> = {};
  getValouAreas(lang).forEach(area => {
    // Ensure the key matches the exact name string defined in LogbookEntryValues
    initialValues[area.name as keyof LogbookEntryValues] = 5;
  });
  return initialValues as LogbookEntryValues;
};


export const INITIAL_USER_DATA: UserDataCollection = VALOU_AREAS_DE.reduce((acc, area) => {
  acc[area.id] = {
    stylingSatz: '',
    vorlieben: [],
    abneigungen: [],
    mustHaves: [],
    noGos: []
  };
  return acc;
}, {} as UserDataCollection);

export const EXAMPLE_USER_DATA: UserDataCollection = {
  privatesLeben: {
    stylingSatz: 'Eine erholsame Wohnsituation mit Naturnähe und tiefgehenden Beziehungen.',
    vorlieben: ['Wohnen in Stadtrandlage mit Naturnähe', 'Arbeitsplatz fußläufig oder mit dem Fahrrad erreichbar'],
    abneigungen: ['Großstadthektik', 'Stadtumgebung ohne Natur'],
    mustHaves: ['Natur und gute Anbindung an die Stadt'],
    noGos: []
  },
  persoenlichkeitSkills: {
    stylingSatz: 'Kreativität, Unabhängigkeit und persönliches Wachstum.',
    vorlieben: ['Kreativität', 'Unabhängigkeit', 'Wachstum'],
    abneigungen: [],
    mustHaves: ['Finanzielle Freiheit', 'Persönliche Weiterentwicklung'],
    noGos: []
  },
  taetigkeit: {
    stylingSatz: 'Eine spannende Aufgabe in einem inspirierenden Umfeld.',
    vorlieben: ['Eigenverantwortung', 'Flexible Arbeitszeiten'],
    abneigungen: ['Hierarchischer Druck', 'Routinetätigkeiten'],
    mustHaves: [],
    noGos: ['Verbindlicher Druck von oben']
  },
  stilWirkung: {
    stylingSatz: 'Authentisch und professionell.',
    vorlieben: ['Klare Kommunikation', 'Strukturiertes Vorgehen'],
    abneigungen: ['Unklare Erwartungen'],
    mustHaves: ['Respektvoller Umgang'],
    noGos: []
  },
  ressourcenMittel: {
    stylingSatz: 'Zugang zu relevanten Netzwerken und Weiterbildung.',
    vorlieben: ['Netzwerke', 'Regionale Vernetzung'],
    abneigungen: [],
    mustHaves: [],
    noGos: []
  },
  gesundheit: {
    stylingSatz: 'Gesundheit durch Flexibilität.',
    vorlieben: ['Work-Life-Balance', 'Tägliche Bewegung'],
    abneigungen: ['Ständiges Reisen'],
    mustHaves: [],
    noGos: ['Jeden Tag nur sitzen']
  }
};

export const CATEGORY_LABELS: CategoryLabels = {
  vorlieben: 'Was mag ich? Meine Vorlieben & Energiespender',
  abneigungen: 'Was mag ich nicht? Meine Abneigungen & Energiefresser',
  mustHaves: 'Must haves',
  noGos: 'No Gos'
};

export const LOCAL_STORAGE_PROFILE_KEY = 'goodwork-profile-data';

// Define RELEVANT_IDENTITY_PROFILE_FIELDS
export const RELEVANT_IDENTITY_PROFILE_FIELDS: Array<keyof ProfileData> = [
  'identitaetProfilGesamtbericht',
  'eigenschaftenPersoenlichkeit',
  'neigungenInteressen',
  'motiveAntriebe',
  'faehigkeitenKompetenzen'
];

export const CAREER_PHASES: Array<{ value: CareerPhase; label: string }> = [
  { value: 'nicht_gesetzt', label: 'Bitte auswählen...' },
  { value: 'berufsstart', label: 'Berufsstart' },
  { value: 'bestehend', label: 'Bestehendes Arbeitsverhältnis' },
  { value: 'neuorientierung', label: 'Neuorientierung / Wechselphase' },
  { value: 'gruendung', label: 'Gründungsvorbereitung' },
  { value: 'retirement', label: 'Retirement (Ruhestandsplanung)' },
];

export const INITIAL_PROFILE_DATA: ProfileData = {
  personalNotes: '',
  experience: '',
  qualifications: '',
  targetIndustries: '',
  exclusionCriteria: '',
  savedAiRecommendation: '',
  savedSummary: '',
  identitaetProfilGesamtbericht: '',
  eigenschaftenPersoenlichkeit: '',
  neigungenInteressen: '',
  motiveAntriebe: '',
  faehigkeitenKompetenzen: '',
  beruflichesIdentitaetsProfilReport: '',
  profilePicture: '',
  valouZielstylingData: INITIAL_USER_DATA,
  valouZielstylingSummary: '',
  riasec: undefined,
  personalityScreening: {
    selectedGeneralAdjectives: [],
    adjectiveScores: undefined,
    traitScores: undefined,
    bigFiveScores: undefined,
    report: undefined,
    lastRun: undefined,
  },
  motivationScreening: undefined,
  futureSkillsScreening: undefined, // Added Future Skills
  decisionCriteriaReport: '',
  cultureMatchReport: '',
  jobMatchingPreferences: {
    keywords: '',
    industries: '',
    regions: '',
    companySize: 'Beliebig',
    workModel: 'Beliebig',
  },
  jobMatches: [],
  jobSearchGroundingSources: [],
  logbookEntries: [],
  currentPhase: 'nicht_gesetzt',
};

export const EXAMPLE_PROFILE_DATA: ProfileData = {
  personalNotes: 'Ich bin eine motivierte Person, die nach einer erfüllenden Tätigkeit sucht, die sowohl Herausforderung als auch Flexibilität bietet. Ich lege Wert auf ein positives Arbeitsklima und Möglichkeiten zur Weiterentwicklung.',
  experience: '5 Jahre Erfahrung im Projektmanagement im IT-Sektor.\n2 Jahre Teamleitung im Bereich Softwareentwicklung.',
  qualifications: 'Master in Informatik\nZertifizierter Scrum Master\nFließend in Englisch und Deutsch',
  targetIndustries: 'Nachhaltige Technologien, Erneuerbare Energien, Bildungssektor, Soziale Unternehmen',
  exclusionCriteria: 'Rüstungsindustrie, Unternehmen mit schlechter ethischer Bilanz, reine Vertriebstätigkeit ohne Produktbezug',
  savedAiRecommendation: '',
  savedSummary: '',
  identitaetProfilGesamtbericht: 'Ich bin ein analytischer Denker mit einer Leidenschaft für Problemlösungen und kontinuierliches Lernen. Meine Stärke liegt darin, komplexe Sachverhalte schnell zu erfassen und kreative Lösungen zu entwickeln. Ich suche ein Umfeld, das Innovation fördert und mir erlaubt, meine Fähigkeiten zum Wohle des Teams und des Unternehmens einzusetzen.',
  eigenschaftenPersoenlichkeit: 'Analytisch, kreativ, teamorientiert, lösungsorientiert, wissbegierig, anpassungsfähig.',
  neigungenInteressen: 'Technologie-Trends, Softwarearchitektur, künstliche Intelligenz, Design Thinking, Fotografie, Wandern.',
  motiveAntriebe: 'Wissenserweiterung, positive Wirkung erzielen, an herausfordernden Projekten arbeiten, Teil eines kompetenten Teams sein, Autonomie.',
  faehigkeitenKompetenzen: 'Softwareentwicklung (Python, Java), Projektmanagement (Agile, Scrum), Datenanalyse, Systemdesign, starke Kommunikationsfähigkeiten, Problemlösungskompetenz.',
  beruflichesIdentitaetsProfilReport: 'Dies ist ein beispielhafter, umfassender Bericht zur beruflichen Identität. Er fasst die wichtigsten Erkenntnisse aus manuellen Eingaben und Tool-Ergebnissen zusammen.',
  profilePicture: '',
  valouZielstylingData: EXAMPLE_USER_DATA,
  valouZielstylingSummary: 'Beispielhafte Zusammenfassung des Valou Stylings. Diese würde normalerweise dynamisch generiert.',
  riasec: undefined,
  personalityScreening: {
    selectedGeneralAdjectives: ["kreativ", "analytisch", "teamorientiert"],
    adjectiveScores: undefined, // Example Big Five scores could be added if needed
    traitScores: undefined,
    bigFiveScores: undefined,
    report: undefined,
    lastRun: undefined,
  },
  motivationScreening: undefined,
  futureSkillsScreening: undefined, // Added Future Skills
  decisionCriteriaReport: '',
  cultureMatchReport: '',
  jobMatchingPreferences: {
    keywords: 'Softwareentwicklung, Projektmanagement',
    industries: 'IT, Nachhaltigkeit',
    regions: 'Berlin, Remote',
    companySize: 'Mittel',
    workModel: 'Hybrid',
  },
  jobMatches: [],
  jobSearchGroundingSources: [],
  logbookEntries: [],
  currentPhase: 'bestehend',
};


// RIASEC Constants
export const RIASEC_QUESTIONS = [
  // R (1-7)
  "Ich verliere mich in Tätigkeiten, bei denen ich mit den Händen etwas baue / repariere.",
  "Mich ziehen Werkzeuge, Maschinen oder technische Geräte an.",
  "Ich genieße es, etwas Greifbares herzustellen.",
  "Handfeste Aufgaben mit Körpereinsatz sprechen mich an.",
  "Ich finde Outdoor-Arbeit oder Werkstätten spannend.",
  "Ich tüftle gern daran, wie Dinge mechanisch funktionieren.",
  "DIY-Videos oder Bau-Tutorials fesseln mich.",
  // I (8-14)
  "Ich vertiefe mich gern in komplexe Fragen, um sie zu verstehen.",
  "Ungelöste Rätsel oder Probleme wecken meine Neugier.",
  "Logische / naturwissenschaftliche Themen faszinieren mich.",
  "Ich recherchiere freiwillig, weil mich Themen packen.",
  "Ich vergleiche gern verschiedene Erklärungen oder Theorien.",
  "Daten sammeln & Hypothesen aufstellen macht mir Spaß.",
  "Ich liebe es, knifflige Sachverhalte aus Neugier zu durchdringen.",
  // A (15-21)
  "Beim Schreiben, Malen, Musizieren vergesse ich die Zeit.",
  "Ich experimentiere gern mit Farben, Formen oder Worten.",
  "Originelle Ideen begeistern mich, auch wenn sie ungewöhnlich sind.",
  "Kreativer Ausdruck ist für mich erfüllend.",
  "Ich sehe schnell ästhetische Verbesserungsmöglichkeiten.",
  "Kunst, Literatur oder Musik inspirieren mich.",
  "Ich genieße Freiräume ohne feste Regeln.",
  // S (22-28)
  "Ich bin gern für andere da und merke schnell, wenn Hilfe nötig ist.",
  "Persönliche Gespräche geben mir Energie.",
  "Zuzuhören und Rat zu geben erfüllt mich.",
  "Ich genieße es, in Gruppen ein gutes Miteinander zu schaffen.",
  "Ich engagiere mich gern, um das Wohlbefinden anderer zu steigern.",
  "Ich interessiere mich für das, was Menschen bewegt.",
  "Wissen weiterzugeben macht mir Freude.",
  // E (29-35)
  "Ich liebe es, Ideen zum Leben zu erwecken.",
  "Herausforderungen ziehen mich an.",
  "Gestalten, entscheiden und Einfluss nehmen reizt mich.",
  "Neue Projekte begeistern mich.",
  "Ich verhandle gern und gewinne Menschen für Ideen.",
  "Ziele setzen und losgehen motiviert mich.",
  "Verantwortung für Projekte gibt mir Energie.",
  // C (36-42)
  "Ordnen und Strukturieren entspannt mich.",
  "Klare Abläufe sprechen mich an.",
  "Zahlen, Tabellen oder Listen machen mir Spaß.",
  "Strukturen geben mir Sicherheit.",
  "Ich arbeite Dinge gern zuverlässig ab.",
  "Dokumentieren und Kontrollieren liegt mir.",
  "Systeme oder Pläne helfen mir, organisiert zu sein."
];

export const RIASEC_MAPPING: { [key: string]: number[] } = {
  R: [1, 2, 3, 4, 5, 6, 7],
  I: [8, 9, 10, 11, 12, 13, 14],
  A: [15, 16, 17, 18, 19, 20, 21],
  S: [22, 23, 24, 25, 26, 27, 28],
  E: [29, 30, 31, 32, 33, 34, 35],
  C: [36, 37, 38, 39, 40, 41, 42]
};

export const RIASEC_DESCRIPTIONS: { [key: string]: {label: string, color: string, description: string} } = {
  R: { label: "Realistisch", color: "#e11d48", description: "Praktische, handfeste Tätigkeiten; Arbeit mit Werkzeugen, Maschinen, Pflanzen oder Tieren." },
  I: { label: "Investigativ", color: "#0d9488", description: "Analytisches Denken, Forschen, Problemlösen; Umgang mit Ideen und Konzepten." },
  A: { label: "Artistisch", color: "#8b5cf6", description: "Kreativer Selbstausdruck, künstlerische Tätigkeiten; Arbeit in unstrukturierten Umgebungen." },
  S: { label: "Sozial", color: "#10b981", description: "Unterstützen, Lehren, Beraten anderer Menschen; Kommunikation und Teamarbeit." },
  E: { label: "Entrepreneurial", color: "#f97316", description: "Führen, Organisieren, Überzeugen; wirtschaftliches Denken und unternehmerische Initiative." },
  C: { label: "Konventionell", color: "#3b82f6", description: "Strukturierte, datenorientierte Tätigkeiten; Ordnung, Präzision und Zuverlässigkeit." }
};

// General Personality Adjectives for selection
export const GENERAL_PERSONALITY_ADJECTIVES: string[] = Array.from(new Set([
  "abenteuerlustig", "achtsam", "aggressiv", "agil", "angeberisch", "ängstlich",
  "anspruchsvoll", "anständig", "arrogant", "ästhetisch", "ausdauernd", "ausweichend",
  "begeisternd", "beharrlich", "bescheiden", "besonnen", "bewertend", "chaotisch",
  "charmant", "cool", "direkt", "diszipliniert", "durchsetzungsstark", "dynamisch",
  "echt", "effektiv - wirksam", "effizient - wirtschaftlich", "ehrlich", "eigenverantwortlich",
  "einfach", "einfallsreich", "empathisch", "energiegeladen", "entscheidungsfreudig",
  "erfolgsorientiert", "ernsthaft - seriös", "experimentell", "fair", "fantasievoll",
  "fleißig", "flexibel", "fokussiert", "forschend", "frei", "freundlich", "geduldig",
  "gelassen", "genussvoll", "gesellig", "gleichgültig", "grenzüberschreitend", "großzügig",
  "harmonisch", "herausfordernd", "höflich", "humorvoll", "impulsiv", "innovativ",
  "intelligent", "interessiert", "intolerant", "intuitiv", "kleinlich", "kontrollierend",
  "kontrolliert", "kooperativ", "kreativ", "kritikorientiert", "launisch", "lebendig",
  "leidenschaftlich", "lernbegeistert", "misstrauisch", "mitfühlend", "modern", "mutig",
  "nachhaltig", "nachlässig", "neugierig", "normiert", "offen", "optimistisch",
  "ordentlich", "passiv", "perfektionistisch", "persönlich", "pragmatisch", "professionell",
  "realistisch", "rechthaberisch", "reserviert", "respektlos", "respektvoll",
  "rücksichtsvoll", "ruhig", "sachlich", "selbstbewusst", "selbstkritisch", "selbstreflektiert",
  "selbstsicher", "selbstständig", "sensibel", "sicherheitsorientiert", "sorgfältig", "sozial",
  "spielerisch", "spontan", "stabil", "stark", "strategisch", "strebsam", "strukturiert",
  "tolerant", "traditionell", "transparent", "traurig", "träumerisch", "treu", "überlegend",
  "überzeugend", "umsichtig", "unabhängig", "unbekümmert", "unbeständig", "undiszipliniert",
  "unentschlossen", "unflexibel", "unkompliziert", "unordentlich", "unruhig", "unsicher",
  "unterstützend", "verantwortungsbewusst", "verbindlich", "verlässlich", "verspielt",
  "verständnisvoll", "vertrauensvoll", "visionär", "vorausschauend", "vorsichtig",
  "warmherzig", "weise", "weltoffen", "wertschätzend", "wettbewerbsorientiert", "wissbegierig",
  "zielorientiert", "zufrieden", "zugewandt", "zurückhaltend", "zuverlässig", "zuvorkommend",
  "zynisch"
].sort((a, b) => a.localeCompare(b))));


export const BIG_FIVE_TRAITS_CONFIG: BigFiveTraitConfig[] = [
  // Openness
  { id: 'fantasievoll', dimension: 'O', pole: '+', adjective: 'Fantasievoll' },
  { id: 'kreativO', dimension: 'O', pole: '+', adjective: 'Kreativ (im Denken)' },
  { id: 'experimentierfreudig', dimension: 'O', pole: '+', adjective: 'Experimentierfreudig' },
  { id: 'intellektuell', dimension: 'O', pole: '+', adjective: 'Intellektuell neugierig' },
  { id: 'unkonventionell', dimension: 'O', pole: '+', adjective: 'Unkonventionell' },
  { id: 'konservativ', dimension: 'O', pole: '-', adjective: 'Konservativ' },
  { id: 'routinemaessig', dimension: 'O', pole: '-', adjective: 'Routinemäßig' },
  { id: 'pragmatischO', dimension: 'O', pole: '-', adjective: 'Pragmatisch (statt idealistisch)' },
  { id: 'traditionellO', dimension: 'O', pole: '-', adjective: 'Traditionell' },
  { id: 'bodenstaendig', dimension: 'O', pole: '-', adjective: 'Bodenständig' },
  // Conscientiousness
  { id: 'organisiert', dimension: 'C', pole: '+', adjective: 'Organisiert' },
  { id: 'sorgfaeltigC', dimension: 'C', pole: '+', adjective: 'Sorgfältig' },
  { id: 'zuverlaessigC', dimension: 'C', pole: '+', adjective: 'Zuverlässig' },
  { id: 'diszipliniertC', dimension: 'C', pole: '+', adjective: 'Diszipliniert' },
  { id: 'pflichtbewusst', dimension: 'C', pole: '+', adjective: 'Pflichtbewusst' },
  { id: 'unbekuemmertC', dimension: 'C', pole: '-', adjective: 'Unbekümmert (lässig)' },
  { id: 'nachlaessigC', dimension: 'C', pole: '-', adjective: 'Nachlässig' },
  { id: 'spontanC', dimension: 'C', pole: '-', adjective: 'Spontan (statt planvoll)' },
  { id: 'flexibelC', dimension: 'C', pole: '-', adjective: 'Flexibel (weniger strukturiert)' },
  { id: 'leichtsinnig', dimension: 'C', pole: '-', adjective: 'Leichtsinnig' },
  // Extraversion
  { id: 'gespraechig', dimension: 'E', pole: '+', adjective: 'Gesprächig' },
  { id: 'geselligE', dimension: 'E', pole: '+', adjective: 'Gesellig' },
  { id: 'durchsetzungsstarkE', dimension: 'E', pole: '+', adjective: 'Durchsetzungsstark' },
  { id: 'energiegeladenE', dimension: 'E', pole: '+', adjective: 'Energiegeladen' },
  { id: 'optimistischE', dimension: 'E', pole: '+', adjective: 'Optimistisch' },
  { id: 'zurueckhaltendE', dimension: 'E', pole: '-', adjective: 'Zurückhaltend' },
  { id: 'reserviertE', dimension: 'E', pole: '-', adjective: 'Reserviert' },
  { id: 'ruhigE', dimension: 'E', pole: '-', adjective: 'Ruhig (lieber allein)' },
  { id: 'nachdenklichE', dimension: 'E', pole: '-', adjective: 'Nachdenklich (statt aktionistisch)' },
  { id: 'ernsthaftE', dimension: 'E', pole: '-', adjective: 'Ernsthaft' },
  // Agreeableness
  { id: 'mitfuehlendA', dimension: 'A', pole: '+', adjective: 'Mitfühlend' },
  { id: 'freundlichA', dimension: 'A', pole: '+', adjective: 'Freundlich' },
  { id: 'kooperativA', dimension: 'A', pole: '+', adjective: 'Kooperativ' },
  { id: 'vertrauensvollA', dimension: 'A', pole: '+', adjective: 'Vertrauensvoll' },
  { id: 'hilfsbereit', dimension: 'A', pole: '+', adjective: 'Hilfsbereit' },
  { id: 'kritischA', dimension: 'A', pole: '-', adjective: 'Kritisch' },
  { id: 'wettbewerbsorientiertA', dimension: 'A', pole: '-', adjective: 'Wettbewerbsorientiert' },
  { id: 'skeptisch', dimension: 'A', pole: '-', adjective: 'Skeptisch' },
  { id: 'eigenstaendigA', dimension: 'A', pole: '-', adjective: 'Eigenständig (weniger gruppenorientiert)' },
  { id: 'direktA', dimension: 'A', pole: '-', adjective: 'Direkt (kann andere irritieren)' },
  // Neuroticism
  { id: 'besorgt', dimension: 'N', pole: '+', adjective: 'Besorgt' },
  { id: 'nervös', dimension: 'N', pole: '+', adjective: 'Nervös' },
  { id: 'launischN', dimension: 'N', pole: '+', adjective: 'Launisch' },
  { id: 'reizbar', dimension: 'N', pole: '+', adjective: 'Reizbar' },
  { id: 'unsicherN', dimension: 'N', pole: '+', adjective: 'Unsicher' },
  { id: 'gelassenN', dimension: 'N', pole: '-', adjective: 'Gelassen' },
  { id: 'entspannt', dimension: 'N', pole: '-', adjective: 'Entspannt' },
  { id: 'emotionalStabil', dimension: 'N', pole: '-', adjective: 'Emotional stabil' },
  { id: 'selbstsicherN', dimension: 'N', pole: '-', adjective: 'Selbstsicher' },
  { id: 'zufriedenN', dimension: 'N', pole: '-', adjective: 'Zufrieden (mit sich selbst)' },
];


export const BIG_FIVE_DIMENSION_DEFINITIONS: Array<{
  dimension: 'O' | 'C' | 'E' | 'A' | 'N';
  label: string;
  description: string;
  color: string;
}> = [
  {
    dimension: 'O',
    label: 'Offenheit für Erfahrungen',
    description: 'Beschreibt das Ausmaß, in dem eine Person offen für neue Ideen, Kunst, Emotionen, Abenteuer, ungewöhnliche Ideen und eine Vielfalt von Erfahrungen ist.',
    color: '#0d9488', // Teal
  },
  {
    dimension: 'C',
    label: 'Gewissenhaftigkeit',
    description: 'Bezieht sich auf die Tendenz, organisiert und verlässlich zu sein, Selbstdisziplin zu zeigen, pflichtbewusst zu handeln, nach Leistung zu streben und geplante statt spontane Verhaltensweisen zu bevorzugen.',
    color: '#3b82f6', // Blue
  },
  {
    dimension: 'E',
    label: 'Extraversion',
    description: 'Kennzeichnet das Ausmaß, in dem eine Person kontaktfreudig, gesellig, energiegeladen und gesprächig ist, im Gegensatz zu zurückhaltend und einzelgängerisch.',
    color: '#f97316', // Orange
  },
  {
    dimension: 'A',
    label: 'Verträglichkeit',
    description: 'Beschreibt die Neigung, mitfühlend und kooperativ zu sein, anstatt misstrauisch und antagonistisch gegenüber anderen. Es beinhaltet Aspekte wie Altruismus, Bescheidenheit und Gutherzigkeit.',
    color: '#10b981', // Green (Emerald)
  },
  {
    dimension: 'N',
    label: 'Neurotizismus',
    description: 'Bezieht sich auf die Tendenz, unangenehme Emotionen wie Ärger, Angst, Depression oder Verletzlichkeit leicht zu erleben. Das Gegenteil ist emotionale Stabilität.',
    color: '#6d28d9', // Indigo/Purple
  },
];

export const MOTIVATION_DIMENSIONS_CONFIG: Array<{
  id: string;
  label: string;
  color: string;
  description: string;
  motivations: Array<{
    id: string;
    label: string;
    question: string;
  }>;
}> = [
  {
    id: 'selbstverwirklichung',
    label: 'Selbstverwirklichung',
    color: '#8b5cf6', // Purple
    description: 'Das Streben nach Entfaltung der eigenen Potenziale, Talente und Persönlichkeit.',
    motivations: [
      { id: 'selbstwirkung', label: 'Selbstwirkung', question: 'Ich erlebe gerne, dass mein Handeln einen direkten, positiven Einfluss hat.' },
      { id: 'entwicklung', label: 'Entwicklung', question: 'Es ist mir wichtig, mich kontinuierlich weiterzuentwickeln und Neues zu lernen.' },
      { id: 'selbstkonsistenzSinn', label: 'Selbstkonsistenz & Sinn', question: 'Meine Tätigkeiten sollen mit meinen Werten übereinstimmen und für mich einen Sinn ergeben.' },
      { id: 'leistung', label: 'Leistung', question: 'Ich setze mir gerne ambitionierte Ziele und freue mich über erreichte Erfolge.' },
      { id: 'abwechslung', label: 'Abwechslung', question: 'Ich schätze vielfältige Aufgaben und Herausforderungen, die Routine vermeiden.' },
      { id: 'autonomie', label: 'Autonomie', question: 'Ich bevorzuge es, eigenverantwortlich zu handeln und Entscheidungsspielräume zu haben.' },
    ],
  },
  {
    id: 'karriereMateriell',
    label: 'Karriere und Materieller Erfolg',
    color: '#f97316', // Orange
    description: 'Das Anstreben von beruflichem Aufstieg, Anerkennung und finanzieller Sicherheit oder Wohlstand.',
    motivations: [
      { id: 'materielles', label: 'Materielles', question: 'Ein gutes Einkommen und finanzielle Sicherheit sind mir sehr wichtig.' },
      { id: 'karriereAufstieg', label: 'Karriere & Aufstieg', question: 'Ich strebe danach, beruflich aufzusteigen und mehr Verantwortung zu übernehmen.' },
      { id: 'fuehrungMacht', label: 'Führung & Macht', question: 'Es motiviert mich, andere anzuleiten, Entscheidungen zu treffen und Einfluss auszuüben.' },
    ],
  },
  {
    id: 'sozialeAspekte',
    label: 'Soziale Aspekte',
    color: '#10b981', // Emerald
    description: 'Die Bedeutung von zwischenmenschlichen Beziehungen, sozialer Anerkennung und dem Beitrag zum Gemeinwohl.',
    motivations: [
      { id: 'ansehenStatus', label: 'Ansehen & Status', question: 'Anerkennung und ein gewisser Status in meinem beruflichen Umfeld sind mir wichtig.' },
      { id: 'feedback', label: 'Feedback', question: 'Regelmäßiges und konstruktives Feedback zu meiner Arbeit ist für mich wertvoll.' },
      { id: 'prosozialitaet', label: 'Prosozialität', question: 'Ich möchte mit meiner Arbeit einen positiven Beitrag für andere oder die Gesellschaft leisten.' },
      { id: 'anschluss', label: 'Anschluss', question: 'Ein gutes Verhältnis zu Kollegen und das Gefühl der Zugehörigkeit sind mir wichtig.' },
    ],
  },
  {
    id: 'workLifeBalance',
    label: 'Work-Life-Balance',
    color: '#0ea5e9', // Sky Blue
    description: 'Das Bedürfnis nach einem ausgewogenen Verhältnis zwischen Berufs- und Privatleben.',
    motivations: [
      { id: 'vereinbarkeit', label: 'Vereinbarkeit', question: 'Es ist mir wichtig, Beruf, Familie und Freizeit gut miteinander vereinbaren zu können.' },
      { id: 'abgrenzung', label: 'Abgrenzung', question: 'Ich lege Wert darauf, nach der Arbeit abschalten zu können und klare Grenzen zu haben.' },
    ],
  },
  {
    id: 'sicherheit',
    label: 'Sicherheit',
    color: '#3b82f6', // Blue
    description: 'Das Streben nach Stabilität, Vorhersagbarkeit und Schutz vor Risiken.',
    motivations: [
      { id: 'physSicherheit', label: 'Physiologische Sicherheit', question: 'Ein sicherer Arbeitsplatz und gute gesundheitliche Rahmenbedingungen sind grundlegend für mich.' },
      { id: 'psychSicherheit', label: 'Psychologische Sicherheit', question: 'Ich möchte mich in meinem Arbeitsumfeld sicher fühlen, um offen Ideen äußern zu können, ohne negative Konsequenzen fürchten zu müssen.' },
      { id: 'planbarkeit', label: 'Planbarkeit', question: 'Ich schätze klare Strukturen, verlässliche Prozesse und eine gewisse Vorhersehbarkeit.' },
    ],
  },
  {
    id: 'arbeitsumgebung',
    label: 'Arbeitsumgebung',
    color: '#64748b', // Slate
    description: 'Die Bedeutung der physischen und atmosphärischen Bedingungen am Arbeitsplatz.',
    motivations: [
      { id: 'atmosphäre', label: 'Atmosphäre', question: 'Eine positive und unterstützende Arbeitsatmosphäre ist mir sehr wichtig.' },
      { id: 'aesthetik', label: 'Ästhetik', question: 'Ein ansprechend und gut gestalteter Arbeitsplatz beeinflusst mein Wohlbefinden positiv.' },
      { id: 'komfortAusstattung', label: 'Komfort & Ausstattung', question: 'Eine gute ergonomische Ausstattung und komfortable Arbeitsmittel sind mir wichtig.' },
    ],
  },
];

export const FUTURE_SKILLS_DIMENSIONS_CONFIG: Array<{
  id: string;
  label: string;
  color: string;
  description: string;
  skills: Array<{
    id: string;
    label: string;
    question: string;
  }>;
}> = [
  {
    id: 'schluesselkompetenzen',
    label: 'Schlüsselkompetenzen / Basisfähigkeiten',
    color: '#14b8a6', // Teal
    description: 'Grundlegende Fähigkeiten, die für eine erfolgreiche berufliche und persönliche Entwicklung unerlässlich sind.',
    skills: [
      { id: 'lernfaehigkeit', label: 'Lernfähigkeit', question: 'Ich eigne mir schnell neues Wissen und Fähigkeiten an und wende sie gerne an.' },
      { id: 'digitaleZusammenarbeit', label: '(Digitale) Zusammenarbeit', question: 'Ich arbeite effektiv mit anderen zusammen, auch über digitale Kanäle.' },
      { id: 'digitalLiteracy', label: 'Digital Literacy', question: 'Ich kann digitale Informationen kritisch bewerten und kompetent nutzen.' },
    ],
  },
  {
    id: 'dynamischesSelbstbild',
    label: 'Dynamisches Selbstbild',
    color: '#06b6d4', // Cyan
    description: 'Die Fähigkeit, flexibel auf Veränderungen zu reagieren und an die eigenen Fähigkeiten zu glauben.',
    skills: [
      { id: 'anpassungsfaehigkeit', label: 'Anpassungsfähigkeit', question: 'Ich komme gut mit Veränderungen zurecht und passe mich flexibel neuen Situationen an.' },
      { id: 'selbstwirksamkeit', label: 'Selbstwirksamkeit', question: 'Ich bin überzeugt, auch schwierige Herausforderungen meistern zu können.' },
    ],
  },
  {
    id: 'unternehmertum',
    label: 'Unternehmertum',
    color: '#84cc16', // Lime
    description: 'Eigenschaften und Fähigkeiten, die proaktives, gestaltendes und zielorientiertes Handeln fördern.',
    skills: [
      { id: 'eigeninitiative', label: 'Eigeninitiative', question: 'Ich ergreife von mir aus die Initiative und warte nicht, bis Aufgaben an mich herangetragen werden.' },
      { id: 'gestaltungswille', label: 'Gestaltungswille', question: 'Es ist mir wichtig, Dinge aktiv zu gestalten und zu verbessern.' },
      { id: 'umsetzungsstaerke', label: 'Umsetzungsstärke', question: 'Ich setze Pläne und Ideen konsequent in die Tat um.' },
      { id: 'problemloesungsfaehigkeit', label: 'Problemlösungsfähigkeit', question: 'Ich analysiere Probleme systematisch und finde kreative Lösungen.' },
      { id: 'risikobereitschaft', label: 'Risikobereitschaft', question: 'Ich bin bereit, kalkulierte Risiken einzugehen, um Ziele zu erreichen.' },
      { id: 'unsicherheitstoleranz', label: 'Unsicherheitstoleranz', question: 'Ich kann gut mit unsicheren oder mehrdeutigen Situationen umgehen.' },
      { id: 'durchhaltevermoegen', label: 'Durchhaltevermögen', question: 'Auch bei Rückschlägen bleibe ich dran und verfolge meine Ziele beharrlich.' },
    ],
  },
  {
    id: 'sozialeKompetenz',
    label: 'Soziale Kompetenz',
    color: '#d946ef', // Fuchsia
    description: 'Fähigkeiten im Umgang mit anderen Menschen und in sozialen Situationen.',
    skills: [
      { id: 'sensitivitaet', label: 'Sensitivität', question: 'Ich nehme Stimmungen und Bedürfnisse anderer Menschen gut wahr.' },
      { id: 'kontaktfaehigkeit', label: 'Kontaktfähigkeit', question: 'Es fällt mir leicht, neue Kontakte zu knüpfen und Beziehungen aufzubauen.' },
      { id: 'soziabilitaet', label: 'Soziabilität', question: 'Ich bin gerne unter Menschen und fühle mich in sozialen Situationen wohl.' },
      { id: 'teamorientierung', label: 'Teamorientierung', question: 'Ich arbeite gerne im Team und trage zu einer guten Zusammenarbeit bei.' },
      { id: 'durchsetzungsstaerkeSK', label: 'Durchsetzungsstärke (Sozial)', question: 'Ich kann meine Meinung klar vertreten und meine Ziele auch gegen Widerstände verfolgen, achte dabei aber auf gute Beziehungen.' }, // Added SK suffix to avoid clash with Big Five
      { id: 'begeisterungsfaehigkeit', label: 'Begeisterungsfähigkeit', question: 'Ich kann mich und andere für neue Ideen und Projekte begeistern.' },
    ],
  },
];