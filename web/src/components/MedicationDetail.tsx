'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Wand2,
  Package,
  DollarSign,
  Tag,
  Building,
  Calendar,
} from 'lucide-react';
import { OpenMedMedication } from '@/types/medication';
import { loadMedicationById, saveMedication } from '@/lib/data';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  cn,
} from '@/lib/utils';
import { DataLoadingIndicator } from '@/components/LoadingIndicator';

export function MedicationDetail() {
  const params = useParams();
  const router = useRouter();
  const [medication, setMedication] = useState<OpenMedMedication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadMedication(params.id as string);
    }
  }, [params.id]);

  const loadMedication = async (id: string) => {
    setLoading(true);
    try {
      const data = await loadMedicationById(id);
      setMedication(data);
    } catch (error) {
      console.error('Error loading medication:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!medication) return;

    setSaving(true);
    try {
      const success = await saveMedication(medication);
      if (success) {
        setEditing(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error saving medication:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    if (!medication) return;

    const newMedication = { ...medication };

    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'manufacturer') {
        newMedication.manufacturer = {
          ...newMedication.manufacturer,
          [child]: value as string,
        };
      } else if (parent === 'pricing') {
        if (!newMedication.pricing) {
          newMedication.pricing = {};
        }
        newMedication.pricing = { ...newMedication.pricing, [child]: value };
      } else if (parent === 'meta') {
        newMedication.meta = {
          ...newMedication.meta,
          [child]: value as string,
        };
      } else if (parent === 'codes') {
        if (!newMedication.codes) {
          newMedication.codes = {};
        }
        newMedication.codes = { ...newMedication.codes, [child]: value as string };
      }
    } else {
      (newMedication as unknown as Record<string, any>)[field] = value;
    }

    setMedication(newMedication);
  };

  const getAISuggestions = async (field: string) => {
    if (!medication) return;

    try {
      const response = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medication, field }),
      });

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      return [];
    }
  };

  if (loading) {
    return <DataLoadingIndicator />;
  }

  if (!medication) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Medication not found</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg hover:bg-white/90 transition-all duration-200 shadow-sm'
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {editing ? 'Edit Medication' : medication.name}
            </h1>
            <p className='text-gray-600 mt-1'>ID: {medication.id}</p>
          </div>
        </div>

        <div className='flex gap-3'>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium'
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 shadow-lg font-medium'
              >
                <Save className='h-4 w-4' />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className='px-4 py-2 bg-gradient-to-r from-cyan-600 to-cyan-600 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-700 transition-all duration-200 shadow-lg font-medium'
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className='flex items-center gap-4 mb-6'>
        <span
          className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            getStatusColor(medication.status)
          )}
        >
          {getStatusText(medication.status)}
        </span>
        <span className='text-sm text-gray-500 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-lg'>
          Last Updated: {formatDate(medication.meta.lastUpdated)}
        </span>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Basic Information */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center'>
              <Package className='h-4 w-4 text-white' />
            </div>
            Basic Information
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Medication Name *
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.name || ''}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/50 backdrop-blur-sm'
                  placeholder='Enter medication name'
                />
              ) : (
                <p className='text-gray-900 font-medium'>{medication.name || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Status *
              </label>
              {editing ? (
                <select
                  value={medication.status}
                  onChange={e => handleFieldChange('status', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value='draft'>Draft</option>
                  <option value='active'>Active</option>
                  <option value='expired'>Expired</option>
                  <option value='withdrawn'>Withdrawn</option>
                  <option value='experimental'>Experimental</option>
                  <option value='clinical-trial'>Clinical Trial</option>
                </select>
              ) : (
                <span className={cn('px-2 py-1 text-sm font-medium rounded-full', getStatusColor(medication.status))}>
                  {getStatusText(medication.status)}
                </span>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Lifecycle Stage
              </label>
              {editing ? (
                <select
                  value={medication.lifecycleStage || ''}
                  onChange={e => handleFieldChange('lifecycleStage', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select lifecycle stage</option>
                  <option value='marketed'>Marketed</option>
                  <option value='discontinued'>Discontinued</option>
                  <option value='pending'>Pending</option>
                  <option value='approved'>Approved</option>
                  <option value='rejected'>Rejected</option>
                  <option value='draft'>Draft</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.lifecycleStage || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Category *
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.category || ''}
                  onChange={e => handleFieldChange('category', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter category'
                />
              ) : (
                <p className='text-gray-900'>{medication.category || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Form
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.form || ''}
                  onChange={e => handleFieldChange('form', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., tablet, capsule, liquid'
                />
              ) : (
                <p className='text-gray-900'>{medication.form || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Route
              </label>
              {editing ? (
                <select
                  value={medication.route || ''}
                  onChange={e => handleFieldChange('route', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select route</option>
                  <option value='oral'>Oral</option>
                  <option value='intravenous'>Intravenous</option>
                  <option value='intramuscular'>Intramuscular</option>
                  <option value='subcutaneous'>Subcutaneous</option>
                  <option value='topical'>Topical</option>
                  <option value='inhalation'>Inhalation</option>
                  <option value='rectal'>Rectal</option>
                  <option value='vaginal'>Vaginal</option>
                  <option value='ophthalmic'>Ophthalmic</option>
                  <option value='otic'>Otic</option>
                  <option value='nasal'>Nasal</option>
                  <option value='transdermal'>Transdermal</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.route || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Site
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.site || ''}
                  onChange={e => handleFieldChange('site', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., left arm, abdomen'
                />
              ) : (
                <p className='text-gray-900'>{medication.site || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Method
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.method || ''}
                  onChange={e => handleFieldChange('method', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., injection technique'
                />
              ) : (
                <p className='text-gray-900'>{medication.method || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Manufacturer Information */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
              <Building className='h-4 w-4 text-white' />
            </div>
            Manufacturer
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Manufacturer Name *
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.manufacturer.name || ''}
                  onChange={e => handleFieldChange('manufacturer.name', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter manufacturer name'
                />
              ) : (
                <p className='text-gray-900'>{medication.manufacturer.name || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Country of Origin *
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.manufacturer.country || ''}
                  onChange={e => handleFieldChange('manufacturer.country', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter country'
                />
              ) : (
                <p className='text-gray-900'>{medication.manufacturer.country || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center'>
              <DollarSign className='h-4 w-4 text-white' />
            </div>
            Pricing Information
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Max Wholesale Price
              </label>
              {editing ? (
                <input
                  type='number'
                  step='0.01'
                  value={medication.pricing?.maxWholesalePrice || ''}
                  onChange={e => handleFieldChange('pricing.maxWholesalePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter price'
                />
              ) : (
                <p className='text-gray-900'>
                  {medication.pricing?.maxWholesalePrice ? formatCurrency(medication.pricing.maxWholesalePrice) : 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Retail Margin %
              </label>
              {editing ? (
                <input
                  type='number'
                  step='0.01'
                  value={medication.pricing?.retailMarginPercent || ''}
                  onChange={e => handleFieldChange('pricing.retailMarginPercent', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter percentage'
                />
              ) : (
                <p className='text-gray-900'>
                  {medication.pricing?.retailMarginPercent ? `${medication.pricing.retailMarginPercent}%` : 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Max Retail Price
              </label>
              {editing ? (
                <input
                  type='number'
                  step='0.01'
                  value={medication.pricing?.maxRetailPrice || ''}
                  onChange={e => handleFieldChange('pricing.maxRetailPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter price'
                />
              ) : (
                <p className='text-gray-900'>
                  {medication.pricing?.maxRetailPrice ? formatCurrency(medication.pricing.maxRetailPrice) : 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Max Price with VAT
              </label>
              {editing ? (
                <input
                  type='number'
                  step='0.01'
                  value={medication.pricing?.maxPriceWithVAT || ''}
                  onChange={e => handleFieldChange('pricing.maxPriceWithVAT', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter price'
                />
              ) : (
                <p className='text-gray-900'>
                  {medication.pricing?.maxPriceWithVAT ? formatCurrency(medication.pricing.maxPriceWithVAT) : 'Not specified'}
                </p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Currency
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.pricing?.currency || ''}
                  onChange={e => handleFieldChange('pricing.currency', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., USD, EUR, ILS'
                />
              ) : (
                <p className='text-gray-900'>{medication.pricing?.currency || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Identification Codes */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <Tag className='h-4 w-4 text-white' />
            </div>
            Identification Codes
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                ATC Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.atc || ''}
                  onChange={e => handleFieldChange('codes.atc', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter ATC code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.atc || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                SNOMED Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.snomed || ''}
                  onChange={e => handleFieldChange('codes.snomed', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter SNOMED code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.snomed || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                YARPA Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.yarpa || ''}
                  onChange={e => handleFieldChange('codes.yarpa', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter YARPA code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.yarpa || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Pharmasoft Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.pharmasoft || ''}
                  onChange={e => handleFieldChange('codes.pharmasoft', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter Pharmasoft code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.pharmasoft || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Formidable Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.formidable || ''}
                  onChange={e => handleFieldChange('codes.formidable', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter Formidable code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.formidable || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                MOH Code
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.codes?.moh || ''}
                  onChange={e => handleFieldChange('codes.moh', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter MOH code'
                />
              ) : (
                <p className='text-gray-900'>{medication.codes?.moh || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Names and Languages */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center'>
              <Tag className='h-4 w-4 text-white' />
            </div>
            Names & Languages
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Generic Name
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.genericName || ''}
                  onChange={e => handleFieldChange('genericName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter generic name'
                />
              ) : (
                <p className='text-gray-900'>{medication.genericName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Hebrew Name
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.hebrewName || ''}
                  onChange={e => handleFieldChange('hebrewName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter Hebrew name'
                />
              ) : (
                <p className='text-gray-900'>{medication.hebrewName || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Arabic Name
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.arabicName || ''}
                  onChange={e => handleFieldChange('arabicName', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter Arabic name'
                />
              ) : (
                <p className='text-gray-900'>{medication.arabicName || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Composition */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center'>
              <Building className='h-4 w-4 text-white' />
            </div>
            Composition
          </h2>

          <div className='space-y-4'>
            {medication.composition && medication.composition.length > 0 ? (
              medication.composition.map((item, index) => (
                <div key={index} className='border border-gray-200 rounded-lg p-3'>
                  <div className='text-sm text-gray-600'>
                    <strong>Substance:</strong> {item.substance}
                  </div>
                  {item.concentration && (
                    <div className='text-sm text-gray-600 mt-1'>
                      <strong>Concentration:</strong> {item.concentration.value} {item.concentration.unit}
                    </div>
                  )}
                  {item.baseEquivalent && (
                    <div className='text-sm text-gray-600 mt-1'>
                      <strong>Base Equivalent:</strong> {item.baseEquivalent.substance} {item.baseEquivalent.value} {item.baseEquivalent.unit}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No composition information available</p>
            )}
          </div>
        </div>

        {/* Clinical Information */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center'>
              <Calendar className='h-4 w-4 text-white' />
            </div>
            Clinical Information
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Pregnancy Category
              </label>
              {editing ? (
                <select
                  value={medication.pregnancyCategory || ''}
                  onChange={e => handleFieldChange('pregnancyCategory', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select category</option>
                  <option value='A'>A</option>
                  <option value='B'>B</option>
                  <option value='C'>C</option>
                  <option value='D'>D</option>
                  <option value='X'>X</option>
                  <option value='Unknown'>Unknown</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.pregnancyCategory || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Lactation Category
              </label>
              {editing ? (
                <select
                  value={medication.lactationCategory || ''}
                  onChange={e => handleFieldChange('lactationCategory', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select category</option>
                  <option value='Safe'>Safe</option>
                  <option value='Caution'>Caution</option>
                  <option value='Avoid'>Avoid</option>
                  <option value='Unknown'>Unknown</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.lactationCategory || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Prescription Required
              </label>
              {editing ? (
                <select
                  value={medication.prescriptionRequired?.toString() || ''}
                  onChange={e => handleFieldChange('prescriptionRequired', e.target.value === 'true')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select option</option>
                  <option value='true'>Yes</option>
                  <option value='false'>No</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.prescriptionRequired ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Controlled Substance
              </label>
              {editing ? (
                <select
                  value={medication.controlledSubstance?.toString() || ''}
                  onChange={e => handleFieldChange('controlledSubstance', e.target.value === 'true')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select option</option>
                  <option value='true'>Yes</option>
                  <option value='false'>No</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.controlledSubstance ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Controlled Substance Level
              </label>
              {editing ? (
                <select
                  value={medication.controlledSubstanceLevel || ''}
                  onChange={e => handleFieldChange('controlledSubstanceLevel', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select level</option>
                  <option value='None'>None</option>
                  <option value='Level1'>Level 1</option>
                  <option value='Level2'>Level 2</option>
                  <option value='Level3'>Level 3</option>
                </select>
              ) : (
                <p className='text-gray-900'>{medication.controlledSubstanceLevel || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Shelf Life
              </label>
              {editing ? (
                <input
                  type='text'
                  value={medication.shelfLife || ''}
                  onChange={e => handleFieldChange('shelfLife', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='e.g., 2 years, 18 months'
                />
              ) : (
                <p className='text-gray-900'>{medication.shelfLife || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mechanism & Indications */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center'>
              <Package className='h-4 w-4 text-white' />
            </div>
            Mechanism & Indications
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Mechanism of Action
              </label>
              {editing ? (
                <textarea
                  value={medication.mechanismOfAction || ''}
                  onChange={e => handleFieldChange('mechanismOfAction', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Describe the mechanism of action'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.mechanismOfAction || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Indications
              </label>
              {editing ? (
                <textarea
                  value={medication.indications?.join(', ') || ''}
                  onChange={e => handleFieldChange('indications', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter indications separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.indications?.join(', ') || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Safety Information */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center'>
              <Package className='h-4 w-4 text-white' />
            </div>
            Safety Information
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Contraindications
              </label>
              {editing ? (
                <textarea
                  value={medication.contraindications?.join(', ') || ''}
                  onChange={e => handleFieldChange('contraindications', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter contraindications separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.contraindications?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Side Effects
              </label>
              {editing ? (
                <textarea
                  value={medication.sideEffects?.join(', ') || ''}
                  onChange={e => handleFieldChange('sideEffects', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter side effects separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.sideEffects?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Warnings
              </label>
              {editing ? (
                <textarea
                  value={medication.warnings?.join(', ') || ''}
                  onChange={e => handleFieldChange('warnings', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter warnings separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.warnings?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Precautions
              </label>
              {editing ? (
                <textarea
                  value={medication.precautions?.join(', ') || ''}
                  onChange={e => handleFieldChange('precautions', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter precautions separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.precautions?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Monitoring
              </label>
              {editing ? (
                <textarea
                  value={medication.monitoring?.join(', ') || ''}
                  onChange={e => handleFieldChange('monitoring', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter monitoring requirements separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.monitoring?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Laboratory Tests
              </label>
              {editing ? (
                <textarea
                  value={medication.laboratoryTests?.join(', ') || ''}
                  onChange={e => handleFieldChange('laboratoryTests', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter laboratory tests separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.laboratoryTests?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Overdose
              </label>
              {editing ? (
                <textarea
                  value={medication.overdose || ''}
                  onChange={e => handleFieldChange('overdose', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Describe overdose symptoms and treatment'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.overdose || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Storage & Packaging */}
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <h2 className='text-xl font-bold mb-4 flex items-center gap-3 text-gray-900'>
            <div className='w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center'>
              <Package className='h-4 w-4 text-white' />
            </div>
            Storage & Packaging
          </h2>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Storage Conditions
              </label>
              {editing ? (
                <textarea
                  value={medication.storageConditions?.join(', ') || ''}
                  onChange={e => handleFieldChange('storageConditions', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter storage conditions separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.storageConditions?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Alternatives
              </label>
              {editing ? (
                <textarea
                  value={medication.alternatives?.join(', ') || ''}
                  onChange={e => handleFieldChange('alternatives', e.target.value.split(', ').filter(s => s.trim()))}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                  placeholder='Enter alternative medications separated by commas'
                  rows={3}
                />
              ) : (
                <p className='text-gray-900'>{medication.alternatives?.join(', ') || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Button */}
      {editing && (
        <div className='bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20'>
          <button
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg font-medium'
          >
            <Wand2 className='h-4 w-4' />
            AI Suggestions
          </button>

          {showAISuggestions && (
            <div className='mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200'>
              <p className='text-sm text-purple-800 font-medium'>
                AI suggestions feature will be available soon...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
