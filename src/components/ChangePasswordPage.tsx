import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DocumentTextIcon } from './icons/Icons';
import { useTranslation } from '../context/TranslationContext';

const ChangePasswordPage: React.FC = () => {
    const { user, changePassword } = useAuth();
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError(t('password_length_error'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t('password_mismatch_error'));
            return;
        }
        setIsLoading(true);
        try {
            await changePassword(newPassword);
            // The context update will trigger a re-render in App.tsx and show the main layout
        } catch (err) {
            setError(t('password_change_error_generic'));
            setIsLoading(false);
        }
    };
    
    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";

    return (
        <div className="fixed inset-0 bg-brand-background z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto bg-brand-surface rounded-2xl shadow-2xl p-8 animate-fade-in">
                 <div className="text-center mb-8">
                    <DocumentTextIcon className="w-12 h-12 text-brand-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-brand-text-primary">
                        {t('change_pw_welcome', { name: user?.name?.split(' ')[0] })}
                    </h1>
                    <p className="text-brand-text-secondary mt-2">
                        {t('change_pw_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="new-password" className={labelStyle}>{t('new_password')}</label>
                        <input 
                            id="new-password" 
                            type="password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            required 
                            className={inputStyle} 
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className={labelStyle}>{t('confirm_new_password')}</label>
                        <input 
                            id="confirm-password" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                            className={inputStyle} 
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? t('saving') : t('set_password_and_continue')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
