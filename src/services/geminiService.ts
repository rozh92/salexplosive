import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { User, Goal, Client, Pitch, Sale, Appointment } from '../types';

// LIVE MODE FIX:
// Vite gebruikt import.meta.env voor variabelen.
// We checken hier op VITE_GOOGLE_AI_KEY.
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;

// We loggen een waarschuwing in plaats van te crashen, zodat de site wel laadt.
if (!API_KEY) {
    console.warn("Let op: VITE_GOOGLE_AI_KEY is niet ingesteld. AI functies zullen niet werken.");
}

// Initialiseer met de key (of een lege string om crash bij init te voorkomen, calls zullen wel falen)
const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

const langMap: Record<string, string> = {
    'nl': 'Dutch',
    'en': 'English',
    'de': 'German'
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
    if (!API_KEY) return "AI Configuratie Fout: API Key ontbreekt. Controleer je instellingen.";

    try {
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
        Analyseer het doelgebied "${area}". Geef een korte, bondige inschatting van de demografie. Wat voor soort mensen wonen hier waarschijnlijk (bijv. jonge gezinnen, studenten, ouderen)? Waar hechten zij waarde aan met betrekking tot ${pitchIndustry === 'telecom' ? 'internet en TV' : 'energie'}? (bijv. prijs, snelheid, duurzaamheid, service).

        ### 2. Advies: ${salesChannel === 'deur-aan-deur' ? 'Lichaamstaal & Toon' : 'Stemgebruik & Toon'}
        Gebaseerd op de persoonlijkheid, de buurtanalyse en het verkoopkanaal ("${salesChannel}"), geef concreet advies.
        ${salesChannel === 'deur-aan-deur' 
            ? 'Focus op lichaamstaal (houding, oogcontact) en toon. Moet de aanpak non-chalant, zakelijk, energiek, of rustig zijn? Geef 2-3 praktische tips.'
            : 'Focus op stemgebruik (toon, tempo, volume) en woordkeuze. Moet de toon enthousiast, kalm, formeel of juist informeel zijn? Geef 2-3 praktische tips.'
        }

        ### 3. De Pitch op Maat (${pitchLength === 'kort' ? 'Korte Versie' : 'Normale Versie'})
        Schrijf een complete verkooppitch, afgestemd op ALLE bovenstaande analyses. Zorg ervoor dat de pitch wordt uitgesproken alsof de verkoper namens **${pitchingForCompany}** spreekt.
        - **Lengte:** Houd de pitch ${pitchLength === 'kort' ? 'extreem kort en bondig (K.I.S.S.). Focus op de absolute kern.' : 'normaal van lengte, met ruimte voor wat meer detail.'}
        - **Structuur:** De pitch moet de volgende fasen volgen:
            - **IJsbreker:** Een creatieve opening die past bij het kanaal, de buurt en de toon.
            - **Vragen Stellen:** Een reeks van 1-2 (voor kort) of 2-3 (voor normaal) inzichtelijke vragen.
            - **De Pitch:** De kern van het verhaal met argumenten die resoneren met de buurt.
            - **Afsluiting (Close):** Een zelfverzekerde, snelle en respectvolle afsluiting gericht op de volgende stap (bv. een afspraak, of direct naar binnen). Vermijd het gevoel dat de verkoper uren blijft hangen. Maak het de klant makkelijk om 'ja' te zeggen tegen de volgende stap.
        
        ### 4. Meest Waarschijnlijke Bezwaren (Objection Handling)
        Identificeer, gebaseerd op de markt, het aanbod en het type buurt, de TOP 3 meest waarschijnlijke bezwaren die een klant zal hebben. Geef voor elk bezwaar een kort en krachtig tegenargument of een vraag om het bezwaar te weerleggen.
        - **Bezwaar 1:** [Bezwaar]
        - **Antwoord 1:** [Antwoord]
        - **Bezwaar 2:** [Bezwaar]
        - **Antwoord 2:** [Antwoord]
        - **Bezwaar 3:** [Bezwaar]
        - **Antwoord 3:** [Antwoord]
        `;

        const finalPrompt = context
            ? `Je bent een AI sales strateeg. Een verkoper wil dat je de pitch aanpast op basis van de nieuwe inzichten uit een coachingsgesprek.
Houd je strikt aan de 4-delige output structuur (Buurtadvies, Advies: Toon, De Pitch, Bezwaren).
Behoud de oorspronkelijke parameters, maar verwerk de feedback uit het gesprek. De output moet in ${targetLanguage} zijn.

--- GESPREKSCONTEXT MET COACH ---
${context}
--- EINDE CONTEXT ---

De originele pitch parameters en het gevraagde output formaat zijn als volgt:
${basePrompt}`
            : basePrompt;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalPrompt,
        });
        
        return response.text || "Geen antwoord ontvangen.";
    } catch (error) {
        console.error("Error generating pitch:", error);
        return "Er is een fout opgetreden bij het genereren van de pitch. Controleer uw internetverbinding en probeer het opnieuw.";
    }
};

export const analyzeCompetitors = async (
    market: 'telecom' | 'energy',
    details: any,
    competitorsToAnalyze: string[]
): Promise<string> => {
    if (!API_KEY) return "[]";

    let prompt = '';
    const competitorList = competitorsToAnalyze.join(', ');

    const baseInstructions = `
        Your task is to act as a data analyst. Use Google Search to find current, detailed information from reliable sources (official provider websites, major comparison sites like Pricewise, Gaslicht.com, Bellen.com, etc.).
        You MUST differentiate between offers for new customers and standard offers for existing customers.

        - For the "newCustomerOffer", find promotional rates, welcome gifts, cashbacks, and any temporary discounts.
        - For the "standardOffer", find the standard, variable, non-promotional rates an existing customer pays after any promotional period ends.
        - If you cannot find a specific numeric value from a reliable source, you MUST use 'null' for that field. DO NOT guess, DO NOT use 0, and DO NOT copy data from the other offer type.

        Provide the output as a clean JSON array of objects, with the exact structure specified below. The output must *only* contain the JSON array, without any extra text, explanations, or markdown formatting.
    `;

    if (market === 'telecom') {
        prompt = `
        ${baseInstructions}
        Analyze the following specific competitors for a telecom (internet & TV) package in the Netherlands: ${competitorList}.

        Our offer for comparison:
        - Package type: ${details.packageType}
        - Internet speed: ${details.internetSpeed} Mbps
        - TV details: ${details.tvDetails}
        - Price per month: €${details.price}
        - One-time costs: €${details.setupFee}
        - Discount/cashback: €${details.discount}
        - Our Unique Selling Points (USPs): ${details.usps}

        JSON Structure:
        [
            {
                "companyName": "string",
                "standardOffer": {
                    "packageName": "string",
                    "internetSpeed": "number (in Mbps) or null",
                    "monthlyPrice": "number (standard price) or null",
                    "setupFee": "number or null",
                    "discount": "number (usually 0) or null",
                    "usps": ["string"]
                },
                "newCustomerOffer": {
                    "packageName": "string",
                    "internetSpeed": "number (in Mbps) or null",
                    "monthlyPrice": "number (promotional price) or null",
                    "setupFee": "number or null",
                    "discount": "number (cashback, bonus) or null",
                    "usps": ["string"]
                }
            }
        ]
        `;
    } else if (market === 'energy') {
        prompt = `
        ${baseInstructions}
        Analyze the following specific competitors for an energy contract (gas and electricity) in the Netherlands: ${competitorList}.

        Our offer for comparison:
        - Contract duration: ${details.contractDuration}
        - Power rate type: ${details.rateType}
        - Power rate normal: €${details.powerRateNormal} per kWh
        - Power rate off-peak: €${details.powerRateLow} per kWh
        - Gas rate: €${details.gasRate} per m³
        - Fixed delivery costs per month: €${details.fixedCosts}
        - Welcome bonus: €${details.welcomeBonus}
        - Our Unique Selling Points (USPs): ${details.usps}
        
        JSON Structure:
        [
            {
                "companyName": "string",
                "standardOffer": {
                    "contractType": "string",
                    "powerRateNormal": "number (in EUR per kWh) or null",
                    "powerRateLow": "number (in EUR per kWh, use null if single rate) or null",
                    "gasRate": "number (in EUR per m³) or null",
                    "fixedCostMonthly": "number or null",
                    "welcomeBonus": "number (usually 0) or null",
                    "usps": ["string"]
                },
                "newCustomerOffer": {
                    "contractType": "string",
                    "powerRateNormal": "number (promotional rate) or null",
                    "powerRateLow": "number (promotional rate, use null if single rate) or null",
                    "gasRate": "number (promotional rate) or null",
                    "fixedCostMonthly": "number or null",
                    "welcomeBonus": "number (cashback, bonus) or null",
                    "usps": ["string"]
                }
            }
        ]
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Pro model voor zoekfunctie
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                thinkingConfig: { thinkingBudget: 1024 } // Lager budget voor snelheid
            },
        });
        
        return response.text || "[]";
    } catch (error) {
        console.error(`Error analyzing ${market} competitors:`, error);
        return "[]";
    }
};

export const getCompetitorSummary = async (ourOffer: any, competitorData: any[], lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        As a sales strategist, compare my offer with my competitors' data.
        The data includes offers for both NEW customers and EXISTING customers (standard offers).
        Provide a brief, strategic summary in Markdown, written in ${targetLanguage}.

        Your analysis MUST address both scenarios:
        1.  **Strengths & Weaknesses vs. NEW Customer Offers:** Where do we win against their aggressive promotions? Where are we vulnerable? How can we counter their welcome bonuses?
        2.  **Strengths & Weaknesses vs. STANDARD Offers:** Where do we win in the long run, after promotions end? This is key for convincing existing customers to switch.

        Structure your answer clearly with headings for "vs. Nieuwe Klanten" and "vs. Bestaande Klanten" (or their ${targetLanguage} equivalents). Under each, provide bullet points for our strengths and weaknesses.

        **My Offer:**
        ${JSON.stringify(ourOffer, null, 2)}

        **Competitor Data:**
        ${JSON.stringify(competitorData, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text || "Geen samenvatting beschikbaar.";
    } catch (error) {
        console.error("Error getting competitor summary:", error);
        return "Kon geen strategische samenvatting genereren.";
    }
};


export const getPitchSuggestions = async (pitchContent: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    try {
        const prompt = `
        You are an expert sales coach. Analyze the following sales pitch and provide concrete, actionable suggestions.

        --- PITCH ---
        ${pitchContent}
        --- END PITCH ---

        Structure your feedback in ${targetLanguage} and in perfectly formatted Markdown with the following FOUR mandatory headings:

        ### Structuur & Flow
        Analyze the structure of the pitch. Is the opening strong? Do the parts follow each other logically? Is the pitch easy to follow?

        ### Woordkeuze & Toon
        Assess the language used. Is the tone appropriate for the target audience? Are there weak words or clichés that could be replaced with more powerful alternatives?

        ### Waardepropositie
        Is the unique value proposition immediately clear to the customer? Are the benefits presented powerfully and persuasively?

        ### Afsluiting (Call to Action)
        Evaluate the closing. Is the call to action clear, concrete, and easy to say 'yes' to? Is the closing confident?
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Geen suggesties beschikbaar.";
    } catch (error) {
        console.error("Error getting pitch suggestions:", error);
        return "Er is een fout opgetreden bij het ophalen van suggesties. Probeer het opnieuw.";
    }
};

export const analyzeNotes = async (notes: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    if (!notes || notes.trim() === '') {
        return "Geen notities om te analyseren.";
    }
    try {
        const prompt = `
        Analyze the following unstructured notes from a sales conversation.
        Provide a concise summary and identify clear, concrete action points.
        Use the following structure in Markdown and in ${targetLanguage}:

        ### Samenvatting
        [Summarize the core of the conversation in 2-3 sentences]

        ### Actiepunten
        - [Action Item 1]
        - [Action Item 2]
        - ...

        --- NOTES ---
        ${notes}
        --- END NOTES ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Geen analyse beschikbaar.";
    } catch (error) {
        console.error("Error analyzing notes:", error);
        return "Er is een fout opgetreden bij het analyseren van de notities.";
    }
};

export const generateWeeklyReview = async (user: User, goals: Goal[], clients: Client[], pitches: Pitch[], lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const recentSales = user.sales?.filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) || [];
    const prompt = `
        Analyze the past week's performance for a salesperson named ${user.name}.
        Provide a concise, encouraging, and actionable weekly review in ${targetLanguage}.
        Structure the output in Markdown with the following sections:

        ### Terugblik op de Week
        Summarize the key activities. Mention the number of new clients (${clients.length}), new pitches created (${pitches.length}), and total sales value (€${recentSales.reduce((sum, s) => sum + s.value, 0).toFixed(2)}).

        ### Voortgang op Doelen
        Compare the weekly sales performance against their set goals.
        - Goals: ${JSON.stringify(goals)}
        - Sales this week value: €${recentSales.reduce((sum, s) => sum + s.value, 0).toFixed(2)}
        Is the salesperson on track? What went well?

        ### Focuspunten voor Volgende Week
        Based on the performance, provide 2-3 concrete and actionable tips for the upcoming week. The tone should be positive and motivating.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen review beschikbaar.";
    } catch (error) {
        console.error("Error generating weekly review:", error);
        throw new Error("Failed to generate weekly review.");
    }
};

export const generateDailyTip = async (user: User, goals: Goal[], sales: Sale[], lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const salesToday = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString());
    const prompt = `
        Generate a single, short, actionable, and motivational sales tip for ${user.name} for today.
        The tip should be in ${targetLanguage}.
        Keep it under 30 words.
        Context:
        - Salesperson profile: Industry is ${user.industry}, sales channel is ${user.salesChannel}.
        - Goals: ${JSON.stringify(goals)}
        - Sales so far today: ${salesToday.length} sales with a total value of €${salesToday.reduce((sum, s) => sum + s.value, 0).toFixed(2)}.
        - Based on this, provide a specific tip. For example, if they have no sales, motivate them to start strong. If they are close to a goal, encourage them for the final push.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Zet hem op vandaag!";
    } catch (error) {
        console.error("Error generating daily tip:", error);
        return "Veel succes met verkopen vandaag!";
    }
};

