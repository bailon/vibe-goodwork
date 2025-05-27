

export interface ValouAreaItem {
  id: string;
  name: string;
  description:string;
  color: string;
  tipps: string[];
}

export interface UserDataEntry {
  stylingSatz: string;
  vorlieben: string[];
  abneigungen: string[];
  mustHaves: string[];
  noGos: string[];
}

export type UserDataCollection = {
  [key: string]: UserDataEntry;
};

export type UserDataCategoryKey = keyof Omit<UserDataEntry, 'stylingSatz'>;

export const USER_DATA_CATEGORIES: UserDataCategoryKey[] = ['vorlieben', 'abneigungen', 'mustHaves', 'noGos'];

export interface CategoryLabels {
  vorlieben: string;
  abneigungen: string;
  mustHaves: string;
  noGos: string;
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

// For RIASEC Tool
export interface RiasecScoreData {
  [key: string]: number; // e.g., { R: 8.5, I: 7.0, ... }
}

export interface RiasecScoreDetail {
  area: string; // R, I, A, S, E, C
  value: number;
  label: string; // e.g., Realistic, Investigative
  color: string; // Associated color
  description: string; // Short description of the type
}
export interface RiasecData {
  scores: RiasecScoreData; // Raw scores keyed by area
  sortedScores: RiasecScoreDetail[]; // Scores sorted by value, including details
  hierarchy: string[]; // Ordered list of area codes, e.g., ["R", "I", "A"]
  hollandCode?: string; // The 3-letter Holland code, e.g., "RIA"
  hollandType?: string; // The descriptive name of the Holland type from AI
  report?: string; // The AI-generated report text
  lastRun?: string; // ISO date string of when the test was last run
}

// Personality Screening Types
export interface PersonalityAdjectiveData {
  [adjectiveId: string]: number; // e.g., { energetic: 7, calm: 2 } scale 1-10 (was 1-7)
}

export interface BigFiveTraitConfig {
  id: string;
  dimension: 'O' | 'C' | 'E' | 'A' | 'N';
  pole: '+' | '-';
  adjective: string;
}

export interface BigFiveTraitScore {
  traitId: string; // e.g., 'talkative', 'reserved'
  adjective: string; // 'Gesprächig', 'Zurückhaltend'
  score: number; // User's raw score for this adjective (1-10)
  normalizedScore: number; // Score normalized (e.g. reversed if negative pole) for dimension calculation (1-10)
  dimension: 'O' | 'C' | 'E' | 'A' | 'N';
  pole: '+' | '-';
}

export interface BigFivePoleScore {
  poleLabel: string; // e.g., "Extraversion", "Introversion"
  score: number; // Average score (1-10) for traits belonging to this pole
  color?: string;
}

export interface BigFiveDimensionScore {
  dimension: 'O' | 'C' | 'E' | 'A' | 'N'; // Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
  label: string; // "Offenheit für Erfahrungen", "Gewissenhaftigkeit", etc.
  score: number; // Overall score for the dimension (typically average of normalized scores, scale 1-10)
  positivePole: BigFivePoleScore;
  negativePole: BigFivePoleScore;
  description: string; // Short description of the dimension
  color: string;
}

export interface PersonalityScreeningData {
  selectedGeneralAdjectives?: string[]; // User-selected general adjectives
  adjectiveScores?: PersonalityAdjectiveData; // User's raw ratings for Big Five adjectives
  traitScores?: BigFiveTraitScore[]; // Detailed scores for each evaluated BigFive trait/adjective
  bigFiveScores?: BigFiveDimensionScore[]; // Calculated scores for the 5 dimensions
  report?: string; // AI-generated report
  lastRun?: string; // ISO date string
}

// Motivation Screening Types
export interface MotiveScoreData {
  [motiveId: string]: number; // e.g., { selbstwirkung: 8, entwicklung: 7 } scale 1-10
}

export interface MotivItemScore {
  id: string; // e.g. 'selbstwirkung'
  label: string; // e.g. 'Selbstwirkung'
  value: number; // User's score for this motive (1-10)
}

export interface MotiveDimensionScore {
  id: string; // e.g. 'selbstverwirklichung'
  label: string; // e.g. 'Selbstverwirklichung'
  averageScore: number; // Average score for this dimension (1-10)
  color: string;
  description: string;
  motivations: MotivItemScore[]; // Scores for individual motives within this dimension
}

export interface MotivationScreeningData {
  dimensionScores: MotiveDimensionScore[]; // Calculated scores for the 6 dimensions
  report?: string; // AI-generated report
  lastRun?: string; // ISO date string
}

// Future Skills Screening Types
export interface FutureSkillItemScore {
  id: string; // e.g. 'lernfaehigkeit'
  label: string; // e.g. 'Lernfähigkeit'
  value: number; // User's score for this skill (1-10)
}

export interface FutureSkillDimensionScore {
  id: string; // e.g. 'schluesselkompetenzen'
  label: string; // e.g. 'Schlüsselkompetenzen / Basisfähigkeiten'
  averageScore: number; // Average score for this dimension (1-10)
  color: string;
  description: string;
  skills: FutureSkillItemScore[]; // Scores for individual skills within this dimension
}

export interface FutureSkillsScreeningData {
  dimensionScores: FutureSkillDimensionScore[]; // Calculated scores for the dimensions
  report?: string; // AI-generated report
  lastRun?: string; // ISO date string
}


// Job Matching Types
export interface JobMatchingPreferences {
  keywords: string;
  industries: string;
  regions: string;
  companySize: string; // e.g., "Beliebig", "Klein", "Mittel", "Groß"
  workModel: string; // e.g., "Beliebig", "Vor Ort", "Hybrid", "Remote"
}

export interface JobMatch {
  title: string;
  company: string;
  location: string;
  snippet: string; // Short description or key responsibilities
  relevance: string; // AI-generated explanation of why it's a good match
  url: string;
  matchingDegree: string; // e.g., "85%"
}

// Logbook Types
export interface LogbookEntryValues {
  // Keys should match ValouAreaItem names from constants.ts
  'Arbeit & Tätigkeit': number;
  'Privates Leben': number;
  'Ressourcen & Mittel': number;
  'Persönlichkeit & Skills': number;
  'Stil & Wirkung': number;
  'Gesundheit': number;
}

export interface LogbookEntry {
  id: string | number; // Unique ID for the entry
  date: string; // ISO date string (e.g., "2023-10-27")
  wellbeing: number; // Scale 1-10
  reflection: string;
  highlights: string;
  challenges: string;
  values: LogbookEntryValues;
  energyLevel: number; // Scale 1-10
  mentalLoad: number; // Scale 1-10
  goodWorkIndex: string; // Calculated string, e.g., "7.5"
}

export type CareerPhase = 'berufsstart' | 'bestehend' | 'neuorientierung' | 'gruendung' | 'retirement' | 'nicht_gesetzt';

export interface ProfileData {
  personalNotes: string;
  experience: string;
  qualifications: string;
  targetIndustries: string;
  exclusionCriteria: string;
  savedAiRecommendation: string;
  savedSummary: string;
  identitaetProfilGesamtbericht: string;
  eigenschaftenPersoenlichkeit: string;
  neigungenInteressen: string;
  motiveAntriebe: string;
  faehigkeitenKompetenzen: string;
  beruflichesIdentitaetsProfilReport: string;

