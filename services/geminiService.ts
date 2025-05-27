

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
    UserDataCollection, ValouAreaItem, GroundingMetadata, GroundingChunkWeb, UserDataEntry, ProfileData, 
    UserDataCategoryKey, 
    USER_DATA_CATEGORIES, 
    RiasecData, // Added RiasecData here
    RiasecScoreData, RiasecScoreDetail,
    PersonalityScreeningData, BigFiveDimensionScore, AppCurrentPage,
    JobMatch, JobMatchingPreferences, MotivationScreeningData, MotiveDimensionScore,
    FutureSkillsScreeningData, FutureSkillDimensionScore, BigFiveTraitScore
} from '../types';
import { VALOU_AREAS, CATEGORY_LABELS, RIASEC_DESCRIPTIONS, BIG_FIVE_DIMENSION_DEFINITIONS, BIG_FIVE_TRAITS_CONFIG, MOTIVATION_DIMENSIONS_CONFIG, FUTURE_SKILLS_DIMENSIONS_CONFIG } from '../constants'; // Added FUTURE_SKILLS_DIMENSIONS_CONFIG
import { areAllIdentityScreeningsComplete } from '../appUtils'; // For checking completeness

const API_KEY = process.env.API_KEY;

export interface AiRecommendationResponse {
  text: string;
  sources?: GroundingMetadata;
}

const getProfileReportSnippet = (profileData: ProfileData, maxLength: number = 300): string => {
    if (profileData.beruflichesIdentitaetsProfilReport && profileData.beruflichesIdentitaetsProfilReport.trim() !== "" && !profileData.beruflichesIdentitaetsProfilReport.startsWith("Fehler:")) {
        return profileData.beruflichesIdentitaetsProfilReport.substring(0, maxLength) + (profileData.beruflichesIdentitaetsProfilReport.length > maxLength ? "..." : "");
    }
    return "Kein umfassender Identitätsreport vorhanden oder generiert.";
};


export const getComprehensiveCoachingReport = async (profileData: ProfileData): Promise<AiRecommendationResponse> => {
  if (!API_KEY) {
    console.warn("API_KEY nicht konfiguriert. KI-Funktionen sind möglicherweise eingeschränkt.");
    return { text: "Fehler: API-Schlüssel nicht konfiguriuriert. Bitte richte die Umgebungsvariable `API_KEY` ein." };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const userData = profileData.valouZielstylingData; 

  let prompt = `Du bist Dr.GoodWork, ein KI-Karriere-Experte und Ratgeber. Ein Nutzer befindet sich in einer beruflichen und persönlichen Umbruchphase und nutzt verschiedene Tools zur Selbstreflexion. Hilf ihm, Klarheit zu gewinnen und ein ganzheitliches Verständnis seiner Situation zu entwickeln.

Hier sind die Informationen, die Du vom Nutzer erhalten hast:

**Allgemeines Profil des Nutzers:**
- Persönliche Notizen/Über mich: ${profileData.personalNotes || "Keine Angabe"}
- Erfahrungen: ${profileData.experience || "Keine Angabe"}
- Qualifikationen: ${profileData.qualifications || "Keine Angabe"}
- Zielbranchen: ${profileData.targetIndustries || "Keine Angabe"}
- Ausschlusskriterien für Branchen/Tätigkeiten: ${profileData.exclusionCriteria || "Keine Angabe"}

**Berufliches Identitätsprofil des Nutzers (manuelle Eingaben):**
- Gesamteindruck/Zusammenfassung des Identitätsprofils: ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Eigenschaften und Persönlichkeit (manuell): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}
- Neigungen und Interessen (manuell ergänzt): ${profileData.neigungenInteressen || "Keine Angabe"}
- Motive und Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}
- Besondere Fähigkeiten und Kompetenzen: ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}

**Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):**
${getProfileReportSnippet(profileData, 500)} 
`;

  if (profileData.riasec && profileData.riasec.scores) {
    prompt += `\n**RIASEC Interessen-Profil (Tool-Ergebnis):**\n`;
    prompt += `- Holland-Code: ${profileData.riasec.hollandCode || "N/A"}${profileData.riasec.hollandType ? ` (${profileData.riasec.hollandType})` : ''}\n`;
    prompt += `- Interessen-Hierarchie (Top 3): ${profileData.riasec.hierarchy.slice(0, 3).map(area => `${RIASEC_DESCRIPTIONS[area]?.label || area} (${area})`).join(' > ')}\n`;
    if (profileData.riasec.report) {
        const reportSummaryMatch = profileData.riasec.report.match(/5\.\s*Abschließende Bewertung\s*([\s\S]*)/);
        if (reportSummaryMatch && reportSummaryMatch[1]) {
            let summaryText = reportSummaryMatch[1].trim();
            const sentences = summaryText.split(/[.!?]+\s/).filter(s => s.length > 0);
            summaryText = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
            prompt += `- Zusammenfassung des RIASEC-Reports: ${summaryText || "Siehe Detailreport."}\n`;
        }
    }
  }

  if (profileData.personalityScreening) {
    const scaleMax = 10; // PersonalityToolPage scale
    const scaleNeutral = Math.ceil((1 + scaleMax) / 2); // e.g., 6 for 1-10

    prompt += `\n**Persönlichkeits-Profil (Tool-Ergebnis, Skala 1-${scaleMax}):**\n`;
    if (profileData.personalityScreening.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0) {
        prompt += `- Selbst zugeschriebene Eigenschaften: ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}\n`;
    }
    if (profileData.personalityScreening.bigFiveScores) {
        profileData.personalityScreening.bigFiveScores.forEach(dim => {
        prompt += `- Big Five ${dim.label}: Score ${dim.score.toFixed(2)}/${scaleMax}. Ausprägung eher Richtung ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel}.\n`;
        });
    }
     if (profileData.personalityScreening.report) {
        const reportSummaryMatch = profileData.personalityScreening.report.match(/Zusammenfassung und Kernbotschaft\s*([\s\S]*?)(?:###|$)/i);
        if (reportSummaryMatch && reportSummaryMatch[1]) {
            let summaryText = reportSummaryMatch[1].trim();
            const sentences = summaryText.split(/[.!?]+\s/).filter(s => s.length > 0);
            summaryText = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
            prompt += `- Zusammenfassung des Persönlichkeits-Reports: ${summaryText || "Siehe Detailreport."}\n`;
        }
    }
  }
  
  if (profileData.motivationScreening?.dimensionScores) {
    prompt += `\n**Antriebe & Motivation (Tool-Ergebnis, Skala 1-10):**\n`;
    profileData.motivationScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore) // Sort by highest score first
      .forEach(dim => {
        prompt += `- Anreizdimension "${dim.label}": Durchschnitt ${dim.averageScore.toFixed(1)}/10.\n`;
        // Optionally list top 1-2 motives in this dimension if very high
        const topMotives = dim.motivations.filter(m => m.value >=8).map(m => m.label).join(', ');
        if (topMotives) prompt += `  (Besonders stark: ${topMotives})\n`;
    });
     if (profileData.motivationScreening.report) {
        const reportSummaryMatch = profileData.motivationScreening.report.match(/Zusammenfassung und Kernbotschaft\s*([\s\S]*?)(?:###|$)/i);
        if (reportSummaryMatch && reportSummaryMatch[1]) {
            let summaryText = reportSummaryMatch[1].trim();
            const sentences = summaryText.split(/[.!?]+\s/).filter(s => s.length > 0);
            summaryText = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
            prompt += `- Zusammenfassung des Motivations-Reports: ${summaryText || "Siehe Detailreport."}\n`;
        }
    }
  }

  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `\n**Future Skills (Tool-Ergebnis, Skala 1-10):**\n`;
    profileData.futureSkillsScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore)
      .forEach(dim => {
        prompt += `- Kompetenzdimension "${dim.label}": Durchschnitt ${dim.averageScore.toFixed(1)}/10.\n`;
        const topSkills = dim.skills.filter(s => s.value >=8).map(s => s.label).join(', ');
        if (topSkills) prompt += `  (Besonders stark: ${topSkills})\n`;
    });
     if (profileData.futureSkillsScreening.report) {
        // Assuming similar report structure for summary extraction
        const reportSummaryMatch = profileData.futureSkillsScreening.report.match(/Zusammenfassung und Kernbotschaft\s*([\s\S]*?)(?:###|$)/i);
        if (reportSummaryMatch && reportSummaryMatch[1]) {
            let summaryText = reportSummaryMatch[1].trim();
            const sentences = summaryText.split(/[.!?]+\s/).filter(s => s.length > 0);
            summaryText = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
            prompt += `- Zusammenfassung des Future Skills Reports: ${summaryText || "Siehe Detailreport."}\n`;
        }
    }
  }


  prompt += `\n**Gewünschter zukünftiger Zustand in verschiedenen Lebensbereichen (Valou-Analyse):**\n`;
  VALOU_AREAS.forEach((area: ValouAreaItem) => {
    const areaData = userData[area.id];
    if (areaData) {
      prompt += `\nBereich: ${area.name} (${area.description})\n`;
      prompt += `- Dein Stylingsatz: ${areaData.stylingSatz || "Noch nicht definiert"}\n`;
      prompt += `- Vorlieben / Energiespender: ${areaData.vorlieben.length > 0 ? areaData.vorlieben.join(', ') : "Keine"}\n`;
      prompt += `- Abneigungen / Energiefresser: ${areaData.abneigungen.length > 0 ? areaData.abneigungen.join(', ') : "Keine"}\n`;
      prompt += `- Must-Haves: ${areaData.mustHaves.length > 0 ? areaData.mustHaves.join(', ') : "Keine"}\n`;
      prompt += `- No-Gos: ${areaData.noGos.length > 0 ? areaData.noGos.join(', ') : "Keine"}\n`;
    }
  });

  prompt += `
Basierend auf diesen umfassenden Informationen (Allgemeines Profil, Berufliches Identitätsprofil inkl. Tool-Ergebnissen wie RIASEC, Persönlichkeit, Motivation und Future Skills, und Valou-Analyse), erstelle bitte **ganzheitliche Tipps und Ratschläge**:
1.  **Eine prägnante Interpretation Deiner allgemeinen Karriereziele, Grundwerte und wichtigsten Interessen/Persönlichkeitsmerkmale/Antriebe/Future Skills.** Was scheint Dir besonders wichtig zu sein, wenn man alle Datenquellen berücksichtigt? Hebe mögliche Synergien oder interessante Muster hervor, die sich aus der Kombination der verschiedenen Daten (Profil, RIASEC, Persönlichkeit, Motivation, Future Skills, Valou) ergeben.
2.  **Personalisierte Empfehlungen für Karrierewege, Arbeitsumgebungen oder nächste Entwicklungsschritte.** Diese sollten mit Deinen angegebenen Vorlieben, Must-Haves und No-Gos sowie Deinem gesamten Profil (insbesondere Identitätsprofil und Tool-Ergebnisse) übereinstimmen. Sei konkret und gib praktische Ratschläge.
3.  **Hervorhebung potenzieller Konflikte, Spannungsfelder oder Bereiche, die Deiner weiteren Reflexion bedürfen.** Gibt es Widersprüche in Deinen Angaben (z.B. zwischen Valou, RIASEC, Persönlichkeit, Motivation, Future Skills oder manuellen Profileingaben und Tool-Ergebnissen) oder Aspekte, die Du vielleicht noch nicht bedacht hast?
4.  **Ermutigung und nächste Schritte.** Gib dem Nutzer eine positive und motivierende Perspektive für seine Weiterentwicklung.

Antworte in einem klaren, handlungsorientierten und einfühlsamen Ton. Sprich den Nutzer direkt mit "Du" an. Formatiere die Antwort mit Markdown für beste Lesbarkeit (Überschriften, Listen, Fettungen).`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });

    const responseText = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;
    
    return {
        text: responseText,
        sources: sources
    };

  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Dr. GoodWork Gesamt-Tipps:", error);
    if (error instanceof Error) {
        return { text: `Fehler bei den Dr. GoodWork Gesamt-Tipps: ${error.message}`};
    }
    return { text: "Ein unbekannter Fehler ist bei den Dr. GoodWork Gesamt-Tipps aufgetreten."};
  }
};

export const getStylingSentenceSuggestion = async (areaName: string, areaDescription: string, areaData: UserDataEntry, profileData: ProfileData): Promise<string> => {
  if (!API_KEY) {
    console.warn("API_KEY nicht konfiguriert. KI-Funktionen sind möglicherweise eingeschränkt.");
    return "Fehler: API-Schlüssel nicht konfiguriert.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10; 
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist ein kreativer Assistent, der hilft, prägnante Stylingsätze zu formulieren.
Der Nutzer reflektiert gerade den Bereich "${areaName}" mit der Leitfrage "${areaDescription}".
Die Stichpunkte des Nutzers zu diesem Bereich sind:
- Vorlieben / Energiespender: ${areaData.vorlieben.length > 0 ? areaData.vorlieben.join(', ') : "Keine spezifischen Angaben"}\n`;
  prompt += `- Abneigungen / Energiefresser: ${areaData.abneigungen.length > 0 ? areaData.abneigungen.join(', ') : "Keine spezifischen Angaben"}\n`;
  prompt += `- Must-Haves: ${areaData.mustHaves.length > 0 ? areaData.mustHaves.join(', ') : "Keine spezifischen Angaben"}\n`;
  prompt += `- No-Gos: ${areaData.noGos.length > 0 ? areaData.noGos.join(', ') : "Keine spezifischen Angaben"}\n\n`;

  // Include relevant profile data for context
  prompt += `Zusätzlicher Kontext aus dem Profil des Nutzers (falls relevant für den Stylingsatz dieses Bereichs):\n`;
  prompt += `- Gesamteindruck/Identitätsprofil: ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}\n`;
  prompt += `- Eigenschaften/Persönlichkeit: ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}\n`;
  if (profileData.personalityScreening?.selectedGeneralAdjectives?.length) {
    prompt += `- Selbst zugeschriebene Eigenschaften (Tool): ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}\n`;
  }
  if (profileData.personalityScreening?.bigFiveScores) {
    prompt += `- Big Five Tendenzen (Tool, Skala 1-${scaleMax}):\n`;
    profileData.personalityScreening.bigFiveScores.forEach(dim => {
      prompt += `  - ${dim.label}: Score ${dim.score.toFixed(1)}, eher ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel}\n`;
    });
  }
  prompt += `- Neigungen/Interessen: ${profileData.neigungenInteressen || "Keine Angabe"}\n`;
  if (profileData.riasec?.hollandCode) {
    prompt += `- RIASEC Holland Code (Tool): ${profileData.riasec.hollandCode} (${profileData.riasec.hollandType || RIASEC_DESCRIPTIONS[profileData.riasec.hierarchy[0]]?.label || 'N/A'})\n`;
  }
  prompt += `- Motive/Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}\n`;
    if (profileData.motivationScreening?.dimensionScores) {
    prompt += `- Top Anreizdimensionen (Tool):\n`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7) 
        .slice(0,2) 
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `- Top Future Skills Dimensionen (Tool):\n`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  prompt += `- Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}\n\n`;
  prompt += `- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n\n`;


  prompt += `Formuliere basierend auf diesen Informationen einen inspirierenden, prägnanten und positiven Stylingsatz (maximal 25 Wörter) für den Bereich "${areaName}".
