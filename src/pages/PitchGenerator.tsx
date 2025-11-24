import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Pitch } from '../types';
import { useAuth } from '../context/AuthContext';
import { ClipboardListIcon, MicrophoneIcon, AcademicCapIcon, PaperAirplaneIcon } from '../components/icons/Icons';
import { encode, decode, decodeAudioData } from '../utils/audioUtils';
import Markdown from 'react-markdown';
import { useTranslation } from '../context/TranslationContext';

// @ts-ignore
const API_KEY = import.meta.env.VITE_GOOGLE_AI_KEY || process.env.API_KEY;

// Initialiseer met een dummy key als de echte ontbreekt om crash te voorkomen.
const ai = new GoogleGenAI({ apiKey: API_KEY || 'DUMMY_KEY' });

type Stage = 'select_pitch' | 'select_persona' | 'practice' | 'feedback';

interface TranscriptEntry {
    speaker: 'user' | 'model';
    text: string;
}

const PitchPractice: React.FC = () => {
    const { pitches: savedPitches, sharePracticeResults } = useAuth();
    const { t, language } = useTranslation();
    const [stage, setStage] = useState<Stage>('select_pitch');
    const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
    const [isPracticing, setIsPracticing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    // We gebruiken 'any' voor de sessie om TypeScript errors met de library types te voorkomen
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const [feedback, setFeedback] = useState('');
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isShared, setIsShared] = useState(false);

    const personas = useMemo(() => ({
        sceptical_manager: {
            name: t('persona_sceptical_manager_name'),
            description: t('persona_sceptical_manager_desc')
        },
        friendly_consumer: {
            name: t('persona_friendly_consumer_name'),
            description: t('persona_friendly_consumer_desc')
        },
        technical_expert: {
            name: t('persona_technical_expert_name'),
            description: t('persona_technical_expert_desc')
        }
    }), [t]);
    type PersonaKey = keyof typeof personas;
    const [selectedPersonaKey, setSelectedPersonaKey] = useState<PersonaKey | null>(null);
    const selectedPersona = selectedPersonaKey ? personas[selectedPersonaKey] : null;

    useEffect(() => {
        return () => {
            stopPractice();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectPitch = (pitch: Pitch) => {
        setSelectedPitch(pitch);
        setStage('select_persona');
    };

    const handleSelectPersona = (personaKey: PersonaKey) => {
        setSelectedPersonaKey(personaKey as PersonaKey);
        setStage('practice');
    };

    const startPractice = async () => {
        if (!API_KEY) {
            setError("API Key ontbreekt. Kan oefensessie niet starten.");
            return;
        }
        if (!selectedPersona) return;
        setIsPracticing(true);
        setError(null);
        setTranscript([]);
        setIsShared(false);
        setIsSharing(false);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const currentOutputAudioContext = outputAudioContextRef.current;
            const outputNode = currentOutputAudioContext.createGain();

            const langMap: Record<string, string> = { 'nl': 'Dutch', 'en': 'English', 'de': 'German' };
            const targetLanguage = langMap[language] || 'Dutch';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;

                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session: any) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const serverContent = message.serverContent as any;

                        // Handle transcription
                        if (serverContent?.inputTranscription) {
                            const { text } = serverContent.inputTranscription;
                            setTranscript((prev: TranscriptEntry[]) => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'user') {
                                     const newTranscript = [...prev];
                                     newTranscript[newTranscript.length - 1] = { speaker: 'user', text };
                                     return newTranscript;
                                }
                                return [...prev, { speaker: 'user', text }];
                            });
                        }
                        if (serverContent?.outputTranscription) {
                             const { text } = serverContent.outputTranscription;
                             setTranscript((prev: TranscriptEntry[]) => {
                                const last = prev[prev.length - 1];
                                if (last?.speaker === 'model') {
                                    const newTranscript = [...prev];
                                    newTranscript[newTranscript.length - 1] = { speaker: 'model', text };
                                    return newTranscript;
                                }
                                return [...prev, { speaker: 'model', text }];
                            });
                        }

                        // Handle audio output
                        const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, currentOutputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), currentOutputAudioContext, 24000, 1);
                            const source = currentOutputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            outputNode.connect(currentOutputAudioContext.destination);

                            source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }

                        if (serverContent?.interrupted) {
                            for (const source of audioSourcesRef.current.values()) {
                                source.stop();
                                audioSourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => setError(t('mic_error_connection', { message: e.message })),
                    onclose: () => {},
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: `You are an AI role-play partner for a salesperson. The salesperson is practicing a pitch. Your role is: ${selectedPersona.description}. Respond to the salesperson as if you are this person. Be realistic. Ask questions. Make objections. Give the salesperson a challenge. Start the conversation by reacting to the salesperson's opening line. Do not say "Hello, I'm ready to begin." Wait for the salesperson. You MUST respond in ${targetLanguage}.`,
                },
            });
        } catch (err) {
            setError(t('mic_error'));
            setIsPracticing(false);
        }
    };
    
    const stopPractice = () => {
        setIsPracticing(false);
        
        sessionPromiseRef.current?.then((session: any) => session.close());
        sessionPromiseRef.current = null;
        
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        
        for (const source of audioSourcesRef.current.values()) {
            source.stop();
        }
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        if (transcript.length > 0) {
            setStage('feedback');
        }
    };
    
    const generateFeedback = async (modelName: 'gemini-2.5-flash' | 'gemini-flash-lite-latest') => {
        setIsGeneratingFeedback(true);
        setFeedback('');
        // FIX: Changed 't' to 'entry' to avoid shadowing the translation function 't'
        const fullTranscript = transcript.map(entry => `${entry.speaker === 'user' ? t('you') : t('client_ai')}: ${entry.text}`).join('\n');
        
        const langMap: Record<string, string> = { 'nl': 'Dutch', 'en': 'English', 'de': 'German' };
        const targetLanguage = langMap[language] || 'Dutch';

        const prompt = `
            As an expert sales coach, analyze the following transcript of a role-play.
            The salesperson's original pitch was:
            --- ORIGINAL PITCH ---
            ${selectedPitch?.content}
            --- END PITCH ---

            The role-play transcript is:
            --- TRANSCRIPT ---
            ${fullTranscript}
            --- END TRANSCRIPT ---

            Provide constructive feedback in ${targetLanguage} and in Markdown. Assess the following points:
            - **${t('feedback_prompt_title_opening')}:** ${t('feedback_prompt_desc_opening')}
            - **${t('feedback_prompt_title_questioning')}:** ${t('feedback_prompt_desc_questioning')}
            - **${t('feedback_prompt_title_objections')}:** ${t('feedback_prompt_desc_objections')}
            - **${t('feedback_prompt_title_tone')}:** ${t('feedback_prompt_desc_tone')}
            - **${t('feedback_prompt_title_closing')}:** ${t('feedback_prompt_desc_closing')}

            For each point, provide a brief analysis and a concrete point for improvement. The headings in your response MUST be in ${targetLanguage}.
        `;

        try {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt,
            });
            setFeedback(response.text || '');
        } catch(e) {
            setFeedback(t('feedback_error'));
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const handleShareResults = async () => {
        if (!selectedPitch || !feedback) return;
        setIsSharing(true);
        try {
            // FIX: Changed 't' to 'entry' to avoid shadowing the translation function 't'
            const fullTranscript = transcript.map(entry => `${entry.speaker === 'user' ? t('you') : t('client_ai')}: ${entry.text}`).join('\n');
            await sharePracticeResults({
                pitchName: selectedPitch.name,
                transcript: fullTranscript,
                feedback: feedback
            });
            setIsShared(true);
        } catch (error: any) {
            alert(`Fout bij delen: ${error.message}`);
        } finally {
            setIsSharing(false);
        }
    };

    const reset = () => {
        stopPractice();
        setStage('select_pitch');
        setSelectedPitch(null);
        setSelectedPersonaKey(null);
        setTranscript([]);
        setFeedback('');
        setIsShared(false);
        setIsSharing(false);
    };

    const renderContent = () => {
        switch (stage) {
            case 'select_pitch':
                return (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('step1_choose_pitch')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {savedPitches.length > 0 ? savedPitches.map(pitch => (
                                <button key={pitch.id} onClick={() => handleSelectPitch(pitch)} className="p-4 rounded-lg text-left bg-brand-secondary hover:bg-brand-border transition-colors">
                                    <p className="font-semibold truncate">{pitch.name}</p>
                                    <p className="text-sm text-brand-text-secondary">{new Date(pitch.createdAt).toLocaleDateString()}</p>
                                </button>
                            )) : (
                                <div className="text-center text-brand-text-secondary py-10 col-span-full">
                                    <ClipboardListIcon className="mx-auto w-12 h-12 mb-4"/>
                                    <p>{t('pitches_empty_practice')}</p>
                                    <p>{t('go_to_pitch_generator')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'select_persona':
                 return (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('step2_choose_partner')}</h2>
                         <p className="text-brand-text-secondary mb-4">{t('choose_partner_subtitle')}</p>
                        <div className="space-y-3">
                            {Object.keys(personas).map(pKey => {
                                const persona = personas[pKey as PersonaKey];
                                return (
                                <button key={pKey} onClick={() => handleSelectPersona(pKey as PersonaKey)} className="w-full text-left p-4 rounded-lg bg-brand-secondary hover:bg-brand-border transition-colors">
                                    <h3 className="font-semibold text-lg text-brand-text-primary">{persona.name}</h3>
                                    <p className="text-brand-text-secondary">{persona.description}</p>
                                </button>
                            )})}
                        </div>
                        <button onClick={() => setStage('select_pitch')} className="mt-6 text-sm text-brand-primary hover:underline">{t('back_to_pitch_selection')}</button>
                    </div>
                );
            case 'practice':
                return (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-14rem)] flex flex-col">
                        <h2 className="text-2xl font-semibold mb-1 text-brand-text-primary">{t('practice_session')} {selectedPersona?.name}</h2>
                        <p className="text-brand-text-secondary mb-4">{t('selected_pitch')} "{selectedPitch?.name}"</p>
                        <div className="flex-grow bg-brand-secondary rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
                            {transcript.map((entry, index) => (
                                <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                                     {entry.speaker === 'model' && <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 text-sm font-bold">AI</div>}
                                     <p className={`p-3 rounded-lg max-w-lg ${entry.speaker === 'user' ? 'bg-brand-primary text-white' : 'bg-brand-border text-brand-text-primary'}`}>{entry.text}</p>
                                </div>
                            ))}
                             {transcript.length === 0 && <p className="text-brand-text-secondary text-center italic mt-4">{t('waiting_to_start')}</p>}
                        </div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <button onClick={isPracticing ? stopPractice : startPractice} className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors flex items-center justify-center ${isPracticing ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-primary hover:opacity-90'}`}>
                           <MicrophoneIcon className="w-5 h-5 mr-2" />
                           {isPracticing ? t('stop_session') : t('start_session')}
                        </button>
                         <button onClick={reset} className="mt-2 w-full text-sm text-brand-primary hover:underline">{t('start_new_session')}</button>
                    </div>
                );
            case 'feedback':
                return (
                     <div className="bg-brand-surface rounded-xl p-6 shadow-lg h-[calc(100vh-14rem)] flex flex-col">
                        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary">{t('session_complete')}</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-semibold mb-2">{t('transcript')}</h3>
                                <div className="flex-grow bg-brand-secondary rounded-lg p-4 overflow-y-auto mb-4 space-y-4">
                                {transcript.map((entry, index) => (
                                    <p key={index} className={entry.speaker === 'user' ? 'text-right' : 'text-left'}>
                                        <span className={`font-bold ${entry.speaker === 'user' ? 'text-brand-primary' : 'text-brand-text-primary'}`}>{entry.speaker === 'user' ? t('you') : t('client_ai')}:</span> {entry.text}
                                    </p>
                                ))}
                                </div>
                            </div>
                             <div className="flex flex-col">
                                <h3 className="text-xl font-semibold mb-2">{t('ai_feedback')}</h3>
                                <div className="flex-grow bg-brand-secondary rounded-lg p-4 overflow-y-auto mb-4">
                                    {isGeneratingFeedback ? (
                                        <div className="flex items-center justify-center h-full">
                                          <p className="text-brand-text-secondary">{t('generating_feedback')}...</p>
                                        </div>
                                    ) : feedback ? (
                                        <div className="prose prose-invert max-w-none text-brand-text-secondary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary">
                                            <Markdown>{feedback}</Markdown>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-brand-text-secondary italic">{t('choose_feedback_type')}</p>
                                            <button onClick={() => generateFeedback('gemini-flash-lite-latest')} disabled={isGeneratingFeedback} className="w-full text-left p-4 rounded-lg bg-brand-surface hover:bg-brand-border transition-colors">
                                                <h4 className="font-semibold text-lg text-brand-text-primary">{t('fast_scan')}</h4>
                                                <p className="text-brand-text-secondary text-sm">{t('fast_scan_desc')}</p>
                                            </button>
                                            <button onClick={() => generateFeedback('gemini-2.5-flash')} disabled={isGeneratingFeedback} className="w-full text-left p-4 rounded-lg bg-brand-surface hover:bg-brand-border transition-colors">
                                                <h4 className="font-semibold text-lg text-brand-text-primary">{t('deep_analysis')}</h4>
                                                <p className="text-brand-text-secondary text-sm">{t('deep_analysis_desc')}</p>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {feedback && !isGeneratingFeedback && (
                                    <button onClick={handleShareResults} disabled={isSharing || isShared} className="bg-green-600/20 text-green-600 font-semibold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-green-600 hover:text-white transition-colors disabled:opacity-70">
                                        <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                                        {isSharing ? t('sharing') : isShared ? t('shared') : t('share_with_manager')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <button onClick={reset} className="mt-4 w-full text-sm text-brand-primary hover:underline">{t('start_new_session')}</button>
                     </div>
                )
        }
    };


    return (
        <div>
            <div className="flex items-center mb-8">
                <AcademicCapIcon className="w-10 h-10 text-brand-primary mr-4"/>
                <div>
                    <h1 className="text-4xl font-bold">{t('pitch_practice_title')}</h1>
                    <p className="text-brand-text-secondary">{t('pitch_practice_subtitle')}</p>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default PitchPractice;