import React, { useMemo, useState } from 'react';
import { User, UserRole } from '../types';
import { UserCircleIcon, ArrowTrendingUpIcon, BriefcaseIcon, WifiIcon, BoltIcon, PlusIcon, UserGroupIcon, ClockIcon, MagnifyingGlassIcon, TrashIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import { getSalesValueForPeriod, getAverageSalesValueForPeriod } from '../utils/salesUtils';
import AddEditMemberModal from '../components/AddEditMemberModal';
import { useTranslation } from '../context/TranslationContext';
import LicenseManagementModal from '../components/LicenseManagementModal';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

const roleConfig: Record<UserRole, { label: string; color: string }> = {
    'salesperson': { label: 'Salesperson', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
    'leader': { label: 'Leader', color: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' },
    'team-leader': { label: 'Team Leader', color: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    'manager': { label: 'Manager', color: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
    'owner': { label: 'Owner', color: 'bg-red-500/10 text-red-500 border border-red-500/20' }
};

interface SectorData {
    totalEmployees: number;
    totalSales: number;
    companies: Record<string, { employees: number; sales: number }>;
}

const SectorStatsCard: React.FC<{ title: string; icon: React.ReactNode; data: SectorData }> = ({ title, icon, data }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div>
                    <h3 className="text-xl font-bold text-brand-text-primary">{title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-brand-text-secondary">
                        <span><strong className="text-brand-text-primary">{data.totalEmployees}</strong> {t('employees')}</span>
                        <span>&bull;</span>
                        <span><strong className="text-brand-text-primary">{data.totalSales.toFixed(1)}</strong> {t('sales_month')}</span>
                    </div>
                </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-brand-border max-h-48 overflow-y-auto">
                {Object.entries(data.companies).length > 0 ? (
                    Object.entries(data.companies).map(([companyName, companyData]) => (
                        <div key={companyName} className="flex justify-between items-center bg-brand-secondary p-2 rounded-md">
                            <span className="font-semibold text-sm">{companyName}</span>
                            <div className="text-right">
                                <p className="font-bold text-brand-primary">{(companyData as SectorData['companies'][string]).sales.toFixed(1)}</p>
                                <p className="text-xs text-brand-text-secondary">{(companyData as SectorData['companies'][string]).employees} medewerker(s)</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-brand-text-secondary text-center">{t('no_employees_in_sector')}</p>
                )}
            </div>
        </div>
    );
};


const ManagerView: React.FC = () => {
    const { user, allUsers, updateTeamMemberRole, deleteUser, decreasePurchasedLicenses } = useAuth();
    const { t, language } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
    const [extraLicenses, setExtraLicenses] = useState(1);
    const [licensePurchaseSuccess, setLicensePurchaseSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLicenseManagementModal, setShowLicenseManagementModal] = useState(false);
    const [freedLicensesCount, setFreedLicensesCount] = useState(0);

    const branchUsers = useMemo(() => {
        return allUsers.filter(u => u.branchName === user?.branchName);
    }, [allUsers, user]);

    const branchEmployees = useMemo(() => {
        return branchUsers.filter(u => u.email !== user?.email);
    }, [branchUsers, user]);

    const branchSales = useMemo(() => {
        return branchEmployees.flatMap(m => m.sales || []);
    }, [branchEmployees]);
    
    const totalMonthlySales = useMemo(() => {
        return getSalesValueForPeriod(branchSales, 'month');
    }, [branchSales]);

    const weeklyAverage = useMemo(() => {
        return getAverageSalesValueForPeriod(branchSales, 'week');
    }, [branchSales]);

    const monthlyAverage = useMemo(() => {
        return getAverageSalesValueForPeriod(branchSales, 'month');
    }, [branchSales]);

    const fteStats = useMemo(() => {
        if (!user) return { total: 0, teamLeaders: 0, leaders: 0, salespersons: 0 };
        return {
            total: branchEmployees.length,
            teamLeaders: branchEmployees.filter(u => u.role === 'team-leader').length,
            leaders: branchEmployees.filter(u => u.role === 'leader').length,
            salespersons: branchEmployees.filter(u => u.role === 'salesperson').length,
        };
    }, [branchEmployees, user]);

    const sectorStats = useMemo(() => {
        if (!user) return { telecom: null, energy: null };
        
        const telecomUsers = branchEmployees.filter(u => u.industry === 'telecom');
        const energyUsers = branchEmployees.filter(u => u.industry === 'energy');
    
        const processSector = (users: User[]): SectorData => {
            const totalSales = getSalesValueForPeriod(users.flatMap(u => u.sales || []), 'month');
            const companies = users.reduce((acc, current) => {
                if (!acc[current.company]) {
                    acc[current.company] = { employees: 0, sales: 0 };
                }
                acc[current.company].employees += 1;
                return acc;
            }, {} as Record<string, { employees: number, sales: number }>);
    
            for (const companyName in companies) {
                const companyUsers = users.filter(u => u.company === companyName);
                companies[companyName].sales = getSalesValueForPeriod(companyUsers.flatMap(u => u.sales || []), 'month');
            }
    
            return {
                totalEmployees: users.length,
                totalSales: totalSales,
                companies: companies
            };
        };
    
        return {
            telecom: processSector(telecomUsers),
            energy: processSector(energyUsers),
        };
    
    }, [branchEmployees, user]);
    
    const sortedUsers = useMemo(() => {
        const roleOrder: Record<UserRole, number> = { 'owner': 0, 'manager': 1, 'team-leader': 2, 'leader': 3, 'salesperson': 4 };
        return [...branchEmployees].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    }, [branchEmployees]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return sortedUsers;
        }
        return sortedUsers.filter(member => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sortedUsers, searchTerm]);

    const handleRoleChange = async (memberEmail: string, newRole: UserRole) => {
        if (window.confirm(t('change_role_confirm', { role: roleConfig[newRole].label }))) {
            try {
                await updateTeamMemberRole(memberEmail, newRole);
            } catch (error) {
                console.error("Role change failed:", error);
            }
        }
    };

    const handleDeleteUser = async (member: User) => {
        if (window.confirm(t('delete_user_confirm'))) {
            try {
                if (!member.uid) return;
                await deleteUser(member.uid);
                if (user?.role === 'owner') {
                    setFreedLicensesCount(1);
                    setShowLicenseManagementModal(true);
                }
            } catch (error: any) {
                alert(`Fout bij verwijderen: ${error.message}`);
            }
        }
    };

    const handleLicenseManagementClose = async (licensesToRemove: number) => {
        setShowLicenseManagementModal(false);
        if (licensesToRemove > 0 && user?.role === 'owner') {
             try {
                await decreasePurchasedLicenses(licensesToRemove);
             } catch (error: any) {
                alert(`Fout bij bijwerken licenties: ${error.message}`);
             }
        }
        setFreedLicensesCount(0);
    };

    const getAvailableRolesForManager = (member: User): UserRole[] => {
        if (!user || user.email === member.email) return [member.role];

        if (user.role === 'manager') {
            return ['salesperson', 'leader', 'team-leader'];
        }
        
        // This view is for managers, but as a safeguard for owners:
        if (user.role === 'owner') {
             return ['salesperson', 'leader', 'team-leader', 'manager'];
        }
        return [member.role];
    };

    const handlePurchaseLicenses = async () => {
        setIsSubmitting(true);
        try {
            const functions = getFunctions(app, 'europe-west3');
            const requestExtraLicenses = httpsCallable(functions, 'requestExtraLicenses');
            
            const totalCostString = priceFormatter(extraLicenses * 9.99);

            await requestExtraLicenses({ 
                numberOfLicenses: extraLicenses,
                totalCost: totalCostString,
            });

            setLicensePurchaseSuccess(true);
            setTimeout(() => {
                setIsLicenseModalOpen(false);
                setTimeout(() => {
                    setLicensePurchaseSuccess(false);
                    setExtraLicenses(1);
                }, 500);
            }, 4000);

        } catch (error: any) {
            console.error("Fout bij aanvragen extra licenties (Manager):", error);
            alert(`Er is een fout opgetreden bij het indienen van uw aanvraag: ${error.message}. Bekijk de console (F12) voor technische details.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;
    
    const currency = language === 'en' ? 'GBP' : 'EUR';
    const locale = language === 'en' ? 'en-GB' : language === 'de' ? 'de-DE' : 'nl-NL';

    const priceFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
    }).format;

    const formattedLicensePrice = priceFormatter(9.99);
    const formattedTotalCostModal = priceFormatter(extraLicenses * 9.99);

    return (
        <>
        <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold">{t('my_branch_title')} {user.branchName}</h1>
                    <p className="text-lg text-brand-text-secondary mt-1">{t('my_branch_subtitle')}</p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={() => setIsLicenseModalOpen(true)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border transition-colors">
                        {t('buy_extra_licenses')}
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('add_member')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                        <ArrowTrendingUpIcon className="w-8 h-8 text-brand-primary"/>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_total_value_month')}</h2>
                        <p className="text-4xl font-bold text-brand-text-primary">{totalMonthlySales.toFixed(1)}</p>
                    </div>
                </div>
                 <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                        <UserGroupIcon className="w-7 h-7 text-brand-primary"/>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_total_fte')}</h2>
                        <p className="text-4xl font-bold text-brand-text-primary">{fteStats.total}</p>
                        <div className="text-xs text-brand-text-secondary mt-1 space-x-2">
                            <span>{fteStats.teamLeaders} TL</span>
                            <span>&bull;</span>
                            <span>{fteStats.leaders} L</span>
                            <span>&bull;</span>
                            <span>{fteStats.salespersons} SP</span>
                        </div>
                    </div>
                </div>
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                    <div className="w-14 h-14 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-6 h-6 text-brand-primary"/>
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_weekly_avg_branch')}</h2>
                        <p className="text-3xl font-bold text-brand-text-primary">{weeklyAverage.toFixed(1)}</p>
                    </div>
                </div>
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                     <div className="w-14 h-14 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-6 h-6 text-brand-primary"/>
                     </div>
                    <div>
                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_monthly_avg_branch')}</h2>
                        <p className="text-3xl font-bold text-brand-text-primary">{monthlyAverage.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sectorStats.telecom && <SectorStatsCard title={t('sector_telecom')} icon={<WifiIcon className="w-6 h-6 text-blue-500"/>} data={sectorStats.telecom} />}
                {sectorStats.energy && <SectorStatsCard title={t('sector_energy')} icon={<BoltIcon className="w-6 h-6 text-yellow-500"/>} data={sectorStats.energy} />}
            </div>
            
            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h2 className="text-xl font-semibold mb-2 sm:mb-0">{t('branch_members')}</h2>
                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder={t('search_employee')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-brand-secondary border border-brand-border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map(member => {
                        const roleInfo = roleConfig[member.role] || { label: member.role, color: 'bg-gray-500/10 text-gray-500' };
                        const availableRoles = getAvailableRolesForManager(member);
                        
                        return (
                             <div key={member.email} className="bg-brand-secondary rounded-lg p-4 flex flex-col border border-brand-border relative">
                                {user?.email !== member.email && (
                                     <button 
                                        onClick={() => handleDeleteUser(member)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-500/10"
                                        title={t('delete_user')}
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                )}
                                <div className="flex items-start mb-4">
                                     {member.profilePicture ? 
                                        <img src={member.profilePicture} alt={member.name} className="w-12 h-12 rounded-full object-cover mr-4 flex-shrink-0" /> :
                                        <UserCircleIcon className="w-12 h-12 text-brand-text-secondary mr-4 flex-shrink-0" />
                                    }
                                    <div>
                                        <p className="font-bold text-brand-text-primary">{member.name}</p>
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                                        <div className="flex items-center text-xs text-brand-text-secondary mt-2">
                                            {member.industry === 'telecom' ? <WifiIcon className="w-4 h-4 mr-1.5" /> : <BoltIcon className="w-4 h-4 mr-1.5" />}
                                            <span className="capitalize">{member.industry}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-brand-text-secondary mt-1">
                                            <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                                            <span>{member.company}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-brand-text-primary flex-grow pt-4 border-t border-brand-border/50">
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-secondary">{t('today')}:</span>
                                        <span className="font-semibold">{getSalesValueForPeriod(member.sales || [], 'today').toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-secondary">{t('this_week')}:</span>
                                        <span className="font-semibold">{getSalesValueForPeriod(member.sales || [], 'week').toFixed(1)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-brand-text-secondary">{t('this_month')}:</span>
                                        <span className="font-semibold">{getSalesValueForPeriod(member.sales || [], 'month').toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-brand-border">
                                    <label className="text-xs text-brand-text-secondary mb-1 block">{t('change_role')}</label>
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.email, e.target.value as UserRole)}
                                        className="w-full bg-brand-surface border border-brand-border rounded-md px-2 py-1.5 text-sm font-medium text-brand-text-primary focus:ring-2 focus:ring-brand-primary disabled:opacity-70 disabled:cursor-not-allowed"
                                        disabled={user.email === member.email}
                                    >
                                        {availableRoles.map(r => (
                                            <option key={r} value={r} className="capitalize">{roleConfig[r].label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <AddEditMemberModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
            
            {isLicenseModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in-fast" onClick={() => !licensePurchaseSuccess && setIsLicenseModalOpen(false)}>
                    <div className="bg-brand-surface rounded-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        {licensePurchaseSuccess ? (
                            <div className="text-center">
                                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xl font-bold text-brand-text-primary mt-4">{t('buy_licenses_modal_success_title')}</h3>
                                <p className="text-brand-text-secondary mt-2">
                                    {t('buy_licenses_modal_success_body')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-6">{t('buy_licenses_modal_title')}</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="extraLicenses" className="block text-sm font-medium text-brand-text-secondary mb-2">{t('buy_licenses_modal_amount')}</label>
                                        <input
                                            id="extraLicenses"
                                            type="number"
                                            min="1"
                                            value={extraLicenses}
                                            onChange={(e) => setExtraLicenses(parseInt(e.target.value) || 1)}
                                            className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-brand-text-secondary">{t('buy_licenses_modal_price_per', { price: formattedLicensePrice })}</p>
                                        <p className="text-2xl font-bold text-brand-text-primary">
                                            {t('buy_licenses_modal_total', { total_cost: formattedTotalCostModal })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-4 pt-6">
                                    <button type="button" onClick={() => setIsLicenseModalOpen(false)} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg">{t('cancel')}</button>
                                    <button onClick={handlePurchaseLicenses} disabled={isSubmitting} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg">
                                        {isSubmitting ? t('sending_request') : t('buy_licenses_modal_submit')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
        <LicenseManagementModal 
            isOpen={showLicenseManagementModal}
            onClose={() => handleLicenseManagementClose(0)}
            freedLicenses={freedLicensesCount}
            onConfirm={handleLicenseManagementClose}
        />
        </>
    );
};

export default ManagerView;