import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Goal, WeeklyReview, MotivationPost, Appointment } from '../types';
import { TrophyIcon, InformationCircleIcon, SparklesIcon, CurrencyDollarIcon, FireIcon, StarIcon, PlusIcon, CalendarDaysIcon, ClockIcon, ChartPieIcon, ArrowTrendingUpIcon, CreditCardIcon } from '../components/icons/Icons';
import { useAuth } from '../context/AuthContext';
import { generateWeeklyReview, generateDailyTip, summarizeAgendaForManager } from '../services/geminiService';
import Markdown from 'react-markdown';
import { calculateStreak, BADGE_DEFINITIONS } from '../utils/gamification';
import MotivationFeed from '../components/MotivationFeed';
import AddPostModal from '../components/AddPostModal';
import { getSalesValueForPeriod, getAverageSalesValueForPeriod } from '../utils/salesUtils';
import TeamPulseWidget from '../components/TeamPulseWidget';
import { useTranslation } from '../context/TranslationContext';


const LogSaleWidget: React.FC = () => {
    // This component no longer exists, the functionality is moved to Layout and LogSaleModal
    // This can be repurposed or removed. For now, it's not rendered.
    // Kept the component shell to avoid breaking imports if any.
    return null;
};

interface DailyTip {
    date: string; // YYYY-MM-DD
    content: string;
    lang: string;
}

