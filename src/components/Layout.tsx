import React, { useState, useEffect } from 'react';
import { Page, ProductPackage } from '../types';
import { useTheme } from '../App';
import { useAuth } from '../context/AuthContext';
import { ChartBarIcon, LightBulbIcon, SparklesIcon, UsersIcon, TrophyIcon, MenuIcon, ChevronLeftIcon, SunIcon, MoonIcon, ClipboardListIcon, MicrophoneIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, UserGroupIcon, BookOpenIcon, ClipboardDocumentCheckIcon, CurrencyDollarIcon, GlobeAmericasIcon, CalendarDaysIcon, ArchiveBoxIcon, BuildingOfficeIcon, CreditCardIcon, ChartPieIcon } from './icons/Icons';
import LogSaleModal from './LogSaleModal';
import HelpChatbot from './HelpChatbot';
import { useTranslation } from '../context/TranslationContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: Page | string;
  isActive: boolean;
  onClick: () => void;
  isSidebarOpen: boolean;
}

const pageToNavKey = (page: Page | string) => {
    switch(page) {
        case Page.MijnPriveTeam: return 'nav_mijnpriveteam';
        case Page.MijnFiliaalTeam: return 'nav_mijnfiliaalteam';
        default: return `nav_${String(page).toLowerCase().replace(/\s+/g, '_')}`;
    }
}


const ThemeToggle: React.FC<{isSidebarOpen: boolean}> = ({ isSidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      title={t(theme === 'light' ? 'theme_toggle_dark' : 'theme_toggle_light')}
      className={`flex items-center w-full py-2.5 rounded-lg transition-colors duration-200 text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
      aria-label={t(theme === 'light' ? 'theme_toggle_dark' : 'theme_toggle_light')}
    >
      {theme === 'light' ? <MoonIcon className="flex-shrink-0 w-6 h-6" /> : <SunIcon className="flex-shrink-0 w-6 h-6" />}
      <span 
        className="ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
        style={{ maxWidth: isSidebarOpen ? '150px' : '0', opacity: isSidebarOpen ? 1 : 0 }}
      >
        {t(theme === 'light' ? 'theme_toggle_dark' : 'theme_toggle_light')}
      </span>
    </button>
  );
};

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isSidebarOpen }) => {
    const { t } = useTranslation();
    const translatedLabel = t(pageToNavKey(label));
    return (
        <button
            onClick={onClick}
            title={isSidebarOpen ? '' : translatedLabel}
            className={`flex items-center w-full py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 ${
            isActive
                ? 'bg-brand-primary text-white shadow-md'
                : 'text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary'
            } ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
        >
            {icon}
            <span 
                className="ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
                style={{ maxWidth: isSidebarOpen ? '150px' : '0', opacity: isSidebarOpen ? 1 : 0 }}
            >
                {translatedLabel}
            </span>
        </button>
    );
};

const Header: React.FC<{ currentPage: string, onMenuClick: () => void, onLogSaleClick: () => void }> = ({ currentPage, onMenuClick, onLogSaleClick }) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const canLogSale = user?.role === 'salesperson' || user?.role === 'leader' || user?.role === 'team-leader';

    return (
        <header className="flex-shrink-0 flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8 bg-brand-surface/80 backdrop-blur-sm border-b border-brand-border shadow-sm">
            <div className="flex items-center min-w-0">
                 <button onClick={onMenuClick} className="lg:hidden text-brand-text-secondary hover:text-brand-text-primary mr-4" aria-label="Open sidebar">
                    <MenuIcon className="w-6 h-6"/>
                 </button>
                 <h2 className="text-2xl font-bold text-brand-text-primary truncate">{currentPage}</h2>
            </div>
            {canLogSale && (
                <button
                    onClick={onLogSaleClick}
                    className="bg-brand-primary text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:opacity-90 transition-all duration-200 transform hover:scale-105"
                >
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    {t('register_sale')}
                </button>
            )}
        </header>
    );
};


