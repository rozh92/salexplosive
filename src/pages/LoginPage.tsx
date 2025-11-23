import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

const LoginPage: React.FC = () => {
    const { login, resetPassword } = useAuth();
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage('');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            if (err.name === 'PendingApproval') {
                setError(t('login_error_pending'));
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                 setError(t('login_error_credentials'));
            } else {
                 setError(t('login_error_generic'));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!email) {
            setError(t('error_email_format'));
            return;
        }
        setError(null);
        setMessage('');
        setIsLoading(true);
        try {
            await resetPassword(email);
            setMessage(t('password_reset_sent'));
        } catch (err: any) {
             if (err.code === 'auth/user-not-found') {
                setError(t('password_reset_not_found'));
            } else {
                setError(t('password_reset_error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-background p-4">
            <div className="w-full max-w-lg mx-auto bg-brand-surface rounded-2xl shadow-2xl p-4 sm:p-8 animate-fade-in">
                <div className="text-center mb-6">
                    <a href="/#/">
                        <img src="https://i.imgur.com/moW461j.png" alt="Bedrijfslogo" className="w-40 h-auto mx-auto" />
                    </a>
                    <h1 className="text-3xl font-bold text-brand-text-primary mt-4">
                        {t('login_welcome_back')}
                    </h1>
                    <p className="text-brand-text-secondary mt-2">
                        {t('login_subtitle')}
                    </p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6 mt-4">
                    <div>
                        <label htmlFor="email-login" className={labelStyle}>{t('email_address')}</label>
                        <input id="email-login" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="password-login" className={labelStyle}>{t('password')}</label>
                            <button type="button" onClick={handlePasswordReset} className="text-sm text-brand-primary hover:underline">{t('forgot_password')}</button>
                        </div>
                        <input id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                            {isLoading ? t('logging_in') : t('login')}
                        </button>
                    </div>
                </form>
                <div className="mt-6 text-center">
                    <a href="/#/register" className="text-sm text-brand-primary hover:underline">
                        {t('no_account_yet')} {t('register_company')}
                    </a>
                </div>

                {/* Anti-Phishing Footer: Cruciaal om suspension te voorkomen */}
                <div className="mt-8 border-t border-brand-border pt-4 text-center text-xs text-brand-text-secondary">
                  <div className="flex justify-center space-x-4">
                    <a href="/#/privacy" className="hover:text-brand-primary transition-colors">Privacybeleid</a>
                    <a href="/#/terms" className="hover:text-brand-primary transition-colors">Algemene Voorwaarden</a>
                    <a href="/#/contact" className="hover:text-brand-primary transition-colors">Contact</a>
                  </div>
                  <p className="mt-2">&copy; {new Date().getFullYear()} SalExplosive. Alle rechten voorbehouden.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