Der Satz sollte die Essenz dessen widerspiegeln, was dem Nutzer in diesem Bereich wichtig ist.
Antworte NUR mit dem Stylingsatz, ohne einleitende oder abschließende Bemerkungen.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    const text = response.text.trim();
    // Remove potential markdown quotes
    return text.replace(/^["']|["']$/g, "");
  } catch (error) {
    console.error(`Fehler bei der Anfrage an die Gemini API für Stylingsatz (${areaName}):`, error);
    if (error instanceof Error) {
        return `Fehler: ${error.message}`;
    }
    return "Fehler: Ein unbekannter Fehler ist aufgetreten.";
  }
};


export const getSuggestionsForCategoryItems = async (
  areaName: string, 
  areaDescription: string, 
  areaTipps: string[],
  categoryKey: UserDataCategoryKey, 
  existingItems: string[],
  profileData: ProfileData
): Promise<string[]> => {
  if (!API_KEY) return [];
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10; 
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist ein hilfreicher Assistent. Der Nutzer füllt gerade sein Valou Styling für den Bereich "${areaName}" (${areaDescription}) aus.
Die allgemeinen Tipps für diesen Bereich sind: ${areaTipps.join(', ')}.
Er ist bei der Kategorie "${CATEGORY_LABELS[categoryKey]}".
Bereits vorhandene Einträge in dieser Kategorie: ${existingItems.length > 0 ? existingItems.join('; ') : "Keine."}

Hier sind weitere Daten aus dem Profil des Nutzers, die für die Vorschläge relevant sein könnten:
- Gesamteindruck/Identitätsprofil: ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Eigenschaften/Persönlichkeit (manuell): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}`;
  if (profileData.personalityScreening?.selectedGeneralAdjectives?.length) {
    prompt += `\n- Selbst zugeschriebene Eigenschaften (Tool): ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}`;
  }
  if (profileData.personalityScreening?.bigFiveScores) {
    prompt += `\n- Big Five Tendenzen (Tool, Skala 1-${scaleMax}):`;
    profileData.personalityScreening.bigFiveScores.forEach(dim => {
      prompt += `\n  - ${dim.label}: Score ${dim.score.toFixed(1)}, eher ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel}`;
    });
  }
  prompt += `\n- Neigungen/Interessen (manuell): ${profileData.neigungenInteressen || "Keine Angabe"}`;
  if (profileData.riasec?.hollandCode) {
    prompt += `\n- RIASEC Holland Code (Tool): ${profileData.riasec.hollandCode} (${profileData.riasec.hollandType || RIASEC_DESCRIPTIONS[profileData.riasec.hierarchy[0]]?.label || 'N/A'})`;
  }
  prompt += `\n- Motive/Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}`;
    if (profileData.motivationScreening?.dimensionScores) {
    prompt += `\n- Top Anreizdimensionen (Tool):`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `\n  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `\n- Top Future Skills Dimensionen (Tool):`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `\n  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})`;
    });
  }
  prompt += `\n- Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}\n`;
  prompt += `- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n\n`;
  
  const valouStylingContext = VALOU_AREAS.map(area => {
    const data = profileData.valouZielstylingData[area.id];
    if (data && data.stylingSatz) {
      return `Valou Bereich ${area.name} - Stylingsatz: "${data.stylingSatz}"`;
    }
    return null;
  }).filter(Boolean).join("\n");
  if (valouStylingContext) {
      prompt += `\nBisherige Valou Stylingsätze aus anderen Bereichen:\n${valouStylingContext}\n`;
  }

  prompt += `
Bitte generiere 3-5 kurze, prägnante Stichpunkte (jeweils max. 10 Wörter), die der Nutzer für die Kategorie "${CATEGORY_LABELS[categoryKey]}" im Bereich "${areaName}" hinzufügen könnte.
Die Vorschläge sollten:
1.  Zum Bereich "${areaName}" passen.
2.  Zur Kategorie "${CATEGORY_LABELS[categoryKey]}" passen.
3.  Die bereits vorhandenen Einträge sinnvoll ergänzen (keine Duplikate oder sehr ähnliche).
4.  Die Gesamtpersönlichkeit und Ziele des Nutzers (aus den Profildaten) widerspiegeln, falls möglich und passend.
5.  Kreativ und inspirierend sein.

Antworte NUR mit einer JSON-Liste von Strings, z.B. ["Vorschlag 1", "Vorschlag 2", "Vorschlag 3"].
Wenn keine passenden Vorschläge generiert werden können, antworte mit einer leeren Liste [].
Stelle sicher, dass jeder String in der JSON-Liste korrekt in doppelten Anführungszeichen eingeschlossen ist und die Strings durch Kommas getrennt sind. Das Array muss mit '[' beginnen und mit ']' enden.
`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    const suggestions = JSON.parse(jsonStr);
    if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
        return suggestions.filter(s => !existingItems.includes(s)); // Filter out duplicates again just in case
    }
    return [];
  } catch (error) {
    console.error(`Fehler bei der Anfrage an die Gemini API für Kategorieneinträge (${areaName} - ${categoryKey}):`, error);
    return [];
  }
};


export const generateKiStylingForAllAreas = async (profileData: ProfileData, areas: ValouAreaItem[]): Promise<UserDataCollection> => {
  if (!API_KEY) {
    console.warn("API_KEY nicht konfiguriert. KI-Funktionen sind möglicherweise eingeschränkt.");
    const errorResult = { ...profileData.valouZielstylingData };
    areas.forEach(area => {
      if (!errorResult[area.id]) errorResult[area.id] = { stylingSatz: '', vorlieben: [], abneigungen: [], mustHaves: [], noGos: [] };
      errorResult[area.id].stylingSatz = "Fehler: API-Schlüssel nicht konfiguriert.";
    });
    return errorResult;
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10;
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let basePrompt = `Du bist Dr. GoodWork, ein KI-Karriere-Coach. Hilf einem Nutzer, sein Valou Ziel-Styling für verschiedene Lebensbereiche zu verfeinern oder zu erstellen.
Der Nutzer hat bereits einige Daten in seinem Profil hinterlegt. Nutze diese, um möglichst passende und persönliche Vorschläge zu generieren.

**Profildaten des Nutzers:**
- Gesamteindruck/Identitätsprofil: ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Eigenschaften/Persönlichkeit (manuell): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}`;
  if (profileData.personalityScreening?.selectedGeneralAdjectives?.length) {
    basePrompt += `\n- Selbst zugeschriebene Eigenschaften (Tool): ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}`;
  }
  if (profileData.personalityScreening?.bigFiveScores) {
    basePrompt += `\n- Big Five Tendenzen (Tool, Skala 1-${scaleMax}):`;
    profileData.personalityScreening.bigFiveScores.forEach(dim => {
      basePrompt += `\n  - ${dim.label}: Score ${dim.score.toFixed(1)}, eher ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel}`;
    });
  }
 basePrompt += `\n- Neigungen/Interessen (manuell): ${profileData.neigungenInteressen || "Keine Angabe"}`;
  if (profileData.riasec?.hollandCode) {
    basePrompt += `\n- RIASEC Holland Code (Tool): ${profileData.riasec.hollandCode} (${profileData.riasec.hollandType || RIASEC_DESCRIPTIONS[profileData.riasec.hierarchy[0]]?.label || 'N/A'})`;
  }
  basePrompt += `\n- Motive/Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}`;
  if (profileData.motivationScreening?.dimensionScores) {
    basePrompt += `\n- Top Anreizdimensionen (Tool):`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            basePrompt += `\n  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    basePrompt += `\n- Top Future Skills Dimensionen (Tool):`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            basePrompt += `\n  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})`;
    });
  }
  basePrompt += `\n- Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}\n`;
  basePrompt += `- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n\n`;


  basePrompt += `**Anweisungen für die JSON-Ausgabe:**
Gib für jeden der folgenden Bereiche ein JSON-Objekt zurück, das die Felder 'stylingSatz', 'vorlieben', 'abneigungen', 'mustHaves' und 'noGos' enthält.

**WICHTIG für die JSON-Formatierung:**
1.  Das gesamte Ergebnis MUSS ein valides JSON-Objekt sein, wobei die Schlüssel die Bereichs-IDs sind (z.B. "privatesLeben", "persoenlichkeitSkills", usw.) und die Werte die jeweiligen Valou-Einträge.
2.  Jeder 'stylingSatz' MUSS ein String sein. Falls der Nutzer bereits einen Stylingsatz eingegeben hat, BEHALTE DIESEN BEI. Generiere nur dann einen neuen, prägnanten Satz (max. 25 Wörter), wenn das Feld leer ist oder nur aus Platzhaltern besteht.
3.  'vorlieben', 'abneigungen', 'mustHaves', 'noGos' MÜSSEN Arrays von Strings sein.
4.  FÜR DIESE ARRAYS GILT:
    a. Berücksichtige die bereits vom Nutzer eingegebenen Stichpunkte. ERGÄNZE diese Listen um 2-3 NEUE, passende Stichpunkte. ERSTELLE KEINE DUPLIKATE zu den vorhandenen Stichpunkten.
    b. Jeder String in diesen Arrays MUSS von doppelten Anführungszeichen (\`"\`) umschlossen sein.
    c. Strings innerhalb eines Arrays MÜSSEN durch ein Komma (\`,\`) getrennt werden.
    d. NACH dem letzten String in einem Array darf KEIN Komma stehen. Beispiel KORREKT: \`["Punkt A", "Punkt B"]\`. Beispiel FALSCH: \`["Punkt A", "Punkt B",]\` oder \`[Punkt A, Punkt B]\`.
    e. Leere Arrays MÜSSEN als \`[]\` dargestellt werden.
5.  Antworte AUSSCHLIESSLICH mit dem JSON-Objekt. Keinen einleitenden Text, keine Erklärungen, kein Markdown \`\`\`json.

**Beispielhafte Struktur für einen Bereich (z.B. "privatesLeben"):**
\`\`\`json
{
  "privatesLeben": {
    "stylingSatz": "Ein harmonisches Zuhause in der Natur mit Raum für Kreativität und enge Freundschaften.",
    "vorlieben": ["Wohnen im Grünen", "Regelmäßige Treffen mit Freunden", "Zeit für Hobbys"],
    "abneigungen": ["Lärmbelästigung", "Oberflächliche Bekanntschaften"],
    "mustHaves": ["Stabile Internetverbindung", "Ein eigener Arbeitsbereich"],
    "noGos": ["Unehrlichkeit im Umgang", "Ständige Erreichbarkeit"]
  }
  // ... weitere Bereiche folgen hier
}
\`\`\`
Passe die Inhalte an die spezifischen Informationen des Nutzers und den jeweiligen Bereich an.

**Zu bearbeitende Valou-Bereiche und existierende Daten des Nutzers:**\n`;

  const areasDataForPrompt = areas.map(area => {
    const existingData = profileData.valouZielstylingData[area.id] || { stylingSatz: '', vorlieben: [], abneigungen: [], mustHaves: [], noGos: [] };
    return `
Bereichs-ID: "${area.id}"
Name: "${area.name}"
Beschreibung: "${area.description}"
Tipps für den Bereich: ${area.tipps.join(', ')}
Existierender Stylingsatz: "${existingData.stylingSatz}"
Existierende Vorlieben: ${JSON.stringify(existingData.vorlieben)}
Existierende Abneigungen: ${JSON.stringify(existingData.abneigungen)}
Existierende Must-Haves: ${JSON.stringify(existingData.mustHaves)}
Existierende No-Gos: ${JSON.stringify(existingData.noGos)}
`;
  }).join("\n---\n");

  const finalPrompt = basePrompt + areasDataForPrompt + "\nGeneriere nun das JSON-Objekt, das alle oben genannten Bereiche abdeckt.";

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: finalPrompt,
        config: { responseMimeType: "application/json" }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const kiGeneratedData = JSON.parse(jsonStr) as UserDataCollection;
    
    // Merge KI data with existing data carefully
    const mergedData = { ...profileData.valouZielstylingData };
    for (const areaId in kiGeneratedData) {
        if (mergedData[areaId] && kiGeneratedData[areaId]) {
            const existingEntry = mergedData[areaId];
            const kiEntry = kiGeneratedData[areaId];

            // Styling Satz: KI nur wenn leer oder Placeholder
            if (!existingEntry.stylingSatz || existingEntry.stylingSatz.includes("Noch nicht definiert")) {
                 mergedData[areaId].stylingSatz = kiEntry.stylingSatz;
            }

            // Listen: KI-Vorschläge zu bestehenden hinzufügen (ohne Duplikate)
            USER_DATA_CATEGORIES.forEach(category => {
                const existingList = existingEntry[category] || [];
                const kiList = kiEntry[category] || [];
                const combinedSet = new Set([...existingList, ...kiList]);
                mergedData[areaId][category] = Array.from(combinedSet);
            });
        } else if (kiGeneratedData[areaId]) { // If area didn't exist, take KI's
             mergedData[areaId] = kiGeneratedData[areaId];
        }
    }
    return mergedData;

  } catch (error: any) {
    console.error("Fehler beim globalen KI Styling:", error);
    const errorResult = { ...profileData.valouZielstylingData };
    areas.forEach(area => {
        if (!errorResult[area.id]) errorResult[area.id] = { stylingSatz: '', vorlieben: [], abneigungen: [], mustHaves: [], noGos: [] };
        errorResult[area.id].stylingSatz = errorResult[area.id].stylingSatz || `Fehler beim Generieren des KI-Stylings für Bereich "${area.name}": ${error.message || 'Unbekannter Fehler'}`;
        // Behalte bestehende Listen bei Fehler
        USER_DATA_CATEGORIES.forEach(cat => {
            errorResult[area.id][cat] = profileData.valouZielstylingData[area.id]?.[cat] || [];
        });
    });
    return errorResult;
  }
};

// Added generateValouZielsummary function
export const generateValouZielsummary = async (valouData: UserDataCollection, profileData: ProfileData): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  let valouDataString = "";
  VALOU_AREAS.forEach((area: ValouAreaItem) => {
    const areaData = valouData[area.id];
    if (areaData) {
      valouDataString += `\n**Bereich: ${area.name} (${area.description})**\n`;
      valouDataString += `- Dein Stylingsatz: ${areaData.stylingSatz || "Noch nicht definiert"}\n`;
      if (areaData.vorlieben.length > 0) valouDataString += `- Vorlieben / Energiespender: ${areaData.vorlieben.join(', ')}\n`;
      if (areaData.abneigungen.length > 0) valouDataString += `- Abneigungen / Energiefresser: ${areaData.abneigungen.join(', ')}\n`;
      if (areaData.mustHaves.length > 0) valouDataString += `- Must-Haves: ${areaData.mustHaves.join(', ')}\n`;
      if (areaData.noGos.length > 0) valouDataString += `- No-Gos: ${areaData.noGos.join(', ')}\n`;
    }
  });

  let prompt = `Du bist Dr. GoodWork, ein KI-Karriere-Coach. Du hilfst einem Nutzer, eine Zusammenfassung seines Valou Ziel-Stylings zu erstellen.
Das Valou Ziel-Styling beschreibt den gewünschten zukünftigen Zustand des Nutzers in verschiedenen Lebensbereichen.

Hier sind die Valou-Daten des Nutzers:
${valouDataString}

Hier sind zusätzliche Kontextinformationen aus dem Profil des Nutzers:
- Gesamteindruck/Identitätsprofil: ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Eigenschaften/Persönlichkeit: ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}
- Neigungen/Interessen: ${profileData.neigungenInteressen || "Keine Angabe"}
- Motive/Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}
`;
  if (profileData.motivationScreening?.dimensionScores) {
    prompt += `- Top Anreizdimensionen (Tool):\n`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `- Top Future Skills Dimensionen (Tool):\n`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  prompt += `- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n\n`;
  prompt += `
Aufgabe:
Erstelle eine prägnante, aufschlussreiche und positive Zusammenfassung des gesamten Valou Ziel-Stylings des Nutzers.
Die Zusammenfassung sollte:
1.  Die Kernaussagen und wichtigsten Themen aus allen Valou-Bereichen integrieren.
2.  Mögliche übergreifende Muster, Synergien oder das "große Ganze" des gewünschten Zustands hervorheben.
3.  Nicht einfach nur die einzelnen Bereiche auflisten, sondern eine synthetisierende Erzählung oder Bewertung bieten.
4.  In einem motivierenden und klaren Ton formuliert sein, den Nutzer direkt mit "Du" ansprechen.
5.  Etwa 150-250 Wörter umfassen. Formatiere die Antwort mit Markdown (Absätze, Listen, Fettungen wenn sinnvoll).

Antworte NUR mit dem zusammenfassenden Text, ohne einleitende oder abschließende Bemerkungen.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Valou Zusammenfassung:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren der Valou Zusammenfassung: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren der Valou Zusammenfassung aufgetreten.";
  }
};


export const getRiasecReport = async (
  sortedScores: RiasecScoreDetail[],
  profileData: ProfileData
): Promise<{ reportText: string, hollandCode: string, hollandType: string }> => {
  if (!API_KEY) {
    return { 
      reportText: "Fehler: API-Schlüssel nicht konfiguriert.",
      hollandCode: "N/A",
      hollandType: "Nicht ermittelbar"
    };
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const topThreeAreas = sortedScores.slice(0, 3);
  const hollandCode = topThreeAreas.map(s => s.area).join('');
  const hollandTypeGuess = `${topThreeAreas[0]?.label || ''}${topThreeAreas[1] ? `-${topThreeAreas[1].label}` : ''}${topThreeAreas[2] ? `-${topThreeAreas[2].label}` : ''} Typ`;


  let prompt = `Du bist Dr. GoodWork, ein erfahrener KI-Berufsberater. Ein Nutzer hat gerade einen RIASEC-Interessen-Self-Check durchgeführt. Erstelle einen prägnanten, motivierenden und hilfreichen Kurzreport. Sprich den Nutzer direkt mit "Du" an.

Hier sind die Ergebnisse des Nutzers (Skala 1-10, höhere Werte bedeuten stärkere Ausprägung):
${sortedScores.map(s => `- ${s.label} (${s.area}): ${s.value.toFixed(2)} (Beschreibung: ${s.description})`).join('\n')}

Abgeleiteter Holland Code (Top 3): ${hollandCode}

Weitere Profildaten des Nutzers zur Kontextualisierung (optional für Deine Interpretation heranziehen):
- Eigenschaften/Persönlichkeit (manuell): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}
- Neigungen/Interessen (manuell): ${profileData.neigungenInteressen || "Keine Angabe"}
- Motive/Antriebe: ${profileData.motiveAntriebe || "Keine Angabe"}
`;
  if (profileData.motivationScreening?.dimensionScores) {
    prompt += `- Top Anreizdimensionen (Tool):\n`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `- Top Future Skills Dimensionen (Tool):\n`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
prompt += `
- Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}
- Zielbranchen: ${profileData.targetIndustries || "Keine Angabe"}
- Valou Stylingsätze (falls vorhanden):
${VALOU_AREAS.map(area => {
  const data = profileData.valouZielstylingData[area.id];
  return data && data.stylingSatz ? `  - ${area.name}: "${data.stylingSatz}"` : null;
}).filter(Boolean).join("\n") || "  Keine Valou Stylingsätze definiert."}
- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n`;

prompt += `
**Struktur des Reports:**
Formatiere Deinen Report mit Markdown. Nutze Überschriften (##), Listen und Fettungen.

1.  **Einleitung:** Begrüße den Nutzer freundlich und erkläre kurz den Zweck des Reports.
2.  **Dein Interessenprofil im Überblick:**
    *   Nenne den Holland-Code (${hollandCode}) und gib eine kurze, verständliche Beschreibung des abgeleiteten Typus (z.B. "${hollandTypeGuess}").
    *   Erläutere die Top 3 Interessenbereiche (${topThreeAreas.map(s => s.label).join(', ')}) kurz und prägnant. Was bedeutet das für den Nutzer?
3.  **Stärken und Potenziale:** Welche typischen Stärken und Potenziale sind mit diesem Interessenprofil verbunden?
4.  **Passende Berufsfelder und Tätigkeiten:**
    *   Nenne 3-5 konkrete Berufsfelder oder Tätigkeitsbereiche, die gut zu diesem Profil passen könnten.
    *   Berücksichtige dabei auch die weiteren Profildaten des Nutzers (falls passend und ohne sie explizit zu wiederholen, sondern implizit in die Vorschläge einfließen lassen).
5.  **Abschließende Bewertung und nächste Schritte:**
    *   Fasse die wichtigsten Erkenntnisse zusammen.
    *   Gib dem Nutzer 1-2 konkrete Impulse oder Fragen für seine weitere Reflexion und Recherche. Ermutige ihn.

**Wichtige Hinweise für Deine Antwort:**
*   Sei positiv und wertschätzend.
*   Vermeide Fachjargon, wo es geht, oder erkläre ihn kurz.
*   Der Report sollte nicht länger als 300-400 Wörter sein.
*   Antworte NUR mit dem Report-Text.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });

    const reportText = response.text.trim();
    
    // Try to extract Holland Type Name from AI response if it differs from guess
    let finalHollandType = hollandTypeGuess;
    // Example: Search for "Du bist ein typischer Realistisch-Investigativ-Artistisch (RIA) Typ."
    const typeMatch = reportText.match(new RegExp(`(?:Der abgeleitete Holland-Code lautet ${hollandCode}.)\\s*(?:Dies entspricht einem|Du bist ein typischer|Das bedeutet, Du bist ein|Dies deutet auf einen)\\s*([^.(]*?)(?:\\s*\\(${hollandCode}\\))?\\s*Typ`, "i"));
    if (typeMatch && typeMatch[1] && typeMatch[1].trim().length > 5) { // Check for reasonable length
        finalHollandType = typeMatch[1].trim();
    }


    return { reportText, hollandCode, hollandType: finalHollandType };

  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für RIASEC Report:", error);
    if (error instanceof Error) {
      return { 
        reportText: `Fehler beim Generieren des Reports: ${error.message}`,
        hollandCode,
        hollandType: hollandTypeGuess // Fallback
      };
    }
    return { 
      reportText: "Ein unbekannter Fehler ist beim Generieren des Reports aufgetreten.",
      hollandCode,
      hollandType: hollandTypeGuess // Fallback
    };
  }
};


