import React from 'react';
import { ShieldCheckIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const PrivacyPolicy: React.FC = () => {
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
                        <h1 className="text-4xl font-bold mt-4">{t('privacy_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">{t('privacy_subtitle')}</p>
                    </div>

                    <div className="prose max-w-none prose-p:text-brand-text-secondary prose-h2:text-brand-text-primary prose-ul:text-brand-text-secondary prose-li:my-1">
                        <p>{t('privacy_intro')}</p>
                        
                        <h2>{t('privacy_h2_data_collected')}</h2>
                        <p>{t('privacy_p_data_collected')}</p>
                        <ul>
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_account_data') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_company_data') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_usage_data') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_technical_data') }} />
                        </ul>

                        <h2>{t('privacy_h2_data_usage')}</h2>
                        <p>{t('privacy_p_data_usage')}</p>
                        <ul>
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_provide_service') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_personalization') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_communication') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_analysis') }} />
                        </ul>

                        <h2>{t('privacy_h2_sharing')}</h2>
                        <p>{t('privacy_p_sharing')}</p>
                        <ul>
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_cloud_providers') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('privacy_li_ai_providers') }} />
                        </ul>

                        <h2>{t('privacy_h2_ai')}</h2>
                        <p>{t('privacy_p_ai')}</p>

                        <h2>{t('privacy_h2_security')}</h2>
                        <p>{t('privacy_p_security')}</p>
                        
                        <h2>{t('privacy_h2_rights')}</h2>
                        <p>{t('privacy_p_rights')}</p>

                        <h2>{t('privacy_h2_changes')}</h2>
                        <p>{t('privacy_p_changes')}</p>

                        <h2>{t('privacy_h2_contact')}</h2>
                        <p dangerouslySetInnerHTML={{ __html: t('privacy_p_contact') }} />
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
};

export default PrivacyPolicy;
