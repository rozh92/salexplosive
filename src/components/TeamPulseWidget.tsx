import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSalesValueForPeriod } from '../utils/salesUtils';
import { TrophyIcon, UserGroupIcon, UserIcon, UserCircleIcon } from './icons/Icons';
import { User } from '../types';
import { useTranslation } from '../context/TranslationContext';

const TeamPulseWidget: React.FC = () => {
    const { user, allUsers } = useAuth();
    const { t } = useTranslation();

    const teamData = useMemo(() => {
        if (!user || !allUsers) {
            return { teamTotalToday: 0, topPerformer: null, coachingOpportunities: [] };
        }

        let teamMembers: User[] = [];

        if (user.role === 'manager') {
            teamMembers = allUsers.filter(u => u.branchName === user.branchName && u.email !== user.email);
        } else if (user.role === 'leader' || user.role === 'team-leader') {
            teamMembers = allUsers.filter(u => user.teamMembers?.includes(u.email));
        }

        const performanceData = teamMembers.map(member => ({
            name: member.name,
            profilePicture: member.profilePicture,
            salesToday: getSalesValueForPeriod(member.sales || [], 'today'),
        })).sort((a, b) => b.salesToday - a.salesToday);

        const teamTotalToday = performanceData.reduce((sum, member) => sum + member.salesToday, 0);
        const topPerformer = performanceData.length > 0 && performanceData[0].salesToday > 0 ? performanceData[0] : null;
        const coachingOpportunities = performanceData.filter(member => member.salesToday === 0);

        return { teamTotalToday, topPerformer, coachingOpportunities };

    }, [user, allUsers]);

    const { topPerformer, coachingOpportunities } = teamData;

    return (
        <div className="bg-brand-surface rounded-xl p-6 shadow-lg h-full">
            <h2 className="text-lg font-semibold mb-4 text-brand-text-primary flex items-center">
                <UserGroupIcon className="w-6 h-6 mr-3 text-brand-primary" />
                {t('team_pulse_widget_title')}
            </h2>
            <div className="space-y-6">
                {/* Top Performer */}
                <div>
                    <h3 className="text-sm font-semibold text-brand-text-secondary mb-2 flex items-center"><TrophyIcon className="w-5 h-5 mr-2 text-yellow-500"/> {t('top_performer')}</h3>
                    {topPerformer ? (
                        <div className="flex items-center bg-brand-secondary p-3 rounded-lg">
                            {topPerformer.profilePicture ? 
                                <img src={topPerformer.profilePicture} alt={topPerformer.name} className="w-8 h-8 rounded-full object-cover mr-3" /> :
                                <UserCircleIcon className="w-8 h-8 text-brand-text-secondary mr-3" />
                            }
                            <span className="font-semibold flex-grow">{topPerformer.name}</span>
                            <span className="font-bold text-green-500">{topPerformer.salesToday.toFixed(1)}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary italic">{t('no_sales_today')}</p>
                    )}
                </div>

                {/* Coaching Opportunities */}
                <div>
                    <h3 className="text-sm font-semibold text-brand-text-secondary mb-2 flex items-center"><UserIcon className="w-5 h-5 mr-2 text-blue-500"/> {t('coaching_opportunities')}</h3>
                    {coachingOpportunities.length > 0 ? (
                        <div className="space-y-2">
                            {coachingOpportunities.map(member => (
                                <div key={member.name} className="flex items-center bg-brand-secondary p-2 rounded-lg text-sm">
                                     {member.profilePicture ? 
                                        <img src={member.profilePicture} alt={member.name} className="w-6 h-6 rounded-full object-cover mr-3" /> :
                                        <UserCircleIcon className="w-6 h-6 text-brand-text-secondary mr-3" />
                                    }
                                    <span>{member.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-brand-text-secondary italic">{t('everyone_sold_today')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamPulseWidget;
