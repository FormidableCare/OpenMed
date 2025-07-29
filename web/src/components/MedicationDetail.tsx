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
import { loadMedicationById, saveMedication, loadAllMedications, getComprehensiveAISuggestions } from '@/lib/data';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  cn,
} from '@/lib/utils';
import { DataLoadingIndicator, ButtonLoading } from '@/components/LoadingIndicator';
import { AISuggestions } from '@/components/AISuggestions';

export function MedicationDetail() {
  const params = useParams();
  const router = useRouter();
  const [medication, setMedication] = useState<OpenMedMedication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allMedications, setAllMedications] = useState<OpenMedMedication[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, Array<{ value: string; confidence: number }>>>({});
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (params.id) {
        // Load all medications for navigation
        const allMeds = await loadAllMedications();
        setAllMedications(allMeds);
        
        // Find current medication index
        const index = allMeds.findIndex(med => med.id === params.id);
        setCurrentIndex(index);
        
        // Load current medication
        await loadMedication(params.id as string);
      }
    };
    
    loadData();
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

  const handleFieldChange = (field: string, value: string | number | boolean | string[] | undefined) => {
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
      (newMedication as unknown as Record<string, unknown>)[field] = value;
    }

    setMedication(newMedication);
  };

  const handleCompositionChange = (index: number, field: string, value: string | number) => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newComposition = [...(newMedication.composition || [])];
    
    if (!newComposition[index]) {
      newComposition[index] = { substance: '' };
    }
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'baseEquivalent') {
        if (!newComposition[index].baseEquivalent) {
          newComposition[index].baseEquivalent = { substance: '', value: 0, unit: '' };
        }
        newComposition[index].baseEquivalent = {
          ...newComposition[index].baseEquivalent!,
          [child]: value,
        };
      } else if (parent === 'concentration') {
        if (!newComposition[index].concentration) {
          newComposition[index].concentration = { value: 0, unit: '' };
        }
        newComposition[index].concentration = {
          ...newComposition[index].concentration!,
          [child]: value,
        };
      }
    } else {
      (newComposition[index] as Record<string, unknown>)[field] = value;
    }
    
    newMedication.composition = newComposition;
    setMedication(newMedication);
  };

  const addCompositionItem = () => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newComposition = [...(newMedication.composition || []), { substance: '' }];
    newMedication.composition = newComposition;
    setMedication(newMedication);
  };

  const removeCompositionItem = (index: number) => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newComposition = [...(newMedication.composition || [])];
    newComposition.splice(index, 1);
    newMedication.composition = newComposition;
    setMedication(newMedication);
  };

  const handlePackagingChange = (index: number, field: string, value: string | number) => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newPackaging = [...(newMedication.packaging || [])];
    
    if (!newPackaging[index]) {
      newPackaging[index] = { packageSize: 0, unit: '' };
    }
    
    (newPackaging[index] as Record<string, unknown>)[field] = value;
    newMedication.packaging = newPackaging;
    setMedication(newMedication);
  };

  const addPackagingItem = () => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newPackaging = [...(newMedication.packaging || []), { packageSize: 0, unit: '' }];
    newMedication.packaging = newPackaging;
    setMedication(newMedication);
  };

  const removePackagingItem = (index: number) => {
    if (!medication) return;

    const newMedication = { ...medication };
    const newPackaging = [...(newMedication.packaging || [])];
    newPackaging.splice(index, 1);
    newMedication.packaging = newPackaging;
    setMedication(newMedication);
  };

  const navigateToMedication = (direction: 'prev' | 'next') => {
    if (currentIndex === -1 || allMedications.length === 0) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allMedications.length - 1;
    } else {
      newIndex = currentIndex < allMedications.length - 1 ? currentIndex + 1 : 0;
    }
    
    const nextMedication = allMedications[newIndex];
    router.push(`/medications/${nextMedication.id}`);
  };



  const handleAiAssist = async () => {
    if (!medication) return;
    
    setAiLoading(true);
    try {
      const suggestions = await getComprehensiveAISuggestions(medication);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
    } finally {
      setAiLoading(false);
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
      <div className='space-y-4 mb-6'>
        {/* Top Row: Navigation */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => router.back()}
              className='flex items-center gap-2 text-cyan-900 hover:text-cyan-600 font-medium cursor-pointer'
            >
              <ArrowLeft className='h-5 w-5' />
              Back to List
            </button>
          </div>
          
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => navigateToMedication('prev')}
                disabled={allMedications.length === 0}
                className='flex items-center gap-2 text-cyan-900 hover:text-cyan-600 font-medium px-1 py-1 cursor-pointer'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
                
              </button>
              
              <div className='px-3 py-1  text-xs font-medium rounded-full bg-gray-600 text-white'>
                {currentIndex + 1} of {allMedications.length}
              </div>
              
              <button
                onClick={() => navigateToMedication('next')}
                disabled={allMedications.length === 0}
                className='flex items-center gap-2 text-cyan-900 hover:text-cyan-600 font-medium px-1 py-1 cursor-pointer'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Title and Actions */}
        <div className='flex justify-between items-center p-4 bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              {editing ? 'Edit Medication' : medication.name}
            </h1>
            <p className='text-gray-600 mt-1'>ID: {medication.id}</p>
            <p>Last Updated: {formatDate(medication.meta.lastUpdated)}</p>
            
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
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  className='flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 shadow-lg font-medium'
                >
                  <Wand2 className='h-4 w-4' />
                  {aiLoading ? 'Loading...' : 'AI Assist'}
                </button>
                <ButtonLoading
                  loading={saving}
                  className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-all duration-200 shadow-lg font-medium'
                  onClick={handleSave}
                >
                  <Save className='h-4 w-4' />
                  {saving ? 'Saving...' : 'Save'}
                </ButtonLoading>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-lg font-medium'
              >
                Edit
              </button>
            )}
          </div>

      </div>
      </div>
   


      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Basic Information */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <input
                    type='text'
                    value={medication.name || ''}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white/50 backdrop-blur-sm'
                    placeholder='Enter medication name'
                  />
                  <AISuggestions
                    field='name'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('name', suggestion)}
                  />
                </>
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
                <>
                  <input
                    type='text'
                    value={medication.category || ''}
                    onChange={e => handleFieldChange('category', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter category'
                  />
                  <AISuggestions
                    field='category'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('category', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.category || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Form
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.form || ''}
                    onChange={e => handleFieldChange('form', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., tablet, capsule, liquid'
                  />
                  <AISuggestions
                    field='form'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('form', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.form || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Route
              </label>
              {editing ? (
                <>
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
                <AISuggestions
                    field='route'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('route', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.route || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Site
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.site || ''}
                    onChange={e => handleFieldChange('site', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., left arm, abdomen'
                  />
                  <AISuggestions
                    field='site'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('site', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.site || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Method
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.method || ''}
                    onChange={e => handleFieldChange('method', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., injection technique'
                  />
                  <AISuggestions
                    field='method'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('method', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.method || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Manufacturer Information */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <input
                    type='text'
                    value={medication.manufacturer.name || ''}
                    onChange={e => handleFieldChange('manufacturer.name', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter manufacturer name'
                  />
                  <AISuggestions
                    field='manufacturer.name'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('manufacturer.name', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.manufacturer.name || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Country of Origin *
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.manufacturer.country || ''}
                    onChange={e => handleFieldChange('manufacturer.country', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter country'
                  />
                  <AISuggestions
                    field='manufacturer.country'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('manufacturer.country', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.manufacturer.country || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <input
                    type='text'
                    value={medication.pricing?.currency || ''}
                    onChange={e => handleFieldChange('pricing.currency', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., USD, EUR, ILS'
                  />
                  <AISuggestions
                    field='pricing.currency'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('pricing.currency', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.pricing?.currency || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Identification Codes */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <input
                    type='text'
                    value={medication.codes?.atc || ''}
                    onChange={e => handleFieldChange('codes.atc', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter ATC code'
                  />
                  <AISuggestions
                    field='codes.atc'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.atc', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.atc || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                SNOMED Code
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.snomed || ''}
                    onChange={e => handleFieldChange('codes.snomed', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter SNOMED code'
                  />
                  <AISuggestions
                    field='codes.snomed'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.snomed', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.snomed || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                YARPA Code
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.yarpa || ''}
                    onChange={e => handleFieldChange('codes.yarpa', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter YARPA code'
                  />
                  <AISuggestions
                    field='codes.yarpa'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.yarpa', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.yarpa || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Pharmasoft Code
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.pharmasoft || ''}
                    onChange={e => handleFieldChange('codes.pharmasoft', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter Pharmasoft code'
                  />
                  <AISuggestions
                    field='codes.pharmasoft'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.pharmasoft', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.pharmasoft || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Formidable Code
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.formidable || ''}
                    onChange={e => handleFieldChange('codes.formidable', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter Formidable code'
                  />
                  <AISuggestions
                    field='codes.formidable'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.formidable', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.formidable || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                MOH Code
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.moh || ''}
                    onChange={e => handleFieldChange('codes.moh', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter MOH code'
                  />
                  <AISuggestions
                    field='codes.moh'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.moh', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.moh || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* Barcode */}
          <div className='flex items-center justify-between'>
            <label className='block text-sm font-medium text-gray-700'>
              Barcode
            </label>
            <div className='flex-1 ml-4'>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.barcode || ''}
                    onChange={e => handleFieldChange('codes.barcode', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter barcode (UPC, EAN, etc.)'
                  />
                  <AISuggestions
                    field='codes.barcode'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.barcode', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.barcode || 'Not specified'}</p>
              )}
            </div>
          </div>

          {/* RxNorm */}
          <div className='flex items-center justify-between'>
            <label className='block text-sm font-medium text-gray-700'>
              RxNorm
            </label>
            <div className='flex-1 ml-4'>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.codes?.rxnorm || ''}
                    onChange={e => handleFieldChange('codes.rxnorm', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter RxNorm RXCUI'
                  />
                  <AISuggestions
                    field='codes.rxnorm'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('codes.rxnorm', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.codes?.rxnorm || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Composition */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold flex items-center gap-3 text-gray-900'>
              <div className='w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center'>
                <Building className='h-4 w-4 text-white' />
              </div>
              Composition
            </h2>
            {editing && (
              <button
                onClick={addCompositionItem}
                className='px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors'
              >
                Add Item
              </button>
            )}
          </div>

          <div className='space-y-4'>
            {medication.composition && medication.composition.length > 0 ? (
              medication.composition.map((item, index) => (
                <div key={index} className='border border-gray-200 rounded-lg p-4'>
                  {editing ? (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-gray-900'>Composition Item {index + 1}</h4>
                        <button
                          onClick={() => removeCompositionItem(index)}
                          className='text-red-500 hover:text-red-700 text-sm'
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Substance *
                        </label>
                        <input
                          type='text'
                          value={item.substance || ''}
                          onChange={e => handleCompositionChange(index, 'substance', e.target.value)}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                          placeholder='Enter substance name'
                        />
                        <AISuggestions
                          field={`composition[${index}].substance`}
                          suggestions={aiSuggestions}
                          onSuggestionClick={(suggestion) => handleCompositionChange(index, 'substance', suggestion)}
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Concentration Value
                          </label>
                          <input
                            type='number'
                            step='0.01'
                            value={item.concentration?.value || ''}
                            onChange={e => handleCompositionChange(index, 'concentration.value', e.target.value ? parseFloat(e.target.value) : 0)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                            placeholder='Enter value'
                          />
                          <AISuggestions
                            field={`composition[${index}].concentration.value`}
                            suggestions={aiSuggestions}
                            onSuggestionClick={(suggestion) => handleCompositionChange(index, 'concentration.value', parseFloat(suggestion))}
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Concentration Unit
                          </label>
                          <input
                            type='text'
                            value={item.concentration?.unit || ''}
                            onChange={e => handleCompositionChange(index, 'concentration.unit', e.target.value)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                            placeholder='e.g., mg, g, ml'
                          />
                          <AISuggestions
                            field={`composition[${index}].concentration.unit`}
                            suggestions={aiSuggestions}
                            onSuggestionClick={(suggestion) => handleCompositionChange(index, 'concentration.unit', suggestion)}
                          />
                        </div>
                      </div>

                      <div className='border-t pt-3'>
                        <h5 className='font-medium text-gray-700 mb-2'>Base Equivalent (Optional)</h5>
                        <div className='grid grid-cols-3 gap-3'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Substance
                            </label>
                            <input
                              type='text'
                              value={item.baseEquivalent?.substance || ''}
                              onChange={e => handleCompositionChange(index, 'baseEquivalent.substance', e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                              placeholder='Enter base substance'
                            />
                            <AISuggestions
                              field={`composition[${index}].baseEquivalent.substance`}
                              suggestions={aiSuggestions}
                              onSuggestionClick={(suggestion) => handleCompositionChange(index, 'baseEquivalent.substance', suggestion)}
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Value
                            </label>
                            <input
                              type='number'
                              step='0.01'
                              value={item.baseEquivalent?.value || ''}
                              onChange={e => handleCompositionChange(index, 'baseEquivalent.value', e.target.value ? parseFloat(e.target.value) : 0)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                              placeholder='Enter value'
                            />
                            <AISuggestions
                              field={`composition[${index}].baseEquivalent.value`}
                              suggestions={aiSuggestions}
                              onSuggestionClick={(suggestion) => handleCompositionChange(index, 'baseEquivalent.value', parseFloat(suggestion))}
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Unit
                            </label>
                            <input
                              type='text'
                              value={item.baseEquivalent?.unit || ''}
                              onChange={e => handleCompositionChange(index, 'baseEquivalent.unit', e.target.value)}
                              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                              placeholder='e.g., mg, g'
                            />
                            <AISuggestions
                              field={`composition[${index}].baseEquivalent.unit`}
                              suggestions={aiSuggestions}
                              onSuggestionClick={(suggestion) => handleCompositionChange(index, 'baseEquivalent.unit', suggestion)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <div className='text-sm text-gray-600'>
                        <strong>Substance:</strong> {item.substance}
                      </div>
                      {item.concentration && (
                        <div className='text-sm text-gray-600'>
                          <strong>Concentration:</strong> {item.concentration.value} {item.concentration.unit}
                        </div>
                      )}
                      {item.baseEquivalent && (
                        <div className='text-sm text-gray-600'>
                          <strong>Base Equivalent:</strong> {item.baseEquivalent.substance} {item.baseEquivalent.value} {item.baseEquivalent.unit}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No composition information available</p>
            )}
          </div>
        </div>

        {/* Packaging */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-bold flex items-center gap-3 text-gray-900'>
              <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center'>
                <Package className='h-4 w-4 text-white' />
              </div>
              Packaging
            </h2>
            {editing && (
              <button
                onClick={addPackagingItem}
                className='px-3 py-1 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors'
              >
                Add Package
              </button>
            )}
          </div>

          <div className='space-y-4'>
            {medication.packaging && medication.packaging.length > 0 ? (
              medication.packaging.map((item, index) => (
                <div key={index} className='border border-gray-200 rounded-lg p-4'>
                  {editing ? (
                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <h4 className='font-medium text-gray-900'>Package {index + 1}</h4>
                        <button
                          onClick={() => removePackagingItem(index)}
                          className='text-red-500 hover:text-red-700 text-sm'
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className='grid grid-cols-2 gap-3'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Package Size *
                          </label>
                          <input
                            type='number'
                            step='0.01'
                            value={item.packageSize || ''}
                            onChange={e => handlePackagingChange(index, 'packageSize', e.target.value ? parseFloat(e.target.value) : 0)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                            placeholder='Enter package size'
                          />
                          <AISuggestions
                            field={`packaging[${index}].packageSize`}
                            suggestions={aiSuggestions}
                            onSuggestionClick={(suggestion) => handlePackagingChange(index, 'packageSize', parseFloat(suggestion))}
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Unit *
                          </label>
                          <input
                            type='text'
                            value={item.unit || ''}
                            onChange={e => handlePackagingChange(index, 'unit', e.target.value)}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                            placeholder='e.g., tablets, capsules, ml'
                          />
                          <AISuggestions
                            field={`packaging[${index}].unit`}
                            suggestions={aiSuggestions}
                            onSuggestionClick={(suggestion) => handlePackagingChange(index, 'unit', suggestion)}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='text-sm text-gray-600'>
                      <strong>Package:</strong> {item.packageSize} {item.unit}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className='text-gray-500'>No packaging information available</p>
            )}
          </div>
        </div>

        {/* Clinical Information */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
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
                <AISuggestions
                    field='pregnancyCategory'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('pregnancyCategory', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.pregnancyCategory || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Lactation Category
              </label>
              {editing ? (
                <>
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
                <AISuggestions
                    field='lactationCategory'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('lactationCategory', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.lactationCategory || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Prescription Required
              </label>
              {editing ? (
                <>
                <select
                  value={medication.prescriptionRequired?.toString() || ''}
                  onChange={e => handleFieldChange('prescriptionRequired', e.target.value === 'true')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select option</option>
                  <option value='true'>Yes</option>
                  <option value='false'>No</option>
                </select>
                <AISuggestions
                    field='prescriptionRequired'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('prescriptionRequired', suggestion)}
                  />
                </>

              ) : (
                <p className='text-gray-900'>{medication.prescriptionRequired ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Controlled Substance
              </label>
              {editing ? (
                <>
                <select
                  value={medication.controlledSubstance?.toString() || ''}
                  onChange={e => handleFieldChange('controlledSubstance', e.target.value === 'true')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Select option</option>
                  <option value='true'>Yes</option>
                  <option value='false'>No</option>
                </select>
                <AISuggestions
                    field='controlledSubstance'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('controlledSubstance', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.controlledSubstance ? 'Yes' : 'No'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Controlled Substance Level
              </label>
              {editing ? (
                <>
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
                <AISuggestions
                    field='controlledSubstanceLevel'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('controlledSubstanceLevel', suggestion)}
                  />
                </>
              
              ) : (
                <p className='text-gray-900'>{medication.controlledSubstanceLevel || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Shelf Life
              </label>
              {editing ? (
                <>
                  <input
                    type='text'
                    value={medication.shelfLife || ''}
                    onChange={e => handleFieldChange('shelfLife', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='e.g., 2 years, 18 months'
                  />
                  <AISuggestions
                    field='shelfLife'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('shelfLife', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.shelfLife || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mechanism & Indications */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <textarea
                    value={medication.mechanismOfAction || ''}
                    onChange={e => handleFieldChange('mechanismOfAction', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Describe the mechanism of action'
                    rows={3}
                  />
                  <AISuggestions
                    field='mechanismOfAction'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('mechanismOfAction', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.mechanismOfAction || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Indications
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.indications?.join(', ') || ''}
                    onChange={e => handleFieldChange('indications', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter indications separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='indications'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('indications', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.indications?.join(', ') || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Safety Information */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <textarea
                    value={medication.contraindications?.join(', ') || ''}
                    onChange={e => handleFieldChange('contraindications', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter contraindications separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='contraindications'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('contraindications', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.contraindications?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Side Effects
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.sideEffects?.join(', ') || ''}
                    onChange={e => handleFieldChange('sideEffects', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter side effects separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='sideEffects'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('sideEffects', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.sideEffects?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Warnings
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.warnings?.join(', ') || ''}
                    onChange={e => handleFieldChange('warnings', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter warnings separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='warnings'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('warnings', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.warnings?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Precautions
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.precautions?.join(', ') || ''}
                    onChange={e => handleFieldChange('precautions', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter precautions separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='precautions'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('precautions', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.precautions?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Monitoring
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.monitoring?.join(', ') || ''}
                    onChange={e => handleFieldChange('monitoring', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter monitoring requirements separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='monitoring'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('monitoring', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.monitoring?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Laboratory Tests
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.laboratoryTests?.join(', ') || ''}
                    onChange={e => handleFieldChange('laboratoryTests', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter laboratory tests separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='laboratoryTests'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('laboratoryTests', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.laboratoryTests?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Overdose
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.overdose || ''}
                    onChange={e => handleFieldChange('overdose', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Describe overdose symptoms and treatment'
                    rows={3}
                  />
                  <AISuggestions
                    field='overdose'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('overdose', suggestion)}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.overdose || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Storage & Packaging */}
        <div className='bg-white backdrop-blur-sm p-6 rounded-xl border border-gray-200'>
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
                <>
                  <textarea
                    value={medication.storageConditions?.join(', ') || ''}
                    onChange={e => handleFieldChange('storageConditions', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter storage conditions separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='storageConditions'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('storageConditions', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.storageConditions?.join(', ') || 'Not specified'}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Alternatives
              </label>
              {editing ? (
                <>
                  <textarea
                    value={medication.alternatives?.join(', ') || ''}
                    onChange={e => handleFieldChange('alternatives', e.target.value.split(', ').filter(s => s.trim()))}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                    placeholder='Enter alternative medications separated by commas'
                    rows={3}
                  />
                  <AISuggestions
                    field='alternatives'
                    suggestions={aiSuggestions}
                    onSuggestionClick={(suggestion) => handleFieldChange('alternatives', [suggestion])}
                  />
                </>
              ) : (
                <p className='text-gray-900'>{medication.alternatives?.join(', ') || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
