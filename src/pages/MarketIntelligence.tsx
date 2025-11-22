import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MarketIntelligenceNote } from '../types';
import { MagnifyingGlassIcon, PlusIcon, UserCircleIcon } from '../components/icons/Icons';
import Markdown from 'react-markdown';
import AddMarketIntelligenceModal from '../components/AddMarketIntelligenceModal';
import { useTranslation } from '../context/TranslationContext';

const MarketIntelligence: React.FC = () => {
    const { user, marketIntelligenceNotes } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isLeadership = user?.role && ['owner', 'manager', 'team-leader', 'leader'].includes(user.role);

    const filteredNotes = useMemo(() => {
        return marketIntelligenceNotes.filter(note => {
            const matchesSearch = searchTerm === '' || 
                note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.authorName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = selectedCategory === null || note.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [marketIntelligenceNotes, searchTerm, selectedCategory]);
    
    const allCategories = useMemo(() => {
        return [...new Set(marketIntelligenceNotes.map(note => note.category))].sort();
    }, [marketIntelligenceNotes]);

    return (
        <>
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold">{t('mi_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-1">{t('mi_subtitle')}</p>
                    </div>
                    {isLeadership && (
                        <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            {t('share_insight')}
                        </button>
                    )}
                </div>
                
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="relative md:col-span-2">
                            <input
                                type="text"
                                placeholder={t('search_in_notes')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-brand-secondary border border-brand-border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            />
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                        </div>
                        <div>
                            <select 
                                value={selectedCategory || ''}
                                onChange={(e) => setSelectedCategory(e.target.value || null)}
                                className="w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            >
                                <option value="">{t('all_categories')}</option>
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4 max-h-[calc(100vh-22rem)] overflow-y-auto pr-2 -mr-2">
                        {filteredNotes.length > 0 ? filteredNotes.map(note => (
                            <div key={note.id} className="bg-brand-secondary p-4 rounded-lg border border-brand-border">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center">
                                         <UserCircleIcon className="w-8 h-8 mr-2 text-brand-text-secondary"/>
                                         <div>
                                            <p className="font-semibold">{note.authorName}</p>
                                            <p className="text-xs text-brand-text-secondary">{new Date(note.createdAt).toLocaleString()}</p>
                                         </div>
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-full">{note.category}</span>
                                </div>
                                <div className="prose max-w-none text-brand-text-secondary prose-p:my-1">
                                    <Markdown>{note.content}</Markdown>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-brand-text-secondary">
                                <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4"/>
                                <p className="font-semibold">{t('no_insights_found_title')}</p>
                                <p className="text-sm">{t('no_insights_found_subtitle')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AddMarketIntelligenceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default MarketIntelligence;
