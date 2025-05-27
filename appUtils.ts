
import { UserDataCollection, ProfileData, UserDataCategoryKey } from './types';
import { getValouAreas, CATEGORY_LABELS, RELEVANT_IDENTITY_PROFILE_FIELDS } from './constants';

export const isValouDataEffectivelyEmpty = (valouData: UserDataCollection): boolean => {
  if (!valouData) return true;
  return Object.values(valouData).every(
    entry => 
      entry.stylingSatz === '' &&
      entry.vorlieben.length === 0 &&
      entry.abneigungen.length === 0 &&
      entry.mustHaves.length === 0 &&
      entry.noGos.length === 0
  );
};

export const isProfileDataSufficientForKiStyling = (currentProfileData: ProfileData): boolean => {
  if (!currentProfileData) return false;
  
  const hasRiasecData = !!currentProfileData.riasec?.scores && Object.keys(currentProfileData.riasec.scores).length > 0;
  if (hasRiasecData) return true;
  
  const hasPersonalityData = !!currentProfileData.personalityScreening?.bigFiveScores && currentProfileData.personalityScreening.bigFiveScores.length > 0;
  if (hasPersonalityData) return true;

  const hasMotivationData = !!currentProfileData.motivationScreening?.dimensionScores && currentProfileData.motivationScreening.dimensionScores.length > 0;
  if (hasMotivationData) return true;

  const hasFutureSkillsData = !!currentProfileData.futureSkillsScreening?.dimensionScores && currentProfileData.futureSkillsScreening.dimensionScores.length > 0;
  if (hasFutureSkillsData) return true;
  
  const SUFFICIENT_MANUAL_IDENTITY_FIELDS: Array<keyof ProfileData> = [
    'identitaetProfilGesamtbericht', 'eigenschaftenPersoenlichkeit', 'neigungenInteressen', 'motiveAntriebe', 'faehigkeitenKompetenzen'
  ];
  const hasSufficientManualIdentityData = SUFFICIENT_MANUAL_IDENTITY_FIELDS.some(field => {
    const value = currentProfileData[field];
    return typeof value === 'string' && value.trim() !== '';
  });
  if (hasSufficientManualIdentityData) return true;

  const SUFFICIENT_GENERAL_PROFILE_FIELDS: Array<keyof ProfileData> = [
    'personalNotes', 'experience', 'qualifications', 'targetIndustries', 'exclusionCriteria'
  ];
  return SUFFICIENT_GENERAL_PROFILE_FIELDS.some(field => {
    const value = currentProfileData[field];
    return typeof value === 'string' && value.trim() !== '';
  });
};

export const isIdentityProfileEmpty = (currentProfileData: ProfileData): boolean => {
  if (!currentProfileData) return true; 
  return RELEVANT_IDENTITY_PROFILE_FIELDS.every(field => {
    const value = currentProfileData[field as keyof ProfileData];
    return !value || (typeof value === 'string' && value.trim() === '');
  });
};

export const generateTxtContentForValou = (valouData: UserDataCollection, valouSummary?: string): string => {
  if (!valouData || Object.keys(valouData).length === 0) return "";
  let txtContent = "VALOU ZIELSTYLING - DEINE ZUSAMMENFASSUNG\n\n";

  if (valouSummary && valouSummary.trim() !== "" && !valouSummary.startsWith("Fehler:")) {
    txtContent += "KI-GENERIERTE GESAMTZUSAMMENFASSUNG:\n";
    txtContent += "----------------------------------------\n";
    let plainSummary = valouSummary
      .replace(/<br\s*\/?>/gi, "\n") 
      .replace(/<\/(h[1-6]|p|ul|ol|li)>/gi, "\n") 
      .replace(/<li>/gi, "- ")
      .replace(/<[^>]+>/g, "") 
      .replace(/\n\s*\n+/g, "\n\n") 
      .trim();
    txtContent += plainSummary + "\n\n";
    txtContent += "----------------------------------------\n\n";
  }

  txtContent += "DETAILS PRO BEREICH:\n";
  txtContent += "----------------------------------------\n\n";

  getValouAreas().forEach(area => {
    const areaData = valouData[area.id];
    if (!areaData) return;
    txtContent += `${area.name.toUpperCase()}\n`;
    txtContent += `${area.description}\n\n`;
    txtContent += `Dein Stylingsatz: ${areaData.stylingSatz || "-"}\n\n`;
    
    Object.keys(CATEGORY_LABELS).forEach(catKey => {
      const category = catKey as UserDataCategoryKey;
      if (areaData[category] && areaData[category].length > 0) {
        txtContent += `${CATEGORY_LABELS[category]}:\n`;
        areaData[category].forEach(item => txtContent += `- ${item}\n`);
        txtContent += "\n";
      }
    });
    txtContent += "----------------------------------------\n\n";
  });
  return txtContent;
};

export const areAllIdentityScreeningsComplete = (profileData: ProfileData): boolean => {
  const riasecComplete = !!profileData.riasec?.lastRun && !!profileData.riasec.scores && Object.keys(profileData.riasec.scores).length > 0;
  const personalityComplete = !!profileData.personalityScreening?.lastRun && !!profileData.personalityScreening.bigFiveScores && profileData.personalityScreening.bigFiveScores.length > 0;
  const motivationComplete = !!profileData.motivationScreening?.lastRun && !!profileData.motivationScreening.dimensionScores && profileData.motivationScreening.dimensionScores.length > 0;
  const futureSkillsComplete = !!profileData.futureSkillsScreening?.lastRun && !!profileData.futureSkillsScreening.dimensionScores && profileData.futureSkillsScreening.dimensionScores.length > 0;
  
  return riasecComplete && personalityComplete && motivationComplete && futureSkillsComplete;
};