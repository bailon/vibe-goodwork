
import { ProfileData } from '../types';
import {
  INITIAL_PROFILE_DATA,
  LOCAL_STORAGE_PROFILE_KEY
} from '../constants';

// ProfileData functions
export const loadProfileDataFromLocalStorage = (): ProfileData => {
  const savedData = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      // Merge with initial data to ensure all keys are present and defaults are applied
      // especially for nested objects like valouZielstylingData
      const completeProfileData = {
         ...INITIAL_PROFILE_DATA,
         ...parsedData,
         valouZielstylingData: {
           ...INITIAL_PROFILE_DATA.valouZielstylingData,
           ...(parsedData.valouZielstylingData || {})
         }
      };
      return completeProfileData;
    } catch (error) {
      console.error("Fehler beim Parsen der Profildaten aus dem LocalStorage:", error);
      return INITIAL_PROFILE_DATA;
    }
  }
  return INITIAL_PROFILE_DATA;
};

export const saveProfileDataToLocalStorage = (data: ProfileData): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, serializedData);
  } catch (error) {
    console.error("Fehler beim Speichern der Profildaten im LocalStorage:", error);
  }
};