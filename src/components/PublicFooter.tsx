import React from 'react';
import { useTranslation } from '../context/TranslationContext';

const PublicFooter: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-brand-secondary/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-center items-center gap-y-4 md:gap-x-4">
                    <p className="text-center text-base text-brand-text-secondary">{t('footer_copyright', { year: new Date().getFullYear() })}</p>
                    <div className="hidden md:flex items-center gap-x-4">
                        <span className="text-brand-text-secondary">|</span>
                        <a href="/#/services" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_services')}</a>
                        <span className="text-brand-text-secondary">|</span>
                        <a href="/#/about" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_about')}</a>
                        <span className="text-brand-text-secondary">|</span>
                        <a href="/#/contact" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_contact')}</a>
                        <span className="text-brand-text-secondary">|</span>
                        <a href="/#/privacy" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_privacy')}</a>
                        <span className="text-brand-text-secondary">|</span>
                        <a href="/#/terms" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_terms')}</a>
                    </div>
                     <div className="flex md:hidden flex-wrap justify-center gap-x-4 gap-y-2">
                        <a href="/#/services" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_services')}</a>
                        <a href="/#/about" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_about')}</a>
                        <a href="/#/contact" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_contact')}</a>
                        <a href="/#/privacy" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_privacy')}</a>
                        <a href="/#/terms" className="text-base text-brand-text-secondary hover:text-brand-primary underline">{t('footer_terms')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
