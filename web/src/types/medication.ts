export interface OpenMedMedication {
  resourceType: 'OpenMedMedication';
  id: string;
  name: string;
  meta: {
    version: string;
    lastUpdated: string;
    source?: string;
  };
  status:
    | 'draft'
    | 'active'
    | 'expired'
    | 'withdrawn'
    | 'experimental'
    | 'clinical-trial';
  lifecycleStage?:
    | 'marketed'
    | 'discontinued'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'draft';
  category: string;
  manufacturer: {
    name: string;
    country: string;
  };
  form?: string;
  route?:
    | 'oral'
    | 'intravenous'
    | 'intramuscular'
    | 'subcutaneous'
    | 'topical'
    | 'inhalation'
    | 'rectal'
    | 'vaginal'
    | 'ophthalmic'
    | 'otic'
    | 'nasal'
    | 'transdermal';
  site?: string;
  method?: string;
  packaging?: Array<{
    packageSize: number;
    unit: string;
  }>;
  composition: Array<{
    substance: string;
    baseEquivalent?: {
      substance: string;
      value: number;
      unit: string;
    };
    concentration?: {
      value: number;
      unit: string;
    } | null;
  }>;
  dosageGuidelines?: Array<{
    route: string;
    quantity: number;
    frequency: string;
    period?: string;
    unit?: string;
    minAge?: number;
    maxAge?: number;
    weightMin?: number;
    weightMax?: number;
    indication?: string;
  }>;
  pricing?: {
    maxWholesalePrice?: number;
    retailMarginPercent?: number;
    maxRetailPrice?: number;
    maxPriceWithVAT?: number;
    currency?: string;
  };
  codes?: {
    atc?: string;
    snomed?: string;
    yarpa?: string;
    pharmasoft?: string;
    formidable?: string;
    moh?: string;
    barcode?: string;
    rxnorm?: string;
  };
  alternatives?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: Array<{
    drug: string;
    severity: 'Major' | 'Moderate' | 'Minor';
    description: string;
  }>;
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X' | 'Unknown';
  lactationCategory?: 'Safe' | 'Caution' | 'Avoid' | 'Unknown';
  storageConditions?: string[];
  shelfLife?: string;
  prescriptionRequired?: boolean;
  controlledSubstance?: boolean;
  controlledSubstanceLevel?: 'None' | 'Level1' | 'Level2' | 'Level3';
  mechanismOfAction?: string;
  indications?: string[];
  warnings?: string[];
  precautions?: string[];
  monitoring?: string[];
  laboratoryTests?: string[];
  overdose?: string;
  pharmacokinetics?: {
    absorption?: string;
    distribution?: string;
    metabolism?: string;
    excretion?: string;
    halfLife?: string;
    bioavailability?: string;
    proteinBinding?: string;
  };
  clinicalTrials?: Array<{
    trialId: string;
    phase?: 'Phase1' | 'Phase2' | 'Phase3' | 'Phase4';
    status?: string;
    results?: string;
  }>;
  references?: Array<{
    type?: string;
    title?: string;
    url?: string;
    doi?: string;
    authors?: string[];
    year?: number;
  }>;
}

export interface MedicationListItem {
  id: string;
  name: string;
  status: string;
  category: string;
  manufacturer: string;
  hasPricing: boolean;
  codes: string[];
}

export interface MedicationFilters {
  status?: string;
  category?: string;
  manufacturer?: string;
  search?: string;
}
