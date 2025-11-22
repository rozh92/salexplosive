import React from 'react';
import { ShieldCheckIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const TermsAndConditions: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-brand-background min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="bg-brand-surface p-8 sm:p-12 rounded-xl shadow-lg">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-brand-primary/10 rounded-full">
                            <ShieldCheckIcon className="w-12 h-12 text-brand-primary"/>
                        </div>
                        <h1 className="text-4xl font-bold mt-4">{t('terms_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">{t('terms_subtitle')}</p>
                    </div>

                    <div className="prose max-w-none prose-p:text-brand-text-secondary prose-h2:text-brand-text-primary prose-ul:text-brand-text-secondary prose-li:my-1">
                        <p>{t('terms_intro')}</p>
                        
                        <h2>{t('terms_h2_usage')}</h2>
                        <p>{t('terms_p_usage_1')}</p>
                        <p dangerouslySetInnerHTML={{ __html: t('terms_p_usage_2') }} />
                        <p>{t('terms_p_usage_3')}</p>

                        <h2>{t('terms_h2_payment')}</h2>
                        <p>{t('terms_p_payment_1')}</p>
                        <p>{t('terms_p_payment_2')}</p>
                        <p dangerouslySetInnerHTML={{ __html: t('terms_p_payment_3') }} />
                        <p>{t('terms_p_payment_4')}</p>

                        <h2>{t('terms_h2_ip')}</h2>
                        <p>{t('terms_p_ip')}</p>

                        <h2>{t('terms_h2_liability')}</h2>
                        <p>{t('terms_p_liability')}</p>

                        <h2>{t('terms_h2_termination')}</h2>
                        <p>{t('terms_p_termination')}</p>
                        
                        <h2>{t('terms_h2_law')}</h2>
                        <p>{t('terms_p_law')}</p>

                        <h2>{t('terms_h2_contact')}</h2>
                        <p dangerouslySetInnerHTML={{ __html: t('terms_p_contact') }} />
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default TermsAndConditions;
