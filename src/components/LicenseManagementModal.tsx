import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/TranslationContext';

interface LicenseManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    freedLicenses: number;
    onConfirm: (licensesToRemove: number) => void;
}

const LicenseManagementModal: React.FC<LicenseManagementModalProps> = ({ isOpen, onClose, freedLicenses, onConfirm }) => {
    const { t } = useTranslation();
    const [licensesToRemove, setLicensesToRemove] = useState(0);
    
    useEffect(() => {
        if (isOpen) {
            setLicensesToRemove(0);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        onConfirm(licensesToRemove);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-lg m-4 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">{t('license_management_title')}</h2>
                <p className="text-brand-text-secondary mb-6">{t('license_management_body', { count: freedLicenses })}</p>

                {freedLicenses > 1 && (
                    <div className="mb-6">
                        <label htmlFor="licensesToRemove" className="block text-sm font-medium text-brand-text-secondary mb-2">
                            {t('license_management_how_many_remove')}
                        </label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="range"
                                id="licensesToRemove"
                                min="0"
                                max={freedLicenses}
                                value={licensesToRemove}
                                onChange={(e) => setLicensesToRemove(parseInt(e.target.value))}
                                className="w-full h-2 bg-brand-secondary rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-bold text-lg w-12 text-center">{licensesToRemove}</span>
                        </div>
                        <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
                            <span>0 ({t('keep_all')})</span>
                            <span>{freedLicenses} ({t('remove_all')})</span>
                        </div>
                    </div>
                )}
                
                {freedLicenses === 1 && (
                     <div className="mb-6 space-y-3">
                        <button onClick={() => setLicensesToRemove(0)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${licensesToRemove === 0 ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-secondary hover:border-brand-primary/50'}`}>
                            <p className="font-semibold">{t('license_management_option_keep')}</p>
                            <p className="text-sm text-brand-text-secondary">{t('license_management_option_keep_desc')}</p>
                        </button>
                         <button onClick={() => setLicensesToRemove(1)} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${licensesToRemove === 1 ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border bg-brand-secondary hover:border-brand-primary/50'}`}>
                            <p className="font-semibold">{t('license_management_option_remove')}</p>
                            <p className="text-sm text-brand-text-secondary">{t('license_management_option_remove_desc')}</p>
                        </button>
                    </div>
                )}


                <div className="flex justify-end space-x-4 pt-4 border-t border-brand-border">
                    <button onClick={() => onConfirm(0)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">
                        {t('license_management_action_keep')}
                    </button>
                    <button onClick={handleConfirm} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" disabled={licensesToRemove === 0 && freedLicenses > 1}>
                         {t('license_management_action_confirm_removal', { count: licensesToRemove })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LicenseManagementModal;