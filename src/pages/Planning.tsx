import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateSalesPlan } from '../services/geminiService';
import { Appointment, Planning } from '../types';
import { CalendarDaysIcon, PlusIcon, SparklesIcon, TrashIcon } from '../components/icons/Icons';
import Markdown from 'react-markdown';
import { useTranslation } from '../context/TranslationContext';

const Planning: React.FC = () => {
    const { user, plannings, appointments, addPlanning, deletePlanning, addAppointment, updateAppointment, deleteAppointment } = useAuth();
    const { t, language } = useTranslation();
    
    // State for planning
    const [planTopic, setPlanTopic] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState<Omit<Planning, 'id'> | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Planning | null>(null);

    // State for appointments
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [appointmentForm, setAppointmentForm] = useState<Omit<Appointment, 'id'>>({ title: '', date: '', time: '', notes: '' });

    const sortedAppointments = useMemo(() => {
        return [...appointments].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA.getTime() - dateB.getTime();
        });
    }, [appointments]);

    const handleGeneratePlan = async () => {
        if (!planTopic || !user) return;
        setIsGeneratingPlan(true);
        setGeneratedPlan(null);
        try {
            const content = await generateSalesPlan(user, planTopic, language);
            setGeneratedPlan({ title: `Trainingsplan: ${planTopic}`, content, createdAt: new Date().toISOString() });
        } catch (error) {
            alert('Kon geen plan genereren.');
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleSavePlan = async () => {
        if (!generatedPlan) return;
        await addPlanning(generatedPlan);
        setGeneratedPlan(null);
        setPlanTopic('');
    };
    
    const handleAppointmentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAppointmentForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAppointmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAppointment) {
            await updateAppointment({ ...editingAppointment, ...appointmentForm });
        } else {
            await addAppointment(appointmentForm);
        }
        setIsAppointmentModalOpen(false);
        setEditingAppointment(null);
    };
    
    const openAppointmentModal = (app: Appointment | null) => {
        if (app) {
            setEditingAppointment(app);
            setAppointmentForm(app);
        } else {
            setEditingAppointment(null);
            setAppointmentForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', notes: '' });
        }
        setIsAppointmentModalOpen(true);
    };

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";
    
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold">{t('planning_title')}</h1>
                <p className="text-lg text-brand-text-secondary mt-1">{t('planning_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* AI Plan Generator */}
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center"><SparklesIcon className="w-6 h-6 mr-3 text-brand-primary"/>{t('ai_training_planner')}</h2>
                    <div>
                        <label htmlFor="planTopic" className={labelStyle}>{t('training_focus')}</label>
                        <div className="flex items-center gap-2">
                            <input id="planTopic" type="text" value={planTopic} onChange={e => setPlanTopic(e.target.value)} placeholder={t('training_focus_placeholder')} className={inputStyle} />
                            <button onClick={handleGeneratePlan} disabled={isGeneratingPlan || !planTopic} className="bg-brand-primary text-white font-semibold p-3 rounded-lg flex-shrink-0 disabled:opacity-50">
                                {isGeneratingPlan ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SparklesIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                    </div>

                    {generatedPlan && (
                        <div className="border-t border-brand-border pt-4">
                            <h3 className="font-semibold">{generatedPlan.title}</h3>
                            <div className="bg-brand-secondary rounded-lg p-4 my-2 max-h-64 overflow-y-auto prose max-w-none"><Markdown>{generatedPlan.content}</Markdown></div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setGeneratedPlan(null)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg">{t('reject')}</button>
                                <button onClick={handleSavePlan} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                            </div>
                        </div>
                    )}
                    
                    <div className="border-t border-brand-border pt-4">
                        <h3 className="font-semibold mb-2">{t('saved_plans')}</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {plannings.map(p => <div key={p.id} onClick={() => setSelectedPlan(p)} className={`p-2 rounded-lg cursor-pointer ${selectedPlan?.id === p.id ? 'bg-brand-primary text-white' : 'bg-brand-secondary'}`}>{p.title}</div>)}
                        </div>
                    </div>
                </div>

                {/* Agenda */}
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold flex items-center"><CalendarDaysIcon className="w-6 h-6 mr-3 text-brand-primary"/>{t('agenda')}</h2>
                        <button onClick={() => openAppointmentModal(null)} className="bg-brand-primary text-white w-10 h-10 rounded-lg grid place-items-center"><PlusIcon className="w-6 h-6"/></button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {sortedAppointments.map(app => (
                            <div key={app.id} onClick={() => openAppointmentModal(app)} className="bg-brand-secondary p-3 rounded-lg cursor-pointer">
                                <div className="flex justify-between">
                                    <p className="font-semibold">{app.title}</p>
                                    <p className="text-sm font-mono text-brand-primary">{new Date(app.date).toLocaleDateString()} @ {app.time}</p>
                                </div>
                                {app.notes && <p className="text-sm text-brand-text-secondary mt-1">{app.notes}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedPlan && (
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold">{selectedPlan.title}</h2>
                        <div className="flex items-center">
                             <button onClick={() => deletePlanning(selectedPlan.id)} className="text-red-500 rounded-lg hover:bg-red-500/10 w-8 h-8 grid place-items-center"><TrashIcon className="w-5 h-5"/></button>
                             <button onClick={() => setSelectedPlan(null)} className="text-brand-text-secondary text-2xl font-bold w-8 h-8">&times;</button>
                        </div>
                    </div>
                    <div className="prose max-w-none mt-4"><Markdown>{selectedPlan.content}</Markdown></div>
                </div>
            )}
            
            {isAppointmentModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setIsAppointmentModalOpen(false)}>
                    <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">{editingAppointment ? t('edit_appointment') : t('new_appointment')}</h2>
                        <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className={labelStyle}>{t('appointment_title')}</label>
                                <input id="title" name="title" type="text" value={appointmentForm.title} onChange={handleAppointmentFormChange} required className={inputStyle} />
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="date" className={labelStyle}>{t('date')}</label>
                                    <input id="date" name="date" type="date" value={appointmentForm.date} onChange={handleAppointmentFormChange} required className={inputStyle} />
                                </div>
                                <div>
                                    <label htmlFor="time" className={labelStyle}>{t('time')}</label>
                                    <input id="time" name="time" type="time" value={appointmentForm.time} onChange={handleAppointmentFormChange} required className={inputStyle} />
                                </div>
                             </div>
                            <div>
                                <label htmlFor="notes" className={labelStyle}>{t('notes_optional')}</label>
                                <textarea id="notes" name="notes" value={appointmentForm.notes} onChange={handleAppointmentFormChange} rows={3} className={inputStyle + ' resize-none'}></textarea>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                                {editingAppointment && <button type="button" onClick={() => { deleteAppointment(editingAppointment.id); setIsAppointmentModalOpen(false); }} className="text-red-500 font-semibold">{t('delete')}</button>}
                                <div className="flex-grow flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAppointmentModalOpen(false)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                                    <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">{t('save')}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
}

export default Planning;
