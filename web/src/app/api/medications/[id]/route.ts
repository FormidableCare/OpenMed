import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { OpenMedMedication } from '@/types/medication';
import { getMedicationByIdFromCache, updateMedicationInCache } from '@/lib/server-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medication = await getMedicationByIdFromCache(params.id);
    
    if (!medication) {
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Error loading medication:', error);
    return NextResponse.json(
      { error: 'Failed to load medication' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const medication: OpenMedMedication = await request.json();

    // Update the lastUpdated timestamp
    medication.meta.lastUpdated = new Date().toISOString();

    const catalogPath = path.join(process.cwd(), '..', 'catalog');
    const filePath = path.join(catalogPath, `${params.id}.json`);

    // Write the updated medication back to file
    await fs.writeFile(filePath, JSON.stringify(medication, null, 2), 'utf-8');

    // Update the cache with the new data
    updateMedicationInCache(medication);

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Error saving medication:', error);
    return NextResponse.json(
      { error: 'Failed to save medication' },
      { status: 500 }
    );
  }
}