export const getPersonalityReport = async (
  bigFiveScores: BigFiveDimensionScore[],
  profileData: ProfileData, // Gesamtes Profil für Kontext
  scaleMax: number,
  scaleNeutral: number
): Promise<{ reportText: string }> => {
  if (!API_KEY) {
    return { reportText: "Fehler: API-Schlüssel nicht konfiguriert." };
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  let prompt = `Du bist Dr. GoodWork, ein erfahrener KI-Coach für Persönlichkeitsentwicklung. Ein Nutzer hat gerade ein Persönlichkeits-Screening durchgeführt, das sowohl eine Selbstauswahl allgemeiner Eigenschaften als auch eine Bewertung spezifischer Adjektive nach dem Big Five Modell umfasst. Erstelle einen einfühlsamen, tiefgründigen und handlungsorientierten Report. Sprich den Nutzer direkt mit "Du" an.

**Die Ergebnisse des Nutzers:**

**1. Selbst zugeschriebene allgemeine Eigenschaften:**
${profileData.personalityScreening?.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0
  ? `- ${profileData.personalityScreening.selectedGeneralAdjectives.join('\n- ')}`
  : "- Keine spezifischen allgemeinen Eigenschaften ausgewählt."}

**2. Big Five Ergebnisse (Skala 1-${scaleMax}, Neutralwert um ${scaleNeutral}):**
${bigFiveScores.map(dim => 
  `- Dimension "${dim.label}" (${dim.dimension}): Gesamtscore ${dim.score.toFixed(2)}.
    Ausprägung Pol "${dim.positivePole.poleLabel}": ${dim.positivePole.score.toFixed(2)}.
    Ausprägung Pol "${dim.negativePole.poleLabel}": ${dim.negativePole.score.toFixed(2)}.`
).join('\n')}

**Weitere Profildaten des Nutzers zur Kontextualisierung:**
- Gesamteindruck/Identitätsprofil (manuell): ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Neigungen/Interessen (manuell): ${profileData.neigungenInteressen || "Keine Angabe"}
- RIASEC Holland Code (Tool): ${profileData.riasec?.hollandCode || "Nicht durchgeführt"} (${profileData.riasec?.hollandType || "N/A"})
- Motive/Antriebe (manuell): ${profileData.motiveAntriebe || "Keine Angabe"}
`;
  if (profileData.motivationScreening?.dimensionScores) {
    prompt += `- Top Anreizdimensionen (Tool):\n`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `- Top Future Skills Dimensionen (Tool):\n`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `  - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
prompt += `
- Fähigkeiten/Kompetenzen (manuell): ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}
- Zielbranchen (manuell): ${profileData.targetIndustries || "Keine Angabe"}
- Valou Stylingsätze (falls vorhanden):
${VALOU_AREAS.map(area => {
  const data = profileData.valouZielstylingData[area.id];
  return data && data.stylingSatz ? `  - ${area.name}: "${data.stylingSatz}"` : null;
}).filter(Boolean).join("\n") || "  Keine Valou Stylingsätze definiert."}
- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n`;

prompt += `
**Struktur des Reports:**
Formatiere Deinen Report mit Markdown (Überschriften ## und ###, Listen, Fettungen).

**Einleitung von Dr. GoodWork**
*   Stelle Dich kurz als Dr. GoodWork vor und erläutere, dass dies ein *erster* Report basierend auf den Selbstangaben ist. Betone, dass Selbstreflexion ein Prozess ist.

**Deine Selbstwahrnehmung: Allgemeine Eigenschaften**
*   **Clustere die vom Nutzer ausgewählten allgemeinen Eigenschaften** thematisch in folgende Kategorien und stelle sie übersichtlich dar:
    *   Temperament und Charaktereigenschaften
    *   Berufliche Eigenschaften und Arbeitsstil
    *   Soziale und kommunikative Eigenschaften
*   Gib eine kurze, wertschätzende erste Deutung dieser Selbstbeschreibung. Was für ein Bild zeichnet der Nutzer von sich?

**Dein Big Five Persönlichkeitsprofil im Detail**
*   Gehe jede der fünf Dimensionen einzeln durch:
    *   Nenne die Dimension (z.B. "Offenheit für Erfahrungen").
    *   Beschreibe kurz, was diese Dimension misst.
    *   Interpretiere den Gesamtscore des Nutzers auf der Skala 1-${scaleMax}.
    *   **Stelle die beiden Pole der Dimension mit ihren Durchschnittswerten dar.**
    *   **Hebe den Pol mit dem höheren Durchschnittswert durch Markdown (fett) hervor** und interpretiere, was diese stärkere Tendenz für den Nutzer bedeuten könnte.
    *   Beziehe die Beschreibung der Dimension (aus den Konstanten) mit ein.

**Reflexion und Ambivalenzen**
*   Thematisiere kurz, dass bei Selbstscreenings manchmal sozial erwünschte Antworten gegeben werden können.
*   Rege den Nutzer an, darüber nachzudenken, ob das dargestellte Profil wirklich seiner tiefsten Selbstwahrnehmung entspricht oder ob es Aspekte gibt, die er vielleicht anders sieht.
*   **Ambivalenzen und Spannungsfelder:**
    *   Gibt es scheinbare Widersprüche oder interessante Ambivalenzen innerhalb der selbst ausgewählten allgemeinen Eigenschaften?
    *   Gibt es interessante Übereinstimmungen oder auch Spannungen zwischen den selbst ausgewählten allgemeinen Eigenschaften und den Ergebnissen des Big Five Screenings?
    *   Skizziere mögliche innere Konfliktfelder oder auch Synergien, die sich daraus ergeben könnten.

**Impulse für Deine berufliche Entwicklung**
*   Basierend auf dem gesamten Persönlichkeitsprofil (allgemeine Eigenschaften und Big Five), gib 2-3 konkrete Impulse:
    *   Welche Arbeitsumfelder oder Aufgaben könnten besonders gut zu diesem Profil passen?
    *   Welche Aspekte seiner Persönlichkeit könnte der Nutzer gezielt weiterentwickeln oder bewusster einsetzen?
    *   Berücksichtige hier auch, falls möglich, die weiteren Profildaten (RIASEC, Motive, Motivation, Ziele aus Valou etc.) für noch passgenauere Impulse.

**Zusammenfassung und Kernbotschaft**
*   Fasse die 2-3 wichtigsten Erkenntnisse oder Kernbotschaften für den Nutzer prägnant zusammen.
*   Gib einen ermutigenden Ausblick.

**Wichtige Hinweise für Deine Antwort:**
*   Sei einfühlsam, positiv und konstruktiv.
*   Der Report sollte tiefgründig, aber verständlich sein.
*   Antworte NUR mit dem Report-Text.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return { reportText: response.text.trim() };
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Persönlichkeitsreport:", error);
    if (error instanceof Error) {
      return { reportText: `Fehler beim Generieren des Reports: ${error.message}` };
    }
    return { reportText: "Ein unbekannter Fehler ist beim Generieren des Reports aufgetreten." };
  }
};

export const generateComprehensiveIdentityProfileReport = async (profileData: ProfileData): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert.";
  }
   // Check if all specific screenings are complete to generate the new short report
  if (areAllIdentityScreeningsComplete(profileData)) {
    return getShortIdentityScreeningReport(profileData);
  }

  // Fallback to original comprehensive report if not all screenings are done
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10; // Standard Big Five scale
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist Dr. GoodWork, ein KI-Experte für berufliche Identität und Karriereentwicklung.
Ein Nutzer hat verschiedene Selbstreflexions-Tools ausgefüllt und manuelle Eingaben zu seinem beruflichen Profil gemacht.
Deine Aufgabe ist es, einen **integrierten Gesamtbericht zur beruflichen Identität** des Nutzers zu erstellen.
Führe die verschiedenen Datenquellen zusammen, zeige Synergien, Muster, aber auch mögliche Diskrepanzen oder Entwicklungsfelder auf.
Der Bericht soll dem Nutzer helfen, ein tieferes, vernetztes Verständnis seiner beruflichen Identität zu gewinnen.
Sprich den Nutzer direkt mit "Du" an und sei motivierend und klar in Deiner Sprache.

**Hier sind die gesammelten Daten des Nutzers:**

**1. Manuelle Profileingaben zum beruflichen Selbstbild:**
- Gesamteindruck/Zusammenfassung des Identitätsprofils (vom Nutzer): ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
- Eigenschaften und Persönlichkeit (selbst beschrieben): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}
- Neigungen und Interessen (selbst beschrieben): ${profileData.neigungenInteressen || "Keine Angabe"}
- Motive und Antriebe (selbst beschrieben): ${profileData.motiveAntriebe || "Keine Angabe"}
- Besondere Fähigkeiten und Kompetenzen (selbst beschrieben): ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}

**2. Ergebnisse aus dem RIASEC Interessen-Check (Tool):**
${profileData.riasec
  ? `- Holland-Code: ${profileData.riasec.hollandCode || "N/A"} (${profileData.riasec.hollandType || "Typ nicht ermittelt"})
- Interessen-Hierarchie (Top 3): ${profileData.riasec.hierarchy.slice(0, 3).map(area => `${RIASEC_DESCRIPTIONS[area]?.label || area}`).join(' > ')}
- Auszug aus dem RIASEC-Report: ${profileData.riasec.report ? profileData.riasec.report.substring(0, 300) + "..." : "Kein Report vorhanden."}`
  : "- RIASEC Interessen-Check wurde noch nicht durchgeführt."}

**3. Ergebnisse aus dem Persönlichkeits-Screening (Tool):**
${profileData.personalityScreening
  ? `Selbst zugeschriebene allgemeine Eigenschaften: ${profileData.personalityScreening.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0 ? profileData.personalityScreening.selectedGeneralAdjectives.join(', ') : "Keine ausgewählt"}
Big Five Ergebnisse (Skala 1-${scaleMax}):
${profileData.personalityScreening.bigFiveScores?.map(dim => 
  `  - ${dim.label}: Score ${dim.score.toFixed(1)}, Tendenz zu ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel} (Polwerte: ${dim.positivePole.poleLabel} ${dim.positivePole.score.toFixed(1)}, ${dim.negativePole.poleLabel} ${dim.negativePole.score.toFixed(1)})`
).join('\n') || "  Keine Big Five Scores vorhanden."}
- Auszug aus dem Persönlichkeits-Report: ${profileData.personalityScreening.report ? profileData.personalityScreening.report.substring(0, 300) + "..." : "Kein Report vorhanden."}`
  : "- Persönlichkeits-Screening wurde noch nicht durchgeführt."}

**4. Ergebnisse aus dem Antriebe & Motivation Screening (Tool):**
${profileData.motivationScreening
  ? `Top Anreizdimensionen (Durchschnittswerte):\n${profileData.motivationScreening.dimensionScores
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3) // Show top 3 dimensions
      .map(dim => `  - ${dim.label}: ${dim.averageScore.toFixed(1)}/10`)
      .join('\n')}\n- Auszug aus dem Motivations-Report: ${profileData.motivationScreening.report ? profileData.motivationScreening.report.substring(0, 300) + "..." : "Kein Report vorhanden."}`
  : "- Antriebe & Motivation Screening wurde noch nicht durchgeführt."}

**5. Ergebnisse aus dem Future Skills Screening (Tool):**
${profileData.futureSkillsScreening
  ? `Top Kompetenzdimensionen (Durchschnittswerte):\n${profileData.futureSkillsScreening.dimensionScores
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3)
      .map(dim => `  - ${dim.label}: ${dim.averageScore.toFixed(1)}/10`)
      .join('\n')}\n- Auszug aus dem Future Skills Report: ${profileData.futureSkillsScreening.report ? profileData.futureSkillsScreening.report.substring(0, 300) + "..." : "Kein Report vorhanden."}`
  : "- Future Skills Screening wurde noch nicht durchgeführt."}
- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n`;

prompt += `
**Struktur des Gesamtberichts "Mein von Dr. GoodWork erstelltes Berufliches Identitätsprofil":**
Formatiere Deinen Report mit Markdown (Überschriften ## und ###, Listen, Fettungen).

**Einleitung**
*   Begrüße den Nutzer und erkläre kurz den Wert dieses integrierten Gesamtberichts für seine berufliche Orientierung.

**Dein Kernprofil: Wer bist Du beruflich?**
*   Synthese der manuellen Eingaben und der Tool-Ergebnisse zu Eigenschaften, Persönlichkeit und Interessen.
*   Was sind die hervorstechendsten Merkmale Deiner beruflichen Persönlichkeit?
*   Welche zentralen Interessen und Neigungen prägen Dich?

**Deine Antriebskräfte: Was motiviert Dich?**
*   Verbinde die manuell genannten Motive mit Aspekten aus dem RIASEC-Profil, dem Persönlichkeits-Screening, dem Motivations-Screening und dem Future Skills Screening.
*   Welche übergeordneten Motive lassen sich erkennen? Was gibt Dir Energie und Sinn bei der Arbeit?

**Deine Stärken und Kompetenzen im Einsatz**
*   Wie passen Deine selbst beschriebenen Fähigkeiten zu Deinem Persönlichkeits-, Interessen-, Motivations- und Future Skills Profil?
*   In welchen Bereichen könnten Deine Kompetenzen besonders gut zur Geltung kommen?

**Mögliche Synergien und Spannungsfelder**
*   Wo ergänzen sich die verschiedenen Aspekte Deines Profils besonders gut? (z.B. passen Deine Interessen zu Deinen Persönlichkeitsstärken, Antrieben und Future Skills?)
*   Gibt es Bereiche, die möglicherweise in Spannung zueinander stehen oder weiterer Reflexion bedürfen? (z.B. hohe Ausprägung in einem Big Five Merkmal, das nicht ideal zu den Top-Interessen laut RIASEC, den dominanten Motiven oder benötigten Future Skills passt)
*   Hebe interessante Muster oder auch "blinde Flecken" hervor.

**Empfehlungen für Deine berufliche Entwicklung**
*   Basierend auf dem Gesamtbild: Welche Arten von beruflichen Umfeldern, Rollen oder Entwicklungspfaden könnten besonders gut zu Dir passen?
*   Gib 2-3 konkrete, umsetzungsorientierte Impulse für die nächsten Schritte Deiner Karrieregestaltung.

**Abschlussbemerkung**
*   Fasse die Essenz Deines beruflichen Identitätsprofils zusammen.
*   Ermutige den Nutzer, dieses Profil als dynamisches Werkzeug für seine kontinuierliche Entwicklung zu nutzen.

**Wichtige Hinweise für Deine Antwort:**
*   Sei wertschätzend, klar und inspirierend.
*   Stelle Verbindungen zwischen den Daten her, anstatt sie nur aufzuzählen.
*   Antworte NUR mit dem Report-Text.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für den umfassenden Identitätsprofil-Report:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren des umfassenden Reports: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren des umfassenden Reports aufgetreten.";
  }
};


