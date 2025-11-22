import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { CreditCardIcon, UserGroupIcon, CurrencyDollarIcon, ArchiveBoxIcon } from '../components/icons/Icons';
import { Invoice } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config'; // Import the app instance

const BillingPage: React.FC = () => {
    const { user, allUsers, invoices } = useAuth();
    const { t } = useTranslation();
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [extraLicenses, setExtraLicenses] = useState(1);
    const [licensePurchaseSuccess, setLicensePurchaseSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user?.role !== 'owner') {
        return <div className="text-center p-8">Access Denied.</div>;
    }
    
    const usedLicenses = allUsers.length;
    const totalLicenses = user.purchasedLicenses || usedLicenses;
    const pricePerLicense = 9.99;
    
    const getLocaleInfo = (lang: string | undefined) => {
        switch (lang) {
            case 'en': return { locale: 'en-GB', currency: 'GBP', vatRate: 0.0 }; // B2B reverse charge
            case 'de': return { locale: 'de-DE', currency: 'EUR', vatRate: 0.0 }; // B2B reverse charge
            default: return { locale: 'nl-NL', currency: 'EUR', vatRate: 0.21 }; // 21% VAT for NL
        }
    }
    const { locale, currency, vatRate } = getLocaleInfo(user.lang);
    
    const priceFormatter = (value: number) => new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format(value);
    
    const totalMonthlyCostExVat = totalLicenses * pricePerLicense;
    const totalMonthlyCostIncVat = totalMonthlyCostExVat * (1 + vatRate);

    const getStatusChip = (status: Invoice['status']) => {
        const translatedStatus = status === 'Betaald' ? t('status_paid') : t('status_due');
        const color = status === 'Betaald' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500';
        return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${color}`}>{translatedStatus}</span>;
    };

    const handlePurchaseLicenses = async () => {
        setIsSubmitting(true);
        try {
            const functions = getFunctions(app, 'europe-west3');
            const requestExtraLicenses = httpsCallable(functions, 'requestExtraLicenses');
            
            const totalCostString = priceFormatter(extraLicenses * pricePerLicense);

            await requestExtraLicenses({ 
                numberOfLicenses: extraLicenses,
                totalCost: totalCostString,
            });

            setLicensePurchaseSuccess(true);
            setTimeout(() => {
                setIsLicenseModalOpen(false);
                setTimeout(() => {
                    setLicensePurchaseSuccess(false);
                    setExtraLicenses(1);
                }, 500);
            }, 4000);

        } catch (error: any) {
            console.error("Fout bij aanvragen extra licenties (Owner):", error);
            alert(`Er is een fout opgetreden bij het indienen van uw aanvraag: ${error.message}. Bekijk de console (F12) voor technische details.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formattedLicensePrice = priceFormatter(pricePerLicense);
    const formattedTotalCostModal = priceFormatter(extraLicenses * pricePerLicense);


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold">{t('billing_title')}</h1>
                    <p className="text-lg text-brand-text-secondary mt-1">{t('billing_subtitle')}</p>
                </div>
                <button onClick={() => setIsLicenseModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                    {t('buy_extra_licenses')}
                </button>
            </div>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">{t('subscription_overview')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-brand-secondary p-4 rounded-lg flex items-center">
                        <UserGroupIcon className="w-8 h-8 text-brand-primary mr-4"/>
                        <div>
                            <p className="text-sm text-brand-text-secondary">{t('used_licenses')}</p>
                            <p className="text-2xl font-bold">{t('licenses_of_total', { used: usedLicenses, total: totalLicenses })}</p>
                        </div>
                    </div>
                     <div className="bg-brand-secondary p-4 rounded-lg flex items-center">
                        <CreditCardIcon className="w-8 h-8 text-brand-primary mr-4"/>
                        <div>
                            <p className="text-sm text-brand-text-secondary">{t('price_per_license')}</p>
                            <p className="text-2xl font-bold">{priceFormatter(pricePerLicense)}</p>
                        </div>
                    </div>
                     <div className="bg-brand-secondary p-4 rounded-lg flex items-center">
                        <CurrencyDollarIcon className="w-8 h-8 text-brand-primary mr-4"/>
                        <div>
                            <p className="text-sm text-brand-text-secondary">{t('total_monthly_cost')}</p>
                            <p className="text-2xl font-bold">{priceFormatter(totalMonthlyCostIncVat)} <span className="text-sm font-normal">{t('vat_inclusive')}</span></p>
                            <p className="text-xs text-brand-text-secondary">{priceFormatter(totalMonthlyCostExVat)} {t('vat_exclusive')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg">
                <div className="p-6">
                    <h2 className="text-2xl font-semibold">{t('invoice_history')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-secondary">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('invoice_number')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('invoice_date')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('invoice_amount')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('invoice_status')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary text-right">{t('invoice_action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <tr key={invoice.id} className="border-b border-brand-border">
                                    <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                                    <td className="p-4 text-brand-text-secondary">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-semibold">{new Intl.NumberFormat(locale, { style: 'currency', currency: invoice.currency }).format(invoice.amount)}</td>
                                    <td className="p-4">{getStatusChip(invoice.status)}</td>
                                    <td className="p-4 text-right">
                                        <a 
                                            href={invoice.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg text-sm hover:opacity-90 transition-opacity"
                                        >
                                            {t('download_invoice')}
                                        </a>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-brand-text-secondary">
                                        <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-2"/>
                                        {t('no_invoices_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             {isLicenseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast" onClick={() => !licensePurchaseSuccess && setIsLicenseModalOpen(false)}>
                    <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {licensePurchaseSuccess ? (
                            <div className="text-center">
                                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xl font-bold text-brand-text-primary mt-4">{t('buy_licenses_modal_success_title')}</h3>
                                <p className="text-brand-text-secondary mt-2">
                                    {t('buy_licenses_modal_success_body')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-6">{t('buy_licenses_modal_title')}</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="extraLicenses" className="block text-sm font-medium text-brand-text-secondary mb-2">{t('buy_licenses_modal_amount')}</label>
                                        <input
                                            id="extraLicenses"
                                            type="number"
                                            min="1"
                                            value={extraLicenses}
                                            onChange={(e) => setExtraLicenses(parseInt(e.target.value) || 1)}
                                            className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-brand-text-secondary">{t('buy_licenses_modal_price_per', { price: formattedLicensePrice })}</p>
                                        <p className="text-2xl font-bold text-brand-text-primary">
                                            {t('buy_licenses_modal_total', { total_cost: formattedTotalCostModal })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 pt-6">
                                    <button type="button" onClick={() => setIsLicenseModalOpen(false)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                                    <button onClick={handlePurchaseLicenses} disabled={isSubmitting} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                                        {isSubmitting ? t('sending_request') : t('buy_licenses_modal_submit')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingPage;