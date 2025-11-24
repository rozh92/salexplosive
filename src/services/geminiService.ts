// We importeren alleen wat we nodig hebben.
// Omdat de types soms conflicteren, gebruiken we 'any' voor de client om build errors te voorkomen.
import { GoogleGenAI } from "@google/genai";
import { User, Goal, Client, Pitch, Sale, Appointment } from '../types';

// VEILIGE KEY OPHALEN
// We gebruiken een 'try-catch' achtige constructie voor import.meta omdat sommige omgevingen dit niet kennen.
let API_KEY: string | undefined;
try {
    // @ts-ignore
    API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
} catch (e) {
    // Fallback voor als import.meta niet bestaat (bijv. in node omgevingen)
    API_KEY = process.env.API_KEY;
}

// We maken de client aan, maar vangen errors af als de key mist.
let ai: any = null;
if (API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
        console.error("Kon Gemini niet initialiseren:", e);
    }
}

const langMap: Record<string, string> = {
    'nl': 'Dutch',
    'en': 'English',
    'de': 'German'
};

const checkApiKey = () => {
    if (!API_KEY || !ai) {
        console.error("Google AI API Key ontbreekt of client is niet geladen!");
        return false;
    }
    return true;
};

// Hulpfunctie om content te genereren met error handling
const generateContentSafe = async (model: string, prompt: string, config?: any) => {
    if (!checkApiKey()) throw new Error("API Key missing");
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: config
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
};

export const generatePitch = async (
    user: User,
    salesChannel: 'deur-aan-deur' | 'telefonisch',
    pitchLength: 'normaal' | 'kort',
    personality: string, 
    area: string,
    pitchingForCompany: string,
    context?: string,
    lang: string = 'nl',
    selectedIndustry?: 'telecom' | 'energy' | ''
): Promise<string> => {
    if (!checkApiKey()) return "AI Configuratie Fout: API Key ontbreekt. Neem contact op met de beheerder.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const pitchIndustry = selectedIndustry || (user.industry !== 'beide' ? user.industry : 'zowel telecom als energie');

    const basePrompt = `
    Genereer een complete verkoopstrategie en pitch voor een verkoper die namens **${pitchingForCompany}** pitcht. De verkoper zelf is in dienst bij ${user.company}. De pitch moet klinken alsof de verkoper voor ${pitchingForCompany} werkt.

    De verkoper heeft de volgende kenmerken:
    - Verkoopkanaal: ${salesChannel}
    - Gewenste pitchlengte: ${pitchLength === 'kort' ? 'Kort & Krachtig (K.I.S.S. principe)' : 'Normaal'}
    - Verkoopmarkt: ${pitchIndustry}
    - Persoonlijkheid/Stijl verkoper: ${personality}
    - Doelgebied (stad/wijk): ${area}

    De output moet in het ${targetLanguage} zijn en de volgende VIER secties bevatten, in perfect opgemaakte Markdown:

    ### 1. Strategisch Buurtadvies
    Analyseer het doelgebied "${area}". Geef een korte, bondige inschatting van de demografie. Wat voor soort mensen wonen hier waarschijnlijk? Waar hechten zij waarde aan?

    ### 2. Advies: ${salesChannel === 'deur-aan-deur' ? 'Lichaamstaal & Toon' : 'Stemgebruik & Toon'}
    Gebaseerd op de persoonlijkheid, de buurtanalyse en het verkoopkanaal ("${salesChannel}"), geef concreet advies over houding, toon en aanpak.

    ### 3. De Pitch op Maat (${pitchLength === 'kort' ? 'Korte Versie' : 'Normale Versie'})
    Schrijf een complete verkooppitch. Zorg ervoor dat de pitch wordt uitgesproken alsof de verkoper namens **${pitchingForCompany}** spreekt.
    - **Structuur:** IJsbreker -> Vragen Stellen -> De Pitch -> Afsluiting (Close).
    
    ### 4. Meest Waarschijnlijke Bezwaren (Objection Handling)
    Geef de TOP 3 meest waarschijnlijke bezwaren voor deze specifieke situatie en geef voor elk een kort weerwoord.
    `;

    const finalPrompt = context
        ? `Je bent een AI sales strateeg en onthoud dat de bedrijf opereert als deur aan deur verkoper of telemarketeer. Pas de strategie aan op basis van deze context:\n---\n${context}\n---\n\nOriginele vraag:\n${basePrompt}`
        : basePrompt;

    try {
        return await generateContentSafe('gemini-2.5-flash', finalPrompt);
    } catch (error) {
        return "Er is een fout opgetreden bij het genereren van de pitch. Probeer het opnieuw.";
    }
};

