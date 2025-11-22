import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { BuildingOfficeIcon, PlusIcon, UserCircleIcon, ArrowTrendingUpIcon, UserGroupIcon, TrashIcon } from '../components/icons/Icons';
import CreateBranchModal from '../components/CreateBranchModal';
import { useTranslation } from '../context/TranslationContext';
import LicenseManagementModal from '../components/LicenseManagementModal';

const OrganizationView: React.FC = () => {
    const { user, allUsers, deleteBranch, decreasePurchasedLicenses } = useAuth();
    const { t } = useTranslation();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [showLicenseModal, setShowLicenseModal] = useState(false);
    const [freedLicensesCount, setFreedLicensesCount] = useState(0);

    const organizationData = useMemo(() => {
        if (!user || allUsers.length === 0) return [];

        const branches: Record<string, User[]> = allUsers.reduce((acc, u) => {
            const branchName = u.branchName || 'Onbekend';
            if (!acc[branchName]) {
                acc[branchName] = [];
            }
            acc[branchName].push(u);
            return acc;
        }, {} as Record<string, User[]>);

        return Object.entries(branches).map(([branchName, members]) => {
            const manager = members.find(m => m.role === 'manager') || null;
            const employeeCount = members.length;
            const totalSalesMonth = members.reduce((sum, m) => sum + (m.totalSalesMonth || 0), 0);
            return {
                branchName,
                manager,
                employeeCount,
                totalSalesMonth,
            };
        });
    }, [user, allUsers]);

    const handleDeleteBranch = async (branch: { branchName: string; employeeCount: number }) => {
        const userCount = branch.employeeCount;
        if (window.confirm(t('delete_branch_confirm', { userCount }))) {
             try {
                const deletedCount = await deleteBranch(branch.branchName);
                setFreedLicensesCount(deletedCount);
                setShowLicenseModal(true);
            } catch (error: any) {
                alert(`Fout bij verwijderen: ${error.message}`);
            }
        }
    };
    
    const handleLicenseManagementClose = async (licensesToRemove: number) => {
        setShowLicenseModal(false);
        if (licensesToRemove > 0) {
             try {
                await decreasePurchasedLicenses(licensesToRemove);
             } catch (error: any) {
                alert(`Fout bij bijwerken licenties: ${error.message}`);
             }
        }
        setFreedLicensesCount(0);
    };

    return (
        <>
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold">{t('org_view_title')}</h1>
                    <p className="text-lg text-brand-text-secondary mt-1">{t('org_view_subtitle')}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('add_new_branch')}
                </button>
            </div>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">{t('branches_overview')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizationData.map(branch => (
                        <div key={branch.branchName} className="bg-brand-secondary p-4 rounded-lg border border-brand-border flex flex-col relative">
                             {user?.role === 'owner' && (
                                <button 
                                    onClick={() => handleDeleteBranch(branch)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-500/10"
                                    title={t('delete_branch')}
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            )}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <BuildingOfficeIcon className="w-8 h-8 text-brand-primary mr-3"/>
                                    <h3 className="text-xl font-bold truncate">{branch.branchName}</h3>
                                </div>
                            </div>
                            <div className="space-y-3 text-sm flex-grow">
                                <div className="flex items-center">
                                    {branch.manager?.profilePicture ? 
                                        <img src={branch.manager.profilePicture} alt={branch.manager.name} className="w-6 h-6 rounded-full object-cover mr-2" />
                                        : <UserCircleIcon className="w-6 h-6 mr-2 text-brand-text-secondary"/>
                                    }
                                    <span className="font-semibold mr-1">{t('manager_label')}</span>
                                    <span className="truncate">{branch.manager?.name || t('manager_not_assigned')}</span>
                                </div>
                                <div className="flex items-center">
                                    <UserGroupIcon className="w-6 h-6 mr-2 text-brand-text-secondary"/>
                                    <span className="font-semibold mr-1">{t('employees_label')}</span>
                                    <span>{branch.employeeCount}</span>
                                </div>
                                <div className="flex items-center">
                                    <ArrowTrendingUpIcon className="w-6 h-6 mr-2 text-brand-text-secondary"/>
                                    <span className="font-semibold mr-1">{t('sales_month_label')}</span>
                                    <span>{branch.totalSalesMonth.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 {organizationData.length === 0 && (
                     <div className="text-center py-12 text-brand-text-secondary">
                        <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-4"/>
                        <p className="font-semibold">{t('branches_empty_title')}</p>
                        <p className="text-sm">{t('branches_empty_subtitle')}</p>
                    </div>
                )}
            </div>

            <CreateBranchModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
        <LicenseManagementModal 
            isOpen={showLicenseModal}
            onClose={() => handleLicenseManagementClose(0)}
            freedLicenses={freedLicensesCount}
            onConfirm={handleLicenseManagementClose}
        />
        </>
    );
};

export default OrganizationView;