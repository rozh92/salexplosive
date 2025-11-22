import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { getCompanyList } from '../constants';
import { useTranslation } from '../context/TranslationContext';

interface AddEditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({ isOpen, onClose }) => {
    const { user: manager, addTeamMember } = useAuth();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('salesperson');
    const [industry, setIndustry] = useState<'telecom' | 'energy' | ''>('');
    const [company, setCompany] = useState('');
    const [salesChannel, setSalesChannel] = useState<'deur-aan-deur' | 'telefonisch' | ''>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setEmail('');
            setPassword('');
            setRole('salesperson');
            setError('');
            
            if (manager) {
                if (manager.industry !== 'beide') {
                    setIndustry(manager.industry);
                } else {
                    setIndustry('');
                }
                if (manager.salesChannel !== 'beide') {
                    setSalesChannel(manager.salesChannel);
                } else {
                    setSalesChannel('');
                }
            }
            setCompany('');

        }
    }, [isOpen, manager]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name || !email || !password || !role || !industry || !company || !salesChannel || !manager) {
            setError(t('error_all_fields_required'));
            return;
        }
        setIsLoading(true);
        try {
            await addTeamMember({ 
                name, 
                email, 
                password, 
                company, 
                industry, 
                salesChannel,
                branchName: manager.branchName,
            }, role);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Kon lid niet toevoegen.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !manager) return null;
    
    const companyList = industry ? getCompanyList(industry, manager?.lang) : [];

    const handleIndustryChange = (newIndustry: 'telecom' | 'energy') => {
        setIndustry(newIndustry);
        setCompany(''); // Reset company when industry changes
    }

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";
    const buttonBase = "w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface";
    const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
    const buttonInactive = "bg-brand-surface text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";

    const availableRoles: UserRole[] = [];
    if (manager.role === 'leader') {
        availableRoles.push('salesperson');
    } else if (manager.role === 'team-leader') {
        availableRoles.push('salesperson', 'leader');
    } else if (manager.role === 'manager') {
        availableRoles.push('salesperson', 'leader', 'team-leader');
    } else if (manager.role === 'owner') {
        availableRoles.push('salesperson', 'leader', 'team-leader', 'manager');
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{t('modal_add_member_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className={labelStyle}>{t('name')}</label>
                            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelStyle}>{t('email')}</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className={labelStyle}>{t('temp_password')}</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
                    </div>
                     <div>
                        <label htmlFor="role" className={labelStyle}>{t('role')}</label>
                         <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} required className={inputStyle}>
                            {availableRoles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                    </div>
                    
                    {manager.industry === 'beide' ? (
                        <div className="space-y-2">
                            <label className={labelStyle}>{t('industry')}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => handleIndustryChange('telecom')} className={`${buttonBase} ${industry === 'telecom' ? buttonActive : buttonInactive}`}>{t('industry_telecom')}</button>
                                <button type="button" onClick={() => handleIndustryChange('energy')} className={`${buttonBase} ${industry === 'energy' ? buttonActive : buttonInactive}`}>{t('industry_energy')}</button>
                            </div>
                        </div>
                    ) : <input type="hidden" value={industry} />}

                    <div>
                        <label htmlFor="company" className={labelStyle}>{t('company')}</label>
                        <select id="company" value={company} onChange={e => setCompany(e.target.value)} required className={inputStyle} disabled={!industry}>
                            <option value="" disabled>{t('select_company')}</option>
                            {companyList.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                     {manager.salesChannel === 'beide' ? (
                        <div className="space-y-2">
                            <label className={labelStyle}>{t('sales_channel')}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setSalesChannel('deur-aan-deur')} className={`${buttonBase} ${salesChannel === 'deur-aan-deur' ? buttonActive : buttonInactive}`}>{t('channel_doortodoor')}</button>
                                <button type="button" onClick={() => setSalesChannel('telefonisch')} className={`${buttonBase} ${salesChannel === 'telefonisch' ? buttonActive : buttonInactive}`}>{t('channel_telemarketing')}</button>
                            </div>
                        </div>
                     ) : <input type="hidden" value={salesChannel} />}
                   
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors">{t('cancel')}</button>
                        <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity" disabled={isLoading}>
                            {isLoading ? t('saving') : t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditMemberModal;