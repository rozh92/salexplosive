import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProductPackage } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface LogSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogSale: (pkg: ProductPackage) => void;
}

const LogSaleModal: React.FC<LogSaleModalProps> = ({ isOpen, onClose, onLogSale }) => {
    const { user, productPackages } = useAuth();
    const { t } = useTranslation();
    const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const availablePackages = useMemo(() => {
        if (!user) return [];
        // The productPackages from context are already pre-filtered by the user's branch.
        // We only need to filter by industry. If the user's profile is set to 'beide' (both),
        // they should see all packages for their branch.
        if (user.industry === 'beide') {
            return productPackages;
        }
        return productPackages.filter(p => p.industry === user.industry);
    }, [user, productPackages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage) return;
        setIsLoading(true);
        try {
            await onLogSale(selectedPackage);
            setSelectedPackage(null);
            onClose();
        } catch (error) {
            // Error is handled by the caller, which shows an alert.
            console.error("Failed to log sale:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{t('log_sale_title')}</h2>
                {availablePackages.length > 0 ? (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-brand-text-secondary mb-2">{t('select_package_sold')}</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto bg-brand-secondary p-2 rounded-lg">
                                {availablePackages.map(pkg => (
                                    <div 
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg)}
                                        className={`p-3 rounded-md cursor-pointer border-2 ${selectedPackage?.id === pkg.id ? 'bg-brand-primary/10 border-brand-primary' : 'border-transparent hover:bg-brand-border'}`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{pkg.name}</span>
                                            <span className="font-bold text-brand-primary">{pkg.value} pnt.</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 pt-4">
                            <button type="button" onClick={onClose} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border">{t('cancel')}</button>
                            <button type="submit" disabled={!selectedPackage || isLoading} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
                                {isLoading ? t('registering') : t('register')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <p className="text-brand-text-secondary text-center">
                            {t('no_packages_defined')}
                        </p>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={onClose} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border">{t('close')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogSaleModal;
