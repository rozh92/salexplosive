

import React, { useState } from 'react';
import { Client } from '../types';
import { PlusIcon, TrashIcon, UsersIcon, SparklesIcon, ClipboardDocumentCheckIcon, EnvelopeIcon, UserIcon } from '../components/icons/Icons';
import { analyzeNotes, generatePreCallBriefing, generateClientProfile } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import EmailAssistantModal from '../components/EmailAssistantModal';
import AiResultCard from '../components/AiResultCard';
import { useTranslation } from '../context/TranslationContext';


const Clients: React.FC = () => {
  const { user, clients, addClient, updateClient, deleteClient } = useAuth();
  const { t, language } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<{ id?: string; name: string; company: string; notes: string }>({ name: '', company: '', notes: '' });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefing, setBriefing] = useState('');

  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [clientProfile, setClientProfile] = useState('');

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setAnalysisResult('');
    setBriefing('');
    setClientProfile('');
  };

  const handleOpenModal = (client: Client | null = null) => {
    if (client) {
      setFormState({ id: client.id, name: client.name, company: client.company, notes: client.notes });
      setSelectedClient(client);
    } else {
      setFormState({ name: '', company: '', notes: '' });
      setSelectedClient(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (selectedClient && formState.id) {
            const updatedClient = { ...selectedClient, ...formState };
            await updateClient(updatedClient);
            setSelectedClient(updatedClient);
        } else {
            const newClientData: Omit<Client, 'id'> = {
                name: formState.name,
                company: formState.company,
                notes: formState.notes,
                createdAt: new Date().toISOString(),
            };
            await addClient(newClientData);
        }
        handleCloseModal();
    } catch (error: any) {
        alert(`Fout bij opslaan van klant: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm(t('delete_confirm'))) {
        try {
            await deleteClient(id);
            if (selectedClient?.id === id) {
                setSelectedClient(null);
            }
        } catch (error: any) {
            alert(`Fout bij verwijderen van klant: ${error.message}`);
        }
    }
  };
  
  const handleAnalyzeNotes = async () => {
    if (!selectedClient) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setBriefing('');
    setClientProfile('');
    try {
        const result = await analyzeNotes(selectedClient.notes, language);
        setAnalysisResult(result);
    } catch (error) {
        setAnalysisResult("Fout bij het analyseren van notities.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerateBriefing = async () => {
    if (!selectedClient || !user) return;
    setIsGeneratingBriefing(true);
    setBriefing('');
    setAnalysisResult('');
    setClientProfile('');
    try {
        const result = await generatePreCallBriefing(user, selectedClient, language);
        setBriefing(result);
    } catch (error) {
        setBriefing("Fout bij het genereren van de briefing.");
    } finally {
        setIsGeneratingBriefing(false);
    }
  };

  const handleGenerateProfile = async () => {
    if (!selectedClient) return;
    setIsGeneratingProfile(true);
    setClientProfile('');
    setAnalysisResult('');
    setBriefing('');
    try {
        const result = await generateClientProfile(selectedClient.notes, language);
        setClientProfile(result);
    } catch (error) {
        setClientProfile("Fout bij het genereren van het klantprofiel.");
    } finally {
        setIsGeneratingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{t('clients_title')}</h1>
        <button onClick={() => handleOpenModal()} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
          <PlusIcon className="w-5 h-5 mr-2" />
          {t('new_client')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-brand-surface rounded-xl p-4 shadow-lg h-[calc(100vh-12rem)] flex flex-col">
          <div className="overflow-y-auto">
            {clients.length > 0 ? clients.map(client => (
              <div key={client.id} onClick={() => handleSelectClient(client)} className={`p-4 rounded-lg cursor-pointer mb-2 transition-colors ${selectedClient?.id === client.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary hover:bg-brand-border'}`}>
                <p className="font-semibold">{client.name}</p>
                <p className={`text-sm ${selectedClient?.id === client.id ? 'text-gray-200' : 'text-brand-text-secondary'}`}>{client.company}</p>
              </div>
            )) : (
              <div className="text-center text-brand-text-secondary py-10">
                  <UsersIcon className="mx-auto w-12 h-12 mb-4"/>
                  <p className="font-semibold">{t('clients_empty_list_title')}</p>
                  <p className="text-sm">{t('clients_empty_list_subtitle')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2 bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-12rem)] overflow-y-auto">
          {selectedClient ? (
            <div>
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold">{selectedClient.name}</h2>
                    <p className="text-lg text-brand-text-secondary mb-4">{selectedClient.company}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleOpenModal(selectedClient)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('edit')}</button>
                    <button onClick={() => handleDelete(selectedClient.id)} className="bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors grid place-items-center w-8 h-8"><TrashIcon className="w-5 h-5"/></button>
                  </div>
              </div>
              <h3 className="text-xl font-semibold mt-6 mb-2 border-b border-brand-border pb-2">{t('notes')}</h3>
              <p className="whitespace-pre-wrap text-brand-text-secondary min-h-[5rem] prose max-w-none">{selectedClient.notes || t('no_notes')}</p>
              
              <div className="mt-6 border-t border-brand-border pt-4 space-y-4">
                  <div className="flex flex-wrap gap-4">
                     <button onClick={handleGenerateBriefing} disabled={isGeneratingBriefing || !selectedClient.notes} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isGeneratingBriefing ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('generating_briefing')}</> : <><ClipboardDocumentCheckIcon className="w-5 h-5 mr-2"/>{t('generate_briefing')}</>}
                    </button>
                    <button onClick={handleGenerateProfile} disabled={isGeneratingProfile || !selectedClient.notes} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isGeneratingProfile ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('generating_client_profile')}</> : <><UserIcon className="w-5 h-5 mr-2"/>{t('generate_client_profile')}</>}
                    </button>
                    <button onClick={handleAnalyzeNotes} disabled={isAnalyzing || !selectedClient.notes} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border transition-opacity disabled:opacity-50">
                        {isAnalyzing ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('analyzing_notes')}</> : <><SparklesIcon className="w-5 h-5 mr-2"/>{t('analyze_notes')}</>}
                    </button>
                  </div>

                {briefing && (
                    <AiResultCard title={t('pre_call_briefing')} icon={<ClipboardDocumentCheckIcon />} content={briefing} />
                )}
                 {clientProfile && (
                    <AiResultCard title={t('ai_client_profile')} icon={<UserIcon />} content={clientProfile} />
                )}
                {analysisResult && (
                    <div className="mt-4">
                        <AiResultCard title={t('note_analysis')} icon={<SparklesIcon />} content={analysisResult} />
                        {(user.salesChannel === 'telefonisch' || user.salesChannel === 'beide') && (
                          <div className={`mt-4 pt-4 border-t border-brand-border`}>
                              <button onClick={() => setIsEmailModalOpen(true)} className="bg-green-600/20 text-green-500 font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-green-600 hover:text-white transition-colors">
                                <EnvelopeIcon className="w-5 h-5 mr-2"/>
                                {t('compose_follow_up_email')}
                            </button>
                          </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary text-center">
              <UsersIcon className="w-16 h-16 mb-4"/>
              <p className="font-semibold text-lg">{t('select_client_title')}</p>
              <p>{t('select_client_subtitle')}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in-fast">
          <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md m-4">
            <h2 className="text-2xl font-bold mb-6">{selectedClient ? t('modal_edit_client') : t('modal_add_client')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('form_name')}</label>
                <input type="text" name="name" id="name" value={formState.name} onChange={handleFormChange} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
              </div>
               <div>
                <label htmlFor="company" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('form_company')}</label>
                <input type="text" name="company" id="company" value={formState.company} onChange={handleFormChange} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"/>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('form_notes')}</label>
                <textarea name="notes" id="notes" value={formState.notes} onChange={handleFormChange} rows={5} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none resize-none"></textarea>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('cancel')}</button>
                <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <EmailAssistantModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        analysisResult={analysisResult}
        language={language}
      />
    </div>
  );
};

export default Clients;
