
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { useTranslation } from '../context/TranslationContext';

const RegisterPage: React.FC = () => {
    const { registerManagerAccount } = useAuth();
    const { t } = useTranslation();
    const [formState, setFormState] = useState<Partial<User>>({
        name: '',
        jobTitle: '',
        phoneNumber: '',
        email: '',
        password: '',
        companyName: '',
        kvk: '',
        btwNumber: '',
        industry: undefined,
        salesChannel: undefined,
        numberOfEmployees: 0,
        address: '',
        postalCode: '',
        city: '',
        country: 'Nederland',
        companyWebsite: '',
        companyPhoneNumber: '',
        invoiceEmail: '',
    });
    const [phoneCountryCode, setPhoneCountryCode] = useState('+31');
    const [localPhoneNumber, setLocalPhoneNumber] = useState('');
    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        services: false,
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const getCountryInfo = (country: string): { code: 'NL' | 'GB' | 'DE', lang: 'nl' | 'en' | 'de', locale: string, currency: string } => {
        switch (country) {
            case 'United Kingdom': return { code: 'GB', lang: 'en', locale: 'en-GB', currency: 'GBP' };
            case 'Germany': return { code: 'DE', lang: 'de', locale: 'de-DE', currency: 'EUR' };
            default: return { code: 'NL', lang: 'nl', locale: 'nl-NL', currency: 'EUR' };
        }
    };
    
    const countryInfo = getCountryInfo(formState.country || 'Nederland');

    const validationPatterns = {
      kvk: {
        NL: { regex: /^\d{8}$/, errorKey: 'error_kvk_format_nl' },
        GB: { regex: /^[A-Za-z0-9]{8}$/, errorKey: 'error_kvk_format_gb' },
        DE: { regex: /^(HRA|HRB)\s?\d+$/i, errorKey: 'error_kvk_format_de' },
      },
      btw: {
        NL: { regex: /^NL\d{9}B\d{2}$/i, errorKey: 'error_btw_format_nl' },
        GB: { regex: /^GB(\d{9}|\d{12})$/i, errorKey: 'error_btw_format_gb' },
        DE: { regex: /^DE\d{9}$/i, errorKey: 'error_btw_format_de' },
      }
    };

    const validateField = (name: string, value: any, currentCountryCode: 'NL' | 'GB' | 'DE'): string => {
        switch (name) {
            case 'name':
                return value.trim().split(' ').length < 2 ? t('error_fullname') : '';
            case 'email':
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? t('error_email_format') : '';
            case 'kvk':
                const kvkValidation = validationPatterns.kvk[currentCountryCode];
                return !kvkValidation.regex.test(value) ? t(kvkValidation.errorKey) : '';
            case 'btwNumber':
                const btwValidation = validationPatterns.btw[currentCountryCode];
                return !btwValidation.regex.test(value) ? t(btwValidation.errorKey) : '';
            default:
                return '';
        }
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const errorMessage = validateField(name, value, countryInfo.code);
        setFieldErrors(prev => ({ ...prev, [name]: errorMessage }));
    };

    const handleAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setAgreements(prev => ({...prev, [name]: checked}));
    };

    const handleFieldChange = (field: keyof User, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const errors: Record<string, string> = {};
        (['name', 'email', 'kvk', 'btwNumber'] as const).forEach(key => {
            const errorMsg = validateField(key, formState[key], countryInfo.code);
            if (errorMsg) errors[key] = errorMsg;
        });

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError(t("register_error_all_fields"));
            return;
        }

        if (!formState.industry || !formState.salesChannel) {
            setError(t("register_error_all_fields"));
            return;
        }
        if (!Object.values(agreements).every(Boolean)) {
            setError(t("register_error_agreements"));
            return;
        }
        setIsLoading(true);
        try {
            const registrationData = { 
                ...formState, 
                phoneNumber: `${phoneCountryCode}${localPhoneNumber}`,
                lang: countryInfo.lang 
            };
            await registerManagerAccount(registrationData);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Registratie mislukt. Probeer het opnieuw.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyle = (hasError: boolean) => 
        `w-full bg-brand-secondary border rounded-lg px-4 py-3 focus:ring-2 focus:outline-none transition-all ${
        hasError ? 'border-red-500 ring-red-500/50' : 'border-brand-border focus:ring-brand-primary'
    }`;
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";
    const buttonBase = "w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface";
    const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
    const buttonInactive = "bg-brand-surface text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";

    const kvkLabelKey = `kvk_number_${countryInfo.code.toLowerCase()}`;
    const btwLabelKey = `btw_number_${countryInfo.code.toLowerCase()}`;

    if (success) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-brand-background p-4">
                <div className="w-full max-w-lg mx-auto bg-brand-surface rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
                    <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-brand-text-primary mt-4">{t('register_success_title')}</h1>
                    <p className="text-brand-text-secondary mt-2">
                        {t('register_success_body')}
                    </p>
                    <a href="/#/" className="mt-8 w-full inline-block bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
                        {t('back_to_home')}
                    </a>
                </div>
            </div>
        )
    }

    const numberOfEmployees = Number(formState.numberOfEmployees) || 0;
    const totalLicenses = numberOfEmployees + 1;

    const priceFormatter = new Intl.NumberFormat(countryInfo.locale, {
        style: 'currency',
        currency: countryInfo.currency,
    });

    const formattedTotalCost = priceFormatter.format(totalLicenses * 9.99);
    const formattedLicenseCost = priceFormatter.format(9.99);


    return (
        <div className="min-h-screen bg-brand-background py-12 px-4">
             <div className="w-full max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <a href="/#/"><img src="https://i.imgur.com/moW461j.png" alt="Bedrijfslogo" className="w-40 h-auto mx-auto mb-4" /></a>
                    <h1 className="text-4xl font-bold text-brand-text-primary">{t('register_title')}</h1>
                    <p className="text-brand-text-secondary mt-2">{t('register_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-brand-surface rounded-2xl shadow-2xl p-8 space-y-8">
                    {/* Persoonlijke gegevens */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold border-b border-brand-border pb-3">{t('personal_details')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className={labelStyle}>{t('full_name')}</label>
                                <input type="text" name="name" id="name" value={formState.name || ''} required className={inputStyle(!!fieldErrors.name)} onChange={handleFormChange} onBlur={handleBlur} />
                                {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                            </div>
                            <div><label htmlFor="jobTitle" className={labelStyle}>{t('job_title')}</label><input type="text" name="jobTitle" id="jobTitle" value={formState.jobTitle || ''} required className={inputStyle(false)} onChange={handleFormChange} /></div>
                            <div>
                                <label htmlFor="phoneNumber" className={labelStyle}>{t('phone_number')}</label>
                                <div className="flex">
                                    <select 
                                        name="phoneCountryCode"
                                        value={phoneCountryCode}
                                        onChange={(e) => setPhoneCountryCode(e.target.value)}
                                        className="rounded-l-lg border border-r-0 border-brand-border bg-brand-secondary px-3 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                    >
                                        <option value="+31">🇳🇱 +31</option>
                                        <option value="+49">🇩🇪 +49</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+32">🇧🇪 +32</option>
                                        <option value="+48">🇵🇱 +48</option>
                                        <option value="+33">🇫🇷 +33</option>
                                    </select>
                                    <input 
                                        type="tel" 
                                        id="phoneNumber" 
                                        value={localPhoneNumber} 
                                        required 
                                        className={`${inputStyle(false)} rounded-l-none`}
                                        onChange={(e) => setLocalPhoneNumber(e.target.value)}
                                        placeholder={t('phone_number_placeholder')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className={labelStyle}>{t('email_login')}</label>
                                <input type="email" name="email" id="email" value={formState.email || ''} required className={inputStyle(!!fieldErrors.email)} onChange={handleFormChange} onBlur={handleBlur} />
                                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                            </div>
                        </div>
                        <div><label htmlFor="password" className={labelStyle}>{t('password')}</label><input type="password" name="password" id="password" value={formState.password || ''} required className={inputStyle(false)} onChange={handleFormChange} /></div>
                    </div>

                    {/* Bedrijfsgegevens */}
                    <div className="space-y-6">
                         <h2 className="text-2xl font-semibold border-b border-brand-border pb-3">{t('company_details')}</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label htmlFor="companyName" className={labelStyle}>{t('company_name')}</label><input type="text" name="companyName" id="companyName" value={formState.companyName || ''} required className={inputStyle(false)} onChange={handleFormChange} /></div>
                             <div>
                                <label htmlFor="kvk" className={labelStyle}>{t(kvkLabelKey)}</label>
                                <input type="text" name="kvk" id="kvk" value={formState.kvk || ''} required className={inputStyle(!!fieldErrors.kvk)} onChange={handleFormChange} onBlur={handleBlur} />
                                {fieldErrors.kvk && <p className="text-red-500 text-xs mt-1">{fieldErrors.kvk}</p>}
                             </div>
                            <div>
                                <label htmlFor="btwNumber" className={labelStyle}>{t(btwLabelKey)}</label>
                                <input type="text" name="btwNumber" id="btwNumber" value={formState.btwNumber || ''} required className={inputStyle(!!fieldErrors.btwNumber)} onChange={handleFormChange} onBlur={handleBlur} />
                                {fieldErrors.btwNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.btwNumber}</p>}
                            </div>
                         </div>

                        <div className="space-y-2 pt-2">
                            <label className={labelStyle}>{t('active_industry')}</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => handleFieldChange('industry', 'telecom')} className={`${buttonBase} ${formState.industry === 'telecom' ? buttonActive : buttonInactive}`}>{t('industry_telecom')}</button>
                                <button type="button" onClick={() => handleFieldChange('industry', 'energy')} className={`${buttonBase} ${formState.industry === 'energy' ? buttonActive : buttonInactive}`}>{t('industry_energy')}</button>
                                <button type="button" onClick={() => handleFieldChange('industry', 'beide')} className={`${buttonBase} ${formState.industry === 'beide' ? buttonActive : buttonInactive}`}>{t('industry_both')}</button>
                            </div>
                        </div>

                         <div className="space-y-2 pt-2">
                            <label className={labelStyle}>{t('sales_channel')}</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button type="button" onClick={() => handleFieldChange('salesChannel', 'deur-aan-deur')} className={`${buttonBase} ${formState.salesChannel === 'deur-aan-deur' ? buttonActive : buttonInactive}`}>{t('channel_doortodoor')}</button>
                                <button type="button" onClick={() => handleFieldChange('salesChannel', 'telefonisch')} className={`${buttonBase} ${formState.salesChannel === 'telefonisch' ? buttonActive : buttonInactive}`}>{t('channel_telemarketing')}</button>
                                <button type="button" onClick={() => handleFieldChange('salesChannel', 'beide')} className={`${buttonBase} ${formState.salesChannel === 'beide' ? buttonActive : buttonInactive}`}>{t('channel_both')}</button>
                            </div>
                        </div>

                         <div className="border-t border-brand-border pt-6">
                             <label htmlFor="numberOfEmployees" className={labelStyle}>{t('num_employees_on_app')}</label>
                             <input type="number" min="0" name="numberOfEmployees" id="numberOfEmployees" value={formState.numberOfEmployees || 0} required className={inputStyle(false)} onChange={handleFormChange} />
                            <div className="mt-2 text-right">
                                <p className="text-sm text-brand-text-secondary">{t('you_pay_for', { num_employees: numberOfEmployees, total_licenses: totalLicenses })}</p>
                                <p className="text-2xl font-bold text-brand-text-primary">{t('total_cost_per_month', { total_cost: formattedTotalCost })}</p>
                                <p className="text-sm text-brand-text-secondary">{t('license_cost', { price: formattedLicenseCost })}</p>
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-brand-border pt-6">
                             <div>
                                <label htmlFor="country" className={labelStyle}>{t('country')}</label>
                                <select name="country" id="country" value={formState.country} required className={inputStyle(false)} onChange={handleFormChange}>
                                    <option value="Nederland">{t('country_nl')}</option>
                                    <option value="United Kingdom">{t('country_en')}</option>
                                    <option value="Germany">{t('country_de')}</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="address" className={labelStyle}>{t('street_housenr')}</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    id="address" 
                                    required 
                                    className={inputStyle(false)}
                                    value={formState.address || ''}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div><label htmlFor="postalCode" className={labelStyle}>{t('postal_code')}</label><input type="text" name="postalCode" id="postalCode" value={formState.postalCode || ''} required className={inputStyle(false)} onChange={handleFormChange} /></div>
                            <div><label htmlFor="city" className={labelStyle}>{t('city')}</label><input type="text" name="city" id="city" value={formState.city || ''} required className={inputStyle(false)} onChange={handleFormChange} /></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-brand-border pt-6">
                             <div><label htmlFor="companyWebsite" className={labelStyle}>{t('company_website')}</label><input type="url" name="companyWebsite" id="companyWebsite" value={formState.companyWebsite || ''} className={inputStyle(false)} onChange={handleFormChange} /></div>
                             <div><label htmlFor="companyPhoneNumber" className={labelStyle}>{t('company_phone')}</label><input type="tel" name="companyPhoneNumber" id="companyPhoneNumber" value={formState.companyPhoneNumber || ''} className={inputStyle(false)} onChange={handleFormChange} /></div>
                             <div><label htmlFor="invoiceEmail" className={labelStyle}>{t('invoice_email')}</label><input type="email" name="invoiceEmail" id="invoiceEmail" value={formState.invoiceEmail || ''} className={inputStyle(false)} onChange={handleFormChange} /></div>
                         </div>
                    </div>
                    
                    {/* Akkoord */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-semibold border-b border-brand-border pb-3">{t('agreements_title')}</h2>
                        <div className="flex items-start"><input type="checkbox" name="terms" id="terms" className="h-5 w-5 mt-0.5" onChange={handleAgreementChange}/><label htmlFor="terms" className="ml-3 text-sm">{t('agree_terms')} <a href="/#/terms" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">{t('terms_link')}</a>.</label></div>
                        <div className="flex items-start"><input type="checkbox" name="privacy" id="privacy" className="h-5 w-5 mt-0.5" onChange={handleAgreementChange}/><label htmlFor="privacy" className="ml-3 text-sm">{t('agree_privacy')} <a href="/#/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">{t('privacy_link')}</a>.</label></div>
                        <div className="flex items-start"><input type="checkbox" name="services" id="services" className="h-5 w-5 mt-0.5" onChange={handleAgreementChange}/><label htmlFor="services" className="ml-3 text-sm">{t('agree_services')} <a href="/#/services" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">{t('services_link')}</a> {t('i_have_read_and_understand')}</label></div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    <div className="pt-4">
                         <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                            {isLoading ? t('registering') : t('register_and_start')}
                        </button>
                    </div>
                </form>
                <div className="mt-8 text-center">
                    <p className="text-brand-text-secondary">
                        {t('already_have_account')}{' '}
                        <a href="/#/login" className="text-brand-primary font-semibold hover:underline">
                            {t('login_here')}
                        </a>
                    </p>
                </div>
             </div>
        </div>
    )
};

export default RegisterPage;
