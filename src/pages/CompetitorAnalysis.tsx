import React, { useState, useEffect } from 'react';
import { analyzeCompetitors, getCompetitorSummary } from '../services/geminiService';
import { TelecomCompetitorData, EnergyCompetitorData, TelecomOffer, EnergyOffer } from '../types';
import { useTheme } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BookOpenIcon, LightBulbIcon, SparklesIcon } from '../components/icons/Icons';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getCompanyList } from '../constants';


const CompetitorAnalysis: React.FC = () => {
    const { user, addContentToKB } = useAuth();
    const { t, language } = useTranslation();
    const [market, setMarket] = useState<'telecom' | 'energy' | null>(null);
    const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [competitors, setCompetitors] = useState<(TelecomCompetitorData | EnergyCompetitorData)[]>([]);
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'newCustomerOffer' | 'standardOffer'>('newCustomerOffer');
    const [isSavingToKB, setIsSavingToKB] = useState(false);
    const [kbSaveSuccess, setKbSaveSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.industry === 'telecom') {
                setMarket('telecom');
            } else if (user.industry === 'energy') {
                setMarket('energy');
            } else { // 'beide', user can choose
                setMarket(null);
            }
        }
    }, [user]);

    useEffect(() => {
        // Reset selection when market changes
        setSelectedCompetitors([]);
        setCompetitors([]);
        setSummary(null);
    }, [market]);

    const competitorsToDisplay = market ? getCompanyList(market, user?.lang).filter(c => !['Anders', 'Other', 'Andere'].includes(c)) : [];

    const [telecomForm, setTelecomForm] = useState({
        packageType: 'Internet & TV',
        internetSpeed: '100',
        tvDetails: 'Standaard TV pakket met 50+ zenders',
        price: '45',
        setupFee: '0',
        discount: '50',
        usps: 'Gratis monteur, 24/7 klantenservice'
    });

    const [energyForm, setEnergyForm] = useState({
        contractDuration: '1 jaar vast',
        rateType: 'dubbel',
        powerRateNormal: '0.35',
        powerRateLow: '0.32',
        gasRate: '1.25',
        fixedCosts: '12',
        welcomeBonus: '200',
        usps: '100% Nederlandse windenergie, CO2-gecompenseerd gas'
    });

    const handleCompetitorSelection = (competitorName: string) => {
        setSelectedCompetitors(prev => 
            prev.includes(competitorName) 
                ? prev.filter(c => c !== competitorName) 
                : [...prev, competitorName]
        );
    };
    
    const handleAnalyze = async () => {
        if (!market || selectedCompetitors.length === 0) return;
        setIsLoading(true);
        setError(null);
        setCompetitors([]);
        setSummary(null);
        setKbSaveSuccess(false);

        try {
            const details = market === 'telecom' ? telecomForm : energyForm;
            const resultString = await analyzeCompetitors(market, details, selectedCompetitors);
            
            const startIndex = resultString.indexOf('[');
            const endIndex = resultString.lastIndexOf(']');

            if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                throw new Error("Could not find a valid JSON array in the AI response.");
            }

            const jsonString = resultString.substring(startIndex, endIndex + 1);

            const result = JSON.parse(jsonString);
            setCompetitors(result);

            setIsSummaryLoading(true);
            const summaryResult = await getCompetitorSummary(details, result, language);
            setSummary(summaryResult);

        } catch (e) {
            console.error(e);
            setError('Fout bij het verwerken van de data. De AI gaf een onverwacht antwoord. Probeer het opnieuw.');
        } finally {
            setIsLoading(false);
            setIsSummaryLoading(false);
        }
    };

    const handleShareToKB = async () => {
        if (!summary || !market || competitors.length === 0) return;
        
        const title = prompt(t('kb_analysis_title_prompt'));
        if (!title) return;
    
        setIsSavingToKB(true);
        setKbSaveSuccess(false);
    
        try {
            const ourOffer = market === 'telecom' ? telecomForm : energyForm;
            
            const content = `
# ${t('kb_analysis_title')}: ${title}

**${t('market')}:** ${market === 'telecom' ? t('market_telecom') : t('market_energy')}
**${t('analysis_date')}:** ${new Date().toLocaleDateString()}

---

## ${t('strategic_summary')}
${summary}

---

## ${t('our_offer_title')}
\`\`\`json
${JSON.stringify(ourOffer, null, 2)}
\`\`\`

---

## ${t('competitor_details_title')}
\`\`\`json
${JSON.stringify(competitors, null, 2)}
\`\`\`
`;
    
            await addContentToKB({
                title: `${t('kb_analysis_title')}: ${title}`,
                content: content,
                note: `${t('kb_analysis_note_prefix')} ${market === 'telecom' ? t('market_telecom') : t('market_energy')} ${t('kb_analysis_note_suffix')}.`,
            });
    
            setKbSaveSuccess(true);
            setTimeout(() => setKbSaveSuccess(false), 3000);
    
        } catch (e) {
            console.error(e);
            alert(t('kb_save_error'));
        } finally {
            setIsSavingToKB(false);
        }
    };


    const handleDataChange = (
        compIndex: number,
        offerType: 'newCustomerOffer' | 'standardOffer',
        field: keyof TelecomOffer | keyof EnergyOffer,
        value: string
    ) => {
        const newValue = value === '' ? null : parseFloat(value);
        if (value !== '' && isNaN(newValue as number)) return;

        setCompetitors(prev => {
            const newComps = [...prev];
            const targetComp: any = { ...newComps[compIndex] };
            const targetOffer = { ...targetComp[offerType] };
            
            targetOffer[field] = newValue;
            targetComp[offerType] = targetOffer;
            newComps[compIndex] = targetComp;
            
            return newComps;
        });
    };

    const marketButtonBase = "w-full text-center py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-background";
    const marketButtonActive = "bg-brand-primary text-white shadow-lg focus:ring-brand-primary";
    const marketButtonInactive = "bg-brand-surface text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-text-primary focus:ring-brand-primary/50";

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold text-brand-text-primary">{t('compa_title')}</h1>
                <p className="text-lg text-brand-text-secondary mt-2">{t('compa_subtitle')}</p>
            </div>

             {user?.industry === 'beide' && (
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-1 text-brand-text-primary">{t('step_choose_market', { step_number: 1 })}</h2>
                    <p className="text-brand-text-secondary mb-4 text-sm">{t('compa_market_subtitle')}</p>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setMarket('telecom')} className={`${marketButtonBase} ${market === 'telecom' ? marketButtonActive : marketButtonInactive}`}>{t('market_telecom')}</button>
                        <button onClick={() => setMarket('energy')} className={`${marketButtonBase} ${market === 'energy' ? marketButtonActive : marketButtonInactive}`}>{t('market_energy')}</button>
                    </div>
                </div>
            )}
            
            {market && (
                <>
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-1 text-brand-text-primary">{t('step_select_competitors', { step_number: user?.industry === 'beide' ? 2 : 1 })}</h2>
                     <p className="text-brand-text-secondary mb-4 text-sm">{t('compa_select_subtitle')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {competitorsToDisplay.map(name => (
                            <label key={name} className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedCompetitors.includes(name) ? 'bg-brand-primary/10 border-brand-primary' : 'bg-brand-secondary border-brand-border hover:border-brand-primary/50'}`}>
                                <input 
                                    type="checkbox"
                                    checked={selectedCompetitors.includes(name)}
                                    onChange={() => handleCompetitorSelection(name)}
                                    className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary bg-brand-surface"
                                />
                                <span className={`font-medium ${selectedCompetitors.includes(name) ? 'text-brand-primary' : 'text-brand-text-primary'}`}>{name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-brand-surface rounded-xl p-6 shadow-lg space-y-6">
                     <h2 className="text-xl font-semibold text-brand-text-primary">{t('step_your_offer', { step_number: user?.industry === 'beide' ? 3 : 2 })}</h2>
                    {market === 'telecom' ? 
                        <TelecomForm form={telecomForm} setForm={setTelecomForm} /> : 
                        <EnergyForm form={energyForm} setForm={setEnergyForm} />}
                    <div className="flex flex-col sm:flex-row justify-end items-center pt-4 border-t border-brand-border">
                        {selectedCompetitors.length === 0 && <p className="text-sm text-red-400 mr-4">{t('compa_select_one_competitor')}</p>}
                        <button onClick={handleAnalyze} disabled={isLoading || selectedCompetitors.length === 0} className="bg-brand-primary text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center w-full sm:w-auto hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]">
                           {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('analyzing')}...
                                </>
                            ) : (
                                 <>
                                    <LightBulbIcon className="w-5 h-5 mr-2" />
                                    {t('analyze_competitors')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
                </>
            )}
            
            {error && <p className="text-red-400 text-center bg-red-900/20 p-4 rounded-lg">{error}</p>}

            {(competitors.length > 0 || isSummaryLoading) && (
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-semibold text-brand-text-primary flex items-center"><SparklesIcon className="w-6 h-6 mr-3 text-brand-primary"/>{t('strategic_summary')}</h2>
                        {(!isSummaryLoading && summary) && (
                            <button
                                onClick={handleShareToKB}
                                disabled={isSavingToKB}
                                className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border transition-colors disabled:opacity-50"
                            >
                                <BookOpenIcon className="w-5 h-5 mr-2" />
                                {isSavingToKB ? t('saving') : kbSaveSuccess ? t('saved') : t('share_to_kb')}
                            </button>
                        )}
                    </div>

                    {isSummaryLoading ? (
                        <p className="text-brand-text-secondary">{t('ai_analyzing_data')}</p>
                    ) : summary ? (
                         <div className="prose max-w-none">
                            <Markdown>{summary}</Markdown>
                         </div>
                    ) : null}
                </div>
            )}

            {competitors.length > 0 && (
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    <div className="flex border-b border-brand-border mb-6">
                        <button onClick={() => setActiveTab('newCustomerOffer')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'newCustomerOffer' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>{t('new_customers')}</button>
                        <button onClick={() => setActiveTab('standardOffer')} className={`py-2 px-6 font-semibold transition-colors ${activeTab === 'standardOffer' ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}>{t('existing_customers')}</button>
                    </div>
                    {market === 'telecom' ?
                        <TelecomResults data={competitors as TelecomCompetitorData[]} activeTab={activeTab} onDataChange={handleDataChange} /> :
                        <EnergyResults data={competitors as EnergyCompetitorData[]} activeTab={activeTab} onDataChange={handleDataChange} />
                    }
                </div>
            )}
        </div>
    );
};

const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";

const TelecomForm: React.FC<{form: any, setForm: any}> = ({form, setForm}) => {
    const { t } = useTranslation();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
                <label htmlFor="packageType" className={labelStyle}>{t('compa_offer_form_telecom_package_type')}</label>
                <input id="packageType" name="packageType" value={form.packageType} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="internetSpeed" className={labelStyle}>{t('compa_offer_form_telecom_speed')}</label>
                <input id="internetSpeed" name="internetSpeed" type="number" value={form.internetSpeed} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="price" className={labelStyle}>{t('compa_offer_form_telecom_price')}</label>
                <input id="price" name="price" type="number" value={form.price} onChange={handleChange} className={inputStyle} />
            </div>
             <div>
                <label htmlFor="discount" className={labelStyle}>{t('compa_offer_form_telecom_discount')}</label>
                <input id="discount" name="discount" type="number" value={form.discount} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="tvDetails" className={labelStyle}>{t('compa_offer_form_telecom_tv_details')}</label>
                    <textarea id="tvDetails" name="tvDetails" value={form.tvDetails} onChange={handleChange} className={`${inputStyle} h-24 resize-none`} />
                </div>
                <div>
                    <label htmlFor="usps" className={labelStyle}>{t('compa_offer_form_telecom_usps')}</label>
                    <textarea id="usps" name="usps" value={form.usps} onChange={handleChange} className={`${inputStyle} h-24 resize-none`} />
                </div>
            </div>
        </div>
    );
};

