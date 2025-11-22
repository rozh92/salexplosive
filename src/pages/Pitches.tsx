
import React, { useState, useEffect } from 'react';
import { Pitch } from '../types';
import { getPitchSuggestions } from '../services/geminiService';
import { ClipboardListIcon, TrashIcon, SparklesIcon, StarIcon, MapPinIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ShieldExclamationIcon, ChartPieIcon, ClipboardDocumentCheckIcon, PlusIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import AccordionSection from '../components/AccordionSection';
import { useTranslation } from '../context/TranslationContext';
import Markdown from 'react-markdown';


const Pitches: React.FC = () => {
  const { user, pitches, addPitch, updatePitch, deletePitch, promotePitchToKB } = useAuth();
  const { t, language } = useTranslation();
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedName, setEditedName] = useState('');
  
  const [suggestions, setSuggestions] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const [buurtadvies, setBuurtadvies] = useState('');
  const [toonadvies, setToonadvies] = useState('');
  const [pitchContent, setPitchContent] = useState('');
  const [bezwaren, setBezwaren] = useState('');

  const [analysisStructuur, setAnalysisStructuur] = useState('');
  const [analysisWoordkeuze, setAnalysisWoordkeuze] = useState('');
  const [analysisWaarde, setAnalysisWaarde] = useState('');
  const [analysisAfsluiting, setAnalysisAfsluiting] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPitchName, setNewPitchName] = useState('');
  const [newPitchBuurtadvies, setNewPitchBuurtadvies] = useState('');
  const [newPitchToonadvies, setNewPitchToonadvies] = useState('');
  const [newPitchPitch, setNewPitchPitch] = useState('');
  const [newPitchBezwaren, setNewPitchBezwaren] = useState('');


  useEffect(() => {
    if (!selectedPitch && pitches.length > 0) {
      setSelectedPitch(pitches[0]);
    }
    if (selectedPitch && !pitches.find(p => p.id === selectedPitch.id)) {
        setSelectedPitch(pitches.length > 0 ? pitches[0] : null);
    }
  }, [pitches, selectedPitch]);

  const parsePitchContent = (content: string) => {
    const buurtadviesMatch = content.match(/### 1\. Strategisch Buurtadvies\n([\s\S]*?)(?=### 2\.|$)/);
    const toonadviesMatch = content.match(/### 2\. Advies:[\s\S]*?\n([\s\S]*?)(?=### 3\.|$)/);
    const pitchContentMatch = content.match(/### 3\. De Pitch op Maat[\s\S]*?\n([\s\S]*?)(?=### 4\.|$)/);
    const bezwarenMatch = content.match(/### 4\. Meest Waarschijnlijke Bezwaren[\s\S]*?\n([\s\S]*?)(?=$)/);

    return {
      buurtadvies: buurtadviesMatch ? buurtadviesMatch[1].trim() : '',
      toonadvies: toonadviesMatch ? toonadviesMatch[1].trim() : '',
      pitchContent: pitchContentMatch ? pitchContentMatch[1].trim() : '',
      bezwaren: bezwarenMatch ? bezwarenMatch[1].trim() : '',
      isStructured: !!(buurtadviesMatch || toonadviesMatch || pitchContentMatch || bezwarenMatch)
    };
  };


  useEffect(() => {
    if (selectedPitch) {
        const { isStructured, buurtadvies, toonadvies, pitchContent, bezwaren } = parsePitchContent(selectedPitch.content);
        
        if (isStructured) {
            setBuurtadvies(buurtadvies);
            setToonadvies(toonadvies);
            setPitchContent(pitchContent);
            setBezwaren(bezwaren);
        } else {
            // Fallback for unstructured content
            setBuurtadvies('');
            setToonadvies('');
            setPitchContent(selectedPitch.content); // Show everything in the main pitch section
            setBezwaren('');
        }
    }
  }, [selectedPitch]);
  
  useEffect(() => {
    if (suggestions) {
        const structuurMatch = suggestions.match(/### Structuur & Flow\n([\s\S]*?)(?=###|$)/);
        const woordkeuzeMatch = suggestions.match(/### Woordkeuze & Toon\n([\s\S]*?)(?=###|$)/);
        const waardeMatch = suggestions.match(/### Waardepropositie\n([\s\S]*?)(?=###|$)/);
        const afsluitingMatch = suggestions.match(/### Afsluiting \(Call to Action\)\n([\s\S]*?)(?=###|$)/);

        setAnalysisStructuur(structuurMatch ? structuurMatch[1].trim() : 'Niet gevonden');
        setAnalysisWoordkeuze(woordkeuzeMatch ? woordkeuzeMatch[1].trim() : 'Niet gevonden');
        setAnalysisWaarde(waardeMatch ? waardeMatch[1].trim() : 'Niet gevonden');
        setAnalysisAfsluiting(afsluitingMatch ? afsluitingMatch[1].trim() : 'Niet gevonden');
    }
  }, [suggestions]);


  const handleSelectPitch = (pitch: Pitch) => {
    setSelectedPitch(pitch);
    setIsEditing(false);
    setSuggestions('');
  };
  
  const handleEdit = () => {
    if (!selectedPitch) return;
    setEditedContent(selectedPitch.content);
    setEditedName(selectedPitch.name);
    setIsEditing(true);
  };
  
  const handleSaveEdit = async () => {
    if (!selectedPitch) return;
    try {
        const updatedPitchData = { ...selectedPitch, content: editedContent, name: editedName };
        await updatePitch(updatedPitchData);
        setSelectedPitch(updatedPitchData);
        setIsEditing(false);
    } catch (error: any) {
        alert(`Fout bij opslaan van wijzigingen: ${error.message}`);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm(t('delete_confirm_pitch'))) {
        try {
            await deletePitch(id);
        } catch (error: any) {
            alert(`Fout bij verwijderen van pitch: ${error.message}`);
        }
    }
  };

  const handleGetSuggestions = async () => {
    if (!selectedPitch) return;
    setIsLoadingSuggestions(true);
    setSuggestions('');
    try {
        const result = await getPitchSuggestions(selectedPitch.content, language);
        setSuggestions(result);
    } catch (error) {
        setSuggestions('Kon geen suggesties ophalen.');
    } finally {
        setIsLoadingSuggestions(false);
    }
  };
  
  const handlePromote = async () => {
    if (!selectedPitch || !user) return;
    const note = prompt(t('promote_note_prompt'));
    if (note) {
        try {
            await promotePitchToKB(selectedPitch, note);
            alert('Pitch gepromoot naar de Team Kennisbank!');
        } catch (error: any) {
            alert(`Fout bij promoten van pitch: ${error.message}`);
        }
    }
  };

  const handleAddNewPitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPitchName || !newPitchPitch) {
      alert("Naam en 'De Pitch op Maat' zijn verplicht.");
      return;
    };
    
    const formattedContent = `### 1. Strategisch Buurtadvies\n${newPitchBuurtadvies}\n\n### 2. Advies: Toon & Stijl\n${newPitchToonadvies}\n\n### 3. De Pitch op Maat\n${newPitchPitch}\n\n### 4. Meest Waarschijnlijke Bezwaren\n${newPitchBezwaren}`;

    try {
        await addPitch({
            name: newPitchName,
            content: formattedContent,
            createdAt: new Date().toISOString(),
        });
        setIsAddModalOpen(false);
        setNewPitchName('');
        setNewPitchBuurtadvies('');
        setNewPitchToonadvies('');
        setNewPitchPitch('');
        setNewPitchBezwaren('');
    } catch (error: any) {
        alert(`Fout bij toevoegen: ${error.message}`);
    }
  };


  return (
    <>
    <div className="animate-fade-in">
       <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{t('pitches_title')}</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('pitches_add_new')}
            </button>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-brand-surface rounded-xl p-4 shadow-lg h-[calc(100vh-12rem)] flex flex-col">
           <div className="overflow-y-auto">
              {pitches.length > 0 ? pitches.map(pitch => (
                <div key={pitch.id} onClick={() => handleSelectPitch(pitch)} className={`p-4 rounded-lg cursor-pointer mb-2 transition-colors ${selectedPitch?.id === pitch.id ? 'bg-brand-primary text-white shadow-md' : 'bg-brand-secondary hover:bg-brand-border'}`}>
                  <div className="flex items-start space-x-3">
                    <ClipboardListIcon className={`w-5 h-5 mt-1 flex-shrink-0 ${selectedPitch?.id === pitch.id ? 'text-white/80' : 'text-brand-text-secondary'}`} />
                    <div>
                      <p className="font-semibold ">{pitch.name}</p>
                      <p className={`text-sm ${selectedPitch?.id === pitch.id ? 'text-white/80' : 'text-brand-text-secondary'}`}>{new Date(pitch.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-brand-text-secondary py-10">
                    <ClipboardListIcon className="mx-auto w-12 h-12 mb-4"/>
                    <p className="font-semibold">{t('pitches_empty_list_title')}</p>
                    <p className="text-sm">{t('pitches_empty_list_subtitle')}</p>
                </div>
              )}
           </div>
        </div>

        <div className="md:col-span-2 bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-12rem)] overflow-y-auto">
          {selectedPitch ? (
            <div>
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-brand-border">
                  <div>
                    {isEditing ? (
                        <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="text-3xl font-bold bg-brand-secondary rounded-lg p-2 -ml-2 w-full" />
                    ) : (
                        <h2 className="text-3xl font-bold">{selectedPitch.name}</h2>
                    )}
                    <p className="text-brand-text-secondary text-sm">{t('saved_on')} {new Date(selectedPitch.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 ml-4">
                    {isEditing ? (
                      <>
                        <button onClick={handleSaveEdit} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">{t('save')}</button>
                        <button onClick={() => setIsEditing(false)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('cancel')}</button>
                      </>
                    ) : (
                      <>
                        <button onClick={handleEdit} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('edit')}</button>
                        <button onClick={() => handleDelete(selectedPitch.id)} className="bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors grid place-items-center w-8 h-8"><TrashIcon className="w-5 h-5"/></button>
                      </>
                    )}
                  </div>
              </div>
              
              {isEditing ? (
                  <textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-[60vh] bg-brand-secondary border border-brand-border rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:outline-none resize-y"
                  />
                ) : (
                  <div className="space-y-4">
                     {(buurtadvies || toonadvies || bezwaren) ? (
                        <>
                            <AccordionSection title={t('strat_buurtadvies')} icon={<MapPinIcon />} defaultOpen={true}>
                                {buurtadvies}
                            </AccordionSection>
                            <AccordionSection title={t('strat_toonadvies')} icon={<ChatBubbleLeftRightIcon />}>
                                {toonadvies}
                            </AccordionSection>
                            <AccordionSection title={t('strat_pitch')} icon={<DocumentTextIcon />}>
                                {pitchContent}
                            </AccordionSection>
                            <AccordionSection title={t('strat_bezwaren')} icon={<ShieldExclamationIcon />}>
                                {bezwaren}
                            </AccordionSection>
                        </>
                     ) : (
                        <div className="prose max-w-none">
                            <Markdown>{selectedPitch.content}</Markdown>
                        </div>
                     )}
                  </div>
                )}

              {!isEditing && (
                <div className="mt-8 border-t border-brand-border pt-6 space-y-4">
                    <h3 className="text-xl font-semibold text-brand-text-primary">{t('ai_pitch_analysis')}</h3>
                    <div className="flex flex-wrap gap-4">
                      {(user?.role === 'manager' || user?.role === 'team-leader' || user?.role === 'leader') && (
                             <button onClick={handlePromote} className="bg-yellow-400/20 text-yellow-500 font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-400 hover:text-white transition-colors">
                                <StarIcon className="w-5 h-5 mr-2" />
                                {t('promote_to_kb')}
                            </button>
                        )}
                      <button onClick={handleGetSuggestions} disabled={isLoadingSuggestions} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity disabled:opacity-50">
                          {isLoadingSuggestions ? (
                              <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t('analyzing')}...
                              </>
                          ) : (
                              <>
                                  <SparklesIcon className="w-5 h-5 mr-2"/>
                                  {t('analyze_with_ai')}
                              </>
                          )}
                      </button>
                    </div>

                    {suggestions && (
                        <div className="mt-4 space-y-3">
                            <AccordionSection title={t('analysis_structure')} icon={<ChartPieIcon />} defaultOpen={true}>
                                {analysisStructuur}
                            </AccordionSection>
                            <AccordionSection title={t('analysis_wording')} icon={<ChatBubbleLeftRightIcon />}>
                                {analysisWoordkeuze}
                            </AccordionSection>
                            <AccordionSection title={t('analysis_value_prop')} icon={<StarIcon />}>
                                {analysisWaarde}
                            </AccordionSection>
                            <AccordionSection title={t('analysis_cta')} icon={<ClipboardDocumentCheckIcon />}>
                                {analysisAfsluiting}
                            </AccordionSection>
                        </div>
                    )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary text-center">
              <ClipboardListIcon className="w-16 h-16 mb-4"/>
              <p className="font-semibold text-lg">{t('select_pitch_title')}</p>
              <p>{t('select_pitch_subtitle')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{t('modal_add_pitch_title')}</h2>
                <form onSubmit={handleAddNewPitch} className="space-y-4">
                    <div>
                        <label htmlFor="newPitchName" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('pitch_name_label')}</label>
                        <input type="text" id="newPitchName" value={newPitchName} onChange={e => setNewPitchName(e.target.value)} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2"/>
                    </div>
                    <div>
                        <label htmlFor="newPitchBuurtadvies" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('modal_pitch_buurtadvies_label')}</label>
                        <textarea id="newPitchBuurtadvies" value={newPitchBuurtadvies} onChange={e => setNewPitchBuurtadvies(e.target.value)} rows={3} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 resize-y"/>
                    </div>
                     <div>
                        <label htmlFor="newPitchToonadvies" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('modal_pitch_toonadvies_label')}</label>
                        <textarea id="newPitchToonadvies" value={newPitchToonadvies} onChange={e => setNewPitchToonadvies(e.target.value)} rows={3} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 resize-y"/>
                    </div>
                     <div>
                        <label htmlFor="newPitchPitch" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('modal_pitch_pitch_label')}</label>
                        <textarea id="newPitchPitch" value={newPitchPitch} onChange={e => setNewPitchPitch(e.target.value)} required rows={5} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 resize-y"/>
                    </div>
                     <div>
                        <label htmlFor="newPitchBezwaren" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('modal_pitch_bezwaren_label')}</label>
                        <textarea id="newPitchBezwaren" value={newPitchBezwaren} onChange={e => setNewPitchBezwaren(e.target.value)} rows={3} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 resize-y"/>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">{t('add_pitch_button')}</button>
                    </div>
                </form>
            </div>
        </div>
    )}
    </>
  );
};

export default Pitches;