  profilePicture: string;
  valouZielstylingData: UserDataCollection;
  valouZielstylingSummary: string;

  riasec?: RiasecData;
  personalityScreening?: PersonalityScreeningData;
  motivationScreening?: MotivationScreeningData;
  futureSkillsScreening?: FutureSkillsScreeningData; // Added Future Skills
  decisionCriteriaReport?: string;
  cultureMatchReport?: string;

  jobMatchingPreferences?: JobMatchingPreferences;
  jobMatches?: JobMatch[];
  jobSearchGroundingSources?: GroundingChunkWeb[];

  logbookEntries?: LogbookEntry[];
  currentPhase?: CareerPhase; 
}

export type AppCurrentPage =
  | 'home'
  | 'valouStyling'
  | 'riasecTool'
  | 'toolsOverview'
  | 'identityProfileOverview'
  | 'personalityScreeningTool'
  | 'motivationScreeningTool'
  | 'futureSkillsScreeningTool' // Added Future Skills Tool Page
  | 'decisionMakingOverview'
  | 'logbook';

export type StylingSentenceLoadingState = string | null;

export type CategorySuggestionLoadingState = {
  areaId: string;
  category: UserDataCategoryKey;
} | null;

export interface CategorySuggestionItem {
  list: string[];
  areaId: string;
  category: UserDataCategoryKey;
}