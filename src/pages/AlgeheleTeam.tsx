import React, { useMemo, useState } from 'react';
import { User, UserRole } from '../types';
import { UserCircleIcon, BriefcaseIcon, WifiIcon, BoltIcon, MagnifyingGlassIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { getAverageSalesValueForPeriod } from '../utils/salesUtils';

const roleConfig: Record<UserRole, { label: string; color: string, order: number }> = {
    'owner': { label: 'Owner', color: 'bg-red-500/10 text-red-500', order: 0 },
    'manager': { label: 'Manager', color: 'bg-yellow-500/10 text-yellow-500', order: 1 },
    'team-leader': { label: 'Team Leader', color: 'bg-green-500/10 text-green-500', order: 2 },
    'leader': { label: 'Leader', color: 'bg-purple-500/10 text-purple-500', order: 3 },
    'salesperson': { label: 'Salesperson', color: 'bg-blue-500/10 text-blue-500', order: 4 }
};

const TeamMemberCard: React.FC<{ member: User; currentUser: User; isSubordinate?: boolean }> = ({ member, currentUser, isSubordinate }) => {
    const { t } = useTranslation();

    const canShowStats = useMemo(() => {
        const viewerRole = currentUser.role;
        const targetRole = member.role;

        if (['owner', 'manager', 'team-leader'].includes(viewerRole)) {
            return true;
        }
        if (viewerRole === 'leader') {
            return ['salesperson', 'leader', 'team-leader'].includes(targetRole);
        }
        if (viewerRole === 'salesperson') {
            return targetRole === 'salesperson';
        }
        return false;
    }, [currentUser.role, member.role]);
    
    const roleInfo = roleConfig[member.role] || { label: member.role, color: 'bg-gray-500/10 text-gray-500' };

    const weeklyAverage = getAverageSalesValueForPeriod(member.sales || [], 'week');
    const monthlyAverage = getAverageSalesValueForPeriod(member.sales || [], 'month');

    return (
        <div className={`bg-brand-secondary rounded-lg p-4 border border-brand-border ${isSubordinate ? '' : 'shadow-lg'}`}>
            <div className="flex items-start">
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
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-brand-border/50 grid grid-cols-2 gap-2 text-center">
                <div>
                    <p className="text-xs text-brand-text-secondary">{t('kpi_weekly_avg_daily')}</p>
                    <p className={`text-xl font-bold ${canShowStats ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>
                        {canShowStats ? weeklyAverage.toFixed(1) : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-brand-text-secondary">{t('kpi_monthly_avg_daily')}</p>
                    <p className={`text-xl font-bold ${canShowStats ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>
                        {canShowStats ? monthlyAverage.toFixed(1) : '-'}
                    </p>
                </div>
            </div>
        </div>
    );
};

const TeamNode: React.FC<{ member: User; allUsers: User[]; level: number; currentUser: User }> = ({ member, allUsers, level, currentUser }) => {
    const directReports = useMemo(() => {
        if (member.role === 'manager') {
            const subordinateEmails = new Set<string>();
            allUsers.forEach(u => {
                if (u.role !== 'manager') {
                    u.teamMembers?.forEach(email => subordinateEmails.add(email));
                }
            });
            return allUsers
                .filter(u => u.email !== member.email && !subordinateEmails.has(u.email))
                .sort((a,b) => (roleConfig[a.role]?.order || 99) - (roleConfig[b.role]?.order || 99));
        }

        if (!member.teamMembers) return [];
        return allUsers
            .filter(u => member.teamMembers?.includes(u.email))
            .sort((a,b) => (roleConfig[a.role]?.order || 99) - (roleConfig[b.role]?.order || 99));
    }, [member, allUsers]);

    return (
        <div>
            <TeamMemberCard member={member} currentUser={currentUser} />
            {directReports.length > 0 && (
                <div className={`mt-4 pl-6 ${level > 0 ? 'border-l-2 border-brand-border' : ''}`}>
                    <div className="space-y-4">
                        {directReports.map(report => (
                            <TeamNode key={report.email} member={report} allUsers={allUsers} level={level + 1} currentUser={currentUser} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const AlgeheleTeam: React.FC = () => {
    const { user, allUsers } = useAuth();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const branchUsers = useMemo(() => {
        if (!user) return [];
        return allUsers.filter(u => u.branchName === user.branchName);
    }, [allUsers, user]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return [];
        }
        return branchUsers.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [branchUsers, searchTerm]);

    const rootUser = useMemo(() => {
        if (!user) return null;
        
        const manager = branchUsers.find(u => u.role === 'manager');
        if (manager) {
            return manager;
        }

        const sortedByRank = [...branchUsers].sort((a,b) => (roleConfig[a.role]?.order || 99) - (roleConfig[b.role]?.order || 99));
        
        return sortedByRank[0] || null;

    }, [user, branchUsers]);

    if (!user) return null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold">{t('page_title_mijnfiliaalteam')}</h1>
                <p className="text-lg text-brand-text-secondary mt-1">{t('overall_team_subtitle')}</p>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder={t('search_employee')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none shadow-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text-secondary" />
            </div>
            
            {searchTerm ? (
                <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                    {filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map(member => (
                                <TeamMemberCard key={member.email} member={member} currentUser={user} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-brand-text-secondary text-center py-8">{t('no_team_members_found')}</p>
                    )}
                </div>
            ) : (
                rootUser ? (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <TeamNode member={rootUser} allUsers={branchUsers} level={0} currentUser={user} />
                    </div>
                ) : (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center">
                        <p className="text-brand-text-secondary">{t('no_team_structure_found')}</p>
                    </div>
                )
            )}
        </div>
    );
};

export default AlgeheleTeam;