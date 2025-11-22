import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Page } from '../types';
import { BuildingOfficeIcon, ArrowTrendingUpIcon, UserGroupIcon, TrophyIcon, PencilSquareIcon, ArchiveBoxIcon, BuildingStorefrontIcon } from '../components/icons/Icons';
import Markdown from 'react-markdown';
import { useTranslation } from '../context/TranslationContext';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; trendColor?: string; }> = ({ title, value, icon, trend, trendColor }) => (
    <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center overflow-hidden">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div className="min-w-0">
            <h2 className="text-sm font-semibold text-brand-text-secondary">{title}</h2>
            <p className="text-3xl font-bold text-brand-text-primary truncate" title={value}>{value}</p>
            {trend && <p className={`text-sm font-semibold ${trendColor}`}>{trend}</p>}
        </div>
    </div>
);

const OwnerDashboard: React.FC<{ setCurrentPage: (page: Page) => void }> = ({ setCurrentPage }) => {
    const { user, allUsers, addKnowledgeBasePost } = useAuth();
    const { t } = useTranslation();
    const [quickPostTitle, setQuickPostTitle] = useState('');
    const [quickPostContent, setQuickPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const organizationData = useMemo(() => {
        if (!user || allUsers.length === 0) return null;

        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const branches: Record<string, User[]> = allUsers.reduce((acc, u) => {
            const branchName = u.branchName || 'Onbekend';
            if (!acc[branchName]) acc[branchName] = [];
            acc[branchName].push(u);
            return acc;
        }, {} as Record<string, User[]>);

        const allSales = allUsers.flatMap(u => u.sales || []);
        
        const totalOrgSalesMonth = allSales
            .filter(sale => new Date(sale.date) >= startOfCurrentMonth)
            .reduce((sum, sale) => sum + sale.value, 0);
            
        const totalOrgSalesLastMonth = allSales
            .filter(sale => {
                const saleDate = new Date(sale.date);
                return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
            })
            .reduce((sum, sale) => sum + sale.value, 0);

        const salesTrend = totalOrgSalesLastMonth > 0
            ? ((totalOrgSalesMonth - totalOrgSalesLastMonth) / totalOrgSalesLastMonth) * 100
            : (totalOrgSalesMonth > 0 ? 100 : 0);

        const branchPerformance = Object.entries(branches).map(([branchName, members]) => {
            const branchSales = members.flatMap(m => m.sales || []).filter(s => new Date(s.date) >= startOfCurrentMonth);
            const totalSales = branchSales.reduce((sum, s) => sum + s.value, 0);
            const employeeCount = members.length;
            const salesPerFte = employeeCount > 0 ? totalSales / employeeCount : 0;
            return { branchName, totalSales, employeeCount, salesPerFte };
        }).sort((a, b) => b.totalSales - a.totalSales);

        return {
            totalBranches: Object.keys(branches).length,
            totalEmployees: allUsers.length,
            totalOrgSalesMonth,
            salesTrend,
            topBranch: branchPerformance[0] || null,
            branchPerformance,
        };
    }, [user, allUsers]);

    const handleQuickPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickPostTitle || !quickPostContent) return;
        setIsPosting(true);
        try {
            await addKnowledgeBasePost(quickPostTitle, quickPostContent);
            setQuickPostTitle('');
            setQuickPostContent('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsPosting(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('greeting_morning');
        if (hour < 18) return t('greeting_afternoon');
        return t('greeting_evening');
    };

    if (!organizationData) return <p>Data wordt geladen...</p>;

    const { totalBranches, totalEmployees, totalOrgSalesMonth, salesTrend, topBranch, branchPerformance } = organizationData;
    const trendColor = salesTrend >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold mb-1">{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
                <p className="text-lg text-brand-text-secondary">{t('owner_dashboard_welcome')}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title={t('kpi_total_value_month')} value={`${totalOrgSalesMonth.toFixed(1)}`} icon={<ArrowTrendingUpIcon className="w-8 h-8 text-brand-primary"/>} trend={`${salesTrend >= 0 ? '+' : ''}${salesTrend.toFixed(1)}% ${t('vs_last_month')}`} trendColor={trendColor} />
                <KpiCard title={t('kpi_top_branch')} value={topBranch?.branchName || '-'} icon={<TrophyIcon className="w-8 h-8 text-brand-primary"/>} />
                <KpiCard title={t('kpi_total_branches')} value={String(totalBranches)} icon={<BuildingStorefrontIcon className="w-8 h-8 text-brand-primary"/>} />
                <KpiCard title={t('kpi_total_employees')} value={String(totalEmployees)} icon={<UserGroupIcon className="w-8 h-8 text-brand-primary"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2">
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">{t('branch_performance_month')}</h2>
                        <div className="space-y-3 max-h-[calc(100vh-30rem)] overflow-y-auto pr-2 -mr-2">
                            {branchPerformance.map((branch, index) => (
                                <div key={branch.branchName} className="bg-brand-secondary p-4 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-lg font-bold w-8 text-center">{index + 1}</span>
                                        <div>
                                            <p className="font-bold text-brand-text-primary">{branch.branchName}</p>
                                            <p className="text-xs text-brand-text-secondary">{branch.employeeCount} {t('employees_short')} &bull; {branch.salesPerFte.toFixed(1)} {t('sales_per_fte')}</p>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-brand-primary">{branch.totalSales.toFixed(1)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">{t('quick_announcement')}</h3>
                        <form onSubmit={handleQuickPost} className="space-y-3">
                            <input type="text" value={quickPostTitle} onChange={e => setQuickPostTitle(e.target.value)} placeholder={t('quick_announcement_title_placeholder')} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 text-sm" />
                            <textarea value={quickPostContent} onChange={e => setQuickPostContent(e.target.value)} placeholder={t('quick_announcement_body_placeholder')} rows={3} className="w-full bg-brand-secondary border border-brand-border rounded-lg px-3 py-2 text-sm resize-none"></textarea>
                            <button type="submit" disabled={isPosting} className="w-full bg-brand-primary text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
                                {isPosting ? t('publishing') : t('publish')}
                            </button>
                        </form>
                    </div>

                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                         <h3 className="text-lg font-semibold mb-3">{t('quick_links')}</h3>
                         <div className="space-y-2">
                             <button onClick={() => setCurrentPage(Page.Organization)} className="w-full flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border">
                                <BuildingOfficeIcon className="w-5 h-5 mr-3 text-brand-text-secondary"/>
                                <span className="font-semibold">{t('manage_organization')}</span>
                             </button>
                             <button onClick={() => setCurrentPage(Page.PackageManagement)} className="w-full flex items-center p-3 rounded-lg bg-brand-secondary hover:bg-brand-border">
                                <ArchiveBoxIcon className="w-5 h-5 mr-3 text-brand-text-secondary"/>
                                <span className="font-semibold">{t('manage_packages')}</span>
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;