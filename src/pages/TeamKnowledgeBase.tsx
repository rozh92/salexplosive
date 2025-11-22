
import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeBasePitch } from '../types';
import { BookOpenIcon, StarIcon, MapPinIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, ShieldExclamationIcon, PlusIcon, TrashIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import AccordionSection from '../components/AccordionSection';
import AddKnowledgeBasePostModal from '../components/AddKnowledgeBasePostModal';
import Markdown from 'react-markdown';
import { useTranslation } from '../context/TranslationContext';

const TeamKnowledgeBase: React.FC = () => {
    const { user, allUsers, knowledgeBasePitches, deleteKnowledgeBasePost } = useAuth();
    const { t } = useTranslation();
    const [selectedPitch, setSelectedPitch] = useState<KnowledgeBasePitch | null>(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [branchFilter, setBranchFilter] = useState<string>('__ALL__');
    
    const isOwner = user?.role === 'owner';
    const isManager = user?.role === 'manager';
    const isManagerOrOwner = isManager || isOwner;

    const branchNames = useMemo(() => {
        if (!isOwner) return [];
        const names = new Set(allUsers.map(u => u.branchName).filter(name => name && name !== user?.companyName));
        return Array.from(names).sort();
    }, [allUsers, isOwner, user?.companyName]);

    const displayedPitches = useMemo(() => {
        if (!user) return [];
        
        if (isOwner) {
            if (branchFilter === '__ALL__') {
                return knowledgeBasePitches;
            }
            if (branchFilter === '__ORGANIZATION__') {
                return knowledgeBasePitches.filter(p => p.branchName === '__ORGANIZATION__');
            }
            return knowledgeBasePitches.filter(p => p.branchName === branchFilter);
        }

        if (isManager) {
            return knowledgeBasePitches.filter(p => p.branchName === user.branchName || p.branchName === '__ORGANIZATION__');
        }
        
        return knowledgeBasePitches.filter(p => p.branchName === user.branchName);
    }, [knowledgeBasePitches, user, isOwner, isManager, branchFilter]);

    useEffect(() => {
        if (!selectedPitch && displayedPitches.length > 0) {
            setSelectedPitch(displayedPitches[0]);
        }
        if (selectedPitch && !displayedPitches.find(p => p.id === selectedPitch.id)) {
            setSelectedPitch(displayedPitches.length > 0 ? displayedPitches[0] : null);
        }
    }, [displayedPitches, selectedPitch]);

    const parsedContent = useMemo(() => {
        if (!selectedPitch) {
            return { isStructured: false, content: '' };
        }
        const { content, note } = selectedPitch;

        // Items with specific notes are never structured pitches.
        const isUnstructuredByNote = 
            note.includes("Concurrentieanalyse") || 
            note.includes("Inzicht over concurrent") || 
            note.includes("Mededeling van");

        // Check for pitch structure markers
        const hasPitchStructure = 
            content.includes('### 1. Strategisch Buurtadvies') &&
            content.includes('### 2. Advies:') &&
            content.includes('### 3. De Pitch op Maat') &&
            content.includes('### 4. Meest Waarschijnlijke Bezwaren');

        if (!isUnstructuredByNote && hasPitchStructure) {
            const buurtadviesMatch = content.match(/### 1\. Strategisch Buurtadvies\n([\s\S]*?)(?=### 2\.|$)/);
            const toonadviesMatch = content.match(/### 2\. Advies:[\s\S]*?\n([\s\S]*?)(?=### 3\.|$)/);
            const pitchContentMatch = content.match(/### 3\. De Pitch op Maat[\s\S]*?\n([\s\S]*?)(?=### 4\.|$)/);
            const bezwarenMatch = content.match(/### 4\. Meest Waarschijnlijke Bezwaren[\s\S]*?\n([\s\S]*?)(?=$)/);
            
            return {
                isStructured: true,
                buurtadvies: buurtadviesMatch ? buurtadviesMatch[1].trim() : '',
                toonadvies: toonadviesMatch ? toonadviesMatch[1].trim() : '',
                pitchContent: pitchContentMatch ? pitchContentMatch[1].trim() : '',
                bezwaren: bezwarenMatch ? bezwarenMatch[1].trim() : '',
                content: ''
            };
        }

        return { isStructured: false, content: content };
    }, [selectedPitch]);
    
    const handleSelectPitch = (pitch: KnowledgeBasePitch) => {
        setSelectedPitch(pitch);
    };

    const handleDelete = async (pitchId: string) => {
        if (window.confirm(t('delete_confirm'))) {
            try {
                await deleteKnowledgeBasePost(pitchId);
            } catch (error: any) {
                alert(`Fout bij verwijderen: ${error.message}`);
            }
        }
    };
    
    const pageTitle = isOwner ? t('kb_title_owner') : isManager ? t('kb_title_manager') : t('kb_title_team');
    const pageDescription = isOwner
        ? t('kb_subtitle_owner')
        : isManager
            ? t('kb_subtitle_manager')
            : t('kb_subtitle_team');

    const isManagerPost = selectedPitch?.note.includes("Mededeling van de manager") || selectedPitch?.note.includes("Mededeling van de directie");

    return (
        <>
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8">
                <div className="flex items-start mb-4 sm:mb-0">
                    <BookOpenIcon className="w-10 h-10 text-brand-primary mr-4 flex-shrink-0"/>
                    <div>
                        <h1 className="text-4xl font-bold">{pageTitle}</h1>
                        <p className="text-lg text-brand-text-secondary">{pageDescription}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isOwner && (
                        <div>
                            <label htmlFor="branchFilter" className="sr-only">{t('filter_by_branch')}</label>
                            <select
                                id="branchFilter"
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="bg-brand-secondary border border-brand-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none h-10"
                            >
                                <option value="__ALL__">{t('all_branches')}</option>
                                <option value="__ORGANIZATION__">{t('org_wide_announcements')}</option>
                                {branchNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {isManagerOrOwner && (
                        <button onClick={() => setIsPostModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity h-10">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            {t('new_post')}
                        </button>
                    )}
                </div>
            </div>
            
            {displayedPitches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-brand-surface rounded-xl p-4 shadow-lg h-[calc(100vh-14rem)] flex flex-col">
                        <div className="overflow-y-auto">
                            {displayedPitches.map(pitch => {
                                const isOrgPost = pitch.branchName === '__ORGANIZATION__';
                                return (
                                <div key={pitch.id} onClick={() => handleSelectPitch(pitch)} className={`p-4 rounded-lg cursor-pointer mb-2 transition-colors ${selectedPitch?.id === pitch.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary hover:bg-brand-border'}`}>
                                <div className="flex items-center mb-1">
                                    <StarIcon className={`w-5 h-5 mr-2 ${selectedPitch?.id === pitch.id ? 'text-yellow-300' : isOrgPost ? 'text-purple-400' : 'text-yellow-500'}`} />
                                    <p className="font-semibold truncate">{pitch.name}</p>
                                </div>
                                <p className={`text-sm ${selectedPitch?.id === pitch.id ? 'text-gray-200' : 'text-brand-text-secondary'}`}>
                                    {isOrgPost && isManager ? `${t('kb_from_org')} ` : ''}{t('posted_by')} {pitch.promotedBy}
                                </p>
                                </div>
                            )})}
                        </div>
                    </div>
                    <div className="md:col-span-2 bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-14rem)] overflow-y-auto">
                       {selectedPitch ? (
                           <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-3xl font-bold">{selectedPitch.name}</h2>
                                    {isManagerOrOwner && (
                                        <button 
                                            onClick={() => handleDelete(selectedPitch.id)}
                                            className="bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors grid place-items-center w-8 h-8 flex-shrink-0 ml-4"
                                            title={t('delete')}
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                </div>
                                <div className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
                                    <p className="font-semibold text-brand-text-primary">{isManagerPost ? t('posted_by') : t('note_from')} {selectedPitch.promotedBy}:</p>
                                    <p className="text-brand-text-secondary italic">"{selectedPitch.note}"</p>
                                </div>
                                
                                {parsedContent.isStructured ? (
                                    <div className="space-y-3 pt-4 border-t border-brand-border">
                                        <AccordionSection title={t('strat_buurtadvies')} icon={<MapPinIcon />} defaultOpen={true}>
                                            {parsedContent.buurtadvies}
                                        </AccordionSection>
                                        <AccordionSection title={t('strat_toonadvies')} icon={<ChatBubbleLeftRightIcon />}>
                                            {parsedContent.toonadvies}
                                        </AccordionSection>
                                        <AccordionSection title={t('strat_pitch')} icon={<DocumentTextIcon />}>
                                            {parsedContent.pitchContent}
                                        </AccordionSection>
                                        <AccordionSection title={t('strat_bezwaren')} icon={<ShieldExclamationIcon />}>
                                            {parsedContent.bezwaren}
                                        </AccordionSection>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-brand-border prose max-w-none">
                                        <Markdown>{parsedContent.content}</Markdown>
                                    </div>
                                )}
                           </div>
                       ) : (
                           <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary text-center">
                              <StarIcon className="w-16 h-16 mb-4 text-yellow-500" />
                              <p className="font-semibold text-lg">{t('select_post_title')}</p>
                              <p>{t('select_post_subtitle')}</p>
                           </div>
                       )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-brand-text-secondary py-16 bg-brand-surface rounded-xl shadow-lg">
                    <BookOpenIcon className="mx-auto w-16 h-16 mb-4"/>
                    <h2 className="text-2xl font-semibold text-brand-text-primary">{t('kb_empty_title')}</h2>
                    <p className="max-w-md mx-auto mt-2">{t('kb_empty_subtitle')}</p>
                </div>
            )}
        </div>
        <AddKnowledgeBasePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
        </>
    );
};

export default TeamKnowledgeBase;