const EnergyForm: React.FC<{form: any, setForm: any}> = ({form, setForm}) => {
    const { t } = useTranslation();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
                <label htmlFor="contractDuration" className={labelStyle}>{t('compa_offer_form_energy_duration')}</label>
                <select id="contractDuration" name="contractDuration" value={form.contractDuration} onChange={handleChange} className={inputStyle}>
                    <option>1 jaar vast</option>
                    <option>3 jaar vast</option>
                    <option>Variabel</option>
                </select>
            </div>
            <div>
                <label htmlFor="rateType" className={labelStyle}>{t('compa_offer_form_energy_rate_type')}</label>
                 <select id="rateType" name="rateType" value={form.rateType} onChange={handleChange} className={inputStyle}>
                    <option value="dubbel">Dubbeltarief</option>
                    <option value="enkel">Enkeltarief</option>
                </select>
            </div>
            <div>
                <label htmlFor="powerRateNormal" className={labelStyle}>{t('compa_offer_form_energy_power_normal')}</label>
                <input id="powerRateNormal" name="powerRateNormal" type="number" step="0.01" value={form.powerRateNormal} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="powerRateLow" className={labelStyle}>{t('compa_offer_form_energy_power_low')}</label>
                <input id="powerRateLow" name="powerRateLow" type="number" step="0.01" value={form.powerRateLow} onChange={handleChange} className={inputStyle} disabled={form.rateType === 'enkel'} />
            </div>
            <div>
                <label htmlFor="gasRate" className={labelStyle}>{t('compa_offer_form_energy_gas')}</label>
                <input id="gasRate" name="gasRate" type="number" step="0.01" value={form.gasRate} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
                <label htmlFor="fixedCosts" className={labelStyle}>{t('compa_offer_form_energy_fixed_costs')}</label>
                <input id="fixedCosts" name="fixedCosts" type="number" step="0.01" value={form.fixedCosts} onChange={handleChange} className={inputStyle} />
            </div>
             <div>
                <label htmlFor="welcomeBonus" className={labelStyle}>{t('compa_offer_form_energy_bonus')}</label>
                <input id="welcomeBonus" name="welcomeBonus" type="number" step="1" value={form.welcomeBonus} onChange={handleChange} className={inputStyle} />
            </div>
            <div className="lg:col-span-4">
                <label htmlFor="usps" className={labelStyle}>{t('compa_offer_form_energy_usps')}</label>
                <textarea id="usps" name="usps" value={form.usps} onChange={handleChange} className={`${inputStyle} h-24 resize-none`} />
            </div>
        </div>
    );
};

