'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Package, DollarSign, Tag, Building } from 'lucide-react';
import { loadStatistics } from '@/lib/data';
import { Statistics } from '@/types/statistics';
import { getStatusColor, getStatusText } from '@/lib/utils';
import { PageLoadingIndicator } from '@/components/LoadingIndicator';

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadStatistics();
      if (data) {
        setStats(data);
      } else {
        setError('Failed to load statistics');
      }
    } catch (err) {
      setError('Error loading statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoadingIndicator />;
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Failed to load statistics'}</p>
        <button
          onClick={loadData}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          System Statistics
        </h1>
        <p className='text-gray-600'>
          Overview of medication data in the system
        </p>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Total Medications
              </p>
              <p className='text-3xl font-bold text-cyan-600'>
                {stats.overview.totalMedications.toLocaleString()}
              </p>
            </div>
            <Package className='h-8 w-8 text-cyan-600' />
          </div>
        </div>

        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>With Pricing</p>
              <p className='text-3xl font-bold text-emerald-600'>
                {stats.overview.medicationsWithPricing.toLocaleString()}
              </p>
            </div>
            <DollarSign className='h-8 w-8 text-emerald-600' />
          </div>
        </div>

        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>
                Different Manufacturers
              </p>
              <p className='text-3xl font-bold text-purple-600'>
                {stats.overview.uniqueManufacturers.toLocaleString()}
              </p>
            </div>
            <Building className='h-8 w-8 text-purple-600' />
          </div>
        </div>

        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Categories</p>
              <p className='text-3xl font-bold text-cyan-600'>
                {stats.overview.uniqueCategories.toLocaleString()}
              </p>
            </div>
            <Tag className='h-8 w-8 text-cyan-600' />
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Status Distribution */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Status Distribution
          </h2>
          <div className='space-y-3'>
            {stats.statusDistribution.map((item) => (
              <div key={item.status} className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>
                  {getStatusText(item.status)}
                </span>
                <div className='flex items-center gap-2'>
                  <div className='w-32 bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full ${getStatusColor(item.status).replace('text-', 'bg-')}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className='text-sm font-medium'>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Popular Categories
          </h2>
          <div className='space-y-3'>
            {stats.topCategories.slice(0, 5).map((item) => (
              <div key={item.category} className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>{item.category}</span>
                <span className='text-sm font-medium'>{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Coverage */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Code Coverage
          </h2>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Formidable</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.formidable}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>MOH</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.moh}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Yarpa</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.yarpa}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Pharmasoft</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.pharmasoft}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>ATC</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.atc}%</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>SNOMED</span>
              <span className='text-sm font-medium'>{stats.codeCoverage.snomed}%</span>
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Price Ranges
          </h2>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Up to ₪50</span>
              <span className='text-sm font-medium'>{stats.priceRanges['0-50'].toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>₪50 - ₪200</span>
              <span className='text-sm font-medium'>{stats.priceRanges['50-200'].toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>₪200 - ₪500</span>
              <span className='text-sm font-medium'>{stats.priceRanges['200-500'].toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>מעל ₪500</span>
              <span className='text-sm font-medium'>{stats.priceRanges['500+'].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Top Manufacturers */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Top Manufacturers
          </h2>
          <div className='space-y-3'>
            {stats.topManufacturers.slice(0, 5).map((item) => (
              <div key={item.manufacturer} className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>{item.manufacturer}</span>
                <span className='text-sm font-medium'>{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Statistics */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4'>
            Pricing Statistics
          </h2>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Average Retail Price</span>
              <span className='text-sm font-medium'>₪{stats.pricingStats.averageRetailPrice.toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Average Wholesale Price</span>
              <span className='text-sm font-medium'>₪{stats.pricingStats.averageWholesalePrice.toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Maximum Price</span>
              <span className='text-sm font-medium'>₪{stats.pricingStats.maxPrice.toLocaleString()}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Minimum Price</span>
              <span className='text-sm font-medium'>₪{stats.pricingStats.minPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
