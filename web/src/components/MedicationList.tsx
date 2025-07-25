'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';
import { MedicationListItem, MedicationFilters } from '@/types/medication';
import { loadMedicationList, clearCache } from '@/lib/data';
import {
  getStatusColor,
  getStatusText,
  filterMedications,
  cn,
} from '@/lib/utils';
import { DataLoadingIndicator } from '@/components/LoadingIndicator';

export function MedicationList() {
  const [medications, setMedications] = useState<MedicationListItem[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<
    MedicationListItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<'loading' | 'cached' | 'fresh'>('loading');
  const [filters, setFilters] = useState<MedicationFilters>({
    status: 'draft',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = filterMedications(medications, filters);
    setFilteredMedications(filtered);
  }, [medications, filters]);

  const loadData = async () => {
    setLoading(true);
    setCacheStatus('loading');
    try {
      const startTime = Date.now();
      const data = await loadMedicationList();
      const loadTime = Date.now() - startTime;
      
      setMedications(data);
      
      // Determine if data was loaded from cache (fast) or fresh (slow)
      if (loadTime < 100) {
        setCacheStatus('cached');
      } else {
        setCacheStatus('fresh');
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    loadData();
  };

  const getUniqueValues = (field: keyof MedicationListItem) => {
    const values = new Set(medications.map(m => m[field] as string));
    return Array.from(values).sort();
  };

  if (loading) {
    return <DataLoadingIndicator />;
  }

  return (
    <div className='space-y-2'>
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-4'>
          <p className='text-gray-600'>
            Total: {filteredMedications.length} medications
          </p>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={handleClearCache}
            className='bg-gray-500 text-white text-sm px-4 py-1 rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg'
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='bg-white backdrop-blur-sm p-4 rounded-xl border border-gray-200 mb-6'>
        <div className='flex gap-4 items-center'>
          <div className='flex-1 relative'>
            <Search className='h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10' />
            <input
              type='text'
              placeholder='Search by name, ID, or manufacturer...'
              className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/50 backdrop-blur-sm'
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 bg-white/50 backdrop-blur-sm'
          >
            <Filter className='h-4 w-4' />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-4'>
            <select
              className='border border-gray-200 rounded-lg px-3 py-2 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
              value={filters.status || ''}
              onChange={e =>
                setFilters({ ...filters, status: e.target.value || undefined })
              }
            >
              <option value=''>All Statuses</option>
              {getUniqueValues('status').map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>

            <select
              className='border border-gray-200 rounded-lg px-3 py-2 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
              value={filters.category || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  category: e.target.value || undefined,
                })
              }
            >
              <option value=''>All Categories</option>
              {getUniqueValues('category').map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className='border border-gray-200 rounded-lg px-3 py-2 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent'
              value={filters.manufacturer || ''}
              onChange={e =>
                setFilters({
                  ...filters,
                  manufacturer: e.target.value || undefined,
                })
              }
            >
              <option value=''>All Manufacturers</option>
              {getUniqueValues('manufacturer').map(manufacturer => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Medication Table */}
      <div className='bg-white backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-black'>
              <tr>
                <th
                  scope='col'
                  className='px-3 py-3å text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Medication
                </th>
                <th
                  scope='col'
                  className='px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Status
                </th>
                <th
                  scope='col'
                  className='px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Category
                </th>
                <th
                  scope='col'
                  className='px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Manufacturer
                </th>
                <th
                  scope='col'
                  className='px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Pricing
                </th>
                <th
                  scope='col'
                  className='px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'
                >
                  Codes
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredMedications.map(medication => (
                <tr
                  key={medication.id}
                  className='hover:bg-gray-50 transition-colors duration-150'
                >
                  <td className='px-3 py-1.5 whitespace-nowrap'>
                    <Link
                      href={`/medications/${medication.id}`}
                      className='group'
                    >
                      <div className='text-sm font-medium text-gray-900 group-hover:text-cyan-600 transition-colors truncate'>
                        {medication.name}
                      </div>
                      <div className='text-sm text-gray-500'>
                        ID: {medication.id}
                      </div>
                    </Link>
                  </td>
                  <td className='px-3 py-1.5 whitespace-nowrap'>
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        getStatusColor(medication.status)
                      )}
                    >
                      {getStatusText(medication.status)}
                    </span>
                  </td>
                  <td className='px-3 py-1.5 whitespace-nowrap text-sm text-gray-900'>
                    {medication.category}
                  </td>
                  <td className='px-3 py-1.5 whitespace-nowrap text-sm text-gray-900'>
                    {medication.manufacturer}
                  </td>
                  <td className='px-3 py-1.5 whitespace-nowrap'>
                    {medication.hasPricing ? (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800'>
                        <DollarSign className='h-3 w-3 mr-1' />
                        Available
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                        Not Available
                      </span>
                    )}
                  </td>
                  <td className='px-3 py-1.5 whitespace-nowrap text-sm text-gray-900'>
                    <div className='flex flex-wrap gap-1'>
                      {medication.codes.slice(0, 2).map(code => (
                        <span
                          key={code}
                          className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800'
                        >
                          {code}
                        </span>
                      ))}
                      {medication.codes.length > 2 && (
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                          +{medication.codes.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMedications.length === 0 && !loading && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>No medications found</p>
        </div>
      )}
    </div>
  );
}
