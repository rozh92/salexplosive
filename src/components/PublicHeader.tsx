import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { MenuIcon, XMarkIcon } from './icons/Icons';

const PublicHeader: React.FC = () => {
    const { t, language, setLanguage } = useTranslation();
    const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLElement>(null);

    const navLinks = [
        { href: '/#/services', labelKey: 'public_nav_rates' },
        { href: '/#/about', labelKey: 'public_nav_about' },
        { href: '/#/contact', labelKey: 'public_nav_contact' },
    ];

    const languages = {
        nl: { name: 'Nederlands', flag: '🇳🇱' },
        en: { name: 'English', flag: '🇬🇧' },
        de: { name: 'Deutsch', flag: '🇩🇪' },
    };

    useEffect(() => {
        const handleHashChange = () => {
            setCurrentPath(window.location.hash || '#/');
            setIsMenuOpen(false); // Sluit menu bij navigatie
        };
        window.addEventListener('hashchange', handleHashChange);
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
            if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLangChange = (lang: string) => {
        setLanguage(lang);
        setIsLangDropdownOpen(false);
    };

    return (
        <header ref={headerRef} className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 w-full z-20 border-b border-brand-border">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Gecorrigeerde 3-koloms layout */}
                <div className="relative flex items-center justify-between h-20">
                    
                    {/* Kolom 1: Links (Desktop: Logo, Mobiel: Lege spacer) */}
                    <div className="flex-1 flex justify-start">
                        <a href="/#/" className="hidden lg:block">
                            <img className="h-28 w-auto" src="https://i.imgur.com/moW461j.png" alt="SalExplosive Logo" />
                        </a>
                    </div>

                    {/* Kolom 2: Midden (Desktop: Nav links, Mobiel: Logo) */}
                    <div className="flex-shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
                        {/* Mobiel Logo */}
                        <a href="/#/" className="lg:hidden">
                            <img className="h-28 w-auto" src="https://i.imgur.com/moW461j.png" alt="SalExplosive Logo" />
                        </a>
                        {/* Desktop Menu */}
                        <div className="hidden lg:flex lg:items-center lg:space-x-8">
                            {navLinks.map(link => {
                                const isActive = currentPath === link.href.substring(1);
                                return (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        className={`font-medium transition-colors ${
                                            isActive
                                                ? 'text-brand-primary'
                                                : 'text-brand-text-secondary hover:text-brand-primary'
                                        }`}
                                    >
                                        {t(link.labelKey)}
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Kolom 3: Rechts (Desktop: Knoppen, Mobiel: Hamburger menu) */}
                    <div className="flex-1 flex justify-end">
                        {/* Desktop knoppen */}
                        <div className="hidden lg:flex items-center space-x-4">
                            <a href="/#/login" className="text-brand-text-secondary font-medium hover:text-brand-primary transition-colors">
                                {t('public_nav_login')}
                            </a>
                            <a href="/#/register" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                                {t('public_nav_register')}
                            </a>
                            <div className="relative" ref={dropdownRef}>
                                <button onClick={() => setIsLangDropdownOpen(prev => !prev)} className="flex items-center p-2 rounded-md hover:bg-brand-secondary">
                                    <span>{languages[language as keyof typeof languages].flag}</span>
                                </button>
                                {isLangDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-40 bg-brand-surface rounded-md shadow-lg border border-brand-border animate-fade-in-fast">
                                        {Object.entries(languages).map(([code, { name, flag }]) => (
                                            <button
                                                key={code}
                                                onClick={() => handleLangChange(code)}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center hover:bg-brand-secondary ${language === code ? 'font-bold text-brand-primary' : 'text-brand-text-primary'}`}
                                            >
                                                <span className="mr-3">{flag}</span>
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Mobiel Menu Knop */}
                        <div className="lg:hidden">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-brand-secondary">
                                {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobiel Menu (deze code blijft hetzelfde) */}
            {isMenuOpen && (
                <div className="lg:hidden bg-brand-surface border-t border-brand-border absolute w-full shadow-lg animate-fade-in-fast">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                         {navLinks.map(link => {
                            const isActive = currentPath === link.href.substring(1);
                            return (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                                        isActive
                                            ? 'bg-brand-primary text-white'
                                            : 'text-brand-text-secondary hover:bg-brand-secondary hover:text-brand-primary'
                                    }`}
                                >
                                    {t(link.labelKey)}
                                </a>
                            );
                        })}
                    </div>
                    <div className="pt-4 pb-3 border-t border-brand-border px-5 space-y-3">
                        <a href="/#/register" className="block w-full text-center bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                            {t('public_nav_register')}
                        </a>
                        <a href="/#/login" className="block w-full text-center text-brand-text-secondary font-medium hover:text-brand-primary transition-colors py-2">
                            {t('public_nav_login')}
                        </a>
                         <div className="flex justify-center pt-2">
                             {Object.entries(languages).map(([code, { flag }]) => (
                                <button
                                    key={code}
                                    onClick={() => handleLangChange(code)}
                                    className={`px-3 py-1 rounded-md text-2xl ${language === code ? 'bg-brand-secondary' : ''}`}
                                >
                                    {flag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PublicHeader;
