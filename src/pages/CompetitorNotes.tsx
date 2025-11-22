import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { CompetitorNote } from '../types';
import { PlusIcon, TrashIcon, ClipboardDocumentCheckIcon, BookOpenIcon } from '../components/icons/Icons';
import { getCompanyList } from '../constants';
import { auth } from '../firebase/config';
import { useTranslation } from '../context/TranslationContext';

const CompetitorNotes: React.FC = () => {
    const { user, competitorNotes, addCompetitorNote, updateCompetitorNote, deleteCompetitorNote, addContentToKB } = useAuth();
    const { t } = useTranslation();
    const [selectedNote, setSelectedNote] = useState<CompetitorNote | null>(null);
    const [formState, setFormState] = useState<Partial<CompetitorNote>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState<'telecom' | 'energy' | ''>(
        user?.industry === 'beide' ? '' : user?.industry || ''
    );
    const [isSharingToKB, setIsSharingToKB] = useState(false);
    const [kbShareSuccess, setKbShareSuccess] = useState(false);


    const emptyFormState: Partial<CompetitorNote> = {
        competitor: '',
        notes: '',
        usps: '',
        telecom_packageType: undefined,
        telecom_internetSpeed: '',
        telecom_monthlyPrice: '',
        telecom_tvDetails: '',
        telecom_phoneDetails: '',
        energy_powerRate: '',
        energy_powerRateLow: '',
        energy_gasRate: '',
        energy_contractDuration: undefined,
        energy_rateType: undefined,
    };

    const filteredNotes = useMemo(() => {
        if (!user) return [];

        const isPrivileged = user.role === 'manager' || user.role === 'owner';
        if (isPrivileged || user.industry === 'beide') {
            return competitorNotes;
        }

        return competitorNotes.filter(note => note.industry === user.industry);
    }, [competitorNotes, user]);


    useEffect(() => {
        if (selectedNote) {
            setFormState(selectedNote);
            if (user?.industry === 'beide' && selectedNote.industry !== 'beide') {
                 setSelectedIndustry(selectedNote.industry);
            }
        } else {
            setFormState(emptyFormState);
            if (user?.industry !== 'beide') {
                setSelectedIndustry(user.industry);
            } else {
                setSelectedIndustry('');
            }
        }
    }, [selectedNote, user?.industry]);

    if (!user) return null;
    
    const isLeadership = user && ['manager', 'team-leader', 'leader'].includes(user.role);

    const competitorsList = selectedIndustry ? getCompanyList(selectedIndustry, user.lang) : [];

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSelectNote = (note: CompetitorNote) => {
        setSelectedNote(note);
        setIsSharingToKB(false);
        setKbShareSuccess(false);
    };

    const handleNewNote = () => {
        setSelectedNote(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formState.competitor || !selectedIndustry) {
            setError(t('error_select_competitor'));
            setIsLoading(false);
            return;
        }

        try {
            if (selectedNote) {
                const updatedData = { ...formState, industry: selectedIndustry } as CompetitorNote;
                await updateCompetitorNote(updatedData);
            } else {
                const noteData: Omit<CompetitorNote, 'id' | 'authorId' | 'authorName' | 'createdAt'> = {
                    ...emptyFormState,
                    ...formState,
                    competitor: formState.competitor,
                    industry: selectedIndustry as 'telecom' | 'energy',
                } as Omit<CompetitorNote, 'id' | 'authorId' | 'authorName' | 'createdAt'>;
                await addCompetitorNote(noteData);
            }
            handleNewNote();
        } catch (err: any) {
            setError(err.message || 'Er is een fout opgetreden.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (noteId: string) => {
        if (window.confirm(t('delete_note_confirm'))) {
            try {
                await deleteCompetitorNote(noteId);
                if (selectedNote?.id === noteId) {
                    handleNewNote();
                }
            } catch(err: any) {
                alert(err.message);
            }
        }
    };
    
    const handleShareToKB = async () => {
        if (!selectedNote || !user) return;
    
        const title = prompt(t('kb_note_title_prompt'));
        if (!title) return;
    
        setIsSharingToKB(true);
        setKbShareSuccess(false);
    
        try {
            let content = `
# ${t('kb_note_title')}: ${selectedNote.competitor}

**${t('industry')}:** ${selectedNote.industry}
**${t('author')}:** ${selectedNote.authorName}
**${t('date')}:** ${new Date(selectedNote.createdAt).toLocaleDateString()}

---

## ${t('usps')}
${selectedNote.usps || t('none')}

## ${t('general_notes')}
${selectedNote.notes || t('none')}

---
`;
    
            if (selectedNote.industry === 'telecom') {
                content += `
## ${t('telecom_details')}
- **${t('package_type')}:** ${selectedNote.telecom_packageType || '-'}
- **${t('monthly_price_eur')}:** ${selectedNote.telecom_monthlyPrice || '-'}
- **${t('internet_speed_mbps')}:** ${selectedNote.telecom_internetSpeed || '-'}
- **${t('tv_details')}:** ${selectedNote.telecom_tvDetails || '-'}
- **${t('phone_details')}:** ${selectedNote.telecom_phoneDetails || '-'}
`;
            }
    
            if (selectedNote.industry === 'energy') {
                content += `
## ${t('energy_details')}
- **${t('contract_duration')}:** ${selectedNote.energy_contractDuration || '-'}
- **${t('rate_type')}:** ${selectedNote.energy_rateType || '-'}
- **${t('power_rate')}:** ${selectedNote.energy_powerRate || '-'}
- **${t('power_rate_offpeak')}:** ${selectedNote.energy_powerRateLow || '-'}
- **${t('gas_rate')}:** ${selectedNote.energy_gasRate || '-'}
`;
            }
            
            await addContentToKB({
                title: `${t('kb_note_title')} - ${title}`,
                content: content,
                note: `${t('kb_note_note_prefix')} ${selectedNote.competitor}`,
            });
    
            setKbShareSuccess(true);
            setTimeout(() => setKbShareSuccess(false), 3000);
    
        } catch (e) {
            console.error(e);
            alert(t('kb_save_error'));
        } finally {
            setIsSharingToKB(false);
        }
    };
    
    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";
    
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold">{t('compa_notes_title')}</h1>
                    <p className="text-lg text-brand-text-secondary mt-1">{t('compa_notes_subtitle')}</p>
                </div>
                <button onClick={handleNewNote} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity flex-shrink-0">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('new_note')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-brand-surface rounded-xl p-4 shadow-lg h-[calc(100vh-12rem)] flex flex-col">
                    <div className="overflow-y-auto">
                      {filteredNotes.length > 0 ? filteredNotes.map(note => (
                          <div key={note.id} onClick={() => handleSelectNote(note)} className={`p-4 rounded-lg cursor-pointer mb-2 transition-colors ${selectedNote?.id === note.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary hover:bg-brand-border'}`}>
                              <p className="font-semibold">{note.competitor}</p>
                              <p className={`text-xs ${selectedNote?.id === note.id ? 'text-gray-200' : 'text-brand-text-secondary'}`}>
                                {t('note_by', { authorName: note.authorName, date: new Date(note.createdAt).toLocaleDateString()})}
                              </p>
                          </div>
                      )) : (
                          <div className="text-center text-brand-text-secondary py-10">
                              <ClipboardDocumentCheckIcon className="w-12 h-12 mx-auto mb-4" />
                              <p className="font-semibold">{t('no_notes_yet')}</p>
                          </div>
                      )}
                    </div>
                </div>

                <div className="md:col-span-2 bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-12rem)] overflow-y-auto">
                    <h2 className="text-2xl font-bold mb-6">{selectedNote ? t('modal_edit_note') : t('modal_new_note')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {user.industry === 'beide' && (
                            <div>
                                <label htmlFor="industrySelection" className={labelStyle}>{t('select_industry')}</label>
                                <select
                                    id="industrySelection"
                                    name="industrySelection"
                                    value={selectedIndustry}
                                    onChange={(e) => {
                                        setSelectedIndustry(e.target.value as 'telecom' | 'energy');
                                        setFormState(prev => ({ ...prev, competitor: '' }));
                                    }}
                                    required
                                    className={inputStyle}
                                >
                                    <option value="" disabled>{t('select_industry')}</option>
                                    <option value="telecom">{t('industry_telecom')}</option>
                                    <option value="energy">{t('industry_energy')}</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="competitor" className={labelStyle}>{t('competitor')}</label>
                            <select id="competitor" name="competitor" value={formState.competitor || ''} onChange={handleFormChange} required className={inputStyle} disabled={!selectedIndustry}>
                                <option value="" disabled>{t('select_competitor')}</option>
                                {competitorsList.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {selectedIndustry === 'telecom' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="telecom_packageType" className={labelStyle}>{t('package_type')}</label>
                                        <select id="telecom_packageType" name="telecom_packageType" value={formState.telecom_packageType || ''} onChange={handleFormChange} className={inputStyle}>
                                            <option value="" disabled>{t('select_package')}</option>
                                            <option value="internet">{t('package_internet_only')}</option>
                                            <option value="tv">{t('package_tv_only')}</option>
                                            <option value="telefonie">{t('package_phone_only')}</option>
                                            <option value="internet_tv">{t('package_internet_tv')}</option>
                                            <option value="internet_telefonie">{t('package_internet_phone')}</option>
                                            <option value="alles_in_1">{t('package_all_in_1')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="telecom_monthlyPrice" className={labelStyle}>{t('monthly_price_eur')}</label>
                                        <input type="text" name="telecom_monthlyPrice" id="telecom_monthlyPrice" value={formState.telecom_monthlyPrice || ''} onChange={handleFormChange} className={inputStyle} />
                                    </div>
                                </div>
                                { (formState.telecom_packageType?.includes('internet')) &&
                                <div>
                                    <label htmlFor="telecom_internetSpeed" className={labelStyle}>{t('internet_speed_mbps')}</label>
                                    <input type="text" name="telecom_internetSpeed" id="telecom_internetSpeed" value={formState.telecom_internetSpeed || ''} onChange={handleFormChange} className={inputStyle} />
                                </div> }
                                { (formState.telecom_packageType?.includes('tv')) &&
                                <div>
                                    <label htmlFor="telecom_tvDetails" className={labelStyle}>{t('tv_details')}</label>
                                    <input type="text" name="telecom_tvDetails" id="telecom_tvDetails" placeholder={t('tv_details_placeholder')} value={formState.telecom_tvDetails || ''} onChange={handleFormChange} className={inputStyle} />
                                </div> }
                                { (formState.telecom_packageType?.includes('telefonie')) &&
                                <div>
                                    <label htmlFor="telecom_phoneDetails" className={labelStyle}>{t('phone_details')}</label>
                                    <input type="text" name="telecom_phoneDetails" id="telecom_phoneDetails" placeholder={t('phone_details_placeholder')} value={formState.telecom_phoneDetails || ''} onChange={handleFormChange} className={inputStyle} />
                                </div> }
                            </div>
                        )}
                        
                        {selectedIndustry === 'energy' && (
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="energy_contractDuration" className={labelStyle}>{t('contract_duration')}</label>
                                    <select id="energy_contractDuration" name="energy_contractDuration" value={formState.energy_contractDuration || ''} onChange={handleFormChange} className={inputStyle}>
                                        <option value="" disabled>{t('select_duration')}</option>
                                        <option value="1 jaar">{t('duration_1_year')}</option>
                                        <option value="3 jaar">{t('duration_3_year')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="energy_rateType" className={labelStyle}>{t('rate_type')}</label>
                                    <select id="energy_rateType" name="energy_rateType" value={formState.energy_rateType || ''} onChange={handleFormChange} className={inputStyle}>
                                        <option value="" disabled>{t('select_rate_type')}</option>
                                        <option value="enkel">{t('rate_type_single')}</option>
                                        <option value="dubbel">{t('rate_type_double')}</option>
                                    </select>
                                </div>
                                {formState.energy_rateType === 'dubbel' ? (
                                    <>
                                        <div>
                                            <label htmlFor="energy_powerRate" className={labelStyle}>{t('power_rate_peak')}</label>
                                            <input type="text" name="energy_powerRate" id="energy_powerRate" value={formState.energy_powerRate || ''} onChange={handleFormChange} className={inputStyle} />
                                        </div>
                                         <div>
                                            <label htmlFor="energy_powerRateLow" className={labelStyle}>{t('power_rate_offpeak')}</label>
                                            <input type="text" name="energy_powerRateLow" id="energy_powerRateLow" value={formState.energy_powerRateLow || ''} onChange={handleFormChange} className={inputStyle} />
                                        </div>
                                    </>
                                ) : (
                                     <div>
                                        <label htmlFor="energy_powerRate" className={labelStyle}>{t('power_rate')}</label>
                                        <input type="text" name="energy_powerRate" id="energy_powerRate" value={formState.energy_powerRate || ''} onChange={handleFormChange} className={inputStyle} />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="energy_gasRate" className={labelStyle}>{t('gas_rate')}</label>
                                    <input type="text" name="energy_gasRate" id="energy_gasRate" value={formState.energy_gasRate || ''} onChange={handleFormChange} className={inputStyle} />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="usps" className={labelStyle}>{t('usps')}</label>
                            <textarea name="usps" id="usps" value={formState.usps || ''} onChange={handleFormChange} rows={3} className={`${inputStyle} resize-y`}></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="notes" className={labelStyle}>{t('general_notes')}</label>
                            <textarea name="notes" id="notes" value={formState.notes || ''} onChange={handleFormChange} rows={4} className={`${inputStyle} resize-y`}></textarea>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <div className="flex justify-between items-center pt-4">
                            <div>
                                {selectedNote && (user.role === 'owner' || user.role === 'manager' || user.role === 'leader' || user.role === 'team-leader' || selectedNote.authorId === auth.currentUser?.uid) && (
                                    <button type="button" onClick={() => handleDelete(selectedNote.id)} className="text-red-500 font-semibold py-2 px-4 rounded-lg hover:bg-red-500/10 transition-colors flex items-center">
                                        <TrashIcon className="w-5 h-5 mr-2" />
                                        {t('delete')}
                                    </button>
                                )}
                            </div>
                            <div className="flex space-x-4 items-center">
                                {selectedNote && isLeadership && (
                                    <button
                                        type="button"
                                        onClick={handleShareToKB}
                                        disabled={isSharingToKB}
                                        className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border transition-colors disabled:opacity-50"
                                    >
                                        <BookOpenIcon className="w-5 h-5 mr-2" />
                                        {isSharingToKB ? t('sharing') : kbShareSuccess ? t('shared') : t('share_note_to_kb')}
                                    </button>
                                )}
                                <button type="button" onClick={handleNewNote} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('cancel')}</button>
                                <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity" disabled={isLoading}>
                                    {isLoading ? t('saving') : t('save')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompetitorNotes;