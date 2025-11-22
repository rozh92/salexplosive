import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { useTranslation } from '../context/TranslationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../App';
import { ChartPieIcon, UserCircleIcon } from '../components/icons/Icons';
import { getAverageSalesValueForPeriod, getSalesValueForPeriod } from '../utils/salesUtils';

const SalesAnalytics: React.FC = () => {
    const { allUsers } = useAuth();
    const { t } = useTranslation();
    const { theme } = useTheme();

    const branchData = useMemo(() => {
        if (allUsers.length === 0) return [];

        const branches: Record<string, User[]> = allUsers.reduce((acc, u) => {
            const branchName = u.branchName || 'Onbekend';
            if (!acc[branchName]) acc[branchName] = [];
            acc[branchName].push(u);
            return acc;
        }, {} as Record<string, User[]>);

        return Object.entries(branches).map(([branchName, members]) => {
            const manager = members.find(m => m.role === 'manager') || null;
            const branchSales = members.flatMap(m => m.sales || []);
            const totalSalesMonth = getSalesValueForPeriod(branchSales, 'month');
            const avgDailySalesMonth = getAverageSalesValueForPeriod(branchSales, 'month');
            
            return {
                branchName,
                manager,
                employeeCount: members.length,
                totalSalesMonth,
                avgDailySalesMonth,
            };
        }).sort((a, b) => b.avgDailySalesMonth - a.avgDailySalesMonth);
    }, [allUsers]);

    const tickColor = theme === 'dark' ? '#adb5bd' : '#868e96';
    const gridColor = theme === 'dark' ? '#343a40' : '#e9ecef';
    const barColor = theme === 'dark' ? '#587CF8' : '#4C6EF5';
    const tooltipBackgroundColor = theme === 'dark' ? '#1E1E1E' : '#ffffff';
    const tooltipBorderColor = theme === 'dark' ? '#343a40' : '#e9ecef';

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold">{t('sales_analytics_title')}</h1>
                <p className="text-lg text-brand-text-secondary mt-1">{t('sales_analytics_subtitle')}</p>
            </div>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-brand-text-primary">{t('monthly_avg_sales_per_branch')}</h2>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={branchData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="branchName" stroke={tickColor} />
                            <YAxis stroke={tickColor} />
                            <Tooltip contentStyle={{ backgroundColor: tooltipBackgroundColor, border: `1px solid ${tooltipBorderColor}` }} cursor={{ fill: 'rgba(76, 110, 245, 0.1)' }} />
                            <Legend />
                            <Bar dataKey="avgDailySalesMonth" fill={barColor} name={t('avg_daily_sales')} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg">
                <div className="p-6">
                    <h2 className="text-xl font-semibold">{t('branch_performance_month')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-secondary">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('branch')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary">{t('manager_label')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary text-center">{t('employees')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary text-right">{t('total_sales')}</th>
                                <th className="p-4 text-sm font-semibold text-brand-text-secondary text-right">{t('avg_daily_sales')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branchData.map(branch => (
                                <tr key={branch.branchName} className="border-b border-brand-border">
                                    <td className="p-4 font-medium">{branch.branchName}</td>
                                    <td className="p-4 text-brand-text-secondary">
                                        <div className="flex items-center">
                                            {branch.manager?.profilePicture ? 
                                                <img src={branch.manager.profilePicture} alt={branch.manager.name} className="w-6 h-6 rounded-full object-cover mr-2" />
                                                : <UserCircleIcon className="w-6 h-6 mr-2 text-brand-text-secondary"/>
                                            }
                                            <span>{branch.manager?.name || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-brand-text-secondary text-center">{branch.employeeCount}</td>
                                    <td className="p-4 font-semibold text-right">{branch.totalSalesMonth.toFixed(1)}</td>
                                    <td className="p-4 font-bold text-brand-primary text-right">{branch.avgDailySalesMonth.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {branchData.length === 0 && (
                        <div className="text-center py-12 text-brand-text-secondary">
                            <ChartPieIcon className="w-12 h-12 mx-auto mb-2"/>
                            {t('branches_empty_title')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