export const getShortIdentityScreeningReport = async (profileData: ProfileData): Promise<string> => {
    if (!API_KEY) {
      return "Fehler: API-Schlüssel nicht konfiguriert.";
    }
    if (!areAllIdentityScreeningsComplete(profileData)) {
        return "Fehler: Bitte vervollständige zuerst alle vier Bereiche des Identitätsprofils (Persönlichkeit, RIASEC, Motive, Future Skills), um den Kurzreport zu generieren.";
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Helper to format Big Five data for the prompt
    const formatBigFiveForPrompt = (personalityScreening?: PersonalityScreeningData) => {
        if (!personalityScreening?.bigFiveScores) return "Big Five: Nicht durchgeführt oder keine Daten.\n";
        let output = "Big Five (Skala 1-10):\n";
        personalityScreening.bigFiveScores.forEach(dim => {
            output += `  Dimension ${dim.label} (${dim.dimension}):\n`;
            output += `    Positiver Pol "${dim.positivePole.poleLabel}": Durchschnitt ${dim.positivePole.score.toFixed(1)}\n`;
            output += `    Negativer Pol "${dim.negativePole.poleLabel}": Durchschnitt ${dim.negativePole.score.toFixed(1)}\n`;
            // The prompt requests "3 Eigenschaftsbereiche mit Selbstratings". This data is in traitScores.
            // We can list traits associated with each pole if available and relevant.
            const traitsForDimension = personalityScreening.traitScores?.filter(t => t.dimension === dim.dimension) || [];
            const positiveTraits = traitsForDimension.filter(t => t.pole === '+').slice(0,3); // Show top 3
            const negativeTraits = traitsForDimension.filter(t => t.pole === '-').slice(0,3); // Show top 3

            if (positiveTraits.length > 0) {
                 output += `    Top Eigenschaften (positiver Pol): ${positiveTraits.map(t => `${t.adjective} (${t.score})`).join(', ')}\n`;
            }
            if (negativeTraits.length > 0) {
                 output += `    Top Eigenschaften (negativer Pol): ${negativeTraits.map(t => `${t.adjective} (${t.score})`).join(', ')}\n`;
            }
        });
        return output;
    };

    const formatRIASECForPrompt = (riasecData?: RiasecData) => {
        if (!riasecData?.sortedScores) return "RIASEC: Nicht durchgeführt oder keine Daten.\n";
        let output = "RIASEC Interessen (Skala 1-10):\n";
        riasecData.sortedScores.forEach(score => {
            output += `  - ${score.label} (${score.area}): ${score.value.toFixed(1)}\n`;
        });
        return output;
    };

    const formatMotivationForPrompt = (motivationData?: MotivationScreeningData) => {
        if (!motivationData?.dimensionScores) return "Motive & Anreize: Nicht durchgeführt oder keine Daten.\n";
        let output = "Motive & Anreizbedingungen (Skala 1-10):\n";
        motivationData.dimensionScores.forEach(dim => {
            output += `  Dimension "${dim.label}" (Ø ${dim.averageScore.toFixed(1)}):\n`;
            dim.motivations.forEach(motiv => {
                output += `    - Motiv "${motiv.label}": ${motiv.value}\n`;
            });
        });
        return output;
    };

    const formatFutureSkillsForPrompt = (futureSkillsData?: FutureSkillsScreeningData) => {
        if (!futureSkillsData?.dimensionScores) return "Future Skills: Nicht durchgeführt oder keine Daten.\n";
        let output = "Future Skills (Skala 1-10):\n";
        futureSkillsData.dimensionScores.forEach(dim => {
            output += `  Dimension "${dim.label}" (Ø ${dim.averageScore.toFixed(1)}):\n`;
            dim.skills.forEach(skill => {
                output += `    - Skill "${skill.label}": ${skill.value}\n`;
            });
        });
        return output;
    };

    let prompt = `Du bist ein erfahrener Good Work Berater. Deine Sprache ist wertschätzend, klar und in der Du-Form. Stütze jede Aussage auf die Daten; vermeide Spekulationen.
Erstelle einen kompakten, praxisnahen Kurzreport als Reflexions- und Entscheidungshilfe basierend auf dem kompletten Selbsteinschätzungs-Screening des Nutzers.

**Datenbasis des Nutzers:**

**1. Persönlichkeit:**
   1.1 Selbst zugeschriebene allgemeine Eigenschaften (Freitext Auswahl):
${profileData.personalityScreening?.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0
    ? profileData.personalityScreening.selectedGeneralAdjectives.join(', ')
    : "Keine spezifischen allgemeinen Eigenschaften ausgewählt."}
   1.2 ${formatBigFiveForPrompt(profileData.personalityScreening)}

**2. Neigungen & Interessen (RIASEC):**
${formatRIASECForPrompt(profileData.riasec)}

**3. Motive & Anreizbedingungen:**
${formatMotivationForPrompt(profileData.motivationScreening)}

**4. Future Skills:**
${formatFutureSkillsForPrompt(profileData.futureSkillsScreening)}

**Skala Hinweis:** Die Bewertungen erfolgten auf einer Skala von 1–10.
Interpretation: ≤4 = niedrig, 5-6 = mittel, 7-8 = hoch, ≥9 = sehr hoch, 10 = maximal.

**Auftrag: Kurzreport erstellen**
Gliedere den Report exakt in folgende Abschnitte (Überschriften beibehalten!):

1. Essenz in zwei Sätzen
2. Charakter & Eigenschaften
3. Big Five Profil
4. Interessen (RIASEC)
5. Motive & Anreize
6. Überfachliche Kompetenzen
7. Stärken & Chancen
8. Konfliktfelder & Risiken
9. Empfehlungen (Beruf & Privat)
10. Eignung für Rollenschwerpunkte
11. Konsistenz Check
12. Persönlicher Statement Satz
13. Reflexionsfragen

**Stil & Formatvorgaben:**
- Du-Ansprache („Du kannst …“).
- Klar, aktiv, ermutigend; fachlich fundiert.
- Nutze Bulletpoints statt langer Fließtexte wo passend.
- Nenne konkrete Werte, wo vorhanden (z.B. „Extraversion 7/10“).
- Maximal 2 Seiten (ca. 600 Wörter).
- Optional: verweise auf extremes Ergebnis („>=9“) für vertiefte Selbstreflexion.

**Qualitätssicherung:**
- Nichts aus dem Screening auslassen.
- Prüfe widersprüchliche Angaben; benenne Spannungen respektvoll.
- Vermeide Fachjargon; erkläre Begriffe kurz, wo nötig.
- Leg den Fokus auf gesundes Wohlbefinden & nachhaltige Performance.

Beginne unmittelbar mit Abschnitt 1.
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Fehler bei der Anfrage an die Gemini API für den Kurzreport Identitätsscreening:", error);
        if (error instanceof Error) {
            return `Fehler beim Generieren des Kurzreports: ${error.message}`;
        }
        return "Ein unbekannter Fehler ist beim Generieren des Kurzreports aufgetreten.";
    }
};


export const generateDecisionMatrixReport = async (profileData: ProfileData): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert. Bitte richte die Umgebungsvariable API_KEY ein.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10; 
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let promptContent = `Du bist Dr. GoodWork, ein KI-Karriere-Berater und Entscheidungscoach. Deine Aufgabe ist es, einen Nutzer dabei zu unterstützen, künftige Karriere- und Lebensentscheidungen eigenständig, reflektiert und passgenau zu treffen.
Schreibe in wertschätzender Du-Form, deutsch, klar und praxisnah.

**Grundlage für Deine Analyse sind die folgenden Daten des Nutzers:**

**1. Identitäts-Screening Ergebnisse und manuelle Eingaben:**
   ${profileData.identitaetProfilGesamtbericht ? `- Gesamteindruck Identitätsprofil (manuell): ${profileData.identitaetProfilGesamtbericht}\n` : ''}
   ${profileData.eigenschaftenPersoenlichkeit ? `- Manuell beschriebene Eigenschaften: ${profileData.eigenschaftenPersoenlichkeit}\n` : ''}
   ${profileData.motiveAntriebe ? `- Manuell beschriebene Motive/Antriebe: ${profileData.motiveAntriebe}\n` : ''}
   ${profileData.faehigkeitenKompetenzen ? `- Manuell beschriebene Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen}\n` : ''}
   ${profileData.neigungenInteressen ? `- Manuell beschriebene Neigungen/Interessen: ${profileData.neigungenInteressen}\n` : ''}
   - Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData, 400)}\n
`;

  if (profileData.personalityScreening) {
    promptContent += `\n   **Persönlichkeits-Screening (Big Five & Selbstbild):**\n`;
    if (profileData.personalityScreening.selectedGeneralAdjectives && profileData.personalityScreening.selectedGeneralAdjectives.length > 0) {
      promptContent += `     - Selbst zugeschriebene allgemeine Eigenschaften: ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}\n`;
    }
    if (profileData.personalityScreening.bigFiveScores) {
      profileData.personalityScreening.bigFiveScores.forEach(dim => {
        const strongerPole = dim.score > scaleNeutral ? dim.positivePole : dim.negativePole;
        promptContent += `     - ${dim.label}: Gesamtscore ${dim.score.toFixed(1)}/${scaleMax}. Stärkere Tendenz zu "${strongerPole.poleLabel}" (Score: ${strongerPole.score.toFixed(1)}).\n`;
      });
    }
  }

  if (profileData.riasec) {
    promptContent += `\n   **RIASEC Interessen-Profil:**\n`;
    promptContent += `     - Holland Code: ${profileData.riasec.hollandCode || 'N/A'} (${profileData.riasec.hollandType || 'N/A'})\n`;
    if (profileData.riasec.hierarchy && profileData.riasec.hierarchy.length > 0) {
        promptContent += `     - Top Interessen: ${profileData.riasec.hierarchy.slice(0, 3).map(area => RIASEC_DESCRIPTIONS[area]?.label || area).join(' > ')}\n`;
    }
     if (profileData.riasec.sortedScores) {
        promptContent += `     - Punkteverteilung:\n`;
        profileData.riasec.sortedScores.forEach(scoreDetail => {
            promptContent += `       - ${scoreDetail.label} (${scoreDetail.area}): ${scoreDetail.value.toFixed(1)}/${scaleMax}\n`;
        });
    }
  }
  
  if (profileData.motivationScreening?.dimensionScores) {
    promptContent += `\n   **Antriebe & Motivation (Top Dimensionen):**\n`;
    profileData.motivationScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore)
      .slice(0, 3) // Consider top 3 dimensions for criteria
      .forEach(dim => {
        promptContent += `     - ${dim.label}: ${dim.averageScore.toFixed(1)}/10 (Stärkste Motive darin: ${dim.motivations.sort((x,y) => y.value - x.value).slice(0,2).map(m => m.label).join(', ') || 'Keine spezifischen hohen Werte'})\n`;
    });
  }

  if (profileData.futureSkillsScreening?.dimensionScores) {
    promptContent += `\n   **Future Skills (Top Dimensionen):**\n`;
    profileData.futureSkillsScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore)
      .slice(0, 3)
      .forEach(dim => {
        promptContent += `     - ${dim.label}: ${dim.averageScore.toFixed(1)}/10 (Stärkste Skills darin: ${dim.skills.sort((x,y) => y.value - x.value).slice(0,2).map(s => s.label).join(', ') || 'Keine spezifischen hohen Werte'})\n`;
    });
  }

  promptContent += `\n**2. Valou Zielstyling (Wünsche & No-Gos in Lebensbereichen):**\n`;
  VALOU_AREAS.forEach(area => {
    const areaData = profileData.valouZielstylingData[area.id];
    if (areaData) {
      promptContent += `   **Bereich: ${area.name}** (${area.description})\n`;
      promptContent += `     - Zielvorstellung (Stylingsatz): ${areaData.stylingSatz || "Keine Angabe"}\n`;
      if (areaData.vorlieben.length > 0) promptContent += `     - Vorlieben/Energiespender: ${areaData.vorlieben.join('; ')}\n`;
      if (areaData.abneigungen.length > 0) promptContent += `     - Abneigungen/Energiefresser: ${areaData.abneigungen.join('; ')}\n`;
      if (areaData.mustHaves.length > 0) promptContent += `     - **Must-Haves**: ${areaData.mustHaves.map(mh => `**${mh}**`).join('; ')}\n`;
      if (areaData.noGos.length > 0) promptContent += `     - ⚠️ **No-Gos**: ${areaData.noGos.map(ng => `**${ng}**`).join('; ')}\n`;
    }
  });

  promptContent += `
\n**Dein Auftrag:**
Erstelle eine **Entscheidungskarte (Matrix)** und einen begleitenden **Kurzreport**. Diese dienen dem Nutzer als dauerhafte Checkliste für die Evaluation von Chancen und Angeboten.

**Struktur des Outputs (Format: Markdown):**

## Deine Persönliche Entscheidungshilfe von Dr. GoodWork

**1. Einleitung (max. 150 Wörter)**
   - Kurze Zusammenfassung, wie das Identitäts-Profil und das Valou Zielstyling zusammenwirken.
   - Erkläre, wofür die nachfolgende Matrix und der Report dienen.

**2. Schlüssel-Insights & Strategische Hinweise für Deine Entscheidungen**
   - Formuliere 3–5 prägnante Bulletpoints.
   - Leite diese aus den wichtigsten Hebeln (z.B. hohe Scores in RIASEC/Big Five/Motivation/Future Skills, Must-Haves aus Valou) und Warnlampen (z.B. niedrige Scores in wichtigen Bereichen, No-Gos aus Valou) aus den Profildaten ab.