export const summarizeAgendaForManager = async (appointments: Appointment[], lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return lang === 'nl' ? "Kan agenda niet laden (API Key mist)." : "Cannot load agenda (API Key missing).";

    const targetLanguage = langMap[lang] || 'Dutch';
    if (appointments.length === 0) {
        return lang === 'nl' ? "Geen afspraken voor vandaag." : "No appointments for today.";
    }
    const prompt = `
        Summarize the following agenda for today for a sales manager.
        Provide a very brief overview, highlighting the number of appointments and any key moments (e.g., first or last appointment of the day).
        The summary should be in ${targetLanguage} and no more than 2 short sentences.
        Agenda:
        ${JSON.stringify(appointments)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Agenda overzicht niet beschikbaar.";
    } catch (error) {
        console.error("Error summarizing agenda:", error);
        throw new Error("Failed to summarize agenda.");
    }
};

export const generatePreCallBriefing = async (user: User, client: Client, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Generate a pre-call briefing for a salesperson (${user.name}) about to contact a client (${client.name} from ${client.company}).
        Use the provided notes to create a structured briefing in ${targetLanguage} and Markdown.
        The briefing must have these sections:

        ### Klantprofiel
        Briefly summarize who the client is based on the notes.

        ### Belangrijkste Punten uit Notities
        Extract 2-3 key bullet points from the previous conversations.

        ### Doel van dit Gesprek
        Suggest a primary and a secondary objective for this call.

        ### Mogelijke Opening
        Suggest one or two opening lines for the conversation, referencing past interactions.

        --- NOTES ---
        ${client.notes}
        --- END NOTES ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen briefing beschikbaar.";
    } catch (error) {
        console.error("Error generating pre-call briefing:", error);
        throw new Error("Failed to generate pre-call briefing.");
    }
};

export const generateClientProfile = async (notes: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Based on the following unstructured notes, generate a client profile.
        The output should be in ${targetLanguage} and Markdown, with the following sections:

        ### Klanttype
        Describe the type of customer (e.g., price-conscious, service-oriented, skeptical, tech-savvy).

        ### Belangrijkste Behoeften & Pijnpunten
        List 2-3 key needs or pain points mentioned in the notes.

        ### Communicatiestijl
        Advise on the best communication style to use with this client (e.g., formal, informal, direct, patient).
        
        --- NOTES ---
        ${notes}
        --- END NOTES ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen profiel beschikbaar.";
    } catch (error) {
        console.error("Error generating client profile:", error);
        throw new Error("Failed to generate client profile.");
    }
};

export const generateFollowUpEmail = async (user: User, analysis: string, goal: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        You are an AI email assistant for a salesperson named ${user.name}.
        Your task is to write a professional follow-up email in ${targetLanguage}.

        **Context from the sales conversation analysis:**
        ${analysis}

        **The goal of this email is:** ${goal}.

        **Instructions:**
        - Write a complete email, including a subject line, greeting, body, and closing.
        - Use the context from the conversation analysis to make the email personal and relevant.
        - The tone should be professional but friendly.
        - Sign off with the salesperson's name: ${user.name}.
        - The output must be only the email content in Markdown.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Kon geen email genereren.";
    } catch (error) {
        console.error("Error generating follow-up email:", error);
        throw new Error("Failed to generate follow-up email.");
    }
};

export const generateTeamPerformanceAnalysis = async (teamData: {name: string, sales: Sale[]}[], lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        As a sales manager, analyze the performance of the following team members based on their sales data for the past month.
        Provide a concise analysis in ${targetLanguage} and Markdown.

        The analysis should contain:
        1.  **Overall Team Performance:** A brief summary of how the team is doing as a whole.
        2.  **Top Performer:** Identify the top performer and briefly mention why.
        3.  **Coaching Opportunity:** Identify one or two team members who might need extra support and suggest a positive way to approach this.

        **Team Data:**
        ${JSON.stringify(teamData, null, 2)}
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen analyse beschikbaar.";
    } catch (error) {
        console.error("Error generating team performance analysis:", error);
        throw new Error("Failed to generate team performance analysis.");
    }
};

export const generateMotivationPostInspiration = async (topic: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Write a short, motivational text for a sales team.
        The topic is "${topic}".
        The text should be inspiring, concise, and ready to be posted.
        The output must be in ${targetLanguage}.
        Don't include a title, just the body text.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen inspiratie beschikbaar.";
    } catch (error) {
        console.error("Error generating motivation post inspiration:", error);
        throw new Error("Failed to generate motivation post inspiration.");
    }
};

export const generateSalesPlan = async (user: User, topic: string, lang: string = 'nl'): Promise<string> => {
    if (!API_KEY) return "AI API Key ontbreekt.";

    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
        Create a simple, structured training plan for a sales team on the topic of "${topic}".
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Geen plan beschikbaar.";
    } catch (error) {
        console.error("Error generating sales plan:", error);
        throw new Error("Failed to generate sales plan.");
    }
};

export const startHelpChat = (lang: string = 'nl'): Chat => {
    if (!API_KEY) {
        throw new Error("API Key missing");
    }

    const targetLanguage = langMap[lang] || 'Dutch';
    const systemInstruction = `
        You are a helpful AI assistant for the "Sales Copilot" application.
        Your goal is to answer user questions about how to use the app.
        You must respond in ${targetLanguage}.
        Your knowledge is limited to the following features:
        - Dashboard: View stats, goals, tips.
        - Pitch Generator: Create sales pitches.
        - Saved Pitches: View and analyze saved pitches.
        - Pitch Practice: Practice pitches with an AI.
        - Clients: Manage client information.
        - Competitor Analysis: Analyze competitors.
        - Competitor Notes: Save notes on competitors.
        - Goals: Set sales goals.
        - Team/Organization Views: For managers to see their teams.

        Rules:
        - Be friendly and concise.
        - If you don't know the answer, say so.
        - Do not answer questions outside of the app's functionality. Politely decline.
        - Your first message should be a friendly greeting asking how you can help.
    `;

    try {
        const chat: Chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return chat;
    } catch (error) {
        console.error("Error starting help chat:", error);
        throw new Error("Failed to start help chat.");
    }
};


export const startAdviceChat = (user: User, lang: string = 'nl'): Chat => {
    if (!API_KEY) {
        throw new Error("API Key missing");
    }

    const targetLanguage = langMap[lang] || 'Dutch';
    
    const systemInstruction = `
        You are an AI Sales Coach. Your only goal is to help a salesperson refine their generated pitch and strategy.
        You MUST respond in ${targetLanguage}.
        Your advice must be specific to their context:
        - Industry: ${user.industry}
        - Company: ${user.company}
        - Sales Channel: ${user.salesChannel}
        
        Rules:
        - Your focus is purely strategic and content-related.
        - You NEVER generate a complete, new pitch in this chat. You only provide advice, ask questions, and help the salesperson think.
        - If the salesperson asks a question that is NOT about sales strategy, the pitch, objections, or the target audience (e.g., "book a flight," "what's the weather?"), you must politely refuse. Say something in ${targetLanguage} that translates to: "I am not programmed for that. My focus is to help you with your sales strategy. Do you have a question about the pitch?"
        - If the conversation leads to a clear, new insight that should change the pitch (e.g., the salesperson says "this neighborhood has many low-income families"), proactively offer to adjust the pitch. Your *exact* final sentence must then be: "Shall I adjust the pitch for you based on this new information? [PROPOSE_REGENERATE]". Use this exact English token at the end, even when responding in other languages.
    `;

    try {
        const chat: Chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return chat;
    } catch (error) {
        console.error("Error starting advice chat:", error);
        throw new Error("Failed to start advice chat.");
    }
};
