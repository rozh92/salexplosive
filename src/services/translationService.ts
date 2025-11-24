import { GoogleGenAI } from "@google/genai";

// FIX: Gebruik import.meta.env en voorkom crash
// @ts-ignore
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || process.env.API_KEY;

// We gebruiken een dummy key zodat de app kan opstarten zonder te crashen.
const ai = new GoogleGenAI({ apiKey: API_KEY || 'DUMMY_KEY' });

const langMap: Record<string, string> = {
    'en': 'English',
    'de': 'German'
};

export const translateBatch = async (
    texts: Record<string, string>, 
    targetLang: 'en' | 'de'
): Promise<Record<string, string>> => {
    // Hier checken we pas of de key er echt is
    if (!API_KEY) {
        console.warn("Translation Service: API Key ontbreekt. Terugvallen op originele teksten.");
        return texts;
    }

    const languageName = langMap[targetLang];
    if (!languageName) {
        console.error(`Unsupported language: ${targetLang}`);
        return {};
    }

    const prompt = `Translate the values of the following JSON object from Dutch to ${languageName}.
Respond with ONLY a valid JSON object containing the translated key-value pairs. Do not add any extra text or markdown formatting.

Input:
${JSON.stringify(texts, null, 2)}

Output:
`;

    let response;
    try {
        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonString = response.text?.trim();
        if (!jsonString) throw new Error("Empty response");
        const translatedObject = JSON.parse(jsonString);
        return translatedObject;
    } catch (error) {
        console.error("Error translating batch:", error);
        
        const fallbackTranslations: Record<string, string> = {};
        for (const key in texts) {
            try {
                const singleResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Translate the following Dutch text to ${languageName}: "${texts[key]}"`
                });
                fallbackTranslations[key] = singleResponse.text?.trim().replace(/"/g, '') || texts[key];
            } catch (singleError) {
                console.error(`Error translating single key "${key}":`, singleError);
                fallbackTranslations[key] = texts[key]; 
            }
        }
        return fallbackTranslations;
    }
};