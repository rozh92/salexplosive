
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateMotivationPostInspiration } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';
import { MotivationPost } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface AddPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    postToEdit: MotivationPost | null;
}

const AddPostModal: React.FC<AddPostModalProps> = ({ isOpen, onClose, postToEdit }) => {
    const { addMotivationPost, updateMotivationPost } = useAuth();
    const { t, language } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [keep, setKeep] = useState(false);
    const [inspirationTopic, setInspirationTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setContent(postToEdit.content);
            setKeep(postToEdit.keep || false);
        } else {
            setTitle('');
            setContent('');
            setKeep(false);
        }
        setInspirationTopic('');
        setError('');
    }, [postToEdit, isOpen]);

    const handleGenerateInspiration = async () => {
        if (!inspirationTopic) return;
        setIsGenerating(true);
        try {
            const inspiration = await generateMotivationPostInspiration(inspirationTopic, language);
            setContent(prev => `${prev ? prev + '\n\n' : ''}${inspiration}`);
        } catch (e) {
            console.error(e);
            alert("Kon geen inspiratie genereren.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            setError(t('error_title_content_required'));
            return;
        }
        setIsPublishing(true);
        setError('');
        try {
            if (postToEdit) {
                await updateMotivationPost({ ...postToEdit, title, content, keep });
            } else {
                await addMotivationPost({ title, content, keep });
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Kon bericht niet publiceren.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{postToEdit ? t('modal_edit_post') : t('modal_new_post')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={labelStyle}>{t('title')}</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="content" className={labelStyle}>{t('content_markdown')}</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={8} required className={`${inputStyle} resize-y`}></textarea>
                    </div>

                    <div className="border-t border-brand-border pt-4">
                        <label htmlFor="inspiration" className={labelStyle}>{t('ai_inspiration')}</label>
                        <div className="flex items-center gap-2">
                            <input type="text" id="inspiration" value={inspirationTopic} onChange={e => setInspirationTopic(e.target.value)} placeholder={t('inspiration_topic_placeholder')} className={`${inputStyle} flex-grow`} />
                             <button type="button" onClick={handleGenerateInspiration} disabled={isGenerating || !inspirationTopic} className="bg-brand-primary text-white rounded-lg grid place-items-center hover:opacity-90 transition-opacity disabled:opacity-50 w-10 h-10">
                                {isGenerating ? (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <SparklesIcon className="w-5 h-5" />
                                )}
                             </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="keep"
                            checked={keep}
                            onChange={(e) => setKeep(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <label htmlFor="keep" className="text-sm text-brand-text-secondary">{t('pin_post')}</label>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-brand-border text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-opacity">{t('cancel')}</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity" disabled={isPublishing}>
                            {isPublishing ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPostModal;
