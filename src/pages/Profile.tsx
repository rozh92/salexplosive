import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CameraIcon, UserCircleIcon } from '../components/icons/Icons';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from '../context/TranslationContext';

const Profile: React.FC = () => {
    const { user, updateUser, changePassword } = useAuth();
    const { t } = useTranslation();
    const [name, setName] = useState(user?.name || '');
    const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
    const [isSaved, setIsSaved] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            setIsUploading(true);
            const storageRef = ref(storage, `profilePictures/${user.email}`);
            try {
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                setProfilePicture(downloadURL);
                await updateUser({ profilePicture: downloadURL });
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Fout bij het uploaden van de afbeelding.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user && name.trim() !== '') {
                await updateUser({ name });
                setIsSaved(true);
                setTimeout(() => setIsSaved(false), 3000);
            }
        } catch (error: any) {
            alert(`Fout bij opslaan: ${error.message}`);
        }
    };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if(newPassword.length < 6) {
            setPasswordError(t('password_length_error'));
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError(t('password_mismatch_error'));
            return;
        }
        
        setIsChangingPassword(true);
        try {
            await changePassword(newPassword);
            setPasswordSuccess(t('password_change_success'));
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                setPasswordError(t('password_change_error_reauth'));
            } else {
                setPasswordError(t('password_change_error_generic'));
            }
        } finally {
            setIsChangingPassword(false);
        }
    };


    if (!user) {
        return <div>Laden...</div>;
    }

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-2";

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h1 className="text-4xl font-bold mb-8">{t('profile_title')}</h1>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg mb-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {profilePicture ? (
                                <img src={profilePicture} alt={t('profile_title')} className="w-32 h-32 rounded-full object-cover" />
                            ) : (
                                <UserCircleIcon className="w-32 h-32 text-brand-text-secondary" />
                            )}
                             <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-1 right-1 bg-brand-primary text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center w-10 h-10"
                                aria-label={t('upload_profile_picture')}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <CameraIcon className="w-5 h-5" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                                accept="image/png, image/jpeg"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className={labelStyle}>{t('your_name')}</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputStyle}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="email" className={labelStyle}>{t('email_address')}</label>
                        <input id="email" type="email" value={user.email} disabled className={`${inputStyle} cursor-not-allowed bg-brand-border/50`} />
                    </div>

                    <div>
                        <label htmlFor="role" className={labelStyle}>{t('role')}</label>
                        <input id="role" type="text" value={user.role} disabled className={`${inputStyle} cursor-not-allowed bg-brand-border/50 capitalize`} />
                    </div>


                    <div className="flex justify-end items-center pt-4">
                        {isSaved && <p className="text-green-500 mr-4 animate-fade-in">{t('profile_saved')}</p>}
                        <button
                            type="submit"
                            className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                 <h2 className="text-xl font-semibold mb-4 text-brand-text-primary">{t('security')}</h2>
                 <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className={labelStyle}>{t('new_password')}</label>
                        <input 
                            id="new-password" 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('new_password_placeholder')}
                            className={inputStyle} 
                        />
                    </div>
                     <div>
                        <label htmlFor="confirm-password" className={labelStyle}>{t('confirm_password')}</label>
                        <input 
                            id="confirm-password" 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('confirm_password_placeholder')}
                            className={inputStyle} 
                        />
                    </div>

                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                    
                     <div className="flex justify-end items-center pt-2">
                        <button
                            type="submit"
                            disabled={isChangingPassword || !newPassword || !confirmPassword}
                            className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border transition-colors disabled:opacity-50"
                        >
                            {isChangingPassword ? t('changing_password') : t('change_password')}
                        </button>
                     </div>
                 </form>
            </div>
        </div>
    );
};

export default Profile;