**3. Bias-Check: Achtsam entscheiden**
   - Erläutere kurz 1-2 potenzielle Entscheidungsverzerrungen (z.B. soziale Erwünschtheit, Bestätigungsfehler, Status-quo-Bias, Verfügbarkeitsheuristik).
   - Gib 1–2 konkrete Strategien, wie der Nutzer damit umgehen kann (z.B. konträre Meinungen einholen, Entscheidungskriterien vorab festlegen und gewichten).

**4. Deine Persönliche Entscheidungsmatrix**
   - Erstelle eine Tabelle im Markdown-Format mit den Spalten:
     | Valou Bereich | Kriterium / Frage | Guter Fit – Positive Anzeichen | Red Flag / No-Go | Relevanz-Score (1–5) |
   - Fülle pro Valou-Bereich ca. 3-6 Zeilen (insgesamt ca. 20-30 Zeilen).
   - **Wichtig:** Übernehme **alle** "Must-Haves" exakt aus dem Valou Zielstyling als Kriterien. Markiere diese Kriterien als **fett**. Weise ihnen eine hohe Relevanz (4 oder 5) zu. Die "Guter Fit"-Spalte sollte dann die Erfüllung dieses Must-Haves positiv beschreiben.
   - **Wichtig:** Übernehme **alle** "No-Gos" exakt aus dem Valou Zielstyling in die "Red Flag / No-Go"-Spalte für das entsprechende Kriterium. Markiere diese No-Gos als **fett** und beginne sie mit dem Emoji ⚠️. Weise diesen Kriterien eine hohe Relevanz (5) zu. Die "Kriterium / Frage" Spalte sollte dann das Vermeiden des No-Gos thematisieren.
   - Formuliere weitere Kriterien/Fragen basierend auf den Vorlieben, Abneigungen und den Ergebnissen der Identitäts-Screenings (RIASEC Top-Bereiche, signifikante Big Five Ausprägungen, relevante Motivations-Dimensionen/Motive, Future Skills, manuelle Angaben zu Motiven/Fähigkeiten).
     - Beispiel: Hoher Wert bei RIASEC "Investigativ" + Persönlichkeitsmerkmal "Neugierig" → Kriterium "Möglichkeit zu forschen und komplexe Probleme zu lösen".
     - Beispiel: Motiv "Autonomie" (falls vorhanden und hoch) → Kriterium "Hoher Grad an Selbstbestimmung und Gestaltungsspielraum".
   - Leite "Guter Fit – Positive Anzeichen" und "Red Flag / No-Go" (außer den direkten No-Gos) logisch aus den Kriterien ab.
   - Weise einen subjektiven "Relevanz-Score" (1=wenig relevant, 5=extrem relevant) für jedes Kriterium zu, basierend auf der Gesamtheit der Nutzerdaten (insb. Must-Haves/No-Gos und stark ausgeprägte Persönlichkeits-/Interessen-/Motivations-/Future Skills-Merkmale).
   - Verweise bei Bedarf auf vorherige Screening Scores (z.B. "Dein Gewissenhaftigkeits-Score von 8/10 spricht für die Wichtigkeit von...").

**5. Vertiefende Reflexionsfragen für Deine Entscheidungen**
   - Stelle 8–10 offene Fragen, die der Nutzer vor einer wichtigen Entscheidung für sich beantworten kann.
   - Mindestens eine Frage pro Valou-Bereich.
   - Eine Meta-Frage zur langfristigen Konsistenz der Entscheidung mit den eigenen Werten und Zielen.

**6. Call to Action: Deine Matrix im Alltag**
   - Kurzer, motivierender Abschluss.
   - Erkläre, wie der Nutzer die Matrix und die Reflexionsfragen im Alltag als Checkliste verwenden und bei Bedarf aktualisieren kann.

**Gestaltungshinweise:**
- Nutze klare, handlungsorientierte Sprache (kein Fachjargon).
- Achte auf konsistente Logik zwischen Screening-Ergebnissen, Zielstyling und der Matrix.
- Halte Einleitung & Bias-Check eher kurz; der Fokus liegt auf der Matrix und den Reflexionsfragen.

**Qualitäts-Checkliste (für Dich, die KI):**
- Sind alle sechs Valou-Bereiche in der Matrix abgedeckt?
- Sind alle Must-Haves exakt und korrekt markiert (fett, hohe Relevanz) in die Matrix übernommen worden?
- Sind alle No-Gos exakt und korrekt markiert (fett, ⚠️ Emoji, hohe Relevanz) in die Matrix übernommen worden?
- Spiegeln die Kriterien und deren Relevanz die höchsten/niedrigsten Screening-Ausprägungen sowie die Valou-Prioritäten wider?
- Enthält die Tabelle keine widersprüchlichen Aussagen zu den Profildaten?
- Ist der gesamte Output in Du-Form und auf Deutsch?
- Beginnt der Output direkt mit "## Deine Persönliche Entscheidungshilfe von Dr. GoodWork"?

Liefere schließlich nur den finalen Report ohne diese detaillierten Instruktionen ab.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: promptContent,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Entscheidungsmatrix:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren der Entscheidungsmatrix: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren der Entscheidungsmatrix aufgetreten.";
  }
};


export const findMatchingJobs = async (
  profileData: ProfileData
): Promise<{ matches: JobMatch[]; groundingMetadata?: GroundingMetadata }> => {
  if (!API_KEY) {
    console.warn("API_KEY nicht konfiguriert. Job Matching Funktion ist eingeschränkt.");
    return { matches: [], groundingMetadata: undefined };
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prefs = profileData.jobMatchingPreferences || { keywords: '', industries: '', regions: '', companySize: 'Beliebig', workModel: 'Beliebig' };
  const scaleMax = 10;
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist Dr. GoodWork, ein spezialisierter KI-Job-Recruiter. Deine Aufgabe ist es, passende, aktuell offene Stellen für einen Nutzer zu finden. Nutze dazu Google Search.

**Umfassende Profildaten des Nutzers:**

**1. Persönliche Basisdaten:**
*   Über mich/Notizen: ${profileData.personalNotes || "Keine Angabe"}
*   Erfahrungen: ${profileData.experience || "Keine Angabe"}
*   Qualifikationen: ${profileData.qualifications || "Keine Angabe"}
*   Zielbranchen (allgemein): ${profileData.targetIndustries || "Keine Angabe"}
*   Ausschlusskriterien (allgemein): ${profileData.exclusionCriteria || "Keine Angabe"}

**2. Berufliches Identitätsprofil (Manuelle Eingaben & Tool-Zusammenfassungen):**
*   Gesamteindruck Identität (manuell): ${profileData.identitaetProfilGesamtbericht || "Keine Angabe"}
*   Eigenschaften & Persönlichkeit (manuell): ${profileData.eigenschaftenPersoenlichkeit || "Keine Angabe"}
*   Neigungen & Interessen (manuell): ${profileData.neigungenInteressen || "Keine Angabe"}
*   Motive & Antriebe (manuell): ${profileData.motiveAntriebe || "Keine Angabe"}
*   Fähigkeiten & Kompetenzen (manuell): ${profileData.faehigkeitenKompetenzen || "Keine Angabe"}
`;

  if (profileData.riasec?.hollandCode) {
    prompt += `*   RIASEC Interessen (Top 3): ${profileData.riasec.hierarchy.slice(0,3).map(area => RIASEC_DESCRIPTIONS[area]?.label).join(', ')} (${profileData.riasec.hollandCode})\n`;
  }
  if (profileData.personalityScreening?.bigFiveScores) {
    prompt += `*   Big Five Tendenzen (Skala 1-${scaleMax}):\n`;
    profileData.personalityScreening.bigFiveScores.forEach(dim => {
      prompt += `    - ${dim.label}: Score ${dim.score.toFixed(1)}, eher ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel}\n`;
    });
  }
  if (profileData.motivationScreening?.dimensionScores) {
    prompt += `*   Top Anreizdimensionen (Tool):\n`;
    profileData.motivationScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `    - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  if (profileData.futureSkillsScreening?.dimensionScores) {
    prompt += `*   Top Future Skills Dimensionen (Tool):\n`;
    profileData.futureSkillsScreening.dimensionScores
        .filter(d => d.averageScore >= 7)
        .slice(0,2)
        .forEach(dim => {
            prompt += `    - ${dim.label} (Score: ${dim.averageScore.toFixed(1)})\n`;
    });
  }
  // Use the helper for the snippet
  prompt += `*   Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil:\n ${getProfileReportSnippet(profileData, 500)}\n`;


  prompt += `
**3. Valou Zielstyling (Wünsche & No-Gos in allen Lebensbereichen):**
${VALOU_AREAS.map(area => {
    const areaData = profileData.valouZielstylingData[area.id];
    if (!areaData) return '';
    let valouAreaInfo = `*   Bereich "${area.name}":\n`;
    if (areaData.stylingSatz) valouAreaInfo += `    - Stylingsatz: ${areaData.stylingSatz}\n`;
    if (areaData.vorlieben.length > 0) valouAreaInfo += `    - Vorlieben: ${areaData.vorlieben.join(', ')}\n`;
    if (areaData.abneigungen.length > 0) valouAreaInfo += `    - Abneigungen: ${areaData.abneigungen.join(', ')}\n`;
    if (areaData.mustHaves.length > 0) valouAreaInfo += `    - **Valou Must-Haves**: ${areaData.mustHaves.join('; ')}\n`;
    if (areaData.noGos.length > 0) valouAreaInfo += `    - **Valou No-Gos**: ${areaData.noGos.join('; ')}\n`;
    return (areaData.stylingSatz || areaData.vorlieben.length > 0 || areaData.abneigungen.length > 0 || areaData.mustHaves.length > 0 || areaData.noGos.length > 0) ? valouAreaInfo : '';
}).filter(Boolean).join('') || "*   Keine detaillierten Valou-Einträge vorhanden.\n"}
`;

  if (profileData.decisionCriteriaReport) {
    prompt += `
**4. Persönliche Entscheidungskriterien (Auszug aus **decisionCriteriaReport**):**
${profileData.decisionCriteriaReport.substring(0, 1000)}... 
(Beachte insbesondere die dort genannte Entscheidungsmatrix und die Relevanz-Scores der Kriterien.)
`;
  } else {
    prompt += `*   Kein expliziter Report zu Entscheidungskriterien vorhanden. Bitte leite Kriterien aus dem Gesamtprofil (Valou, Identität) ab.\n`;
  }

prompt += `
**Job-Suchpräferenzen des Nutzers (diese sind als Filter zu verstehen, das Gesamtprofil ist entscheidender):**
*   Schlüsselwörter/Tätigkeiten: ${prefs.keywords || "Keine spezifischen, leite aus Profil ab"}
*   Branchen (Präferenz): ${prefs.industries || "Keine spezifischen, leite aus Profil ab"}
*   Regionen/Orte: ${prefs.regions || "Deutschlandweit, Remote bevorzugt falls passend"}
*   Unternehmensgröße: ${prefs.companySize || "Beliebig"}
*   Arbeitsmodell: ${prefs.workModel || "Beliebig"}

**Deine Aufgaben:**
1.  **Analysiere das GESAMTE oben dargestellte Nutzerprofil SEHR GENAU.** Berücksichtige insbesondere den **decisionCriteriaReport** (falls vorhanden), alle **Valou Must-Haves** und **Valou No-Gos**, sowie die Kernelemente aus dem **Identitätsprofil** (RIASEC, Persönlichkeit, Motivation, Future Skills, manuelle Angaben).
2.  **Führe eine Google-Suche durch**, um **aktuell ausgeschriebene, offene Stellen** zu finden.
3.  Berücksichtige gängige Jobplattformen (z.B. LinkedIn, Indeed, StepStone, XING für den deutschsprachigen Raum) sowie Karriereseiten von Unternehmen.
4.  Filtere die Ergebnisse und präsentiere die **Top 3-7 relevantesten Stellen**.
5.  **WICHTIG:** Stelle sicher, dass es sich um **tatsächlich existierende und aktuell offene Stellen** handelt. Gib keine fiktiven oder veralteten Anzeigen aus.
6.  Für jede Stelle:
    *   Gib eine kurze, prägnante Stellenbeschreibung.
    *   Begründe die Relevanz explizit anhand der Übereinstimmung mit den genannten Profildaten (Entscheidungskriterien, Valou, Persönlichkeit etc.).
    *   **Berechne einen Übereinstimmungsgrad ("matchingDegree") in Prozent** (z.B. "85%"). Dieser Grad soll reflektieren, wie gut die Stelle zum GESAMTEN Profil des Nutzers passt, basierend auf Deiner Analyse. Höher ist besser.

**Antwortformat:**
Gib Deine Antwort **AUSSCHLIESSLICH als valides JSON-Array** von Job-Objekten zurück. Jedes Job-Objekt muss folgende Felder enthalten:
*   \`title\`: Der Titel der Stellenanzeige (string).
*   \`company\`: Der Name des Unternehmens (string).
*   \`location\`: Der Arbeitsort (string).
*   \`snippet\`: Eine sehr kurze Zusammenfassung der Stelle oder Schlüsselaufgaben (max. 2-3 Sätze, string).
*   \`relevance\`: Eine kurze Begründung (1-2 Sätze), warum diese Stelle gut zum Nutzerprofil passt, mit Bezug auf konkrete Profildaten (string).
*   \`url\`: Der direkte Link zur Stellenanzeige (string).
*   \`matchingDegree\`: Der berechnete Übereinstimmungsgrad als String (z.B. "85%").

**Beispiel für ein einzelnes Job-Objekt im JSON-Array:**
\`\`\`json
{
  "title": "Softwareentwickler Frontend (m/w/d)",
  "company": "Tech Solutions GmbH",
  "location": "Berlin oder Remote",
  "snippet": "Entwicklung moderner Webanwendungen mit React und TypeScript. Mitarbeit in agilen Teams und Gestaltung innovativer Benutzeroberflächen.",
  "relevance": "Passt gut zu den technischen Interessen (RIASEC 'I') und dem Valou Must-Have 'Flexible Arbeitszeiten'.",
  "url": "https://beispiel-karriereseite.de/job/frontend-dev",
  "matchingDegree": "90%"
}
\`\`\`
Stelle sicher, dass das JSON-Array korrekt formatiert ist (mit \`[\` am Anfang und \`]\` am Ende, Objekte durch Kommas getrennt). Gib KEINEN zusätzlichen Text oder Markdown-Formatierung um das JSON-Array herum aus.
Wenn keine passenden Stellen gefunden werden, gib ein leeres Array \`[]\` zurück.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    let parsedMatches: JobMatch[] = [];
    if (jsonStr) {
        try {
            parsedMatches = JSON.parse(jsonStr);
            if (!Array.isArray(parsedMatches) || !parsedMatches.every(job => 
                typeof job.title === 'string' &&
                typeof job.company === 'string' &&
                typeof job.location === 'string' &&
                typeof job.snippet === 'string' &&
                typeof job.relevance === 'string' &&
                typeof job.url === 'string' &&
                typeof job.matchingDegree === 'string' // Validate new field
            )) {
                console.warn("Job Matching: Antwort ist kein valides JobMatch[] Array. Formatproblem oder fehlendes matchingDegree?", parsedMatches);
                throw new Error("Ungültiges Format der Job-Matches von der KI.");
            }
        } catch (e: any) {
            console.error("Fehler beim Parsen der Job-Matches JSON-Antwort:", e, "\nEmpfangener Text:", jsonStr);
            const groundingData = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;
            if (groundingData?.groundingChunks && groundingData.groundingChunks.length > 0) {
                const fallbackMatches: JobMatch[] = groundingData.groundingChunks
                    .filter(chunk => chunk.web && chunk.web.uri)
                    .map((chunk, index) => ({
                        title: chunk.web.title || `Gefundener Link ${index + 1}`,
                        company: "Unbekannt (aus Google Search Quelle)",
                        location: "Unbekannt",
                        snippet: `Möglicherweise relevante Seite: ${chunk.web.title || chunk.web.uri}. Bitte manuell prüfen.`,
                        relevance: "Konnte Relevanz nicht automatisch bestimmen, da die Detailverarbeitung fehlschlug. Bitte Link manuell prüfen.",
                        url: chunk.web.uri,
                        matchingDegree: "N/A", // Fallback for new field
                    }));
                if (fallbackMatches.length > 0) {
                     console.warn("Job Matching: Fallback auf Grounding Chunks, da JSON-Verarbeitung fehlschlug.");
                     return { matches: fallbackMatches, groundingMetadata: groundingData };
                }
            }
            throw e;
        }
    }
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;
    return { matches: parsedMatches, groundingMetadata };

  } catch (error) {
    console.error("Schwerwiegender Fehler bei der Anfrage an die Gemini API für Job Matching:", error);
    if (error instanceof Error) {
      throw new Error(`Fehler bei der Jobsuche mit Dr. GoodWork: ${error.message}`);
    }
    throw new Error("Ein unbekannter Fehler ist bei der Jobsuche aufgetreten.");
  }
};

export const generateCultureMatchReport = async (profileData: ProfileData): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert. Bitte richte die Umgebungsvariable API_KEY ein.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10; 
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let promptContent = `Du bist Dr. GoodWork, ein KI-Experte für Unternehmenskultur und Karriere-Passung.
Deine Aufgabe ist es, einen Report für einen Nutzer zu erstellen, der seine ideale Unternehmenskultur beschreibt und ihm hilft, passende Arbeitsumfelder zu identifizieren.
Der Report soll auf Deutsch, in wertschätzender Du-Form und praxisnah sein.

**Grundlage für Deine Analyse sind die folgenden, umfassenden Daten des Nutzers:**

**1. Identitätsprofil (Manuelle Eingaben, RIASEC, Persönlichkeits-Screening, Motivation, Future Skills):**
   ${profileData.identitaetProfilGesamtbericht ? `- Gesamteindruck Identität (manuell): ${profileData.identitaetProfilGesamtbericht}\n` : ''}
   ${profileData.eigenschaftenPersoenlichkeit ? `- Manuell beschriebene Eigenschaften: ${profileData.eigenschaftenPersoenlichkeit}\n` : ''}
   ${profileData.motiveAntriebe ? `- Motive/Antriebe (manuell): ${profileData.motiveAntriebe}\n` : ''}
   ${profileData.faehigkeitenKompetenzen ? `- Fähigkeiten/Kompetenzen: ${profileData.faehigkeitenKompetenzen}\n` : ''}
   ${profileData.neigungenInteressen ? `- Neigungen/Interessen: ${profileData.neigungenInteressen}\n` : ''}
    - Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData, 400)}\n