export const analyzeCompetitors = async (
    market: 'telecom' | 'energy',
    details: any,
    competitorsToAnalyze: string[]
): Promise<string> => {
    if (!checkApiKey()) return "[]";

    const competitorList = competitorsToAnalyze.join(', ');
    const baseInstructions = `
        Your task is to act as a data analyst. Use Google Search to find current information from reliable sources (official websites, pricewise, gaslicht.com, etc.).
        Find offers for NEW customers (promotions) and EXISTING customers (standard rates).
        If a value is not found, use null. Do NOT guess.
        Output ONLY a valid JSON array. No markdown formatting.
    `;

    let prompt = "";
    if (market === 'telecom') {
        prompt = `${baseInstructions}
        Analyze telecom packages in NL for: ${competitorList}.
        Comparison offer: Package: ${details.packageType}, Speed: ${details.internetSpeed}, Price: ${details.price}.
        JSON Structure: [{ "companyName": "string", "standardOffer": { "packageName": "string", "internetSpeed": number|null, "monthlyPrice": number|null, "setupFee": number|null, "discount": number|null, "usps": ["string"] }, "newCustomerOffer": { "packageName": "string", "internetSpeed": number|null, "monthlyPrice": number|null, "setupFee": number|null, "discount": number|null, "usps": ["string"] } }]`;
    } else {
        prompt = `${baseInstructions}
        Analyze energy contracts in NL for: ${competitorList}.
        Comparison offer: Duration: ${details.contractDuration}, Normal Rate: ${details.powerRateNormal}, Gas: ${details.gasRate}.
        JSON Structure: [{ "companyName": "string", "standardOffer": { "contractType": "string", "powerRateNormal": number|null, "powerRateLow": number|null, "gasRate": number|null, "fixedCostMonthly": number|null, "welcomeBonus": number|null, "usps": ["string"] }, "newCustomerOffer": { "contractType": "string", "powerRateNormal": number|null, "powerRateLow": number|null, "gasRate": number|null, "fixedCostMonthly": number|null, "welcomeBonus": number|null, "usps": ["string"] } }]`;
    }

    try {
        // We gebruiken hier 'any' voor config omdat de types soms verschillen per versie
        return await generateContentSafe("gemini-2.5-pro", prompt, {
            tools: [{googleSearch: {}}],
            thinkingConfig: { thinkingBudget: 1024 }
        });
    } catch (error) {
        return "[]";
    }
};

export const getCompetitorSummary = async (ourOffer: any, competitorData: any[], lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        As a sales strategist, compare my offer with competitors.
        Write a strategic summary in ${targetLanguage} and Markdown.
        Address: Strengths/Weaknesses vs New Customers AND vs Existing Customers.
        
        My Offer: ${JSON.stringify(ourOffer)}
        Competitor Data: ${JSON.stringify(competitorData)}
    `;
    try {
        return await generateContentSafe("gemini-2.5-flash", prompt);
    } catch (error) {
        return "Geen samenvatting beschikbaar.";
    }
};

export const getPitchSuggestions = async (pitchContent: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Sales Coach analysis of this pitch:
        ${pitchContent}
        
        Provide feedback in ${targetLanguage} and Markdown with headings:
        ### Structuur & Flow
        ### Woordkeuze & Toon
        ### Waardepropositie
        ### Afsluiting (Call to Action)
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen suggesties beschikbaar.";
    }
};

export const analyzeNotes = async (notes: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    if (!notes || notes.trim() === '') return "Geen notities.";
    
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Analyze these sales notes. Provide a summary and action items in ${targetLanguage} and Markdown.
        Structure:
        ### Samenvatting
        ### Actiepunten
        
        Notes: ${notes}
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen analyse beschikbaar.";
    }
};

export const generateWeeklyReview = async (user: User, goals: Goal[], clients: Client[], pitches: Pitch[], lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const recentSales = user.sales?.filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) || [];
    
    const prompt = `
        Weekly sales review for ${user.name} in ${targetLanguage} and Markdown.
        Stats: New Clients: ${clients.length}, New Pitches: ${pitches.length}, Sales Value: ${recentSales.reduce((sum, s) => sum + s.value, 0)}.
        Goals: ${JSON.stringify(goals)}.
        
        Sections:
        ### Terugblik op de Week
        ### Voortgang op Doelen
        ### Focuspunten voor Volgende Week
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen review beschikbaar.";
    }
};

