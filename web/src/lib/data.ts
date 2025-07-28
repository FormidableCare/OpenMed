import { OpenMedMedication, MedicationListItem } from '@/types/medication';
import { Statistics } from '@/types/statistics';
import { transformMedicationToListItem } from './utils';

// Cache for loaded medications
let medicationsCache: OpenMedMedication[] | null = null;
let listItemsCache: MedicationListItem[] | null = null;
let cacheTimestamp: number = 0;
const CLIENT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

export async function loadAllMedications(): Promise<OpenMedMedication[]> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (medicationsCache && (now - cacheTimestamp) < CLIENT_CACHE_DURATION) {
    console.log(`Returning ${medicationsCache.length} medications from client cache`);
    return medicationsCache;
  }

  console.log('Loading medications from server...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/medications');
    if (!response.ok) {
      throw new Error('Failed to load medications');
    }

    const medications = await response.json();
    medicationsCache = medications;
    cacheTimestamp = now;
    
    const loadTime = Date.now() - startTime;
    console.log(`Loaded ${medications.length} medications from server in ${loadTime}ms`);
    return medications;
  } catch (error) {
    console.error('Error loading medications:', error);
    // Return existing cache if available, otherwise empty array
    return medicationsCache || [];
  }
}

export async function loadMedicationById(
  id: string
): Promise<OpenMedMedication | null> {
  try {
    const response = await fetch(`/api/medications/${id}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading medication:', error);
    return null;
  }
}

export async function loadMedicationList(): Promise<MedicationListItem[]> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (listItemsCache && (now - cacheTimestamp) < CLIENT_CACHE_DURATION) {
    return listItemsCache;
  }

  const medications = await loadAllMedications();
  const listItems = medications.map(transformMedicationToListItem);
  listItemsCache = listItems;
  return listItems;
}

export async function saveMedication(
  medication: OpenMedMedication
): Promise<boolean> {
  try {
    const response = await fetch(`/api/medications/${medication.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(medication),
    });

    if (response.ok) {
      // Update client cache with the new medication data
      updateMedicationInClientCache(medication);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving medication:', error);
    return false;
  }
}

export function clearCache() {
  medicationsCache = null;
  listItemsCache = null;
  cacheTimestamp = 0;
  console.log('Client cache cleared');
}

export function updateMedicationInClientCache(medication: OpenMedMedication) {
  // Update medications cache
  if (medicationsCache) {
    const index = medicationsCache.findIndex(med => med.id === medication.id);
    if (index !== -1) {
      medicationsCache[index] = medication;
    } else {
      medicationsCache.push(medication);
    }
    // Re-sort the cache
    medicationsCache.sort((a, b) => a.id.localeCompare(b.id));
  }
  
  // Update list items cache
  if (listItemsCache) {
    const updatedListItem = transformMedicationToListItem(medication);
    const index = listItemsCache.findIndex(item => item.id === medication.id);
    if (index !== -1) {
      listItemsCache[index] = updatedListItem;
    } else {
      listItemsCache.push(updatedListItem);
    }
    // Re-sort the cache
    listItemsCache.sort((a, b) => a.id.localeCompare(b.id));
  }
  
  console.log(`Updated medication ${medication.id} in client cache`);
}

export async function clearServerCache(): Promise<boolean> {
  try {
    const response = await fetch('/api/cache', {
      method: 'DELETE',
    });
    
    if (response.ok) {
      // Also clear client cache
      clearCache();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error clearing server cache:', error);
    return false;
  }
}

export async function loadStatistics(): Promise<Statistics | null> {
  try {
    const response = await fetch('/api/statistics');
    if (!response.ok) {
      throw new Error('Failed to load statistics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading statistics:', error);
    return null;
  }
}

export async function getAISuggestions(
  field: string, 
  medication: Partial<OpenMedMedication>, 
  context?: string
): Promise<Array<{ value: string; confidence: number }>> {
  try {
    const response = await fetch('/api/ai-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ field, medication, context }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }

    const data = await response.json();
    const fieldSuggestions = data.suggestions?.[field] || [];
    // Return the full suggestion objects with confidence scores
    return fieldSuggestions.map((suggestion: { value: string; confidence?: number } | string) => 
      typeof suggestion === 'object' ? { value: suggestion.value, confidence: suggestion.confidence || 1.0 } : { value: suggestion, confidence: 1.0 }
    );
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return [];
  }
}

export async function getComprehensiveAISuggestions(
  medication: Partial<OpenMedMedication>,
  context?: string
): Promise<Record<string, Array<{ value: string; confidence: number }>>> {
  try {
    const response = await fetch('/api/ai-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ medication, context }),
    });

    if (!response.ok) {
      throw new Error('Failed to get comprehensive AI suggestions');
    }

    const data = await response.json();
    const suggestions = data.suggestions || {};
    
    // Return the full suggestion objects with confidence scores
    const transformedSuggestions: Record<string, Array<{ value: string; confidence: number }>> = {};
    for (const [field, fieldSuggestions] of Object.entries(suggestions)) {
      if (Array.isArray(fieldSuggestions)) {
        transformedSuggestions[field] = fieldSuggestions.map((suggestion: { value: string; confidence?: number } | string) => 
          typeof suggestion === 'object' ? { value: suggestion.value, confidence: suggestion.confidence || 1.0 } : { value: suggestion, confidence: 1.0 }
        );
      }
    }
    
    return transformedSuggestions;
  } catch (error) {
    console.error('Error getting comprehensive AI suggestions:', error);
    return {};
  }
}
