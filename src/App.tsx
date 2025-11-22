import React, { useState, createContext, useContext, useEffect } from 'react';
import { Page } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PitchGenerator from './pages/PitchGenerator';
import Clients from './pages/Clients';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import Goals from './pages/Goals';
import Pitches from './pages/Pitches';
import PitchPractice from './pages/PitchPractice';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import TeamKnowledgeBase from './pages/TeamKnowledgeBase';
import CompetitorNotes from './pages/CompetitorNotes';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import AlgeheleTeam from './pages/AlgeheleTeam';
import ManagerView from './pages/ManagerView';
import Planning from './pages/Planning';
import PackageManagement from './pages/PackageManagement';
import OwnerDashboard from './pages/OwnerDashboard';
import OrganizationView from './pages/OrganizationView';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ServicesAndRates from './pages/ServicesAndRates';
import TermsAndConditions from './pages/TermsAndConditions';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import { TranslationProvider } from './context/TranslationContext';
import BillingPage from './pages/BillingPage';
import SalesAnalytics from './pages/SalesAnalytics';
import MyPrivateTeamView from './pages/MyPrivateTeamView';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const LoggedInApp: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);

  const renderPage = () => {
    const isOwner = user?.role === 'owner';
    const isManagerOrOwner = user?.role === 'manager' || isOwner;

    // Fallback for pages that might have been removed
    const ownerForbiddenPages = [
        Page.PitchGenerator, Page.Pitches, Page.PitchPractice, 
        Page.CompetitorAnalysis, Page.Goals, Page.Clients, Page.CompetitorNotes
    ];
    if (isOwner && ownerForbiddenPages.includes(currentPage)) {
        return <OwnerDashboard setCurrentPage={setCurrentPage} />;
    }
    if ((currentPage === Page.Clients || currentPage === Page.Goals) && (isOwner || user?.role === 'manager')) {
        return isOwner ? <OwnerDashboard setCurrentPage={setCurrentPage} /> : <Dashboard />;
    }

    switch (currentPage) {
      case Page.Dashboard:
        if (isOwner) return <OwnerDashboard setCurrentPage={setCurrentPage} />;
        return <Dashboard />;
      case Page.PitchGenerator:
        return <PitchGenerator />;
      case Page.Pitches:
        return <Pitches />;
      case Page.PitchPractice:
        return <PitchPractice />;
      case Page.Clients:
        return <Clients />;
      case Page.CompetitorAnalysis:
        return <CompetitorAnalysis />;
      case Page.CompetitorNotes:
        return <CompetitorNotes />;
      case Page.Goals:
        return <Goals />;
      case Page.Settings:
        return <Settings />;
      case Page.Organization:
        if (isOwner) return <OrganizationView />;
        return <Dashboard />; // Fallback for non-owners
      case Page.MijnPriveTeam:
        if (isOwner) return <OrganizationView />;
        if (user?.role === 'manager') return <ManagerView />;
        if (user?.role && ['salesperson', 'leader', 'team-leader'].includes(user.role)) {
            return <MyPrivateTeamView />;
        }
        return <Dashboard />; // Fallback
      case Page.MijnFiliaalTeam:
         if (user?.role && ['salesperson', 'leader', 'team-leader', 'manager', 'owner'].includes(user.role)) {
            return <AlgeheleTeam />;
        }
        return <Dashboard />;
      case Page.Profile:
        return <Profile />;
      case Page.TeamKnowledgeBase:
      case Page.OrganizationNews:
        return <TeamKnowledgeBase />;
      case Page.Planning:
        if (isManagerOrOwner) return <Planning />;
        return <Dashboard />;
      case Page.PackageManagement:
        if (isManagerOrOwner) return <PackageManagement />;
        return <Dashboard />;
      case Page.Billing:
        if (isOwner) return <BillingPage />;
        return <Dashboard />;
      case Page.SalesAnalytics:
        if (isOwner) return <SalesAnalytics />;
        return <Dashboard />;
      default:
        if (isOwner) return <OwnerDashboard setCurrentPage={setCurrentPage} />;
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};


const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-brand-background">
            <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  if (user) {
    if (user.forcePasswordChange) {
      return <ChangePasswordPage />;
    }
    return <LoggedInApp />;
  }

  switch (route) {
    case '#/register':
      return <RegisterPage />;
    case '#/login':
      return <LoginPage />;
    case '#/privacy':
      return <PrivacyPolicy />;
    case '#/services':
      return <ServicesAndRates />;
    case '#/terms':
      return <TermsAndConditions />;
    case '#/contact':
      return <ContactPage />;
    case '#/about':
      return <AboutPage />;
    default:
      return <LandingPage />;
  }
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TranslationProvider>
          <AppContent />
        </TranslationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;