const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogSaleModalOpen, setIsLogSaleModalOpen] = useState(false);
  const { user, logout, logSale } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const isManagerOrOwner = isManager || isOwner;

  const baseNavItemsRaw = [
    { icon: <ChartBarIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Dashboard },
    { icon: <SparklesIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.PitchGenerator },
    { icon: <ClipboardListIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Pitches },
    { icon: <MicrophoneIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.PitchPractice },
    { icon: <UsersIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Clients },
    { icon: <LightBulbIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.CompetitorAnalysis },
    { icon: <ClipboardDocumentCheckIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.CompetitorNotes },
    { icon: <TrophyIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Goals },
  ];
  
  const forbiddenOwnerPages = [
    Page.PitchGenerator,
    Page.Pitches,
    Page.PitchPractice,
    Page.CompetitorAnalysis,
    Page.Goals,
    Page.MijnFiliaalTeam,
    Page.Clients,
    Page.CompetitorNotes,
  ];

  const baseNavItems = baseNavItemsRaw
    .filter(item => !isManager || (item.label !== Page.Clients && item.label !== Page.Goals))
    .filter(item => !isOwner || !forbiddenOwnerPages.includes(item.label as Page));
  
  const navItems: { icon: React.ReactNode; label: Page | string }[] = [...baseNavItems];
  
  const pageToTitleKey = (page: Page): string => {
      switch(page) {
          case Page.Pitches: return 'page_title_opgeslagen_pitches';
          case Page.PitchPractice: return 'page_title_pitch_oefenen';
          case Page.CompetitorNotes: return 'page_title_concurrentie_notities';
          case Page.Billing: return 'page_title_facturatie';
          case Page.MijnPriveTeam: return 'page_title_mijnpriveteam';
          case Page.MijnFiliaalTeam: return 'page_title_mijnfiliaalteam';
          default: return `page_title_${String(page).toLowerCase().replace(/\s+/g, '_')}`;
      }
  };

  const getPageTitle = (page: Page): string => {
      if (page === Page.MijnPriveTeam) {
          if (isManager) return t('page_title_mijn_filiaal');
          if (isOwner) return t('page_title_mijn_organisatie');
          return t('page_title_mijnpriveteam');
      }
      if (page === Page.TeamKnowledgeBase || page === Page.OrganizationNews) {
          if (isOwner) return t('page_title_organisatie_news');
          if (isManager) return t('nav_branch_knowledge_base');
          return t('page_title_team_kennisbank');
      }
      return t(pageToTitleKey(page));
  }
  
  if (isOwner) {
    navItems.push({ icon: <BuildingOfficeIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Organization });
    navItems.push({ icon: <ChartPieIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.SalesAnalytics });
  }

  const teamRoles: (string | undefined)[] = ['manager', 'leader', 'team-leader', 'salesperson'];
  if (teamRoles.includes(user?.role) && !isOwner) {
      if (isManager) {
          navItems.push({ icon: <UserGroupIcon className="flex-shrink-0 w-6 h-6"/>, label: 'Mijn Filiaal' });
      } else {
          navItems.push({ icon: <UserGroupIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.MijnPriveTeam });
      }
  }

  if (isManagerOrOwner) {
    navItems.push({ icon: <CalendarDaysIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Planning });
    navItems.push({ icon: <ArchiveBoxIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.PackageManagement });
  }

  if (isOwner) {
    navItems.push({ icon: <CreditCardIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.Billing });
  }
  
  if (user?.role && ['salesperson', 'leader', 'team-leader'].includes(user.role)) {
    navItems.push({ icon: <GlobeAmericasIcon className="flex-shrink-0 w-6 h-6"/>, label: Page.MijnFiliaalTeam });
  }
  
  navItems.push({ icon: <BookOpenIcon className="flex-shrink-0 w-6 h-6"/>, label: isOwner ? Page.OrganizationNews : isManager ? 'Filiaal Kennisbank' : Page.TeamKnowledgeBase });
  
  const handleNavClick = (page: Page | string) => {
    let pageToSet: Page;
    if (page === 'Mijn Filiaal') {
        pageToSet = Page.MijnPriveTeam;
    } else if (page === 'Filiaal Kennisbank') {
        pageToSet = Page.TeamKnowledgeBase;
    } else {
        pageToSet = page as Page;
    }
    setCurrentPage(pageToSet);

    if (window.innerWidth < 1024) { 
        setIsSidebarOpen(false);
    }
  };

  const handleLogSale = async (pkg: ProductPackage) => {
    try {
        await logSale(pkg);
    } catch (error: any) {
        alert(`Fout bij registreren van verkoop: ${error.message}`);
        throw error;
    }
};

  const mijnTeamLabel = isManager ? 'Mijn Filiaal' : isOwner ? Page.Organization : Page.MijnPriveTeam;
  const kennisbankLabel = isOwner ? Page.OrganizationNews : isManager ? 'Filiaal Kennisbank' : Page.TeamKnowledgeBase;

  return (
    <div className="flex h-screen bg-brand-background font-sans text-brand-text-primary overflow-hidden">
      
      <div 
        onClick={() => setIsSidebarOpen(false)} 
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      ></div>
      
      <aside className={`bg-brand-surface border-r border-brand-border flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out z-40
        fixed inset-y-0 left-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}`}>
        
        <div className={`relative flex items-center border-b border-brand-border px-4 flex-shrink-0 h-20 justify-center`}>
          <div className={`flex items-center text-center transition-all duration-300`}>
            <img src="https://i.imgur.com/moW461j.png" alt="Bedrijfslogo" className="h-32 w-34 flex-shrink-0" />
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className={`hidden lg:grid place-items-center text-brand-text-secondary hover:text-brand-text-primary rounded-full hover:bg-brand-secondary transition-all duration-300 w-8 h-8 absolute top-1/2 -translate-y-1/2 ${isSidebarOpen ? 'right-2' : '-right-4'}`}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <ChevronLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        <nav className="flex-grow p-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={String(item.label)}
              icon={item.icon}
              label={item.label}
              isActive={currentPage === item.label || 
                (item.label === mijnTeamLabel && (currentPage === Page.MijnPriveTeam || currentPage === Page.Organization)) || 
                (item.label === kennisbankLabel && (currentPage === Page.TeamKnowledgeBase || currentPage === Page.OrganizationNews))}
              onClick={() => handleNavClick(item.label)}
              isSidebarOpen={isSidebarOpen}
            />
          ))}
        </nav>
        
        <div className="p-3 mt-auto border-t border-brand-border space-y-2">
            <NavItem
              icon={
                user?.profilePicture ? 
                <img src={user.profilePicture} alt="Profile" className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> :
                <UserCircleIcon className="w-6 h-6 flex-shrink-0"/>
              }
              label={Page.Profile}
              isActive={currentPage === Page.Profile}
              onClick={() => handleNavClick(Page.Profile)}
              isSidebarOpen={isSidebarOpen}
            />
             <NavItem
              icon={<Cog6ToothIcon className="flex-shrink-0 w-6 h-6"/>}
              label={Page.Settings}
              isActive={currentPage === Page.Settings}
              onClick={() => handleNavClick(Page.Settings)}
              isSidebarOpen={isSidebarOpen}
            />
            <ThemeToggle isSidebarOpen={isSidebarOpen} />
            <button
              onClick={logout}
              title={t('nav_logout')}
              className={`flex items-center w-full py-2.5 rounded-lg transition-colors duration-200 text-red-500/80 hover:bg-red-500/10 hover:text-red-500 ${isSidebarOpen ? 'px-4' : 'justify-center'}`}
              aria-label={t('nav_logout')}
            >
              <ArrowRightOnRectangleIcon className="flex-shrink-0 w-6 h-6" />
              <span 
                className="ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300"
                style={{ maxWidth: isSidebarOpen ? '150px' : '0', opacity: isSidebarOpen ? 1 : 0 }}
              >
                {t('nav_logout')}
              </span>
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            currentPage={getPageTitle(currentPage)} 
            onMenuClick={() => setIsSidebarOpen(true)}
            onLogSaleClick={() => setIsLogSaleModalOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
      <LogSaleModal 
        isOpen={isLogSaleModalOpen}
        onClose={() => setIsLogSaleModalOpen(false)}
        onLogSale={handleLogSale}
      />
      <HelpChatbot />
    </div>
  );
};

export default Layout;
