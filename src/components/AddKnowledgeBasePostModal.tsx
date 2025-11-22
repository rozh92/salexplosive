

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

interface AddKnowledgeBasePostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddKnowledgeBasePostModal: React.FC<AddKnowledgeBasePostModalProps> = ({ isOpen, onClose }) => {
    const { addKnowledgeBasePost } = useAuth();
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            setError(t('error_title_content_required'));
            return;
        }
        setIsPublishing(true);
        setError('');
        try {
            await addKnowledgeBasePost(title, content);
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
                <h2 className="text-2xl font-bold mb-6">{t('modal_add_kb_post_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className={labelStyle}>{t('title_subject')}</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="content" className={labelStyle}>{t('content_message')}</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={8} required className={`${inputStyle} resize-y`}></textarea>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-brand-border text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:opacity-80 transition-opacity">{t('cancel')}</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity" disabled={isPublishing}>
                            {isPublishing ? t('publishing') : t('publish')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddKnowledgeBasePostModal;