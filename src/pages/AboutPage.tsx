import React from 'react';
import { AcademicCapIcon } from '../components/icons/Icons';
import PublicHeader from '../components/PublicHeader';
import { useTranslation } from '../context/TranslationContext';
import PublicFooter from '../components/PublicFooter'; // Belangrijke import

const AboutPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="bg-brand-background min-h-screen flex flex-col">
            <PublicHeader />
            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-brand-surface p-8 sm:p-12 rounded-xl shadow-lg">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-brand-primary/10 rounded-full">
                            <AcademicCapIcon className="w-12 h-12 text-brand-primary"/>
                        </div>
                        <h1 className="text-4xl font-bold mt-4">{t('about_title')}</h1>
                        <p className="text-lg text-brand-text-secondary mt-2">{t('about_subtitle')}</p>
                    </div>

                    <div className="prose max-w-none prose-p:text-brand-text-secondary prose-h2:text-brand-text-primary">
                        <h2>{t('about_h2_story')}</h2>
                        <p>{t('about_p1')}</p>
                        <p>{t('about_p2')}</p>
                        <p>{t('about_p3')}</p>
                        <h2>{t('about_h2_mission')}</h2>
                        <p>{t('about_p4')}</p>
                        <p>{t('about_p5')}</p>
                    </div>
                </div>
            </main>
            <PublicFooter /> {/* Gecorrigeerde, responsive footer */}
        </div>
    );
};

export default AboutPage;