const DailyTipWidget: React.FC = () => {
    const { user, goals } = useAuth();
    const [tip, setTip] = useLocalStorage<DailyTip | null>(user ? `dailyTip_${user.uid}` : 'dailyTip', null);
    const [isLoading, setIsLoading] = useState(false);
    const { t, language } = useTranslation();

    const todayStr = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchTip = async () => {
            if (user && (!tip || tip.date !== todayStr || tip.lang !== language)) {
                setIsLoading(true);
                try {
                    const content = await generateDailyTip(user, goals, user.sales || [], language);
                    setTip({ date: todayStr, content, lang: language });
                } catch (error) {
                    console.error("Failed to generate daily tip", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchTip();
    }, [user, goals, tip, todayStr, setTip, language]);

    return (
         <div className="lg:col-span-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 text-brand-primary flex items-center"><SparklesIcon className="w-5 h-5 mr-2" /> {t('ai_tip_of_the_day')}</h2>
            {isLoading && <p className="text-brand-text-secondary">{t('generating')}...</p>}
            {!isLoading && tip && <p className="text-brand-text-primary">{tip.content}</p>}
        </div>
    )
};

const SalesGoalWidget: React.FC = () => {
    const { user, goals } = useAuth();
    const { t } = useTranslation();
    if (!user) return null;

    const dailySalesGoal = goals.find(g => g.goalType === 'sales' && g.type === 'daily')?.target || 0;
    const weeklySalesGoal = goals.find(g => g.goalType === 'sales' && g.type === 'weekly')?.target || 0;

    const salesToday = getSalesValueForPeriod(user.sales || [], 'today');
    const salesThisWeek = getSalesValueForPeriod(user.sales || [], 'week');

    const dailyProgress = dailySalesGoal > 0 ? (salesToday / dailySalesGoal) * 100 : 0;
    const weeklyProgress = weeklySalesGoal > 0 ? (salesThisWeek / weeklySalesGoal) * 100 : 0;
    
    return (
        <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-brand-text-primary flex items-center">
                <TrophyIcon className="w-6 h-6 mr-3 text-brand-primary" />
                {t('sales_goals_value')}
            </h2>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium">{t('today')}</span>
                        <span className="font-semibold">{salesToday.toFixed(1)} / {dailySalesGoal > 0 ? dailySalesGoal : '-'}</span>
                    </div>
                    <div className="w-full bg-brand-secondary rounded-full h-2.5">
                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${Math.min(dailyProgress, 100)}%` }}></div>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium">{t('this_week')}</span>
                        <span className="font-semibold">{salesThisWeek.toFixed(1)} / {weeklySalesGoal > 0 ? weeklySalesGoal : '-'}</span>
                    </div>
                    <div className="w-full bg-brand-secondary rounded-full h-2.5">
                        <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${Math.min(weeklyProgress, 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgendaVandaagWidget: React.FC = () => {
    const { appointments } = useAuth();
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t, language } = useTranslation();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));

    useEffect(() => {
        const fetchSummary = async () => {
            if (todaysAppointments.length > 0) {
                setIsLoading(true);
                try {
                    const result = await summarizeAgendaForManager(todaysAppointments, language);
                    setSummary(result);
                } catch (error) {
                    console.error("Failed to summarize agenda", error);
                    setSummary("Kon agenda niet samenvatten.");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSummary(t('no_appointments_today'));
            }
        };
        fetchSummary();
    }, [appointments, t, language]); // Re-run when appointments or language change

    return (
        <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2 text-brand-text-primary flex items-center">
                <CalendarDaysIcon className="w-6 h-6 mr-3 text-brand-primary" />
                {t('your_agenda_today')}
            </h2>
            {isLoading ? <p className="text-brand-text-secondary text-sm">{t('ai_summary_loading')}</p> : 
                <div className="text-brand-text-secondary text-sm mb-4 prose max-w-none">
                    <Markdown>{summary}</Markdown>
                </div>
            }
            <div className="space-y-3 border-t border-brand-border pt-4 max-h-48 overflow-y-auto">
                {todaysAppointments.length > 0 ? (
                    todaysAppointments.map(app => (
                        <div key={app.id} className="flex items-start text-sm">
                            <span className="font-bold text-brand-primary w-16">{app.time}</span>
                            <div>
                                <p className="font-semibold text-brand-text-primary">{app.title}</p>
                                {app.notes && <p className="text-xs text-brand-text-secondary">{app.notes}</p>}
                            </div>
                        </div>
                    ))
                ) : (
                    !isLoading && <p className="text-brand-text-secondary text-sm">{t('no_appointments_today')}</p>
                )}
            </div>
        </div>
    );
};

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-start">
        <div className="w-12 h-12 bg-brand-primary/10 rounded-lg mr-4 flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <h2 className="text-sm font-semibold text-brand-text-secondary">{title}</h2>
            <p className="text-3xl font-bold text-brand-text-primary">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
  const { user, pitches, clients, goals, motivationPosts, allUsers } = useAuth();
  const { t, language } = useTranslation();
  const [weeklyReview, setWeeklyReview] = useLocalStorage<WeeklyReview | null>(user ? `weeklyReview_${user.uid}` : 'weeklyReview', null);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MotivationPost | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 18) return t('greeting_afternoon');
    return t('greeting_evening');
  };
  
  const handleGenerateReview = async () => {
    if (!user) return;
    setIsGeneratingReview(true);
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const recentClients = clients.filter(c => new Date(c.createdAt) > oneWeekAgo);
        const recentPitches = pitches.filter(p => new Date(p.createdAt) > oneWeekAgo);
        
        const goalsToReview = goals.filter(g => g.goalType === 'sales'); 

        const content = await generateWeeklyReview(user, goalsToReview, recentClients, recentPitches, language);
        setWeeklyReview({ generatedAt: new Date().toISOString(), content });
    } catch (error) {
        console.error("Failed to generate weekly review", error);
        alert(`Kon geen review genereren: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsGeneratingReview(false);
    }
  };
  
  const shouldGenerateNewReview = () => {
    if (!weeklyReview) return true;
    const lastGenerated = new Date(weeklyReview.generatedAt);
    const now = new Date();
    const daysSinceLast = (now.getTime() - lastGenerated.getTime()) / (1000 * 3600 * 24);
    return daysSinceLast >= 1;
  };
  
  const salesStreak = user?.sales ? calculateStreak(user.sales) : 0;
  const isLeader = user?.role === 'leader' || user?.role === 'team-leader' || user?.role === 'manager' || user?.role === 'owner';
  const canLogSales = user?.role === 'salesperson' || user?.role === 'leader' || user?.role === 'team-leader';
  const isLeadershipWithTeam = user?.role === 'manager' || user?.role === 'leader' || user?.role === 'team-leader';
  const isManagerOrOwner = user?.role === 'manager' || user?.role === 'owner';

  const licenseData = useMemo(() => {
    if (!user || !isManagerOrOwner) return { used: 0, purchased: 0 };

    if (user.role === 'manager') {
        const branchUsers = allUsers.filter(u => u.branchName === user.branchName);
        const used = branchUsers.length;
        const purchased = user.purchasedLicenses || 0;
        return { used, purchased };
    }

    // Fallback for owner, though they have their own dashboard
    const used = allUsers.length;
    const owner = allUsers.find(u => u.role === 'owner');
    // Owner doesn't manage licenses directly on their object in the new model
    const finalPurchased = owner?.purchasedLicenses ?? used; 
    return { used, purchased: finalPurchased };

}, [user, allUsers, isManagerOrOwner]);

  const weeklyAverage = user ? getAverageSalesValueForPeriod(user.sales || [], 'week') : 0;
  const monthlyAverage = user ? getAverageSalesValueForPeriod(user.sales || [], 'month') : 0;

  const handleOpenAddPostModal = () => {
    setEditingPost(null);
    setIsAddPostModalOpen(true);
  };
  
  const handleOpenEditPostModal = (post: MotivationPost) => {
    setEditingPost(post);
    setIsAddPostModalOpen(true);
  };

  const handleClosePostModal = () => {
      setIsAddPostModalOpen(false);
      setEditingPost(null);
  };
  
  const managerTeamData = useMemo(() => {
    if (!user || !isManagerOrOwner || !allUsers) return null;
    
    const teamMembers = allUsers.filter(u => u.branchName === user.branchName && u.email !== user.email);
    const allTeamSales = teamMembers.flatMap(m => m.sales || []);
    
    const salesToday = getSalesValueForPeriod(allTeamSales, 'today');
    const salesWeek = getSalesValueForPeriod(allTeamSales, 'week');
    const salesMonth = getSalesValueForPeriod(allTeamSales, 'month');
    
    const avgDailyMonth = getAverageSalesValueForPeriod(allTeamSales, 'month');

    return {
      salesToday,
      salesWeek,
      salesMonth,
      avgDailyMonth
    };

  }, [user, allUsers, isManagerOrOwner]);
  
  const filteredMotivationPosts = useMemo(() => {
    if (!user) return [];
    return motivationPosts.filter(post => {
        return !post.branchName || post.branchName === user.branchName;
    });
  }, [motivationPosts, user]);


  return (
    <>
    <div className="text-brand-text-primary animate-fade-in space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-1">{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-lg text-brand-text-secondary">{t(isManagerOrOwner ? 'dashboard_welcome_management' : 'dashboard_welcome_sales')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             {isManagerOrOwner ? (
                <>
                    {/* MANAGER DASHBOARD */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KpiCard title={t('kpi_team_sales_today')} value={managerTeamData?.salesToday.toFixed(1) ?? '0.0'} icon={<CurrencyDollarIcon className="w-6 h-6 text-brand-primary" />} />
                        <KpiCard title={t('kpi_team_sales_week')} value={managerTeamData?.salesWeek.toFixed(1) ?? '0.0'} icon={<CalendarDaysIcon className="w-6 h-6 text-brand-primary" />} />
                        <KpiCard title={t('kpi_team_sales_month')} value={managerTeamData?.salesMonth.toFixed(1) ?? '0.0'} icon={<ArrowTrendingUpIcon className="w-6 h-6 text-brand-primary" />} />
                        <KpiCard title={t('kpi_avg_daily_month')} value={managerTeamData?.avgDailyMonth.toFixed(1) ?? '0.0'} icon={<ClockIcon className="w-6 h-6 text-brand-primary" />} />
                        <KpiCard 
                            title={t('used_licenses')} 
                            value={t('licenses_of_total', { used: licenseData?.used, total: licenseData?.purchased })} 
                            icon={<CreditCardIcon className="w-6 h-6 text-brand-primary" />} 
                        />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <AgendaVandaagWidget />
                        <TeamPulseWidget />
                    </div>
                </>
             ) : (
                <>
                    {/* SALESPERSON & LEADER DASHBOARD */}
                    <DailyTipWidget />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {canLogSales && (<SalesGoalWidget />)}
                        {isLeadershipWithTeam && (<TeamPulseWidget />)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {canLogSales && (
                            <>
                                <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                                        <ClockIcon className="w-6 h-6 text-brand-primary"/>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_weekly_avg_daily')}</h2>
                                        <p className="text-3xl font-bold text-brand-text-primary">{weeklyAverage.toFixed(1)}</p>
                                    </div>
                                </div>
                                <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center">
                                    <div className="w-14 h-14 bg-brand-primary/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                                        <ClockIcon className="w-6 h-6 text-brand-primary"/>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-semibold text-brand-text-secondary">{t('kpi_monthly_avg_daily')}</h2>
                                        <p className="text-3xl font-bold text-brand-text-primary">{monthlyAverage.toFixed(1)}</p>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="bg-brand-surface rounded-xl p-6 shadow-lg flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-14 h-14 bg-orange-500/10 rounded-full mr-4 flex items-center justify-center flex-shrink-0">
                                    <FireIcon className="w-6 h-6 text-orange-500"/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{t('sales_streak')}</h2>
                                    <p className="text-brand-text-secondary text-sm">{t('sales_streak_subtitle')}</p>
                                </div>
                            </div>
                            <p className="text-5xl font-bold text-orange-500">{salesStreak}</p>
                        </div>
                    </div>
                    <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-brand-text-primary flex items-center">
                            <StarIcon className="w-6 h-6 mr-3 text-yellow-500"/>
                            {t('my_badges')}
                        </h2>
                        {user?.badges && user.badges.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {user.badges.map(badgeId => {
                                    const badge = BADGE_DEFINITIONS[badgeId];
                                    if (!badge) return null;
                                    return (
                                        <div key={badgeId} title={badge.description} className="flex items-center bg-brand-secondary p-2 pr-4 rounded-full">
                                            <div className="p-1.5 bg-yellow-400/20 rounded-full mr-2">
                                                <StarIcon className="w-5 h-5 text-yellow-500"/>
                                            </div>
                                            <span className="font-semibold text-sm">{badge.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-brand-text-secondary">{t('badges_empty_state')}</p>
                        )}
                    </div>
                </>
             )}
             <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-brand-text-primary flex items-center">
                            <InformationCircleIcon className="w-6 h-6 mr-3 text-brand-primary"/>
                            {t('your_week_in_review')}
                        </h2>
                        <p className="text-sm text-brand-text-secondary">{t('week_in_review_subtitle')}</p>
                    </div>
                    {shouldGenerateNewReview() && (
                        <button onClick={handleGenerateReview} disabled={isGeneratingReview} className="bg-brand-secondary text-brand-text-primary font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-brand-border transition-colors disabled:opacity-50">
                            {isGeneratingReview ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <SparklesIcon className="w-5 h-5 mr-2"/>
                            )}
                            <span>{isGeneratingReview ? '' : t('generate_review')}</span>
                        </button>
                    )}
                </div>
                {weeklyReview?.content ? (
                    <div className="bg-brand-secondary p-4 rounded-lg prose max-w-none">
                        <Markdown>{weeklyReview.content}</Markdown>
                    </div>
                ) : (
                    <p className="text-brand-text-secondary italic">{t('review_empty_state')}</p>
                )}
            </div>
          </div>
          <div className="bg-brand-surface rounded-xl p-6 shadow-lg">
             <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-semibold text-brand-text-primary">
                        {t('team_updates')}
                    </h2>
                     <p className="text-sm text-brand-text-secondary">{t('team_updates_subtitle')}</p>
                </div>
                {isLeader && (
                     <button onClick={handleOpenAddPostModal} className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-opacity">
                        <span className="grid place-items-center mr-2">
                           <PlusIcon className="w-5 h-5" />
                        </span>
                        {t('new_post')}
                    </button>
                )}
            </div>
            <MotivationFeed posts={filteredMotivationPosts} onEdit={handleOpenEditPostModal} />
          </div>
      </div>
    </div>
    <AddPostModal 
        isOpen={isAddPostModalOpen} 
        onClose={handleClosePostModal} 
        postToEdit={editingPost}
    />
    </>
  );
};

export default Dashboard;