import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { InformationCircleIcon } from '../components/icons/Icons';
import { getCompanyList } from '../constants';
import { useTranslation } from '../context/TranslationContext';

const Settings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [company, setCompany] = useState(user?.company || '');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (user) {
            setCompany(user.company);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user && company.trim() !== '') {
            try {
                await updateUser({ company });
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            } catch (error: any) {
                alert(`Fout bij opslaan van instellingen: ${error.message}`);
            }
        }
    };

    if (!user) {
        return <div>Laden...</div>;
    }

    const isManagerOrOwner = user.role === 'manager' || user.role === 'owner';
    const companyList = getCompanyList(user.industry, user.lang);
    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
    const disabledInputStyle = "w-full bg-brand-border/50 border border-brand-border rounded-lg px-4 py-3 text-brand-text-secondary cursor-not-allowed";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h1 className="text-4xl font-bold mb-8">{t('settings_title')}</h1>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className={labelStyle}>{t('your_name')}</label>
                        <input id="name" type="text" value={user.name} disabled className={disabledInputStyle} />
                    </div>
                    
                    <div>
                        <label htmlFor="email" className={labelStyle}>{t('email_address')}</label>
                        <input id="email" type="email" value={user.email} disabled className={disabledInputStyle} />
                    </div>

                    { !isManagerOrOwner && (
                        <>
                            <div>
                                <label htmlFor="company" className={labelStyle}>{t('company_name')}</label>
                                <select 
                                    id="company" 
                                    value={company} 
                                    onChange={(e) => setCompany(e.target.value)} 
                                    required 
                                    className={inputStyle}
                                >
                                    {companyList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label htmlFor="industry" className={labelStyle}>{t('industry')}</label>
                                <input id="industry" type="text" value={user.industry === 'telecom' ? 'Telecom' : 'Energie'} disabled className={disabledInputStyle} />
                            </div>

                            <div>
                                <label htmlFor="salesChannel" className={labelStyle}>{t('sales_channel')}</label>
                                <input id="salesChannel" type="text" value={user.salesChannel} disabled className={disabledInputStyle} />
                            </div>
                        </>
                    )}

                    <div className="bg-brand-secondary p-4 rounded-lg flex items-start text-brand-text-secondary text-sm">
                        <InformationCircleIcon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                             {t(isManagerOrOwner ? 'settings_info_manager' : 'settings_info_salesperson')}
                        </div>
                    </div>

                    { !isManagerOrOwner && (
                        <div className="flex justify-end items-center pt-4">
                            {isSaved && <p className="text-green-500 mr-4 animate-fade-in">{t('changes_saved')}</p>}
                            <button 
                                type="submit" 
                                className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                                disabled={company === user.company || company.trim() === ''}
                            >
                                {t('save')}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Settings;