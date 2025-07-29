import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OpenMedMedication, MedicationListItem } from '@/types/medication';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'ILS'
): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800';
    case 'draft':
      return 'bg-amber-100 text-amber-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    case 'experimental':
      return 'bg-purple-100 text-purple-800';
    case 'clinical-trial':
      return 'bg-cyan-100 text-cyan-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'draft':
      return 'Draft';
    case 'expired':
      return 'Expired';
    case 'withdrawn':
      return 'Withdrawn';
    case 'experimental':
      return 'Experimental';
    case 'clinical-trial':
      return 'Clinical Trial';
    default:
      return status;
  }
}

export function transformMedicationToListItem(
  medication: OpenMedMedication
): MedicationListItem {
  const codes = [];
  if (medication.codes?.formidable) codes.push('Formidable');
  if (medication.codes?.moh) codes.push('MOH');
  if (medication.codes?.yarpa) codes.push('Yarpa');
  if (medication.codes?.pharmasoft) codes.push('Pharmasoft');
  if (medication.codes?.barcode) codes.push('Barcode');
  if (medication.codes?.rxnorm) codes.push('RxNorm');

  return {
    id: medication.id,
    name: medication.name,
    status: medication.status,
    category: medication.category,
    manufacturer: medication.manufacturer.name,
    hasPricing: !!(
      medication.pricing &&
      (medication.pricing.maxWholesalePrice ||
        medication.pricing.maxRetailPrice ||
        medication.pricing.maxPriceWithVAT)
    ),
    codes,
  };
}

export function filterMedications(
  medications: MedicationListItem[],
  filters: {
    status?: string;
    category?: string;
    manufacturer?: string;
    search?: string;
  }
): MedicationListItem[] {
  return medications.filter(medication => {
    if (filters.status && medication.status !== filters.status) return false;
    if (filters.category && medication.category !== filters.category)
      return false;
    if (
      filters.manufacturer &&
      medication.manufacturer !== filters.manufacturer
    )
      return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        medication.name.toLowerCase().includes(searchLower) ||
        medication.id.toLowerCase().includes(searchLower) ||
        medication.manufacturer.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}
