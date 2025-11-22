import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface CreateBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateBranchModal: React.FC<CreateBranchModalProps> = ({ isOpen, onClose }) => {
    const { user, createBranchAndManager } = useAuth();
    const { t } = useTranslation();
    const [branchName, setBranchName] = useState('');
    const [managerName, setManagerName] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPassword, setManagerPassword] = useState('');
    const [industry, setIndustry] = useState<'telecom' | 'energy' | 'beide' | ''>('');
    const [salesChannel, setSalesChannel] = useState<'deur-aan-deur' | 'telefonisch' | 'beide' | ''>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBranchName('');
            setManagerName('');
            setManagerEmail('');
            setManagerPassword('');
            setIndustry(user?.industry === 'beide' ? '' : user?.industry || '');
            setSalesChannel(user?.salesChannel === 'beide' ? '' : user?.salesChannel || '');
            setError('');
        }
    }, [isOpen, user]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!branchName || !managerName || !managerEmail || !managerPassword || !industry || !salesChannel) {
            setError(t('error_all_fields_required'));
            return;
        }
        setIsLoading(true);
        try {
            const managerData: Omit<User, 'role' | 'teamMembers' | 'sales' | 'forcePasswordChange' | 'profilePicture' | 'badges' | 'totalSalesToday' | 'totalSalesWeek' | 'totalSalesMonth' | 'branchName' | 'company'> = {
                name: managerName,
                email: managerEmail,
                password: managerPassword,
                industry: industry as 'telecom' | 'energy' | 'beide',
                salesChannel: salesChannel as 'deur-aan-deur' | 'telefonisch' | 'beide',
            };
            await createBranchAndManager(branchName, managerData);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Kon filiaal niet aanmaken.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";
    const buttonBase = "w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface";
    const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
    const buttonInactive = "bg-brand-surface text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-lg m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{t('modal_create_branch_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="branchName" className={labelStyle}>{t('new_branch_name')}</label>
                        <input type="text" id="branchName" value={branchName} onChange={e => setBranchName(e.target.value)} required className={inputStyle} />
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className={labelStyle}>{t('active_industry')}</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button type="button" onClick={() => setIndustry('telecom')} className={`${buttonBase} ${industry === 'telecom' ? buttonActive : buttonInactive}`}>{t('industry_telecom')}</button>
                            <button type="button" onClick={() => setIndustry('energy')} className={`${buttonBase} ${industry === 'energy' ? buttonActive : buttonInactive}`}>{t('industry_energy')}</button>
                            <button type="button" onClick={() => setIndustry('beide')} className={`${buttonBase} ${industry === 'beide' ? buttonActive : buttonInactive}`}>{t('industry_both')}</button>
                        </div>
                    </div>

                     <div className="space-y-2 pt-2">
                        <label className={labelStyle}>{t('sales_channel')}</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button type="button" onClick={() => setSalesChannel('deur-aan-deur')} className={`${buttonBase} ${salesChannel === 'deur-aan-deur' ? buttonActive : buttonInactive}`}>{t('channel_doortodoor')}</button>
                            <button type="button" onClick={() => setSalesChannel('telefonisch')} className={`${buttonBase} ${salesChannel === 'telefonisch' ? buttonActive : buttonInactive}`}>{t('channel_telemarketing')}</button>
                            <button type="button" onClick={() => setSalesChannel('beide')} className={`${buttonBase} ${salesChannel === 'beide' ? buttonActive : buttonInactive}`}>{t('channel_both')}</button>
                        </div>
                    </div>

                    <div className="border-t border-brand-border pt-4">
                        <h3 className="font-semibold text-lg mb-2">{t('manager_details')}</h3>
                         <div className="space-y-4">
                            <div>
                                <label htmlFor="managerName" className={labelStyle}>{t('manager_full_name')}</label>
                                <input type="text" id="managerName" value={managerName} onChange={e => setManagerName(e.target.value)} required className={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="managerEmail" className={labelStyle}>{t('manager_email')}</label>
                                <input type="email" id="managerEmail" value={managerEmail} onChange={e => setManagerEmail(e.target.value)} required className={inputStyle} />
                            </div>
                            <div>
                                <label htmlFor="managerPassword" className={labelStyle}>{t('manager_temp_password')}</label>
                                <input type="password" id="managerPassword" value={managerPassword} onChange={e => setManagerPassword(e.target.value)} required className={inputStyle} />
                            </div>
                        </div>
                    </div>
                   
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('cancel')}</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity" disabled={isLoading}>
                            {isLoading ? t('creating') : t('create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBranchModal;
