import React, { useState, useEffect } from 'react';
import { generatePitch, startAdviceChat } from '../services/geminiService';
import { SparklesIcon, BookmarkIcon, MapPinIcon, ChatBubbleLeftRightIcon, ShieldExclamationIcon, DocumentTextIcon, ChatBubbleLeftEllipsisIcon, BoltIcon, WifiIcon, BriefcaseIcon } from '../components/icons/Icons';
import { Pitch } from '../types';
import AdviceChatModal from '../components/AdviceChatModal';
import { Chat } from '@google/genai';
import { useAuth } from '../context/AuthContext';
import AccordionSection from '../components/AccordionSection';
import { useTranslation } from '../context/TranslationContext';
import { getCompanyList } from '../constants';


const PitchGenerator: React.FC = () => {
  const { user, addPitch } = useAuth();
  const { t, language } = useTranslation();
  const [pitchLength, setPitchLength] = useState<'normaal' | 'kort' | ''>('');
  const [selectedChannel, setSelectedChannel] = useState<'deur-aan-deur' | 'telefonisch' | ''>('');
  const [selectedIndustry, setSelectedIndustry] = useState<'telecom' | 'energy' | ''>('');
  const [pitchingForCompany, setPitchingForCompany] = useState('');
  const [personality, setPersonality] = useState('');
  const [area, setArea] = useState('');
  
  const [fullPitch, setFullPitch] = useState('');
  const [buurtadvies, setBuurtadvies] = useState('');
  const [toonadvies, setToonadvies] = useState('');
  const [pitchContent, setPitchContent] = useState('');
  const [bezwaren, setBezwaren] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const companyList = selectedIndustry ? getCompanyList(selectedIndustry, user?.lang) : [];

  useEffect(() => {
    if (user) {
      if (user.salesChannel !== 'beide') {
        setSelectedChannel(user.salesChannel);
      } else {
        setSelectedChannel('');
      }
      if (user.industry !== 'beide') {
        setSelectedIndustry(user.industry);
      } else {
        setSelectedIndustry('');
      }
    }
  }, [user]);
  
  useEffect(() => {
    // Reset the selected company when the industry changes
    setPitchingForCompany('');
  }, [selectedIndustry]);

  useEffect(() => {
    if (fullPitch) {
        const buurtadviesMatch = fullPitch.match(/### 1\. Strategisch Buurtadvies\n([\s\S]*?)(?=### 2\.|$)/);
        const toonadviesMatch = fullPitch.match(/### 2\. Advies:[\s\S]*?\n([\s\S]*?)(?=### 3\.|$)/);
        const pitchContentMatch = fullPitch.match(/### 3\. De Pitch op Maat[\s\S]*?\n([\s\S]*?)(?=### 4\.|$)/);
        const bezwarenMatch = fullPitch.match(/### 4\. Meest Waarschijnlijke Bezwaren[\s\S]*?\n([\s\S]*?)(?=$)/);

        setBuurtadvies(buurtadviesMatch ? buurtadviesMatch[1].trim() : 'Analyse niet beschikbaar.');
        setToonadvies(toonadviesMatch ? toonadviesMatch[1].trim() : 'Analyse niet beschikbaar.');
        setPitchContent(pitchContentMatch ? pitchContentMatch[1].trim() : 'Pitch niet beschikbaar.');
        setBezwaren(bezwarenMatch ? bezwarenMatch[1].trim() : 'Analyse niet beschikbaar.');
    }
  }, [fullPitch]);

  const handleGeneratePitch = async () => {
    if (!user || !pitchLength || !selectedChannel || !selectedIndustry || !pitchingForCompany || !personality || !area) {
      alert('Vul alstublieft alle velden in.');
      return;
    }
    setIsLoading(true);
    setHasGenerated(true);
    setFullPitch('');
    setBuurtadvies('');
    setToonadvies('');
    setPitchContent('');
    setBezwaren('');
    try {
      const result = await generatePitch(user, selectedChannel, pitchLength, personality, area, pitchingForCompany, undefined, language, selectedIndustry);
      setFullPitch(result);
    } catch (error) {
      console.error(error);
      setFullPitch('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateWithContext = async (context: string) => {
    if (!user || !pitchLength || !selectedChannel || !selectedIndustry || !pitchingForCompany || !personality || !area) {
        alert('Er is een fout opgetreden. De originele parameters zijn niet beschikbaar.');
        return;
    }

    setIsLoading(true);
    setHasGenerated(true);
    setFullPitch('');
    setBuurtadvies('');
    setToonadvies('');
    setPitchContent('');
    setBezwaren('');
    
    try {
        const result = await generatePitch(user, selectedChannel, pitchLength, personality, area, pitchingForCompany, context, language, selectedIndustry);
        setFullPitch(result);
    } catch (error) {
        console.error(error);
        setFullPitch('Er is iets misgegaan bij het hergenereren van de pitch.');
    } finally {
        setIsLoading(false);
    }
  };

  const openChat = () => {
    if (!user) return;
    const session = startAdviceChat(user, language);
    setChatSession(session);
    setIsChatModalOpen(true);
  };

  const handleSavePitch = async () => {
    const name = prompt("Geef deze strategie een naam:");
    if (!name || name.trim() === "" || !fullPitch) return;
  
    try {
      const newPitchData: Omit<Pitch, 'id'> = {
        name: name.trim(),
        content: fullPitch,
        createdAt: new Date().toISOString(),
      };
      
      await addPitch(newPitchData);
  
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
  
    } catch (error: any) {
      console.error("Save Pitch Error:", error);
      alert(`Fout bij opslaan: ${error.message}`);
    }
  };


  const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
  const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";
  const buttonBase = "w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface flex items-center justify-center";
  const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
  const buttonInactive = "bg-brand-secondary text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";

  if (!user) return null;

  let stepCounter = 1;
  const showChannelStep = user.salesChannel === 'beide';
  const showIndustryStep = user.industry === 'beide';

  return (
    <>
      <div className="animate-fade-in">
        <h1 className="text-4xl font-bold mb-2 text-brand-text-primary">{t('pitch_generator_title')}</h1>
        <p className="text-lg text-brand-text-secondary mb-8">{t('pitch_generator_subtitle')}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-brand-surface rounded-xl p-6 shadow-lg space-y-6">
            
            <div className="space-y-4 bg-brand-secondary p-4 rounded-lg border border-brand-border">
                <h2 className="text-lg font-semibold">{t('your_profile')}</h2>
                <div className="text-sm space-y-1 text-brand-text-secondary">
                    <p><strong>{t('sales_channel')}:</strong> <span className="capitalize">{user.salesChannel}</span></p>
                    <p><strong>{t('industry')}:</strong> <span className="capitalize">{user.industry}</span></p>
                    <p><strong>{t('company')}:</strong> {user.company}</p>
                </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t('step_choose_pitch_type', { step_number: stepCounter++ })}</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPitchLength('normaal')} className={`${buttonBase} ${pitchLength === 'normaal' ? buttonActive : buttonInactive}`}>{t('pitch_type_normal')}</button>
                <button onClick={() => setPitchLength('kort')} className={`${buttonBase} ${pitchLength === 'kort' ? buttonActive : buttonInactive}`}>{t('pitch_type_short')}</button>
              </div>
            </div>

            {pitchLength && showChannelStep && (
                <div className="space-y-2 border-t border-brand-border pt-6 animate-fade-in">
                    <h2 className="text-lg font-semibold">{t('step_choose_sales_channel', { step_number: stepCounter++ })}</h2>
                    <p className="text-sm text-brand-text-secondary">{t('channel_info')}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setSelectedChannel('deur-aan-deur')} className={`${buttonBase} ${selectedChannel === 'deur-aan-deur' ? buttonActive : buttonInactive}`}>{t('channel_doortodoor')}</button>
                        <button onClick={() => setSelectedChannel('telefonisch')} className={`${buttonBase} ${selectedChannel === 'telefonisch' ? buttonActive : buttonInactive}`}>{t('channel_telemarketing')}</button>
                    </div>
                </div>
            )}
            
            {pitchLength && (selectedChannel || !showChannelStep) && showIndustryStep && (
                <div className="space-y-2 border-t border-brand-border pt-6 animate-fade-in">
                    <h2 className="text-lg font-semibold">{t('step_choose_industry', { step_number: stepCounter++ })}</h2>
                    <p className="text-sm text-brand-text-secondary">{t('industry_info')}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setSelectedIndustry('telecom')} className={`${buttonBase} ${selectedIndustry === 'telecom' ? buttonActive : buttonInactive}`}>
                            <WifiIcon className="w-5 h-5 mr-2" />
                            {t('industry_telecom')}
                        </button>
                        <button onClick={() => setSelectedIndustry('energy')} className={`${buttonBase} ${selectedIndustry === 'energy' ? buttonActive : buttonInactive}`}>
                            <BoltIcon className="w-5 h-5 mr-2" />
                            {t('industry_energy')}
                        </button>
                    </div>
                </div>
            )}

            {pitchLength && (selectedChannel || !showChannelStep) && (selectedIndustry || !showIndustryStep) && (
                <div className="space-y-2 border-t border-brand-border pt-6 animate-fade-in">
                    <h2 className="text-lg font-semibold flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2"/> {t('step_choose_pitching_for', { step_number: stepCounter++ })}</h2>
                    <div>
                        <label htmlFor="pitchingForCompany" className={labelStyle}>{t('pitching_for_company_label')}</label>
                        <select
                            id="pitchingForCompany"
                            value={pitchingForCompany}
                            onChange={(e) => setPitchingForCompany(e.target.value)}
                            required
                            className={inputStyle}
                        >
                            <option value="" disabled>{t('select_company')}</option>
                            {companyList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            )}
            
            {pitchLength && (selectedChannel || !showChannelStep) && (selectedIndustry || !showIndustryStep) && pitchingForCompany && (
              <div className="space-y-6 border-t border-brand-border pt-6 animate-fade-in">
                  <h2 className="text-lg font-semibold">{t('step_details_title', { step_number: stepCounter })}</h2>
                  <div>
                    <label htmlFor="personality" className={labelStyle}>{t('style_personality_label')}</label>
                    <input id="personality" type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={t('style_personality_placeholder')} className={inputStyle} />
                  </div>

                  <div>
                    <label htmlFor="area" className={labelStyle}>{t('area_label')}</label>
                    <input id="area" type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder={t('area_placeholder')} className={inputStyle} />
                  </div>
              </div>
            )}

            <button
              onClick={handleGeneratePitch}
              disabled={isLoading || !area || !personality || !pitchLength || !selectedChannel || !selectedIndustry || !pitchingForCompany}
              className="w-full bg-brand-primary text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('generating_strategy')}
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {t('generate_strategy')}
                </>
              )}
            </button>
          </div>

          <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex flex-col">
            <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('your_strategy_and_pitch')}</h2>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
              {!hasGenerated ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-brand-text-secondary p-8 border-2 border-dashed border-brand-border rounded-lg">
                    <SparklesIcon className="w-12 h-12 mb-4" />
                    <p className="font-semibold">{t('strategy_placeholder_title')}</p>
                    <p className="text-sm">{t('strategy_placeholder_subtitle')}</p>
                </div>
              ) : (
                  <div className="space-y-3">
                      <AccordionSection title={t('strat_buurtadvies')} icon={<MapPinIcon />} defaultOpen={true}>
                          {isLoading ? t('generating') : buurtadvies}
                      </AccordionSection>
                      <AccordionSection title={t('strat_toonadvies')} icon={<ChatBubbleLeftRightIcon />}>
                          {isLoading ? t('generating') : toonadvies}
                      </AccordionSection>
                      <AccordionSection title={t('strat_pitch')} icon={<DocumentTextIcon />}>
                          {isLoading ? t('generating') : pitchContent}
                      </AccordionSection>
                      <AccordionSection title={t('strat_bezwaren')} icon={<ShieldExclamationIcon />}>
                           {isLoading ? t('generating') : bezwaren}
                      </AccordionSection>
                  </div>
              )}
            </div>
            <div className="mt-6 border-t border-brand-border pt-4">
              {fullPitch && !isLoading && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                          onClick={openChat}
                          className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-2 px-6 rounded-lg flex items-center justify-center hover:opacity-90 transition-colors order-1 sm:order-1"
                      >
                          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2" />
                          {t('ask_ai_coach')}
                      </button>

                      <div className="w-full sm:w-auto order-2 sm:order-2">
                      {justSaved ? (
                          <p className="text-center text-green-500 font-semibold animate-fade-in py-2 px-6">{t('saved')}</p>
                      ) : (
                          <button
                          onClick={handleSavePitch}
                          className="w-full bg-brand-secondary text-brand-text-primary font-semibold py-2 px-6 rounded-lg flex items-center justify-center hover:bg-brand-border transition-colors"
                          >
                          <BookmarkIcon className="w-5 h-5 mr-2" />
                          {t('save_strategy')}
                          </button>
                      )}
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AdviceChatModal 
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          chatSession={chatSession}
          onRegenerate={handleRegenerateWithContext}
      />
    </>
  );
};

export default PitchGenerator;
