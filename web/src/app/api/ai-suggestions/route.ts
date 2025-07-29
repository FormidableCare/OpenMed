import { NextRequest, NextResponse } from 'next/server';
import { OpenMedMedication } from '@/types/medication';
import { generateText } from 'ai';
import { getAIModel, getAIConfig, validateAIEnvironment } from '@/lib/ai-config';
import { searchFrenchMedication, getFrenchMedicationDetails, mapFrenchDataToOpenMed } from '@/lib/french-medication-api';

interface AISuggestionRequest {
  medication: Partial<OpenMedMedication>;
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { medication, context }: AISuggestionRequest = await request.json();
    const validation = validateAIEnvironment();

    if (!validation.valid) {
      return NextResponse.json(
        { error: `AI configuration error: ${validation.errors.join(', ')}` },
        { status: 500 }
      );
    }

    // Try to get French database data first
    let frenchData = null;
    if (medication.name) {
      try {
        const frenchResults = await searchFrenchMedication(medication.name);
        if (frenchResults.length > 0) {
          frenchData = frenchResults[0];
        }
      } catch (error) {
        console.warn('Failed to fetch French medication data:', error);
      }
    }

    const model = getAIModel();
    const config = getAIConfig();
    
    // Enhance context with French database data if available
    let enhancedContext = context || '';
    if (frenchData) {
      const mappedData = mapFrenchDataToOpenMed(frenchData);
      enhancedContext += `\n\nFrench Database Reference:\n${JSON.stringify(mappedData, null, 2)}`;
    }
    
    const prompt = createComprehensivePrompt(medication, enhancedContext);

    const { text } = await generateText({
      model,
      prompt,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });

    let suggestions: Record<string, Array<{ value: string; confidence: number }>> = {};
    try {
      const rawJson = extractRawJson(text);
      suggestions = JSON.parse(rawJson);
    } catch (error) {
      console.error('Failed to parse AI suggestions as JSON:', error);
      console.error('Raw AI response:', text);
      suggestions = {};
    }

    return NextResponse.json({ suggestions, frenchData: frenchData ? mapFrenchDataToOpenMed(frenchData) : null });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function createComprehensivePrompt(
  medication: Partial<OpenMedMedication>,
  context?: string
): string {
  const serialized = JSON.stringify(medication, null, 2);

  return `
You are a medical AI assistant. Given the following medication information:

${serialized}

Your task is to generate 1–3 suggestions for **each field that is empty, null, undefined, or "-"**. Each suggestion must include a confidence score (between 0 and 1).

Respond with a **valid JSON object only**, no markdown or other formatting, containing suggestions only. Do not include fields that are already populated or not applicable. Do not include any explanation, markdown, or formatting — only raw JSON.

Example format:

{
  "fieldName": [
    { "value": "suggestion1", "confidence": 0.9 },
    { "value": "suggestion2", "confidence": 0.85 }
  ]
}

List of target fields:

- Top-level:
  - name, category, form, route, site, method
  - mechanismOfAction, indications, contraindications, sideEffects, warnings, precautions, monitoring, laboratoryTests, overdose
  - storageConditions, shelfLife, alternatives
  - pregnancyCategory, lactationCategory, controlledSubstanceLevel

- Nested:
  - codes.atc, codes.snomed, codes.yarpa, codes.pharmasoft, codes.moh, codes.barcode, codes.rxnorm

- Composition (array items):
  - composition[].substance
  - composition[].concentration.value
  - composition[].concentration.unit
  - composition[].baseEquivalent.substance
  - composition[].baseEquivalent.value
  - composition[].baseEquivalent.unit

- Packaging (array items):
  - packaging[].packageSize
  - packaging[].unit

- Pharmacokinetics:
  - pharmacokinetics.absorption
  - pharmacokinetics.distribution
  - pharmacokinetics.metabolism
  - pharmacokinetics.excretion
  - pharmacokinetics.halfLife
  - pharmacokinetics.bioavailability
  - pharmacokinetics.proteinBinding

Guidelines:

- For **array-type fields** (e.g., indications, sideEffects), each suggestion should be a complete item suitable to append to the array.
- For **nested fields** (e.g., manufacturer.name), only suggest values for the specific property.
- For **enum fields** (e.g., route, pregnancyCategory), return valid values.
- All confidence values must be numbers between 0 and 1.

${context ? `Additional context:\n${context}` : ''}
`.trim();
}

function extractRawJson(text: string): string {
  return text
    .replace(/^```json\s*/i, '')  // remove leading ```json
    .replace(/^```\s*/i, '')      // or just ```
    .replace(/\s*```$/i, '')      // remove trailing ```
    .trim();
}