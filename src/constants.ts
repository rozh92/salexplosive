
export const TELECOM_COMPANIES_NL = ["KPN", "Ziggo", "Odido", "Youfone", "Budget Alles-in-1", "Caiway", "Anders"];
export const ENERGY_COMPANIES_NL = ["Eneco", "Vattenfall", "Essent", "Greenchoice", "Budget Energie", "Oxxio", "Vandebron", "Anders"];

export const TELECOM_COMPANIES_EN = ["BT", "Sky", "Virgin Media", "TalkTalk", "Vodafone", "EE", "Plusnet", "Other"];
export const ENERGY_COMPANIES_EN = ["British Gas", "E.ON Next", "OVO Energy", "EDF Energy", "ScottishPower", "Octopus Energy", "Shell Energy", "Other"];

export const TELECOM_COMPANIES_DE = ["Deutsche Telekom", "Vodafone", "1&1", "O2", "Telefónica", "PŸUR", "NetCologne", "Andere"];
export const ENERGY_COMPANIES_DE = ["E.ON", "Vattenfall", "EnBW", "RWE", "innogy", "EWE", "LichtBlick", "Andere"];

export const getCompanyList = (industry: 'telecom' | 'energy' | 'beide', lang: 'nl' | 'en' | 'de' = 'nl'): string[] => {
    if (industry === 'telecom') {
        if (lang === 'en') return TELECOM_COMPANIES_EN;
        if (lang === 'de') return TELECOM_COMPANIES_DE;
        return TELECOM_COMPANIES_NL;
    }
    if (industry === 'energy') {
        if (lang === 'en') return ENERGY_COMPANIES_EN;
        if (lang === 'de') return ENERGY_COMPANIES_DE;
        return ENERGY_COMPANIES_NL;
    }
    return [];
};
