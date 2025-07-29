import { NextRequest, NextResponse } from 'next/server';
import { getMedicationsFromCache } from '@/lib/server-cache';
import { OpenMedMedication } from '@/types/medication';

export async function GET(request: NextRequest) {
  try {
    const medications = await getMedicationsFromCache();
    
    // Calculate statistics
    const stats = calculateStatistics(medications);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error calculating statistics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate statistics' },
      { status: 500 }
    );
  }
}

function calculateStatistics(medications: OpenMedMedication[]) {
  // Basic counts
  const totalMedications = medications.length;
  
  // Status distribution
  const statusCounts: Record<string, number> = {};
  medications.forEach(med => {
    const status = med.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  // Categories
  const categoryCounts: Record<string, number> = {};
  medications.forEach(med => {
    const category = med.category || 'Unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Manufacturers
  const manufacturerCounts: Record<string, number> = {};
  medications.forEach(med => {
    const manufacturer = med.manufacturer?.name || 'Unknown';
    manufacturerCounts[manufacturer] = (manufacturerCounts[manufacturer] || 0) + 1;
  });
  
  // Pricing statistics
  const medicationsWithPricing = medications.filter(med => 
    med.pricing && (
      med.pricing.maxWholesalePrice || 
      med.pricing.maxRetailPrice || 
      med.pricing.maxPriceWithVAT
    )
  );
  
  const pricingData = medicationsWithPricing.map(med => ({
    maxWholesalePrice: med.pricing?.maxWholesalePrice || 0,
    maxRetailPrice: med.pricing?.maxRetailPrice || 0,
    maxPriceWithVAT: med.pricing?.maxPriceWithVAT || 0
  }));
  
  // Price ranges
  const priceRanges = {
    '0-50': 0,
    '50-200': 0,
    '200-500': 0,
    '500+': 0
  };
  
  pricingData.forEach(pricing => {
    const price = pricing.maxRetailPrice || pricing.maxWholesalePrice || pricing.maxPriceWithVAT;
    if (price <= 50) priceRanges['0-50']++;
    else if (price <= 200) priceRanges['50-200']++;
    else if (price <= 500) priceRanges['200-500']++;
    else priceRanges['500+']++;
  });
  
  // Code coverage
  const codeCoverage = {
    formidable: 0,
    moh: 0,
    yarpa: 0,
    pharmasoft: 0,
    atc: 0,
    snomed: 0,
    barcode: 0,
    rxnorm: 0
  };
  
  medications.forEach(med => {
    if (med.codes?.formidable) codeCoverage.formidable++;
    if (med.codes?.moh) codeCoverage.moh++;
    if (med.codes?.yarpa) codeCoverage.yarpa++;
    if (med.codes?.pharmasoft) codeCoverage.pharmasoft++;
    if (med.codes?.atc) codeCoverage.atc++;
    if (med.codes?.snomed) codeCoverage.snomed++;
    if (med.codes?.barcode) codeCoverage.barcode++;
    if (med.codes?.rxnorm) codeCoverage.rxnorm++;
  });
  
  // Route distribution
  const routeCounts: Record<string, number> = {};
  medications.forEach(med => {
    const route = med.route || 'Unknown';
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  
  // Form distribution
  const formCounts: Record<string, number> = {};
  medications.forEach(med => {
    const form = med.form || 'Unknown';
    formCounts[form] = (formCounts[form] || 0) + 1;
  });
  
  // Top categories (sorted by count)
  const topCategories = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));
  
  // Top manufacturers (sorted by count)
  const topManufacturers = Object.entries(manufacturerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([manufacturer, count]) => ({ manufacturer, count }));
  
  return {
    overview: {
      totalMedications,
      medicationsWithPricing: medicationsWithPricing.length,
      uniqueManufacturers: Object.keys(manufacturerCounts).length,
      uniqueCategories: Object.keys(categoryCounts).length,
      uniqueRoutes: Object.keys(routeCounts).length,
      uniqueForms: Object.keys(formCounts).length
    },
    statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / totalMedications) * 100)
    })),
    topCategories,
    topManufacturers,
    priceRanges,
    codeCoverage: {
      formidable: Math.round((codeCoverage.formidable / totalMedications) * 100),
      moh: Math.round((codeCoverage.moh / totalMedications) * 100),
      yarpa: Math.round((codeCoverage.yarpa / totalMedications) * 100),
      pharmasoft: Math.round((codeCoverage.pharmasoft / totalMedications) * 100),
      atc: Math.round((codeCoverage.atc / totalMedications) * 100),
      snomed: Math.round((codeCoverage.snomed / totalMedications) * 100),
      barcode: Math.round((codeCoverage.barcode / totalMedications) * 100),
      rxnorm: Math.round((codeCoverage.rxnorm / totalMedications) * 100)
    },
    routeDistribution: Object.entries(routeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([route, count]) => ({ route, count })),
    formDistribution: Object.entries(formCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([form, count]) => ({ form, count })),
    pricingStats: {
      averageWholesalePrice: pricingData.length > 0 
        ? Math.round(pricingData.reduce((sum, p) => sum + p.maxWholesalePrice, 0) / pricingData.length)
        : 0,
      averageRetailPrice: pricingData.length > 0 
        ? Math.round(pricingData.reduce((sum, p) => sum + p.maxRetailPrice, 0) / pricingData.length)
        : 0,
      maxPrice: pricingData.length > 0 
        ? Math.max(...pricingData.map(p => p.maxRetailPrice || p.maxWholesalePrice || p.maxPriceWithVAT))
        : 0,
      minPrice: pricingData.length > 0 
        ? Math.min(...pricingData.map(p => p.maxRetailPrice || p.maxWholesalePrice || p.maxPriceWithVAT).filter(p => p > 0))
        : 0
    }
  };
} 