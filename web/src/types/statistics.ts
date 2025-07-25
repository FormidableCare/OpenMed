export interface StatisticsOverview {
  totalMedications: number;
  medicationsWithPricing: number;
  uniqueManufacturers: number;
  uniqueCategories: number;
  uniqueRoutes: number;
  uniqueForms: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface CategoryItem {
  category: string;
  count: number;
}

export interface ManufacturerItem {
  manufacturer: string;
  count: number;
}

export interface RouteItem {
  route: string;
  count: number;
}

export interface FormItem {
  form: string;
  count: number;
}

export interface PriceRanges {
  '0-50': number;
  '50-200': number;
  '200-500': number;
  '500+': number;
}

export interface CodeCoverage {
  formidable: number;
  moh: number;
  yarpa: number;
  pharmasoft: number;
  atc: number;
  snomed: number;
}

export interface PricingStats {
  averageWholesalePrice: number;
  averageRetailPrice: number;
  maxPrice: number;
  minPrice: number;
}

export interface Statistics {
  overview: StatisticsOverview;
  statusDistribution: StatusDistribution[];
  topCategories: CategoryItem[];
  topManufacturers: ManufacturerItem[];
  priceRanges: PriceRanges;
  codeCoverage: CodeCoverage;
  routeDistribution: RouteItem[];
  formDistribution: FormItem[];
  pricingStats: PricingStats;
} 