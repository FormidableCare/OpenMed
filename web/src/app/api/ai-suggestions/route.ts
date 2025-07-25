import { NextRequest, NextResponse } from 'next/server';
import { OpenMedMedication } from '@/types/medication';

export async function POST(request: NextRequest) {
  try {
    const { medication, field } = await request.json();

    // For now, we'll return mock suggestions
    // In a real implementation, this would call OpenAI API
    const suggestions = generateMockSuggestions(medication, field);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function generateMockSuggestions(
  medication: OpenMedMedication,
  field: string
): string[] {
  const suggestions: { [key: string]: string[] } = {
    name: [
      `${medication.name} - Enhanced`,
      `${medication.name} (Updated)`,
      `${medication.name} - Premium`,
    ],
    category: [
      'Prescription Medicine',
      'Over-the-Counter',
      'Special Import',
      'Hospital Use Only',
    ],
    'manufacturer.name': [
      'Teva Pharmaceutical Industries',
      'Pfizer Israel',
      'Novartis Israel',
      'Merck Sharp & Dohme',
    ],
    composition: [
      'Active pharmaceutical ingredient',
      'Main therapeutic component',
      'Primary drug substance',
    ],
  };

  return suggestions[field] || ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
}
