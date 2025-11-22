

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { startHelpChat } from '../services/geminiService';
import { PaperAirplaneIcon, QuestionMarkCircleIcon } from './icons/Icons';
import Markdown from 'react-markdown';
import { Chat } from '@google/genai';
import { useTranslation } from '../context/TranslationContext';

const HelpChatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { language, t } = useTranslation();

    useEffect(() => {
        if (isOpen && !chatSessionRef.current) {
            chatSessionRef.current = startHelpChat(language);
            setIsLoading(true);
            // Get the initial message from the bot
            chatSessionRef.current.sendMessage({ message: "Start" }).then(result => {
                setMessages([{ role: 'model', text: result.text.replace('Start\n', '')}]);
            }).catch(e => {
                console.error(e);
                setMessages([{ role: 'model', text: 'Sorry, de help-assistent is momenteel niet beschikbaar.' }]);
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [isOpen, language]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (messageText: string) => {
        if (messageText.trim() === '' || !chatSessionRef.current || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessage({ message: messageText });
            const modelResponse: ChatMessage = { role: 'model', text: result.text };
            setMessages(prev => [...prev, modelResponse]);
        } catch (error) {
            console.error("Error sending chat message:", error);
            const errorMessage: ChatMessage = { role: 'model', text: 'Mijn excuses, er is een fout opgetreden. Probeer het alstublieft opnieuw.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const quickReplies = [
        t('quick_reply_log_sale'),
        t('quick_reply_add_member'),
        t('quick_reply_generate_pitch'),
        t('quick_reply_manage_clients'),
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-brand-surface rounded-xl shadow-2xl w-full max-w-md h-[70vh] flex flex-col animate-slide-in-bottom-right">
                    <div className="p-4 border-b border-brand-border flex justify-between items-center flex-shrink-0">
                        <h2 className="text-xl font-bold flex items-center"><QuestionMarkCircleIcon className="w-6 h-6 mr-2 text-brand-primary" />{t('help_assistant_title')}</h2>
                        <button onClick={() => setIsOpen(false)} className="text-3xl font-light text-brand-text-secondary hover:text-brand-text-primary">&times;</button>
                    </div>
                    
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>}
                                <div className={`p-3 rounded-lg max-w-[85%] prose max-w-none text-brand-text-primary prose-p:my-0 ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-secondary'}`}>
                                    <Markdown>{msg.text}</Markdown>
                                </div>
                            </div>
                        ))}
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
                    
                    <div className="p-4 border-t border-brand-border flex-shrink-0 space-y-3">
                         {messages.length <= 1 && !isLoading && (
                            <div className="flex flex-wrap gap-2">
                                {quickReplies.map(reply => (
                                    <button 
                                        key={reply} 
                                        onClick={() => handleSend(reply)}
                                        className="text-sm bg-brand-secondary text-brand-primary font-semibold py-1.5 px-3 rounded-full hover:bg-brand-border transition-colors"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                                placeholder={t('ask_your_question')}
                                className="w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={() => handleSend(input)} disabled={isLoading || input.trim() === ''} className="bg-brand-primary text-white rounded-lg disabled:opacity-50 transition-colors grid place-items-center w-10 h-10">
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-brand-primary text-white rounded-full shadow-lg hover:opacity-90 transition-all transform hover:scale-110 grid place-items-center w-16 h-16"
                    aria-label="Open help chatbot"
                >
                    <QuestionMarkCircleIcon className="w-8 h-8" />
                </button>
            )}
        </div>
    );
};

export default HelpChatbot;