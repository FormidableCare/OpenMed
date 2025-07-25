import { promises as fs } from 'fs';
import path from 'path';
import { OpenMedMedication } from '@/types/medication';

// Server-side cache
let medicationsCache: OpenMedMedication[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Batch size for parallel processing
const BATCH_SIZE = 100;

export async function getMedicationsFromCache(): Promise<OpenMedMedication[]> {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (medicationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    console.log(`Returning ${medicationsCache.length} medications from cache`);
    return medicationsCache;
  }

  // Load fresh data from files
  console.log('Loading medications from files...');
  const startTime = Date.now();
  
  try {
    const catalogPath = path.join(process.cwd(), '..', 'catalog');
    const files = await fs.readdir(catalogPath);

    const jsonFiles = files.filter(file => file.endsWith('.json'));
    console.log(`Found ${jsonFiles.length} JSON files to process`);

    const medications: OpenMedMedication[] = [];

    // Process files in batches for better performance
    for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
      const batch = jsonFiles.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(jsonFiles.length / BATCH_SIZE)} (${batch.length} files)`);
      
      // Read files in parallel within each batch
      const batchPromises = batch.map(async (file) => {
        try {
          const filePath = path.join(catalogPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const medication = JSON.parse(content) as OpenMedMedication;
          return medication;
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validMedications = batchResults.filter(med => med !== null) as OpenMedMedication[];
      medications.push(...validMedications);
    }

    // Sort by ID for consistent ordering
    console.log('Sorting medications...');
    medications.sort((a, b) => a.id.localeCompare(b.id));

    // Update cache
    medicationsCache = medications;
    cacheTimestamp = now;

    const loadTime = Date.now() - startTime;
    console.log(`Loaded ${medications.length} medications into cache in ${loadTime}ms`);
    return medications;
  } catch (error) {
    console.error('Error loading medications into cache:', error);
    // Return existing cache if available, otherwise empty array
    return medicationsCache || [];
  }
}

export async function getMedicationByIdFromCache(id: string): Promise<OpenMedMedication | null> {
  const medications = await getMedicationsFromCache();
  return medications.find(med => med.id === id) || null;
}

export function clearServerCache() {
  medicationsCache = null;
  cacheTimestamp = 0;
  console.log('Server cache cleared');
}

export function updateMedicationInCache(medication: OpenMedMedication) {
  if (!medicationsCache) return;

  const index = medicationsCache.findIndex(med => med.id === medication.id);
  if (index !== -1) {
    medicationsCache[index] = medication;
  } else {
    medicationsCache.push(medication);
  }
  
  // Re-sort the cache
  medicationsCache.sort((a, b) => a.id.localeCompare(b.id));
  
  // Update timestamp to extend cache validity
  cacheTimestamp = Date.now();
}

// Preload function to warm up cache on server startup
export async function preloadCache(): Promise<void> {
  console.log('Preloading medication cache...');
  try {
    await getMedicationsFromCache();
    console.log('Cache preload completed successfully');
  } catch (error) {
    console.error('Error preloading cache:', error);
  }
}

// Get cache status for monitoring
export function getCacheStatus() {
  const now = Date.now();
  const isExpired = !medicationsCache || (now - cacheTimestamp) >= CACHE_DURATION;
  const timeUntilExpiry = medicationsCache ? CACHE_DURATION - (now - cacheTimestamp) : 0;
  
  return {
    hasCache: !!medicationsCache,
    isExpired,
    cacheSize: medicationsCache?.length || 0,
    lastUpdated: cacheTimestamp,
    timeUntilExpiry,
    cacheDuration: CACHE_DURATION
  };
} 