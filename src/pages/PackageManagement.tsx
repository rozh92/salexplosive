
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProductPackage } from '../types';
import { PlusIcon, TrashIcon, ArchiveBoxIcon } from '../components/icons/Icons';
import { getCompanyList } from '../constants';
import { useTranslation } from '../context/TranslationContext';

const PackageManagement: React.FC = () => {
    const { user, productPackages, addProductPackage, updateProductPackage, deleteProductPackage } = useAuth();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ProductPackage | null>(null);
    const [formState, setFormState] = useState<Omit<ProductPackage, 'id'>>({ name: '', industry: 'telecom', company: '', value: 1.0 });

    useEffect(() => {
        if (editingPackage) {
            setFormState(editingPackage);
        } else {
            setFormState({ name: '', industry: user?.industry === 'beide' ? 'telecom' : user?.industry || 'telecom', company: '', value: 1.0 });
        }
    }, [editingPackage, user]);

    const openModal = (pkg: ProductPackage | null) => {
        setEditingPackage(pkg);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPackage(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue: string | number | 'telecom' | 'energy' | 'beide' = value;
        if (name === 'value') {
            finalValue = parseFloat(value) || 0;
        }
        setFormState(prev => ({ ...prev, [name]: finalValue as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPackage) {
                await updateProductPackage({ ...editingPackage, ...formState });
            } else {
                await addProductPackage(formState);
            }
            closeModal();
        } catch (error: any) {
            alert(`Fout: ${error.message}`);
        }
    };
    
    const handleDelete = async (packageId: string) => {
        if(window.confirm('Weet u zeker dat u dit pakket wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
            try {
                await deleteProductPackage(packageId);
            } catch (error: any) {
                alert(`Fout: ${error.message}`);
            }
        }
    };

    if (!user || (user.role !== 'manager' && user.role !== 'owner')) return null;

    const companyList = getCompanyList(formState.industry, user?.lang);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold">{t('pkg_mgmt_title')}</h1>
                    <p className="text-lg text-brand-text-secondary mt-1">{t('pkg_mgmt_subtitle')}</p>
                </div>
                {(user.role === 'manager' || user.role === 'owner') && (
                    <button onClick={() => openModal(null)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('new_package')}
                    </button>
                )}
            </div>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productPackages.map(pkg => (
                        <div key={pkg.id} className="bg-brand-secondary rounded-lg p-4 border border-brand-border flex flex-col">
                            <div className="flex-grow">
                                <p className="font-bold text-lg">{pkg.name}</p>
                                <p className="text-sm text-brand-text-secondary">{pkg.company} ({pkg.industry})</p>
                                <p className="text-2xl font-bold text-brand-primary my-4">{pkg.value.toFixed(1)} <span className="text-sm font-normal text-brand-text-secondary">{t('contract_value')}</span></p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => openModal(pkg)} className="w-full bg-brand-surface text-brand-text-primary text-sm font-semibold py-2 px-4 rounded-md hover:bg-brand-border">{t('edit')}</button>
                                <button onClick={() => handleDelete(pkg.id)} className="bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white grid place-items-center w-8 h-8"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                    {productPackages.length === 0 && (
                        <div className="col-span-full text-center text-brand-text-secondary py-10">
                            <ArchiveBoxIcon className="w-12 h-12 mx-auto mb-4"/>
                            <p>{t('pkg_empty_state')}</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">{editingPackage ? t('modal_edit_package') : t('modal_new_package')}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label>{t('package_name')}</label>
                                <input name="name" value={formState.name} onChange={handleFormChange} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2"/>
                            </div>
                             <div>
                                <label>{t('industry')}</label>
                                <select name="industry" value={formState.industry} onChange={handleFormChange} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2">
                                    <option value="telecom">{t('industry_telecom')}</option>
                                    <option value="energy">{t('industry_energy')}</option>
                                </select>
                            </div>
                             <div>
                                <label>{t('company')}</label>
                                <select name="company" value={formState.company} onChange={handleFormChange} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2">
                                     <option value="" disabled>{t('select_company')}</option>
                                    {companyList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>{t('contract_value')}</label>
                                <input name="value" type="number" step="0.1" value={formState.value} onChange={handleFormChange} required className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2"/>
                            </div>
                            <div className="flex justify-end space-x-4 pt-4">
                                <button type="button" onClick={closeModal} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-brand-border">{t('cancel')}</button>
                                <button type="submit" className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90">{t('save')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackageManagement;
