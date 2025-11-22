import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { User, Goal, Client, Pitch, Sale, Appointment } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
        
        return response.text;
    } catch (error) {
        console.error("Error generating pitch:", error);
        throw new Error("Er is een fout opgetreden bij het genereren van de pitch.");
    }
};

export const analyzeCompetitors = async (
    market: 'telecom' | 'energy',
    details: any,
    competitorsToAnalyze: string[]
): Promise<string> => {
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
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                thinkingConfig: { thinkingBudget: 16384 }
            },
        });
        
        return response.text;
    } catch (error) {
        console.error(`Error analyzing ${market} competitors:`, error);
        return "[]";
    }
};

export const getCompetitorSummary = async (ourOffer: any, competitorData: any[], lang: string = 'nl'): Promise<string> => {
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
        return response.text;
    } catch (error) {
        console.error("Error getting competitor summary:", error);
        return "Kon geen strategische samenvatting genereren.";
    }
};


export const getPitchSuggestions = async (pitchContent: string, lang: string = 'nl'): Promise<string> => {
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

        return response.text;
    } catch (error) {
        console.error("Error getting pitch suggestions:", error);
        return "Er is een fout opgetreden bij het ophalen van suggesties. Probeer het opnieuw.";
    }
};

export const analyzeNotes = async (notes: string, lang: string = 'nl'): Promise<string> => {
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

        return response.text;
    } catch (error) {
        console.error("Error analyzing notes:", error);
        return "Er is een fout opgetreden bij het analyseren van de notities.";
    }
};

export const startAdviceChat = (user: User, lang: string = 'nl'): Chat => {
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
        throw new Error("Kon de AI Coach niet starten.");
    }
};