`;

  if (profileData.personalityScreening) {
    promptContent += `   **Persönlichkeits-Screening (Auszug):**\n`;
    if (profileData.personalityScreening.selectedGeneralAdjectives?.length) {
      promptContent += `     - Selbstbild (Adjektive): ${profileData.personalityScreening.selectedGeneralAdjectives.join(', ')}\n`;
    }
    if (profileData.personalityScreening.bigFiveScores) {
      profileData.personalityScreening.bigFiveScores.forEach(dim => {
        const strongerPole = dim.score > scaleNeutral ? dim.positivePole : dim.negativePole;
        promptContent += `     - ${dim.label}: Tendenz zu "${strongerPole.poleLabel}" (Score: ${dim.score.toFixed(1)}/${scaleMax}).\n`;
      });
    }
  }

  if (profileData.riasec) {
    promptContent += `   **RIASEC Interessen-Profil (Auszug):**\n`;
    promptContent += `     - Holland Code: ${profileData.riasec.hollandCode || 'N/A'} (${profileData.riasec.hollandType || 'N/A'})\n`;
    if (profileData.riasec.hierarchy?.length) {
        promptContent += `     - Top Interessen: ${profileData.riasec.hierarchy.slice(0, 3).map(area => RIASEC_DESCRIPTIONS[area]?.label || area).join(' > ')}\n`;
    }
  }
  
  if (profileData.motivationScreening?.dimensionScores) {
    promptContent += `   **Antriebe & Motivation (Top Dimensionen):**\n`;
    profileData.motivationScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore)
      .slice(0, 3)
      .forEach(dim => {
        promptContent += `     - ${dim.label}: ${dim.averageScore.toFixed(1)}/10 (Stärkste Motive: ${dim.motivations.sort((x,y) => y.value - x.value).slice(0,2).map(m => m.label).join(', ') || 'N/A'})\n`;
    });
  }

  if (profileData.futureSkillsScreening?.dimensionScores) {
    promptContent += `   **Future Skills (Top Dimensionen):**\n`;
    profileData.futureSkillsScreening.dimensionScores
      .sort((a,b) => b.averageScore - a.averageScore)
      .slice(0, 3)
      .forEach(dim => {
        promptContent += `     - ${dim.label}: ${dim.averageScore.toFixed(1)}/10 (Stärkste Skills: ${dim.skills.sort((x,y) => y.value - x.value).slice(0,2).map(s => s.label).join(', ') || 'N/A'})\n`;
    });
  }


  promptContent += `\n**2. Valou Zielstyling (Wünsche & No-Gos in Lebensbereichen, insb. "Arbeit & Tätigkeit" und "Persönlichkeit & Skills"):**\n`;
  VALOU_AREAS.forEach(area => {
    const areaData = profileData.valouZielstylingData[area.id];
    if (areaData && (area.id === 'taetigkeit' || area.id === 'persoenlichkeitSkills' || areaData.mustHaves.length > 0 || areaData.noGos.length > 0)) {
      promptContent += `   **Bereich: ${area.name}**\n`;
      if (areaData.stylingSatz) promptContent += `     - Zielvorstellung: ${areaData.stylingSatz}\n`;
      if (areaData.vorlieben.length > 0) promptContent += `     - Vorlieben: ${areaData.vorlieben.join('; ')}\n`;
      if (areaData.abneigungen.length > 0) promptContent += `     - Abneigungen: ${areaData.abneigungen.join('; ')}\n`;
      if (areaData.mustHaves.length > 0) promptContent += `     - **Must-Haves**: ${areaData.mustHaves.map(mh => `**${mh}**`).join('; ')}\n`;
      if (areaData.noGos.length > 0) promptContent += `     - ⚠️ **No-Gos**: ${areaData.noGos.map(ng => `**${ng}**`).join('; ')}\n`;
    }
  });
  
  if (profileData.decisionCriteriaReport) {
     promptContent += `\n**3. Auszug aus dem Report "Persönliche Entscheidungshilfe":**\n (Berücksichtige hieraus insbesondere die priorisierten Kriterien und "Red Flags")\n ${profileData.decisionCriteriaReport.substring(0, 800)}...\n`;
  }


  promptContent += `
\n**Dein Auftrag:**
Erstelle einen **Culture Match Report** im Markdown-Format.

**Struktur des Reports:**

## Dein Persönlicher Culture Match Report von Dr. GoodWork

**1. Einleitung (max. 100 Wörter)**
   - Erkläre kurz, warum die Passung zur Unternehmenskultur so wichtig für Zufriedenheit und Erfolg im Job ist.
   - Beziehe Dich darauf, dass dieser Report auf der Analyse seiner umfassenden Profildaten basiert.

**2. Deine Ideale Unternehmenskultur: Kernmerkmale**
   - Beschreibe basierend auf dem GESAMTEN Profil (insb. Persönlichkeit, Interessen, Motive, Motivation, Future Skills, Valou Must-Haves/No-Gos und Entscheidungskriterien) die **charakteristischen Merkmale** einer Unternehmenskultur, in der der Nutzer wahrscheinlich aufblühen würde.
   - Gehe auf Aspekte ein wie z.B.:
     *   Führungsstil (z.B. partizipativ, direktiv, coachend)
     *   Kommunikationskultur (z.B. offen, formal, informell)
     *   Teamarbeit vs. Einzelarbeit (Präferenz)
     *   Struktur & Hierarchie (z.B. flach, agil, traditionell-hierarchisch)
     *   Umgang mit Fehlern (z.B. Lernkultur, Null-Fehler-Toleranz)
     *   Innovationsbereitschaft und Risikofreude
     *   Work-Life-Balance und Flexibilität
     *   Werteorientierung des Unternehmens (falls ableitbar)
   - Nutze 3-5 prägnante Bulletpoints oder einen kurzen Fließtext pro Hauptmerkmal.

**3. Warnsignale: Diese Kulturen könnten schwierig für Dich sein**
   - Leite aus den No-Gos (Valou), Abneigungen und niedrigen Werten/konträren Ausprägungen im Profil (z.B. Persönlichkeit, RIASEC, Motivation, Future Skills) konkrete "Red Flags" in Unternehmenskulturen ab.
   - Nenne 3-5 klare Beispiele für kulturelle Aspekte, die wahrscheinlich zu Frustration oder Demotivation führen würden.
   - Beispiel: "Eine stark von Mikromanagement geprägte Kultur könnte Deinem Bedürfnis nach Autonomie (aus Valou/Motiven) widersprechen."

**4. So findest Du Deinen Culture Fit: Praktische Tipps**
   - Gib 4-6 konkrete Ratschläge, wie der Nutzer die Kultur potenzieller Arbeitgeber besser einschätzen kann:
     *   Fragen für das Vorstellungsgespräch (spezifische Fragen, die auf kulturelle Aspekte abzielen, die für ihn relevant sind).
     *   Recherchemethoden (z.B. Unternehmenswebsite kritisch lesen, Mitarbeiterbewertungen auf Kununu/Glassdoor, LinkedIn-Profile von Mitarbeitern analysieren).
     *   Achten auf nonverbale Signale und die Atmosphäre beim Bewerbungsprozess.
     *   Nutzen des eigenen Netzwerks.

**5. Abschlussbemerkung**
   - Kurzer, motivierender Abschluss, der den Nutzer ermutigt, bei der Jobsuche aktiv auf den Culture Fit zu achten.

**Wichtige Hinweise:**
- Formuliere den Report klar, positiv und handlungsorientiert.
- Stelle direkte Bezüge zu den Nutzerdaten her (z.B. "Dein RIASEC-Profil deutet auf X hin, daher wäre eine Kultur wichtig, die Y fördert").
- Vermeide generische Aussagen. Der Report soll so persönlich wie möglich sein.
- Antworte NUR mit dem Report-Text (Markdown).
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
      contents: promptContent,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Culture Match Report:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren des Culture Match Reports: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren des Culture Match Reports aufgetreten.";
  }
};


