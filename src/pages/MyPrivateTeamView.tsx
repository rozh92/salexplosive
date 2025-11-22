import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { getSalesValueForPeriod } from '../utils/salesUtils';
import { UserCircleIcon, BriefcaseIcon, WifiIcon, BoltIcon, PlusIcon, SparklesIcon, CurrencyDollarIcon, ChartPieIcon, ArrowTrendingUpIcon } from '../components/icons/Icons';
import { useTranslation } from '../context/TranslationContext';
import AddEditMemberModal from '../components/AddEditMemberModal';
import { generateTeamPerformanceAnalysis } from '../services/geminiService';
import Markdown from 'react-markdown';

const roleConfig: Record<UserRole, { label: string; color: string }> = {
    'salesperson': { label: 'Salesperson', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
    'leader': { label: 'Leader', color: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' },
    'team-leader': { label: 'Team Leader', color: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    'manager': { label: 'Manager', color: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' },
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
                    <div className="flex items-center text-xs text-brand-text-secondary mt-1">
                        {member.industry === 'telecom' ? <WifiIcon className="w-4 h-4 mr-1.5" /> : <BoltIcon className="w-4 h-4 mr-1.5" />}
                        <span className="capitalize">{member.industry}</span>
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


const MyPrivateTeamView: React.FC = () => {
    const { user, allUsers, updateTeamMemberRole } = useAuth();
    const { t, language } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const { teamMembers, peers, displayLeader, displayTeamLeader } = useMemo(() => {
        if (!user || allUsers.length === 0) {
            return { teamMembers: [], peers: [], displayLeader: null, displayTeamLeader: null };
        }

        const myTeamMembers = allUsers.filter(u => user.teamMembers?.includes(u.email));
        
        const directSuperior = allUsers.find(sup => sup.teamMembers?.includes(user.email));

        let finalDisplayLeader: User | null = null;
        let finalDisplayTeamLeader: User | null = null;
        
        if (directSuperior) {
            if (directSuperior.role === 'team-leader') {
                finalDisplayLeader = directSuperior;
                finalDisplayTeamLeader = directSuperior;
            } else if (directSuperior.role === 'leader') {
                finalDisplayLeader = directSuperior;
                const teamLeaderAbove = allUsers.find(sup => sup.role === 'team-leader' && sup.teamMembers?.includes(directSuperior.email));
                finalDisplayTeamLeader = teamLeaderAbove || directSuperior; // Fallback to leader
            } else {
                // If superior is another role (e.g., manager), they occupy both slots
                finalDisplayLeader = directSuperior;
                finalDisplayTeamLeader = directSuperior;
            }
        }
        
        const myPeers = (directSuperior && user.role === 'salesperson') 
            ? allUsers.filter(u => directSuperior.teamMembers?.includes(u.email) && u.email !== user.email)
            : [];

        return { teamMembers: myTeamMembers, peers: myPeers, displayLeader: finalDisplayLeader, displayTeamLeader: finalDisplayTeamLeader };
    }, [user, allUsers]);

    const teamPerformance = useMemo(() => {
        const allSales = teamMembers.flatMap(m => m.sales || []);
        return {
            today: getSalesValueForPeriod(allSales, 'today'),
            week: getSalesValueForPeriod(allSales, 'week'),
            month: getSalesValueForPeriod(allSales, 'month'),
        };
    }, [teamMembers]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysis('');
        try {
            const teamDataForAnalysis = teamMembers.map(m => ({ name: m.name, sales: m.sales || [] }));
            const result = await generateTeamPerformanceAnalysis(teamDataForAnalysis, language);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
            setAnalysis("Fout bij het genereren van de analyse.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRoleChange = async (memberEmail: string, newRole: UserRole) => {
        if (window.confirm(t('change_role_confirm', { role: roleConfig[newRole].label }))) {
            try {
                await updateTeamMemberRole(memberEmail, newRole);
            } catch (error) {
                console.error("Role change failed:", error);
            }
        }
    };

    const getAvailableRolesForMember = (memberRole: UserRole): UserRole[] => {
        if (!user) return [memberRole];
        if (user.role === 'team-leader') {
            if (['salesperson', 'leader'].includes(memberRole)) return ['salesperson', 'leader'];
        }
        return [memberRole];
    };

    if (!user) return null;
    
    const title = user.role === 'salesperson' ? t('my_team_title_salesperson') : t('page_title_mijnpriveteam');
    const subtitle = user.role === 'salesperson' ? t('my_team_subtitle_salesperson') : (user.role === 'leader' ? t('welcome_leader') : t('welcome_team_leader'));
    
    return (
        <>
            <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold">{title}</h1>
                        <p className="text-lg text-brand-text-secondary mt-1">{subtitle}</p>
                    </div>
                    {(user.role === 'leader' || user.role === 'team-leader') && (
                        <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            {t('add_member')}
                        </button>
                    )}
                </div>

                {/* Superiors Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {displayTeamLeader ? (
                        <UserCard member={displayTeamLeader} title={t('your_team_leader')} />
                    ) : (
                        <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center flex items-center justify-center min-h-[280px]">
                            <p className="text-brand-text-secondary">{t('no_team_leader_found')}</p>
                        </div>
                    )}
                    
                    {displayLeader ? (
                         <UserCard member={displayLeader} title={t('your_leader')} />
                    ) : (
                         <div className="bg-brand-surface rounded-xl p-6 shadow-lg text-center flex items-center justify-center min-h-[280px]">
                            <p className="text-brand-text-secondary">{t('no_leader_found')}</p>
                        </div>
                    )}
                </div>

                {/* Peers Section (Salesperson) */}
                {user.role === 'salesperson' && (
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
                )}
                
                {/* Team Management Section (Leader/Team-Leader) */}
                {(user.role === 'leader' || user.role === 'team-leader') && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center"><div className="p-4 bg-brand-primary/10 rounded-full mr-4"><CurrencyDollarIcon className="w-8 h-8 text-brand-primary"/></div><div><h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_sales_today')}</h2><p className="text-3xl font-bold text-brand-text-primary">{teamPerformance.today.toFixed(1)}</p></div></div>
                            <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center"><div className="p-4 bg-brand-primary/10 rounded-full mr-4"><ChartPieIcon className="w-8 h-8 text-brand-primary"/></div><div><h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_sales_week')}</h2><p className="text-3xl font-bold text-brand-text-primary">{teamPerformance.week.toFixed(1)}</p></div></div>
                            <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center"><div className="p-4 bg-brand-primary/10 rounded-full mr-4"><ArrowTrendingUpIcon className="w-8 h-8 text-brand-primary"/></div><div><h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_sales_month')}</h2><p className="text-3xl font-bold text-brand-text-primary">{teamPerformance.month.toFixed(1)}</p></div></div>
                        </div>
                        
                        <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                            <h2 className="text-xl font-semibold mb-4">{t('team_members_and_roles')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {teamMembers.map(member => {
                                    const availableRoles = getAvailableRolesForMember(member.role);
                                    const roleInfo = roleConfig[member.role] || { label: member.role, color: 'bg-gray-500/10 text-gray-500' };
                                    return (
                                        <div key={member.email} className="bg-brand-secondary rounded-lg p-4 flex flex-col border border-brand-border">
                                            <div className="flex items-start mb-4">
                                                {member.profilePicture ? 
                                                    <img src={member.profilePicture} alt={member.name} className="w-12 h-12 rounded-full object-cover mr-4 flex-shrink-0" /> :
                                                    <UserCircleIcon className="w-12 h-12 text-brand-text-secondary mr-4 flex-shrink-0" />
                                                }
                                                <div>
                                                    <p className="font-bold text-brand-text-primary">{member.name}</p>
                                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleInfo.color}`}>{roleInfo.label}</span>
                                                </div>
                                            </div>
                                            <div className="text-center my-4 flex-grow">
                                                <p className="text-4xl font-bold text-brand-primary">{getSalesValueForPeriod(member.sales || [], 'month').toFixed(1)}</p>
                                                <p className="text-sm text-brand-text-secondary">{t('sales_this_month')}</p>
                                            </div>
                                            <div className="mt-auto">
                                                <label className="text-xs text-brand-text-secondary mb-1 block">{t('change_role')}</label>
                                                <select value={member.role} onChange={(e) => handleRoleChange(member.email, e.target.value as UserRole)} className="w-full bg-brand-surface border border-brand-border rounded-md px-2 py-1.5 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed" disabled={availableRoles.length <= 1}>
                                                    {availableRoles.map(r => <option key={r} value={r} className="capitalize">{roleConfig[r].label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div><h2 className="text-2xl font-semibold text-brand-text-primary flex items-center"><SparklesIcon className="w-6 h-6 mr-3 text-brand-primary"/>{t('ai_team_performance_analysis')}</h2><p className="text-sm text-brand-text-secondary">{t('ai_team_analysis_subtitle')}</p></div>
                                <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border disabled:opacity-50">{isAnalyzing ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : <SparklesIcon className="w-5 h-5 mr-2" />}{isAnalyzing ? t('analyzing') : t('generate_analysis')}</button>
                            </div>
                            {analysis && <div className="bg-brand-secondary p-4 rounded-lg prose prose-invert max-w-none text-brand-text-secondary prose-headings:text-brand-text-primary prose-strong:text-brand-text-primary"><Markdown>{analysis}</Markdown></div>}
                        </div>
                    </>
                )}
            </div>
            <AddEditMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default MyPrivateTeamView;