export const startHelpChat = (lang: string = 'nl'): Chat => {
    const targetLanguage = langMap[lang] || 'Dutch';

    const formalFormMap: Record<string, string> = {
        'nl': "de 'U'-vorm",
        'en': "the formal 'you'",
        'de': "die 'Sie'-Form"
    };
    
    const systemInstruction = `
        U bent een formele, respectvolle en zeer professionele AI-assistent voor de webapplicatie 'Sales Copilot'. Uw enige doel is om duidelijke, stapsgewijze instructies te geven aan gebruikers over hoe ze de functies van de applicatie kunnen gebruiken. U moet te allen tijde in het ${targetLanguage} antwoorden, in een formele en respectvolle toon (gebruik ${formalFormMap[lang] || formalFormMap['nl']}). Baseer uw antwoorden uitsluitend op de onderstaande kennisbank. De kennisbank is in het Nederlands, maar u vertaalt de relevante informatie dynamisch naar ${targetLanguage} in uw antwoorden.

        --- KENNISBANK SALES COPILOT ---

        **ALGEMENE FUNCTIES**

        *   **Dashboard**: Dit is uw startpagina. Het toont een overzicht van uw verkoopdoelen, een dagelijkse AI-tip en recente teamupdates van het management.
        *   **Instellingen**: Hier kunt u uw bedrijfsnaam aanpassen (indien u geen manager bent). Andere gegevens zoals uw rol en e-mailadres zijn vastgezet.
        *   **Profiel**: Hier kunt u uw naam en profielfoto wijzigen, en uw wachtwoord aanpassen.

        **VERKOOP & STRATEGIE**

        *   **Een Sale Registreren**:
            1. Klik op de knop 'Registreer Sale' rechtsboven in het scherm.
            2. Er verschijnt een venster met de productpakketten die uw manager heeft ingesteld voor uw team.
            3. Selecteer het pakket dat u heeft verkocht.
            4. Klik op 'Registreer' om de verkoop te voltooien. De waarde wordt automatisch bij uw doelen opgeteld.

        *   **Pitch Generator**: Voor het creëren van een complete verkoopstrategie.
            1. Navigeer naar 'Pitch Generator'.
            2. Kies het type pitch: 'Normaal' of 'Kort & Krachtig'.
            3. Vul uw verkoopstijl en de stad/wijk in waar u actief bent.
            4. Klik op 'Genereer Strategie'. De AI levert een 4-delige strategie (buurtadvies, toonadvies, de pitch zelf, en bezwaren).
            5. U kunt de strategie opslaan of de AI Coach om verfijning vragen.

        *   **Opgeslagen Pitches**: Uw persoonlijke bibliotheek van strategieën.
            1. Ga naar 'Opgeslagen Pitches'.
            2. Selecteer een pitch uit de lijst om de details te bekijken.
            3. U kunt de pitch bewerken, verwijderen, of een AI-analyse laten uitvoeren voor verbeterpunten.
            4. Als u een 'leader' of 'team-leader' bent, kunt u een succesvolle pitch 'promoten' naar de Team Kennisbank.

        *   **Pitch Oefenen**: Een interactieve rollenspelsimulator.
            1. Ga naar 'Pitch Oefenen'.
            2. Kies eerst een van uw opgeslagen pitches.
            3. Kies vervolgens een AI-persona (bv. 'Sceptische Manager') om tegen te oefenen.
            4. Start de sessie. U spreekt via uw microfoon en de AI reageert met audio.
            5. Na afloop kunt u een transcriptie van het gesprek bekijken en AI-feedback op uw prestaties genereren.

        **KLANTEN & CONCURRENTIE**

        *   **Klanten**: Een eenvoudig CRM-systeem.
            1. Navigeer naar 'Klanten'.
            2. Voeg een nieuwe klant toe of selecteer een bestaande klant.
            3. U kunt notities toevoegen en bewerken.
            4. Gebruik de AI-knoppen om uw notities te analyseren, een 'Pre-Call Briefing' te genereren (die ook externe data gebruikt), of een klantprofiel op te stellen.
            5. Voor telefonische verkopers is er ook een 'Email Assistent' om follow-up e-mails op te stellen.

        *   **Concurrentieanalyse**: Vergelijk uw aanbod met de markt.
            1. Ga naar 'Concurrentieanalyse'.
            2. Kies uw markt (Telecom of Energie).
            3. Selecteer de concurrenten die u wilt analyseren.
            4. Vul de details van uw eigen aanbod in.
            5. De AI gebruikt Google Search om actuele data te verzamelen en presenteert een vergelijking en een strategische samenvatting.

        *   **Concurrentie Notities**: Deel inzichten met uw team.
            1. Ga naar 'Concurrentie Notities'.
            2. Hier kunt u notities van uzelf en teamleden bekijken over specifieke concurrenten.
            3. Voeg een nieuwe notitie toe met specifieke details over pakketten, prijzen of USP's van een concurrent.

        **DOELEN & MOTIVATIE**

        *   **Doelen**: Stel uw persoonlijke verkoopdoelen in.
            1. Ga naar 'Doelen'.
            2. Stel een nieuw doel in door het aantal sales en de periode (dagelijks of wekelijks) te kiezen.
            3. Actieve doelen worden hier weergegeven. U kunt ze ook verwijderen.
            4. Uw voortgang is zichtbaar op het Dashboard.

        *   **Team Updates (op Dashboard)**: Een feed met motiverende berichten van uw leidinggevenden. Leidinggevenden ('leader', 'team-leader', 'manager') kunnen hier nieuwe berichten plaatsen.

        **TEAM & MANAGEMENT (ROL-AFHANKELIJK)**

        *   **Mijn Team / Mijn Filiaal**:
            *   **Salespersons**: Zien hier hun directe 'leader' en 'team-leader', en de collega's binnen hun directe team.
            *   **Leaders & Team-Leaders**: Zien hier hun teamleden, hun prestaties en kunnen de rol van een 'salesperson' wijzigen naar 'leader' (en vice versa). Ze kunnen ook nieuwe leden toevoegen.
            *   **Managers**: Zien een compleet overzicht van het hele filiaal ('Mijn Filiaal'), inclusief alle medewerkers, sectorstatistieken en prestaties. Ze kunnen ook **extra licenties aanvragen** via de knop 'Extra Licenties Kopen' op deze pagina.

        *   **Hoe een teamlid toe te voegen (voor Leaders, Team-Leaders, Managers)**:
            1. Navigeer naar de 'Mijn Team' of 'Mijn Filiaal' pagina.
            2. Klik op de knop 'Voeg Lid Toe'.
            3. Vul de gegevens van het nieuwe lid in (naam, e-mail, tijdelijk wachtwoord).
            4. Selecteer de juiste rol. De beschikbare rollen hangen af van uw eigen rol.
            5. Vul de branche, het bedrijf en het verkoopkanaal in.
            6. Klik op 'Opslaan'. Het nieuwe lid ontvangt instructies en moet bij de eerste login een nieuw wachtwoord instellen.

        *   **Team Kennisbank**:
            *   **Voor iedereen**: Een bibliotheek met 'gouden pitches' (succesvolle strategieën) die door leiders zijn gepromoot. Managers kunnen hier ook algemene mededelingen plaatsen.
            *   **Voor Leaders/Team-Leaders**: Kunnen een pitch vanuit 'Opgeslagen Pitches' promoten naar de kennisbank.
            *   **Voor Managers**: Kunnen mededelingen plaatsen voor het hele filiaal.

        *   **Planning (alleen voor Managers)**:
            1. Ga naar 'Planning'.
            2. Genereer een AI-trainingsplan door een onderwerp in te vullen.
            3. Sla het gegenereerde plan op om het later te bekijken.
            4. Beheer ook uw eigen agenda door afspraken toe te voegen en te bewerken.

        *   **Pakketbeheer (alleen voor Managers)**:
            1. Ga naar 'Pakketbeheer'.
            2. Definieer hier de productpakketten die uw teams kunnen verkopen.
            3. Voeg een nieuw pakket toe met een naam, branche, bedrijf en de 'contractwaarde' (een puntensysteem, bv. 1.0 of 0.5).
            4. Deze pakketten verschijnen in de 'Registreer Sale' modal voor de verkopers.
            
        **OWNER FUNCTIES (ALLEEN VOOR EIGENAREN)**

        *   **Owner Dashboard**: Een speciaal dashboard dat een overzicht geeft van de prestaties van de gehele organisatie, inclusief alle filialen.
        *   **Mijn Organisatie**: Hier kunt u filialen aanmaken, beheren en verwijderen. U heeft een overzicht van alle managers en het totale aantal medewerkers per filiaal.
        *   **Facturatie & Abonnement**:
            1. Ga naar de 'Facturatie' pagina in het menu.
            2. Hier ziet u een overzicht van uw huidige abonnement, het aantal licenties en uw factuurgeschiedenis.
            3. Om **meer licenties aan te vragen**, klikt u op de knop 'Extra Licenties Kopen'.
            4. Er verschijnt een venster waar u het aantal kunt specificeren en de aanvraag kunt indienen.

        --- EINDE KENNISBANK ---

        Uw regels:
        1.  **Wees Stapsgewijs**: Geef bij de vraag hoe iets te doen, genummerde stappen. Wees zeer expliciet en gebruik de informatie uit de Kennisbank.
        2.  **Blijf bij het Onderwerp**: Beantwoord geen vragen die niets te maken hebben met de Sales Copilot-applicatie. Weiger beleefd en stuur het gesprek terug.
        3.  **Wees Formeel**: Gebruik altijd de formele toon die past bij de doeltaal (${targetLanguage}).
        4.  **Geen Technisch Jargon**: Leg alles uit vanuit het perspectief van een gebruiker.
        5.  **Begin het gesprek**: Uw eerste bericht moet altijd een formele begroeting zijn in de taal ${targetLanguage}, bijvoorbeeld: "Goedendag. Hoe kan ik u vandaag assisteren met de Sales Copilot applicatie?"
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
        throw new Error("Kon de Help Chatbot niet starten.");
    }
};


export const generatePreCallBriefing = async (user: User, client: Client, lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    Genereer een beknopte, actiegerichte "Pre-Call Briefing" voor een ${user.salesChannel} verkoper van ${user.company} (${user.industry}).
    De briefing is voor een gesprek met ${client.name} van ${client.company}. De output moet in ${targetLanguage} zijn.

    Gebruik twee informatiebronnen:
    1.  De interne notities van de verkoper.
    2.  Actuele, openbare informatie over het bedrijf "${client.company}" via Google Search.

    De output moet in Markdown zijn en de volgende structuur hebben:

    ### 1. Gesprekscontext
    - **Klant:** ${client.name}
    - **Bedrijf:** ${client.company}
    - **Type Gesprek:** ${user.salesChannel === 'telefonisch' ? 'Telefoongesprek' : 'Fysieke afspraak'}

    ### 2. Samenvatting Vorige Contacten
    Vat de belangrijkste punten uit de notities hieronder samen. Wat is de status? Waar is eerder over gesproken?

    ### 3. Actuele Inzichten (via Google Search)
    Zoek naar recent nieuws, persberichten of belangrijke ontwikkelingen bij ${client.company}. Zijn er nieuwe projecten, uitdagingen of successen waar we op kunnen inspelen? Presenteer 2-3 opvallende punten.

    ### 4. Strategische Gespreksdoelen
    - **Primair Doel:** [Formuleer het belangrijkste doel voor dit gesprek]
    - **Secundair Doel:** [Formuleer een 'nice-to-have' doel]

    ### 5. Mogelijke Inhaakmomenten & Vragen
    - [Stel 1-2 slimme, open vragen voor op basis van de notities en de actuele inzichten]
    - [Geef 1 suggestie voor een persoonlijke ijsbreker of een relevant inhaakmoment]

    --- INTERNE NOTITIES ---
    ${client.notes}
    --- EINDE NOTITIES ---
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating pre-call briefing:", error);
        return "Kon geen briefing genereren. Controleer de verbinding en probeer het opnieuw.";
    }
};

export const generateFollowUpEmail = async (user: User, analysis: string, goal: 'afspraak bevestigen' | 'offerte nasturen' | 'bedanken voor gesprek', lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    You are an AI Email Assistant for a salesperson.
    Draft a professional, concise follow-up email in ${targetLanguage}.

    **Salesperson's Context:**
    - Name: ${user.name}
    - Company: ${user.company}
    - Role: ${user.salesChannel} salesperson in the ${user.industry} sector.

    **Goal of the email:** ${goal}

    **Basis for the email (summary & action points from the conversation):**
    ---
    ${analysis}
    ---

    **Instructions:**
    - Use the information from the summary and action points to write the email body.
    - The tone should be professional, friendly, and action-oriented.
    - Keep it short and scannable. Use line breaks.
    - Start with a suitable salutation (e.g., "Beste [Klantnaam],").
    - End with a professional closing and the salesperson's name.
    - Ensure the email clearly states the next step, in line with the chosen goal.
    - Use placeholders like [Klantnaam] where necessary.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating follow-up email:", error);
        return "Kon geen e-mail genereren. Probeer het opnieuw.";
    }
};

export const generateWeeklyReview = async (user: User, goals: Goal[], clients: Client[], pitches: Pitch[], lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const sales = user.sales || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const salesToday = sales.filter(s => new Date(s.date) >= startOfToday).reduce((sum, s) => sum + s.value, 0);

    const dayOfWeek = now.getDay(); 
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diff);
    const salesThisWeek = sales.filter(s => new Date(s.date) >= startOfWeek).reduce((sum, s) => sum + s.value, 0);
    
    const dailyGoals = goals.filter(g => g.type === 'daily');
    const weeklyGoals = goals.filter(g => g.type === 'weekly');
    
    const goalsSummary = {
        daily: {
            total: dailyGoals.length,
            completed: dailyGoals.filter(g => salesToday >= g.target).length
        },
        weekly: {
            total: weeklyGoals.length,
            completed: weeklyGoals.filter(g => salesThisWeek >= g.target).length
        }
    };

    const prompt = `
    You are a motivational AI Performance Coach for a salesperson named ${user.name}.
    Analyze the performance data from the past week and provide a short, personal "Week in Review" in Markdown, written in ${targetLanguage}.
    The tone should be positive, constructive, and motivational. Address the salesperson directly.

    **Data from the week:**
    - New clients added: ${clients.length}
    - New pitches saved: ${pitches.length}
    - Daily goals: ${goalsSummary.daily.completed} of ${goalsSummary.daily.total} achieved.
    - Weekly goals: ${goalsSummary.weekly.completed} of ${goalsSummary.weekly.total} achieved.
    - Salesperson context: Works at ${user.company} in the ${user.industry} as a ${user.salesChannel} salesperson.

    **Structure of the review:**
    1.  **A Positive Opening:** Start with a compliment or a positive observation about the week.
    2.  **Highlight of the Week:** Mention one specific, positive point. For example, the high number of goals achieved, or the fact that many new clients were added.
    3.  **An Insight or Tip:** Based on the data, provide one concrete, small, and easily actionable piece of advice for the coming week. For example: "It's noticeable that you're saving many pitches. Next week, try practicing one of them with the Pitch Coach." or "You've almost hit all your daily goals. For next week, try setting one extra, challenging goal."
    4.  **A Motivational Closing:** End with a short, energetic sentence to start the new week well.

    Keep the entire text short and inspiring (about 4-5 sentences total).
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating weekly review:", error);
        return "Kon geen wekelijkse review genereren.";
    }
};