export const generateDailyTip = async (user: User, goals: Goal[], sales: Sale[], lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const salesToday = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    
    const prompt = `
        Generate 1 short, actionable sales tip (max 30 words) in ${targetLanguage} for ${user.name}.
        Context: Industry ${user.industry}, Sales today: ${salesToday.length}. Goals: ${JSON.stringify(goals)}.
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Zet hem op vandaag!";
    }
};

export const summarizeAgendaForManager = async (appointments: Appointment[], lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return lang === 'nl' ? "Kan agenda niet laden." : "Cannot load agenda.";
    if (appointments.length === 0) return lang === 'nl' ? "Geen afspraken." : "No appointments.";
    
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `Summarize this agenda in 2 sentences in ${targetLanguage}: ${JSON.stringify(appointments)}`;
    
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen overzicht.";
    }
};

export const generatePreCallBriefing = async (user: User, client: Client, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Pre-call briefing for ${user.name} calling ${client.name} (${client.company}).
        Output in ${targetLanguage} and Markdown.
        Sections:
        ### Klantprofiel
        ### Belangrijkste Punten uit Notities
        ### Doel van dit Gesprek
        ### Mogelijke Opening
        
        Notes: ${client.notes}
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen briefing beschikbaar.";
    }
};

export const generateClientProfile = async (notes: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Create client profile from notes in ${targetLanguage} and Markdown.
        Sections:
        ### Klanttype
        ### Belangrijkste Behoeften & Pijnpunten
        ### Communicatiestijl
        
        Notes: ${notes}
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen profiel beschikbaar.";
    }
};

export const generateFollowUpEmail = async (user: User, analysis: string, goal: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Write a professional follow-up email in ${targetLanguage} from ${user.name}.
        Goal: ${goal}.
        Context: ${analysis}.
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Kon geen email genereren.";
    }
};

export const generateTeamPerformanceAnalysis = async (teamData: {name: string, sales: Sale[]}[], lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Analyze team sales performance in ${targetLanguage} and Markdown.
        Sections:
        1. Overall Team Performance
        2. Top Performer
        3. Coaching Opportunity
        
        Data: ${JSON.stringify(teamData)}
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen analyse beschikbaar.";
    }
};

export const generateMotivationPostInspiration = async (topic: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `Write a short, inspiring sales team post about "${topic}" in ${targetLanguage}. No title.`;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen inspiratie beschikbaar.";
    }
};

export const generateSalesPlan = async (user: User, topic: string, lang: string = 'nl'): Promise<string> => {
    if (!checkApiKey()) return "AI API Key ontbreekt.";
    
    const targetLanguage = langMap[lang] || 'Dutch';
    // We gebruiken user.industry nu in de prompt, zodat de variabele 'used' is en de fout verdwijnt.
    const industryContext = user.industry && user.industry !== 'beide' ? ` in the ${user.industry} industry` : '';

    const prompt = `
        Create a simple, structured training plan${industryContext} for a sales team on the topic of "${topic}".
        The output must be in ${targetLanguage} and in Markdown.
        The plan should include:

        ### Leerdoelen
        List 2-3 key learning objectives.

        ### Kernconcepten
        Explain the main ideas in a few bullet points.

        ### Oefening / Rollenspel
        Describe a practical exercise or role-play scenario for the team to practice.
    `;
    try {
        return await generateContentSafe('gemini-2.5-flash', prompt);
    } catch (error) {
        return "Geen plan beschikbaar.";
    }
};

export const startHelpChat = (lang: string = 'nl'): any => {
    if (!checkApiKey()) throw new Error("API Key missing");
    const targetLanguage = langMap[lang] || 'Dutch';
    try {
        return ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are a helpful AI assistant for "Sales Copilot". Help users use the app. Respond in ${targetLanguage}. Be concise.`
            },
        });
    } catch (error) {
        console.error("Error starting help chat:", error);
        throw error;
    }
};

export const startAdviceChat = (user: User, lang: string = 'nl'): any => {
    if (!checkApiKey()) throw new Error("API Key missing");
    const targetLanguage = langMap[lang] || 'Dutch';
    try {
        return ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `You are an AI Sales Coach. Help the salesperson with strategy, pitches, and objections. Respond in ${targetLanguage}. Industry: ${user.industry}. Channel: ${user.salesChannel}. If you suggest a new pitch structure, end with "[PROPOSE_REGENERATE]".`
            },
        });
    } catch (error) {
        console.error("Error starting advice chat:", error);
        throw error;
    }
};