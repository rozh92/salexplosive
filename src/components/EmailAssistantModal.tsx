
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateFollowUpEmail } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';
import Markdown from 'react-markdown';
import { useTranslation } from '../context/TranslationContext';

interface EmailAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: string;
  language: string;
}

type EmailGoal = 'afspraak bevestigen' | 'offerte nasturen' | 'bedanken voor gesprek';

const EmailAssistantModal: React.FC<EmailAssistantModalProps> = ({ isOpen, onClose, analysisResult, language }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [goal, setGoal] = useState<EmailGoal | ''>('');
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleGenerateEmail = async () => {
    if (!user || !goal || !analysisResult) return;
    setIsLoading(true);
    setEmailContent('');
    try {
      const content = await generateFollowUpEmail(user, analysisResult, goal, language);
      setEmailContent(content);
    } catch (error) {
      setEmailContent("Kon geen e-mail genereren.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(emailContent);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  if (!isOpen) return null;
  
  const buttonBase = "w-full text-center py-2 px-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface text-sm";
  const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
  const buttonInactive = "bg-brand-secondary text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-brand-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center"><SparklesIcon className="w-6 h-6 mr-3 text-brand-primary"/> {t('email_assistant_title')}</h2>
          <button onClick={onClose} className="text-2xl font-light text-brand-text-secondary hover:text-brand-text-primary">&times;</button>
        </div>

        <div className="flex-grow p-6 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('step1_email_goal')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => setGoal('afspraak bevestigen')} className={`${buttonBase} ${goal === 'afspraak bevestigen' ? buttonActive : buttonInactive}`}>{t('goal_confirm_appointment')}</button>
              <button onClick={() => setGoal('offerte nasturen')} className={`${buttonBase} ${goal === 'offerte nasturen' ? buttonActive : buttonInactive}`}>{t('goal_send_quote')}</button>
              <button onClick={() => setGoal('bedanken voor gesprek')} className={`${buttonBase} ${goal === 'bedanken voor gesprek' ? buttonActive : buttonInactive}`}>{t('goal_thank_for_meeting')}</button>
            </div>
          </div>
          
          {goal && (
             <div className="mb-6 animate-fade-in">
                 <button onClick={handleGenerateEmail} disabled={isLoading} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('generating_email')}
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {t('step2_generate_email')}
                        </>
                    )}
                 </button>
             </div>
          )}

          {emailContent && (
             <div className="animate-fade-in">
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('step3_result')}</label>
                <div className="bg-brand-secondary border border-brand-border rounded-lg p-4 h-96 overflow-y-auto whitespace-pre-wrap prose prose-invert max-w-none text-brand-text-primary prose-p:my-2">
                   <Markdown>{emailContent}</Markdown>
                </div>
             </div>
          )}
        </div>

        {emailContent && !isLoading && (
            <div className="p-4 border-t border-brand-border flex-shrink-0">
                <button onClick={handleCopyToClipboard} className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    {hasCopied ? t('copied') : t('copy_to_clipboard')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default EmailAssistantModal;
