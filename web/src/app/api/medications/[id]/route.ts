import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { OpenMedMedication } from '@/types/medication';
import { getMedicationByIdFromCache, updateMedicationInCache } from '@/lib/server-cache';

const execAsync = promisify(exec);

// Git configuration
const GIT_USER_NAME = process.env.GIT_USER_NAME || 'OpenMed System';
const GIT_USER_EMAIL = process.env.GIT_USER_EMAIL || 'system@openmed.formidable.care';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const medication = await getMedicationByIdFromCache(id);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const medication: OpenMedMedication = await request.json();
    
    // Extract user information from request headers or body
    const userEmail = request.headers.get('x-user-email') || GIT_USER_EMAIL;
    const userName = request.headers.get('x-user-name') || GIT_USER_NAME;
    const userMessage = request.headers.get('x-commit-message') || `Update medication ${id}`;

    // Update the lastUpdated timestamp
    medication.meta.lastUpdated = new Date().toISOString();

    const catalogPath = path.join(process.cwd(), '..', 'catalog');
    const filePath = path.join(catalogPath, `${id}.json`);

    // Write the updated medication back to file
    await fs.writeFile(filePath, JSON.stringify(medication, null, 2), 'utf-8');

    // Update the cache with the new data
    updateMedicationInCache(medication);

    // Commit changes to Git
    try {
      await commitChangesToGit(catalogPath, filePath, userName, userEmail, userMessage);
    } catch (gitError) {
      console.error('Git commit failed:', gitError);
      // Don't fail the entire request if Git commit fails
      // The file is still saved, just not committed
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Error saving medication:', error);
    return NextResponse.json(
      { error: 'Failed to save medication' },
      { status: 500 }
    );
  }
}

async function commitChangesToGit(
  catalogPath: string, 
  filePath: string, 
  userName: string, 
  userEmail: string, 
  commitMessage: string
) {
  try {
    // Change to the catalog directory
    process.chdir(catalogPath);
    
    // Add the specific file to staging
    await execAsync(`git add "${path.basename(filePath)}"`);
    
    // Configure Git user for this commit
    await execAsync(`git config user.name "${userName}"`);
    await execAsync(`git config user.email "${userEmail}"`);
    
    // Commit the changes
    await execAsync(`git commit -m "${commitMessage}"`);
    
    // Push to remote repository
    await execAsync('git push origin main');
    
    console.log(`Successfully committed and pushed changes for ${path.basename(filePath)}`);
  } catch (error) {
    console.error('Error in Git operations:', error);
    throw error;
  }
}
