

import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { getSalesValueForPeriod } from '../utils/salesUtils';
import { UserCircleIcon, BriefcaseIcon, WifiIcon, BoltIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/TranslationContext';

const roleConfig: Record<UserRole, { label: string; color: string }> = {
    'salesperson': { label: 'Salesperson', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
    'leader': { label: 'Leader', color: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' },
    'team-leader': { label: 'Team Leader', color: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    'manager': { label: 'Manager', color: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
    // FIX: Added the 'owner' role to the configuration object to satisfy the UserRole type.
    'owner': { label: 'Owner', color: 'bg-red-500/10 text-red-500 border border-red-500/20' }
};

const UserCard: React.FC<{ member: User, title: string }> = ({ member, title }) => {
    const roleInfo = roleConfig[member.role] || { label: member.role, color: 'bg-gray-500/10 text-gray-500' };

    return (
        <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center border border-brand-border flex flex-col justify-between min-h-[280px]">
            <div>
                <h3 className="text-lg font-semibold text-brand-text-secondary mb-4">{title}</h3>
                {member.profilePicture ?
                    <img src={member.profilePicture} alt={member.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" /> :
                    <UserCircleIcon className="w-24 h-24 text-brand-text-secondary mx-auto mb-4" />
                }
            </div>
            <div>
                 <p className="font-bold text-xl text-brand-text-primary">{member.name}</p>
                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                 <div className="flex items-center justify-center text-xs text-brand-text-secondary mt-3">
                    {member.industry === 'telecom' ? <WifiIcon className="w-4 h-4 mr-1.5" /> : <BoltIcon className="w-4 h-4 mr-1.5" />}
                    <span className="capitalize">{member.industry}</span>
                </div>
                <div className="flex items-center justify-center text-xs text-brand-text-secondary mt-1">
                    <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                    <span>{member.company}</span>
                </div>
            </div>
        </div>
    );
};

const PeerCard: React.FC<{ member: User }> = ({ member }) => {
     const { t } = useTranslation();
     const salesThisMonth = getSalesValueForPeriod(member.sales || [], 'month');
     return (
        <div className="bg-brand-secondary rounded-lg p-4 flex items-center justify-between border border-brand-border">
            <div className="flex items-center">
                {member.profilePicture ?
                    <img src={member.profilePicture} alt={member.name} className="w-10 h-10 rounded-full object-cover mr-4" /> :
                    <UserCircleIcon className="w-10 h-10 text-brand-text-secondary mr-4" />
                }
                <div>
                    <p className="font-bold text-brand-text-primary">{member.name}</p>
                    <div className="flex items-center text-xs text-brand-text-secondary mt-1 space-x-4">
                        <div className="flex items-center">
                            {member.industry === 'telecom' ? <WifiIcon className="w-4 h-4 mr-1.5" /> : <BoltIcon className="w-4 h-4 mr-1.5" />}
                            <span className="capitalize">{member.industry}</span>
                        </div>
                        <div className="flex items-center">
                            <BriefcaseIcon className="w-4 h-4 mr-1.5" />
                            <span>{member.company}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <p className="text-xl font-bold text-brand-primary text-right">{salesThisMonth.toFixed(1)}</p>
                <p className="text-xs text-brand-text-secondary text-right">{t('this_month')}</p>
            </div>
        </div>
     );
};

const SalespersonTeamView: React.FC = () => {
    const { user, allUsers } = useAuth();
    const { t } = useTranslation();

    const { teamLeader, directLeader, peers } = useMemo(() => {
        if (!user || allUsers.length === 0) {
            return { teamLeader: null, directLeader: null, peers: [] };
        }

        const directSuperior = allUsers.find(potentialSuperior =>
            (potentialSuperior.role === 'leader' || potentialSuperior.role === 'team-leader') &&
            potentialSuperior.teamMembers?.includes(user.email)
        );

        if (!directSuperior) {
            return { teamLeader: null, directLeader: null, peers: [] };
        }

        let identifiedTeamLeader: User | null = null;
        let identifiedDirectLeader: User | null = null;
        let identifiedPeers: User[] = [];

        if (directSuperior.role === 'leader') {
            identifiedDirectLeader = directSuperior;
            identifiedTeamLeader = allUsers.find(potentialTeamLeader =>
                potentialTeamLeader.role === 'team-leader' &&
                potentialTeamLeader.teamMembers?.includes(directSuperior.email)
            ) || null;
            
            identifiedPeers = allUsers.filter(peer =>
                directSuperior.teamMembers?.includes(peer.email) &&
                peer.email !== user.email &&
                peer.role === 'salesperson'
            );

        } else if (directSuperior.role === 'team-leader') {
            identifiedDirectLeader = directSuperior;
            identifiedTeamLeader = directSuperior;

            identifiedPeers = allUsers.filter(peer =>
                directSuperior.teamMembers?.includes(peer.email) &&
                peer.email !== user.email &&
                peer.role === 'salesperson'
            );
        }

        return { teamLeader: identifiedTeamLeader, directLeader: identifiedDirectLeader, peers: identifiedPeers };

    }, [user, allUsers]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-4xl font-bold">{t('my_team_title_salesperson')}</h1>
                <p className="text-lg text-brand-text-secondary mt-1">{t('my_team_subtitle_salesperson')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {teamLeader ? (
                    <UserCard member={teamLeader} title={t('your_team_leader')} />
                ) : (
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center flex items-center justify-center min-h-[280px]">
                        <p className="text-brand-text-secondary">{t('no_team_leader_found')}</p>
                    </div>
                )}
                
                {directLeader ? (
                     <UserCard member={directLeader} title={t('your_leader')} />
                ) : (
                     <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center flex items-center justify-center min-h-[280px]">
                        <p className="text-brand-text-secondary">{t('no_leader_found')}</p>
                    </div>
                )}
            </div>

            <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">{t('your_teammates')}</h2>
                {peers.length > 0 ? (
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {peers.map(peer => <PeerCard key={peer.email} member={peer} />)}
                    </div>
                ) : (
                    <p className="text-brand-text-secondary">{t('no_teammates')}</p>
                )}
            </div>
        </div>
    );
};

export default SalespersonTeamView;