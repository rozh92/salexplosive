import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { useTranslation } from '../context/TranslationContext';

interface EditBranchModalProps {
    isOpen: boolean;
    onClose: () => void;
    branch: { branchName: string; manager: User | null; };
}

const EditBranchModal: React.FC<EditBranchModalProps> = ({ isOpen, onClose, branch }) => {
    const { allUsers, updateBranchDetails } = useAuth();
    const { t } = useTranslation();
    const [branchName, setBranchName] = useState(branch.branchName);
    const [newManagerEmail, setNewManagerEmail] = useState(branch.manager?.email || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBranchName(branch.branchName);
            setNewManagerEmail(branch.manager?.email || '');
            setError('');
        }
    }, [isOpen, branch]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!branchName) {
            setError(t('error_branch_name_required'));
            return;
        }
        setIsLoading(true);
        try {
            await updateBranchDetails(branch.branchName, branchName, newManagerEmail !== branch.manager?.email ? newManagerEmail : undefined);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Kon filiaal niet bijwerken.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const potentialManagers = allUsers.filter(u => u.branchName === branch.branchName && u.role !== 'manager');

    const inputStyle = "w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none";
    const labelStyle = "block text-sm font-medium text-brand-text-secondary mb-1";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md m-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6">{t('modal_edit_branch_title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="branchName" className={labelStyle}>{t('new_branch_name')}</label>
                        <input type="text" id="branchName" value={branchName} onChange={e => setBranchName(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="newManager" className={labelStyle}>{t('assign_manager')}</label>
                        <select id="newManager" value={newManagerEmail} onChange={e => setNewManagerEmail(e.target.value)} className={inputStyle}>
                            {branch.manager && <option value={branch.manager.email}>{branch.manager.name} {t('current_manager_label')}</option>}
                            {potentialManagers.map(user => (
                                <option key={user.email} value={user.email}>{user.name}</option>
                            ))}
                        </select>
                         <p className="text-xs text-brand-text-secondary mt-1">{t('new_manager_help_text')}</p>
                    </div>
                   
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

export default EditBranchModal;