export const generateTeamPerformanceAnalysis = async (teamData: { name: string, sales: Sale[] }[], lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    You are an experienced AI Sales Manager. Analyze the sales data of the team below. The most important KPI is the **total value of contracts sold**. Each sale object has a 'value' field that indicates how much a contract is worth (e.g., 1.0, 0.5).

    Provide a detailed, constructive analysis in ${targetLanguage} and in Markdown.
    Address the team leader directly.

    **Structure of the Analysis:**
    ### 1. Algemene Teamprestaties
    - Summarize the overall performance of the team. What is the **total value** of the contracts sold? Is an upward or downward trend visible?

    ### 2. Top-presteerders
    - Identify the 1-2 best-performing team members based on the **total contract value**. Mention their successes and what makes them successful (e.g., consistency, high volume, selling valuable contracts).

    ### 3. Coaching Mogelijkheden
    - Identify team members who may need extra support based on a lower **total contract value**.
    - Be empathetic and constructive. Avoid negative language. Focus on potential.

    ### 4. Concreet Actieplan voor de Teamleider
    - Provide 2-3 concrete, actionable coaching tips aimed at increasing the **total contract value**. Link each tip to a specific team member.
    - Example advice: "Schedule a 1-on-1 meeting with [Name] to discuss their approach and see how you can increase the value per sale together." or "Organize a session where [Top Performer] shares their method with the rest of the team."

    **Team Information and Sales Data (focus on the sum of 'value'):**
    ---
    ${JSON.stringify(teamData, null, 2)}
    ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating team performance analysis:", error);
        return "Kon de team prestatieanalyse niet genereren.";
    }
};