const ThemeAwareChartColors = () => {
    const { theme } = useTheme();
    return {
        tickColor: theme === 'dark' ? '#adb5bd' : '#868e96',
        gridColor: theme === 'dark' ? '#343a40' : '#e9ecef',
        tooltipBackgroundColor: theme === 'dark' ? '#1E1E1E' : '#ffffff',
        tooltipBorderColor: theme === 'dark' ? '#343a40' : '#e9ecef',
        barColor: theme === 'dark' ? '#587CF8' : '#4C6EF5',
    };
};

const EditableField: React.FC<{ label: string, value: number | null, unit: string, onChange: (value: string) => void }> = ({ label, value, unit, onChange }) => (
    <div className="flex justify-between items-center">
        <strong>{label}:</strong>
        {value === null ? (
            <input
                type="number"
                placeholder="N/A"
                onChange={(e) => onChange(e.target.value)}
                className="w-24 text-right bg-brand-surface border border-brand-border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
        ) : (
            <span>{value} {unit}</span>
        )}
    </div>
);


const TelecomResults: React.FC<{ data: TelecomCompetitorData[], activeTab: 'newCustomerOffer' | 'standardOffer', onDataChange: (index: number, offerType: 'newCustomerOffer' | 'standardOffer', field: keyof TelecomOffer, value: string) => void }> = ({ data, activeTab, onDataChange }) => {
    const { tickColor, gridColor, tooltipBackgroundColor, tooltipBorderColor, barColor } = ThemeAwareChartColors();
    const { t } = useTranslation();

    const chartData = data.map(comp => ({
        companyName: comp.companyName,
        monthlyPrice: comp[activeTab]?.monthlyPrice || 0,
    }));

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div className="h-96">
                <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('monthly_price_comparison')}</h2>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="companyName" stroke={tickColor} />
                        <YAxis stroke={tickColor} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBackgroundColor, border: `1px solid ${tooltipBorderColor}` }} cursor={{ fill: 'rgba(76, 110, 245, 0.1)' }} />
                        <Legend />
                        <Bar dataKey="monthlyPrice" fill={barColor} name="Prijs p/m (€)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('detailed_comparison')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))` }}>
                    {data.map((comp, index) => {
                        const offer = comp[activeTab];
                        if (!offer) return null;
                        return (
                            <div key={index} className="bg-brand-secondary rounded-lg p-4 flex flex-col border border-brand-border">
                                <h3 className="text-xl font-bold text-brand-primary">{comp.companyName}</h3>
                                <p className="text-sm text-brand-text-secondary mt-1 mb-3 flex-grow">{offer.packageName}</p>
                                <div className="border-t border-brand-border pt-3 space-y-2 text-sm">
                                    <EditableField label="Snelheid" value={offer.internetSpeed} unit="Mbps" onChange={(val) => onDataChange(index, activeTab, 'internetSpeed', val)} />
                                    <EditableField label="Setup" value={offer.setupFee} unit="€" onChange={(val) => onDataChange(index, activeTab, 'setupFee', val)} />
                                    <EditableField label="Korting" value={offer.discount} unit="€" onChange={(val) => onDataChange(index, activeTab, 'discount', val)} />
                                </div>
                                <h4 className="font-semibold mt-4 mb-2 border-t border-brand-border pt-3">USPs:</h4>
                                <ul className="list-disc list-inside text-brand-text-secondary space-y-1 text-sm">
                                    {offer.usps.map((usp, i) => <li key={i}>{usp}</li>)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const EnergyResults: React.FC<{ data: EnergyCompetitorData[], activeTab: 'newCustomerOffer' | 'standardOffer', onDataChange: (index: number, offerType: 'newCustomerOffer' | 'standardOffer', field: keyof EnergyOffer, value: string) => void }> = ({ data, activeTab, onDataChange }) => {
    const { tickColor, gridColor, tooltipBackgroundColor, tooltipBorderColor, barColor } = ThemeAwareChartColors();
    const { t } = useTranslation();

    const chartData = data.map(comp => ({
        companyName: comp.companyName,
        powerRateNormal: comp[activeTab]?.powerRateNormal || 0,
    }));

    return (
        <div className="space-y-8 animate-fade-in-fast">
            <div className="h-96">
                <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('power_rate_normal_comparison')}</h2>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="companyName" stroke={tickColor} />
                        <YAxis stroke={tickColor} domain={['dataMin - 0.05', 'dataMax + 0.05']} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBackgroundColor, border: `1px solid ${tooltipBorderColor}` }} cursor={{ fill: 'rgba(76, 110, 245, 0.1)' }} />
                        <Legend />
                        <Bar dataKey="powerRateNormal" fill={barColor} name="Stroom Normaal (€/kWh)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('detailed_comparison')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))` }}>
                    {data.map((comp, index) => {
                        const offer = comp[activeTab];
                        if (!offer) return null;
                        return (
                            <div key={index} className="bg-brand-secondary rounded-lg p-4 flex flex-col border border-brand-border">
                                <h3 className="text-xl font-bold text-brand-primary">{comp.companyName}</h3>
                                <p className="text-sm text-brand-text-secondary mt-1 mb-3 flex-grow">{offer.contractType}</p>
                                <div className="border-t border-brand-border pt-3 space-y-2 text-sm">
                                    <EditableField label="Stroom Normaal" value={offer.powerRateNormal} unit="/kWh" onChange={(val) => onDataChange(index, activeTab, 'powerRateNormal', val)} />
                                    {offer.powerRateLow !== undefined && <EditableField label="Stroom Dal" value={offer.powerRateLow} unit="/kWh" onChange={(val) => onDataChange(index, activeTab, 'powerRateLow', val)} />}
                                    <EditableField label="Gas" value={offer.gasRate} unit="/m³" onChange={(val) => onDataChange(index, activeTab, 'gasRate', val)} />
                                    <EditableField label="Vaste Kosten" value={offer.fixedCostMonthly} unit="/maand" onChange={(val) => onDataChange(index, activeTab, 'fixedCostMonthly', val)} />
                                    <EditableField label="Bonus" value={offer.welcomeBonus} unit="€" onChange={(val) => onDataChange(index, activeTab, 'welcomeBonus', val)} />
                                </div>
                                <h4 className="font-semibold mt-4 mb-2 border-t border-brand-border pt-3">USPs:</h4>
                                <ul className="list-disc list-inside text-brand-text-secondary space-y-1 text-sm">
                                    {offer.usps.map((usp, i) => <li key={i}>{usp}</li>)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


export default CompetitorAnalysis;