export const getMotivationReport = async (
  motivationData: MotivationScreeningData,
  profileData: ProfileData
): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10;
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist Dr. GoodWork, ein KI-Coach spezialisiert auf berufliche Motivation und Antrieb.
Ein Nutzer hat gerade ein Screening zu seinen Anreizdimensionen und Motivbereichen abgeschlossen.
Erstelle einen tiefgründigen, differenzierten und motivierenden Report. Sprich den Nutzer direkt mit "Du" an.

**Die Ergebnisse des Nutzers aus dem Motivations-Screening (Skala 1-${scaleMax}):**
${motivationData.dimensionScores.map(dim =>
  `- Anreizdimension "${dim.label}" (Gesamtdurchschnitt: ${dim.averageScore.toFixed(1)}):
${dim.motivations.map(motiv => `    - Motiv "${motiv.label}": ${motiv.value}`).join('\n')}`
).join('\n')}

**Weitere Profildaten des Nutzers zur Kontextualisierung:**
- Selbstbild (manuell): ${profileData.identitaetProfilGesamtbericht || profileData.eigenschaftenPersoenlichkeit || "Keine spezifische Angabe"}
- RIASEC Top-Interessen: ${profileData.riasec?.hierarchy.slice(0,3).map(h => RIASEC_DESCRIPTIONS[h]?.label).join(', ') || "N/A"}
- Big Five Persönlichkeitstendenzen (Auszug):
${profileData.personalityScreening?.bigFiveScores?.map(dim => `  - ${dim.label}: Tendenz zu ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel} (Score ${dim.score.toFixed(1)})`).join('\n') || "  Keine Big Five Daten"}
- Top Future Skills Dimensionen (Auszug):
${profileData.futureSkillsScreening?.dimensionScores?.slice(0,2).map(dim => `  - ${dim.label}: ${dim.averageScore.toFixed(1)}`).join('\n') || "  Keine Future Skills Daten"}
- Valou Ziel-Styling (Top 3 Must-Haves gesamt, falls vorhanden):
${profileData.valouZielstylingData ? Object.values(profileData.valouZielstylingData).flatMap(v => v.mustHaves).slice(0,3).join(', ') || "Keine Must-Haves spezifiziert" : "N/A"}
- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n`;

prompt += `
**Struktur des Reports:**
Formatiere Deinen Report mit Markdown (Überschriften ## und ###, Listen, Fettungen).

**Einleitung von Dr. GoodWork**
*   Stelle Dich kurz vor und erläutere den Wert dieses Motivations-Screenings. Betone, dass es um *innere* Antriebe geht.

**Deine Motivationslandschaft: Ein Überblick**
*   Identifiziere die **2-3 stärksten Anreizdimensionen** (höchste Durchschnittswerte).
    *   Beschreibe für jede dieser Top-Dimensionen, was sie allgemein bedeutet.
    *   Hebe die **1-2 stärksten spezifischen Motivbereiche** innerhalb dieser Top-Dimensionen hervor. Was sagt das über Deine spezifischen Bedürfnisse und Energiequellen aus?
*   Gehe kurz auf **auffallend niedrig bewertete Anreizdimensionen oder Motivbereiche** ein. Biete mögliche, neutrale Interpretationen an (z.B. "Bereiche wie X scheinen aktuell eine geringere Priorität für Dich zu haben. Das kann bedeuten, dass...").

**Reflexion: Soziale Erwünschtheit und Authentizität**
*   **WICHTIG:** Leite einen Abschnitt ein, der zur Selbstreflexion über soziale Erwünschtheit anregt.
    *   Stelle Fragen wie: "Entsprechen diese Einschätzungen wirklich Deinen tiefsten inneren Antrieben, oder spiegeln sie vielleicht wider, was Du glaubst, das von Dir erwartet wird, oder was gesellschaftlich als erstrebenswert gilt?"
    *   "Gibt es Bereiche, bei denen Du gezögert hast oder bei denen Du Dir unsicher warst, wie Du sie bewerten sollst? Was könnten die Gründe dafür sein?"
    *   "Welche dieser Antriebe spürst Du am authentischsten in Deinem Alltag?"
    *   Ermutige den Nutzer, diese Ergebnisse als Ausgangspunkt für ehrliche Selbstreflexion zu nutzen.

**Deine Motive im Kontext Deines Profils**
*   **Synergien:** Wo gibt es interessante Übereinstimmungen oder Verstärkungen zwischen Deinen stärksten Motiven und anderen Aspekten Deines Profils (RIASEC, Persönlichkeit, Valou, Future Skills)?
    *   Beispiel: "Deine hohe Ausprägung in 'Leistung' (Motivation) passt gut zu Deinem RIASEC-Interesse 'Entrepreneurial' und Deiner Big Five Eigenschaft 'Gewissenhaftigkeit'."
*   **Mögliche Spannungsfelder:** Wo könnten Deine Motive im Widerspruch zu anderen Deiner Eigenschaften, Interessen oder Lebenszielen stehen?
    *   Beispiel: "Ein starkes Bedürfnis nach 'Autonomie' könnte in manchen traditionellen Unternehmensstrukturen, die Du vielleicht aufgrund anderer Interessen in Betracht ziehst, eine Herausforderung darstellen."

**Impulse für Deine berufliche Gestaltung**
*   Gib 2-3 konkrete Impulse, wie Du Deine dominanten Motive in Deiner aktuellen oder zukünftigen beruflichen Situation besser berücksichtigen und nähren kannst.
*   Welche Arten von Aufgaben, Rollen oder Arbeitsumgebungen könnten Deine Motivationsstruktur besonders gut ansprechen?

**Zusammenfassung und Kernbotschaft**
*   Fasse die 2-3 wichtigsten Erkenntnisse oder Kernbotschaften für den Nutzer bezüglich seiner Motivation prägnant zusammen.
*   Gib einen ermutigenden Ausblick und betone die Wichtigkeit, die eigenen Antriebe zu kennen und zu nutzen.

**Wichtige Hinweise für Deine Antwort:**
*   Sei differenziert und vermeide pauschale Aussagen.
*   Formuliere positiv und ressourcenorientiert.
*   Der Report sollte tiefgründig, aber verständlich sein (ca. 400-600 Wörter).
*   Antworte NUR mit dem Report-Text.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Motivationsreport:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren des Reports: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren des Reports aufgetreten.";
  }
};

export const getFutureSkillsReport = async (
  futureSkillsData: FutureSkillsScreeningData,
  profileData: ProfileData
): Promise<string> => {
  if (!API_KEY) {
    return "Fehler: API-Schlüssel nicht konfiguriert.";
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const scaleMax = 10;
  const scaleNeutral = Math.ceil((1 + scaleMax) / 2);

  let prompt = `Du bist Dr. GoodWork, ein KI-Coach spezialisiert auf Future Skills und Kompetenzentwicklung.
Ein Nutzer hat gerade ein Screening zu seinen Future Skills abgeschlossen.
Erstelle einen tiefgründigen, differenzierten und motivierenden Report. Sprich den Nutzer direkt mit "Du" an.

**Die Ergebnisse des Nutzers aus dem Future Skills Screening (Skala 1-${scaleMax}):**
${futureSkillsData.dimensionScores.map(dim =>
  `- Kompetenzdimension "${dim.label}" (Gesamtdurchschnitt: ${dim.averageScore.toFixed(1)}):
${dim.skills.map(skill => `    - Skill "${skill.label}": ${skill.value}`).join('\n')}`
).join('\n')}

**Weitere Profildaten des Nutzers zur Kontextualisierung:**
- Selbstbild (manuell): ${profileData.identitaetProfilGesamtbericht || profileData.eigenschaftenPersoenlichkeit || "Keine spezifische Angabe"}
- RIASEC Top-Interessen: ${profileData.riasec?.hierarchy.slice(0,3).map(h => RIASEC_DESCRIPTIONS[h]?.label).join(', ') || "N/A"}
- Big Five Persönlichkeitstendenzen (Auszug):
${profileData.personalityScreening?.bigFiveScores?.map(dim => `  - ${dim.label}: Tendenz zu ${dim.score > scaleNeutral ? dim.positivePole.poleLabel : dim.negativePole.poleLabel} (Score ${dim.score.toFixed(1)})`).join('\n') || "  Keine Big Five Daten"}
- Top Anreizdimensionen (Motivation Screening, Auszug):
${profileData.motivationScreening?.dimensionScores?.slice(0,2).map(dim => `  - ${dim.label}: ${dim.averageScore.toFixed(1)}`).join('\n') || "  Keine Motivationsdaten"}
- Valou Ziel-Styling (Top 3 Must-Haves gesamt, falls vorhanden):
${profileData.valouZielstylingData ? Object.values(profileData.valouZielstylingData).flatMap(v => v.mustHaves).slice(0,3).join(', ') || "Keine Must-Haves spezifiziert" : "N/A"}
- Auszug aus dem Gesamtbericht zum beruflichen Identitätsprofil (falls vorhanden):\n ${getProfileReportSnippet(profileData)}\n`;

prompt += `
**Struktur des Reports:**
Formatiere Deinen Report mit Markdown (Überschriften ## und ###, Listen, Fettungen).

**Einleitung von Dr. GoodWork**
*   Stelle Dich kurz vor und erläutere den Wert dieses Future Skills Screenings für die berufliche Zukunftsfähigkeit.

**Deine Future Skills Landschaft: Ein Überblick**
*   Identifiziere die **2-3 stärksten Kompetenzdimensionen** (höchste Durchschnittswerte).
    *   Beschreibe für jede dieser Top-Dimensionen, was sie allgemein bedeutet.
    *   Hebe die **1-2 stärksten spezifischen Kompetenzfelder (Skills)** innerhalb dieser Top-Dimensionen hervor. Was sagt das über Deine besonderen Stärken aus?
*   Gehe kurz auf **auffallend niedrig bewertete Kompetenzdimensionen oder Skills** ein. Biete mögliche, neutrale Interpretationen an und zeige Entwicklungspotenziale auf (z.B. "Im Bereich X zeigst Du aktuell eine geringere Ausprägung. Das könnte ein spannendes Feld für Deine Weiterentwicklung sein, wenn es für Deine Ziele relevant ist.").

**Reflexion: Kontext und Anwendungsbereiche**
*   **WICHTIG:** Leite einen Abschnitt ein, der zur Selbstreflexion über den Kontext der Selbsteinschätzung anregt.
    *   Stelle Fragen wie: "In welchen Situationen (beruflich/privat) zeigst Du diese Stärken besonders deutlich?", "Gibt es Bereiche, in denen Du Deine weniger ausgeprägten Skills bewusst trainieren oder umgehen möchtest?", "Wie relevant sind die einzelnen Future Skills für Deine aktuellen oder angestrebten beruflichen Rollen?"
    *   Ermutige den Nutzer, diese Ergebnisse als Basis für gezielte Entwicklungspläne zu nutzen.

**Deine Future Skills im Kontext Deines Profils**
*   **Synergien:** Wo gibt es interessante Übereinstimmungen oder Verstärkungen zwischen Deinen stärksten Future Skills und anderen Aspekten Deines Profils (RIASEC, Persönlichkeit, Motivation, Valou)?
    *   Beispiel: "Deine hohe 'Problemlösungsfähigkeit' (Future Skill) korrespondiert hervorragend mit Deinem investigativen Interesse (RIASEC 'I')."
*   **Mögliche Entwicklungsfelder im Abgleich:** Wo könnten Deine Future Skills im Widerspruch zu Deinen Zielen stehen oder wo könnten bestimmte Skills Deine anderen Stärken noch besser unterstützen?
    *   Beispiel: "Wenn Du Deine 'Gestaltungswillen' (Future Skill) stärker einsetzen möchtest, könnte eine Weiterentwicklung Deiner 'Durchsetzungsstärke' (Future Skill) hilfreich sein."

**Impulse für Deine Kompetenzentwicklung**
*   Gib 2-3 konkrete Impulse, wie Du Deine dominanten Future Skills gezielt einsetzen und Deine Entwicklungsfelder angehen kannst.
*   Welche Lernmethoden, Projekte oder Verantwortungsbereiche könnten Deine Kompetenzentwicklung fördern?

**Zusammenfassung und Kernbotschaft**
*   Fasse die 2-3 wichtigsten Erkenntnisse oder Kernbotschaften für den Nutzer bezüglich seiner Future Skills prägnant zusammen.
*   Gib einen ermutigenden Ausblick und betone die Bedeutung kontinuierlichen Lernens und Anpassens.

**Wichtige Hinweise für Deine Antwort:**
*   Sei differenziert und vermeide pauschale Aussagen.
*   Formuliere positiv und ressourcenorientiert.
*   Der Report sollte tiefgründig, aber verständlich sein (ca. 400-600 Wörter).
*   Antworte NUR mit dem Report-Text.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Fehler bei der Anfrage an die Gemini API für Future Skills Report:", error);
    if (error instanceof Error) {
      return `Fehler beim Generieren des Reports: ${error.message}`;
    }
    return "Ein unbekannter Fehler ist beim Generieren des Reports aufgetreten.";
  }
};
