

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
// FIX: Fix incorrect import names for company lists.
import { TELECOM_COMPANIES_NL as TELECOM_COMPANIES, ENERGY_COMPANIES_NL as ENERGY_COMPANIES } from '../constants';

type AuthMode = 'login' | 'register';

const AuthPage: React.FC = () => {
    // FIX: Renamed `register` to `registerManagerAccount` and aliased it as `register` for use in this component.
    const { login, registerManagerAccount: register, resetPassword } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [name, setName] = useState('');
    const [industry, setIndustry] = useState<'telecom' | 'energy' | ''>('');
    const [company, setCompany] = useState('');
    const [salesChannel, setSalesChannel] = useState<'deur-aan-deur' | 'telefonisch' | ''>('');
    const [branchName, setBranchName] = useState('');
    
    const toggleMode = () => {
        setMode(prev => prev === 'login' ? 'register' : 'login');
        setError(null);
        setMessage('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage('');
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                 setError('Uw e-mailadres of wachtwoord is incorrect.');
            } else {
                 setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !industry || !company || !salesChannel || !email || !password || !branchName) {
            setError('Alle velden zijn verplicht.');
            return;
        }
        setError(null);
        setMessage('');
        setIsLoading(true);
        try {
            const newUser: Omit<User, 'role'> = { name, email, password, industry, company, salesChannel, branchName };
            await register(newUser as Partial<User>);
        } catch (err: any)
        {
            if (err.code === 'auth/email-already-in-use') {
                setError('Dit e-mailadres is al in gebruik.');
            } else if (err.code === 'auth/weak-password') {
                setError('Uw wachtwoord moet minimaal 6 tekens lang zijn.');
            } else {
                setError('Er is een onverwachte fout opgetreden bij de registratie.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!email) {
            setError('Vul alstublieft uw e-mailadres in.');
            return;
        }
        setError(null);
        setMessage('');
        setIsLoading(true);
        try {
            await resetPassword(email);
            setMessage('Er is een e-mail met instructies voor wachtwoordherstel naar u verzonden.');
        } catch (err: any) {
             if (err.code === 'auth/user-not-found') {
                setError('Geen account gevonden voor dit e-mailadres.');
            } else {
                setError('Kon de e-mail voor wachtwoordherstel niet verzenden.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";
    const buttonBase = "w-full text-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface";
    const buttonActive = "bg-brand-primary text-white shadow-md focus:ring-brand-primary";
    const buttonInactive = "bg-brand-surface text-brand-text-secondary hover:bg-brand-border hover:text-brand-text-primary focus:ring-brand-primary/50";

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-background p-4">
            <div className="w-full max-w-lg mx-auto bg-brand-surface rounded-2xl shadow-2xl p-4 animate-fade-in">
                <div className="text-center mb-6">
                    <img src="https://i.imgur.com/moW461j.png" alt="Bedrijfslogo" className="w-62 h-64 mx-auto -mb-8" />
                    <h1 className="text-3xl font-bold text-brand-text-primary">
                        {mode === 'login' ? 'Welkom terug!' : 'Maak uw Account aan'}
                    </h1>
                    <p className="text-brand-text-secondary mt-2">
                        {mode === 'login' ? 'Log in om door te gaan naar uw Sales Copilot.' : 'Personaliseer uw AI-assistent.'}
                    </p>
                </div>
                
                {mode === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email-login" className={labelStyle}>E-mailadres</label>
                            <input id="email-login" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <label htmlFor="password-login" className={labelStyle}>Wachtwoord</label>
                                <button type="button" onClick={handlePasswordReset} className="text-sm text-brand-primary hover:underline">Wachtwoord vergeten?</button>
                            </div>
                            <input id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {message && <p className="text-green-500 text-sm text-center">{message}</p>}
                        <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                {isLoading ? 'Inloggen...' : 'Inloggen'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                         <div>
                            <label htmlFor="name-register" className={labelStyle}>Volledige Naam</label>
                            <input id="name-register" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="email-register" className={labelStyle}>E-mailadres</label>
                            <input id="email-register" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="password-register" className={labelStyle}>Wachtwoord</label>
                            <input id="password-register" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputStyle} />
                        </div>
                        <div className="space-y-2 pt-2">
                            <label className={labelStyle}>Branche</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setIndustry('telecom')} className={`${buttonBase} ${industry === 'telecom' ? buttonActive : buttonInactive}`}>Telecom</button>
                                <button type="button" onClick={() => setIndustry('energy')} className={`${buttonBase} ${industry === 'energy' ? buttonActive : buttonInactive}`}>Energie</button>
                            </div>
                        </div>
                         {industry && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label htmlFor="company" className={labelStyle}>Bedrijf</label>
                                    <select id="company" value={company} onChange={e => setCompany(e.target.value)} required className={inputStyle}>
                                        <option value="" disabled>Selecteer uw bedrijf</option>
                                        {(industry === 'telecom' ? TELECOM_COMPANIES : ENERGY_COMPANIES).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="branchName" className={labelStyle}>Filiaalnaam</label>
                                    <input id="branchName" type="text" value={branchName} onChange={e => setBranchName(e.target.value)} required className={inputStyle} placeholder="bv. Amsterdam Centrum"/>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2 pt-2">
                            <label className={labelStyle}>Verkoopkanaal</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setSalesChannel('deur-aan-deur')} className={`${buttonBase} ${salesChannel === 'deur-aan-deur' ? buttonActive : buttonInactive}`}>Deur-aan-deur</button>
                                <button type="button" onClick={() => setSalesChannel('telefonisch')} className={`${buttonBase} ${salesChannel === 'telefonisch' ? buttonActive : buttonInactive}`}>Telefonisch</button>
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                         <div className="pt-2">
                            <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                                {isLoading ? 'Registreren...' : 'Account Aanmaken'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;