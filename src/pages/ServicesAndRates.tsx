import React from 'react';
import { TagIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const ServicesAndRates: React.FC = () => {
    const { t, language } = useTranslation();

    const currency = language === 'en' ? 'GBP' : 'EUR';
    const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'nl-NL';

    const formattedPrice = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(9.99);

    const includedFeatures = [
        t('feature_included_1'),
        t('feature_included_2'),
        t('feature_included_3'),
        t('feature_included_4'),
        t('feature_included_5'),
        t('feature_included_6'),
        t('feature_included_7'),
        t('feature_included_8')
    ];

    return (
        <div className="bg-brand-background min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
                <div className="bg-brand-surface p-8 sm:p-12 rounded-xl shadow-lg">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-brand-primary/10 rounded-full">
                            <TagIcon className="w-12 h-12 text-brand-primary"/>
                        </div>
                        <h1 className="text-4xl font-bold mt-4">{t('rates_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">{t('rates_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="bg-brand-secondary p-8 rounded-lg border border-brand-border text-center">
                            <h2 className="text-2xl font-semibold">{t('rates_trial_title')}</h2>
                            <p className="text-brand-text-secondary mt-2">{t('rates_trial_body')}</p>
                            <a href="/#/register" className="mt-6 block w-full bg-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:opacity-90 transition-opacity">
                                {t('rates_trial_cta')}
                            </a>
                        </div>
                         <div className="bg-brand-secondary p-8 rounded-lg border border-brand-border text-center">
                            <h2 className="text-xl font-semibold text-brand-text-secondary">{t('rates_after_trial_title')}</h2>
                            <p className="text-5xl font-extrabold text-brand-text-primary my-2">{t('rates_price_display', { price: formattedPrice })}</p>
                            <p className="font-semibold text-brand-text-secondary">{t('rates_price_user_month')}</p>
                        </div>
                    </div>
                    
                    <div className="mt-12">
                        <h3 className="text-2xl font-semibold text-center mb-6">{t('rates_all_in_one_title')}</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            {includedFeatures.map((feature) => (
                                <li key={feature} className="flex items-center">
                                    <div className="w-6 h-6 flex items-center justify-center bg-green-500/10 rounded-full mr-3 flex-shrink-0">
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                    </div>
                                    <span className="text-brand-text-primary">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>
            </main>
            <PublicFooter /> {/* Gecorrigeerde, responsive footer */}
        </div>
    );
};

export default ServicesAndRates;
