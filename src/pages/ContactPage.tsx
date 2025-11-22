import React, { useState } from 'react';
import { EnvelopeIcon, PhoneIcon, BuildingStorefrontIcon, BriefcaseIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const ContactPage: React.FC = () => {
    const { t } = useTranslation();
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // In a real application, you would send the data here (e.g., to an API or email service).
        console.log("Form data:", formState);
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1000);
    };

    return (
        <div className="bg-brand-background min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="bg-brand-surface p-8 sm:p-12 rounded-xl shadow-lg">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-brand-primary/10 rounded-full">
                            <EnvelopeIcon className="w-12 h-12 text-brand-primary"/>
                        </div>
                        <h1 className="text-4xl font-bold mt-4">{t('contact_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">{t('contact_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-semibold mb-4">{t('contact_details_title')}</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <EnvelopeIcon className="w-6 h-6 mr-4 mt-1 text-brand-primary"/>
                                        <div>
                                            <h3 className="font-semibold">{t('contact_email_label')}</h3>
                                            <a href="mailto:info@salexplosive.com" className="text-brand-text-secondary hover:text-brand-primary underline">info@salexplosive.com</a>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <PhoneIcon className="w-6 h-6 mr-4 mt-1 text-brand-primary"/>
                                        <div>
                                            <h3 className="font-semibold">{t('contact_phone_label')}</h3>
                                            <p className="text-brand-text-secondary">{t('contact_phone_value')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <BuildingStorefrontIcon className="w-6 h-6 mr-4 mt-1 text-brand-primary"/>
                                        <div>
                                            <h3 className="font-semibold">{t('contact_address_label')}</h3>
                                            <p className="text-brand-text-secondary">{t('contact_address_value')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <BriefcaseIcon className="w-6 h-6 mr-4 mt-1 text-brand-primary"/>
                                        <div>
                                            <h3 className="font-semibold">{t('contact_kvk_label')}</h3>
                                            <p className="text-brand-text-secondary">97878952</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            {isSubmitted ? (
                                <div className="bg-green-500/10 text-green-700 p-6 rounded-lg text-center h-full flex flex-col justify-center">
                                    <h3 className="text-xl font-bold">{t('contact_form_submitted_title')}</h3>
                                    <p>{t('contact_form_submitted_body')}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                     <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('contact_form_name_label')}</label>
                                        <input type="text" name="name" id="name" required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2" onChange={handleFormChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('contact_form_email_label')}</label>
                                        <input type="email" name="email" id="email" required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2" onChange={handleFormChange} />
                                    </div>
                                     <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('contact_form_phone_label')}</label>
                                        <input type="tel" name="phone" id="phone" required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2" onChange={handleFormChange} />
                                    </div>
                                     <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('contact_form_subject_label')}</label>
                                        <input type="text" name="subject" id="subject" required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2" onChange={handleFormChange} />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-brand-text-secondary mb-1">{t('contact_form_message_label')}</label>
                                        <textarea name="message" id="message" required rows={5} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 resize-none" onChange={handleFormChange}></textarea>
                                    </div>
                                    <div className="pt-2">
                                        <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50">
                                            {isLoading ? t('contact_form_sending_button') : t('contact_form_submit_button')}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default ContactPage;