export const generateDailyTip = async (user: User, goals: Goal[], sales: Sale[], lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - diff);
    const salesThisWeek = sales.filter(s => new Date(s.date) >= startOfWeek).reduce((sum, s) => sum + s.value, 0);

    const openWeeklyGoals = goals.filter(g => g.type === 'weekly' && salesThisWeek < g.target);
    const recentSalesValue = sales.filter(s => {
        const saleDate = new Date(s.date);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return saleDate > threeDaysAgo;
    }).reduce((sum, s) => sum + s.value, 0);

    const context = `
    - Salesperson name: ${user.name}
    - Role: ${user.role}
    - Open weekly goals: ${openWeeklyGoals.length}
    - Total sales value last 3 days: ${recentSalesValue}
    `;

    const prompt = `
    You are an AI Sales Coach. Generate one short, motivational, and context-aware "Tip of the Day" for the salesperson.
    The tip must be in ${targetLanguage}, a maximum of 2-3 sentences long, and written directly and personally.

    Use the following context to generate a relevant tip:
    ${context}

    **Example scenarios:**
    - If there are still open weekly goals: "Good morning! You still have ${openWeeklyGoals.length} weekly goals open. Let's tackle one today to end the week strong!"
    - If there have been few recent sales: "It's been a bit quiet. A perfect moment to practice one of your top pitches with the AI Coach and prepare for the next opportunity."
    - If there's a new feature (like Team Knowledge Base): "Did you know your team leader can share 'Golden Pitches' in the Team Knowledge Base? A great source for inspiration!"
    - A general motivational tip: "Every 'no' brings you closer to a 'yes'. Stay focused and positive today!"

    Now generate a suitable, original tip.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating daily tip:", error);
        return "Begin de dag sterk en focus op je doelen!";
    }
};

export const generateMotivationPostInspiration = async (topic: string, lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    You are a motivational speaker for sales teams.
    Write a short, powerful, and inspiring paragraph based on the following topic.
    The response must be in ${targetLanguage}.

    Topic: "${topic}"
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating motivation post inspiration:", error);
        return "";
    }
};

export const generateSalesPlan = async (user: User, topic: string, lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    You are a senior sales manager for ${user.company}, a company active in the ${user.industry} sector using a '${user.salesChannel}' sales channel.
    Your task is to create a practical, step-by-step training plan in Markdown, written in ${targetLanguage}.
    The plan is for a manager to train their sales team, which sells ${user.industry} products/services.
    The output should be highly relevant to this specific business context. Do NOT mention the name "SalExplosive".

    The topic for the training is: "${topic}".

    Structure the training plan with the following components:
    - **Learning Objectives:** What will the team be able to do after this training? (3 bullet points, tailored to ${user.industry} sales)
    - **Session 1: Theory (30 mins):** Key concepts and principles, with examples from the ${user.industry} market.
    - **Session 2: Practical Exercise / Role-play (45 mins):** A concrete exercise the team can do, simulating a realistic '${user.salesChannel}' scenario for ${user.industry} products.
    - **Session 3: Feedback & Follow-up (15 mins):** How to provide feedback and measure success in this specific sales environment.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating sales plan:", error);
        return "Kon geen trainingsplan genereren.";
    }
};

export const summarizeAgendaForManager = async (appointments: Appointment[], lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const appointmentList = appointments.map(a => `- ${a.time}: ${a.title} ${a.notes ? `(${a.notes})` : ''}`).join('\n');
    const prompt = `
    You are an AI assistant for a busy sales manager. Summarize the following agenda for today.
    Identify the most important appointment and provide one strategic tip.
    The output must be in ${targetLanguage} and very concise.

    Agenda:
    ${appointmentList}

    Example output:
    "You have ${appointments.length} appointments today. The most important one seems to be with [Client Name]. Tip: Focus on confirming the budget during this call."
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing agenda:", error);
        return "Kon de agenda niet samenvatten.";
    }
};


export const generateClientProfile = async (notes: string, lang: string = 'nl'): Promise<string> => {
    const targetLanguage = langMap[lang] || 'Dutch';
    const prompt = `
    Analyze the following notes about a client and generate a "Client Persona" profile.
    This helps the salesperson to better understand and connect with the client.
    The output must be in ${targetLanguage} and in Markdown.

    Structure the profile with these headings:
    ### Persoonlijkheidstype
    (e.g., Analytisch, Relatiegericht, Besluitvaardig, Expressief)

    ### Belangrijkste Drijfveren
    (What does this client value most? e.g., Prijs, Kwaliteit, Service, Innovatie, Zekerheid)

    ### Communicatiestijl
    (How should you communicate with this person? e.g., Formeel, To-the-point, Sociaal, Gedetailleerd)
    
    --- NOTES ---
    ${notes}
    --- END NOTES ---
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating client profile:", error);
        return "Kon geen klantprofiel genereren.";
    }
};
