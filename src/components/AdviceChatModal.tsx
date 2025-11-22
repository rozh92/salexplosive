import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/Icons';
import Markdown from 'react-markdown';
import { Chat } from '@google/genai';
import { useTranslation } from '../context/TranslationContext';

interface AdviceChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatSession: Chat | null;
    onRegenerate: (context: string) => void;
}

const AdviceChatModal: React.FC<AdviceChatModalProps> = ({ isOpen, onClose, chatSession, onRegenerate }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ role: 'model', text: t('advice_chat_modal_initial_greeting') }]);
        } else {
            setMessages([]);
            setInput('');
        }
    }, [isOpen, t]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (input.trim() === '' || !chatSession || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatSession.sendMessage({ message: input });
            const modelResponse: ChatMessage = { role: 'model', text: result.text };
            setMessages(prev => [...prev, modelResponse]);
        } catch (error) {
            console.error("Error sending chat message:", error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Sorry, er is iets misgegaan. Probeer het opnieuw.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegenerateClick = () => {
        const context = messages.map(m => `${m.role === 'user' ? 'Verkoper' : 'Coach'}: ${m.text}`).join('\n');
        onRegenerate(context);
        onClose();
    };

    if (!isOpen) return null;
    
    const lastMessage = messages[messages.length - 1];
    const showRegenerateButton = lastMessage?.role === 'model' && lastMessage.text.includes('[PROPOSE_REGENERATE]');
    const lastMessageText = showRegenerateButton ? lastMessage.text.replace('[PROPOSE_REGENERATE]', '').trim() : lastMessage?.text;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-brand-border flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{t('advice_chat_modal_title')}</h2>
                    <button onClick={onClose} className="text-2xl font-light text-brand-text-secondary hover:text-brand-text-primary">&times;</button>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => {
                        const isLastMessage = index === messages.length - 1;
                        const textToRender = isLastMessage ? lastMessageText : msg.text;
                        
                        return (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>}
                                <div className={`p-3 rounded-lg max-w-[80%] prose prose-invert max-w-none text-brand-text-primary prose-p:my-0 ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-secondary'}`}>
                                    <Markdown>{textToRender}</Markdown>
                                </div>
                            </div>
                        );
                    })}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>
                            <div className="p-3 rounded-lg bg-brand-secondary">
                                <span className="inline-block w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse mx-0.5"></span>
                                <span className="inline-block w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse mx-0.5" style={{animationDelay: '0.2s'}}></span>
                                <span className="inline-block w-2 h-2 bg-brand-text-secondary rounded-full animate-pulse mx-0.5" style={{animationDelay: '0.4s'}}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                {showRegenerateButton && !isLoading && (
                    <div className="p-4 border-t border-brand-border flex-shrink-0">
                        <button 
                            onClick={handleRegenerateClick}
                            className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            {t('propose_regenerate_button')}
                        </button>
                    </div>
                )}
                
                <div className="p-4 border-t border-brand-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('advice_chat_modal_placeholder')}
                            className="w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="bg-brand-primary text-white rounded-lg disabled:opacity-50 transition-colors grid place-items-center w-10 h-10">
                            <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdviceChatModal;
