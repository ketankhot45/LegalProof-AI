import { getGeminiClient, GEMINI_MODEL, callWithRetry } from './client.js';

export interface EntityExtractionResult {
  persons: string[];
  organizations: string[];
  locations: string[];
  dates: string[];
  identifiers: string[];
}

/**
 * Extracts key named entities (Persons, Organizations, Locations, Dates, Identifiers) from text.
 */
export const extractEntitiesFromText = async (text: string): Promise<EntityExtractionResult> => {
  if (!text || text.trim().length === 0) {
    return { persons: [], organizations: [], locations: [], dates: [], identifiers: [] };
  }

  const ai = getGeminiClient();

  const response = await callWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          text: `Extract key named entities from the following text:
"${text.slice(0, 10000)}"

Return a JSON object with array properties:
- "persons": List of individuals/persons mentioned.
- "organizations": List of companies, agencies, institutions mentioned.
- "locations": List of addresses, cities, places mentioned.
- "dates": List of dates, times, timestamps mentioned.
- "identifiers": List of reference numbers, case IDs, serial numbers, invoice numbers mentioned.`,
        },
      ],
      config: {
        systemInstruction: 'You are an entity extraction engine. Extract accurate factual entities. Do not infer unstated facts or make legal judgements.',
        responseMimeType: 'application/json',
      },
    })
  );

  try {
    const parsed = JSON.parse(response.text || '{}');
    return {
      persons: Array.isArray(parsed.persons) ? parsed.persons : [],
      organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      dates: Array.isArray(parsed.dates) ? parsed.dates : [],
      identifiers: Array.isArray(parsed.identifiers) ? parsed.identifiers : [],
    };
  } catch {
    return { persons: [], organizations: [], locations: [], dates: [], identifiers: [] };
  }
};
