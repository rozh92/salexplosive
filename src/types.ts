export enum Page {
  Dashboard = 'Dashboard',
  PitchGenerator = 'Pitch Generator',
  Pitches = 'Opgeslagen Pitches',
  PitchPractice = 'Pitch Oefenen',
  Clients = 'Klanten',
  CompetitorAnalysis = 'Concurrentieanalyse',
  CompetitorNotes = 'Concurrentie Notities',
  Goals = 'Doelen',
  Settings = 'Instellingen',
  MijnPriveTeam = 'Mijn Privé Team',
  Organization = 'Mijn Organisatie',
  MijnFiliaalTeam = 'Mijn Filiaal Team',
  Profile = 'Profiel',
  TeamKnowledgeBase = 'Team Kennisbank',
  OrganizationNews = 'Organisatie News',
  Planning = 'Planning',
  PackageManagement = 'Pakketbeheer',
  Billing = 'Facturatie',
  SalesAnalytics = 'Verkoopanalyse',
}

export type UserRole = 'salesperson' | 'leader' | 'team-leader' | 'manager' | 'owner';

export interface ProductPackage {
  id: string;
  name: string;
  industry: 'telecom' | 'energy';
  company: string;
  value: number;
  companyId?: string;
}

export interface Sale {
    id: string;
    date: string; // ISO 8601 format
    packageId: string;
    packageName: string;
    value: number;
    companyId?: string;
}

export interface User {
  uid?: string;
  name: string;
  email: string;
  password?: string;
  industry: 'telecom' | 'energy' | 'beide';
  company: string;
  branchName: string;
  salesChannel: 'deur-aan-deur' | 'telefonisch' | 'beide';
  role: UserRole;
  teamMembers?: string[];
  sales?: Sale[];
  forcePasswordChange?: boolean;
  profilePicture?: string; 
  badges?: string[];
  totalSalesToday?: number;
  totalSalesWeek?: number;
  totalSalesMonth?: number;
  companyId?: string;
  status?: 'pending' | 'approved';
  lang?: 'nl' | 'en' | 'de';
  purchasedLicenses?: number;

  // Manager/Company registration fields
  jobTitle?: string;
  phoneNumber?: string;
  companyName?: string;
  kvk?: string;
  btwNumber?: string;
  companySector?: string;
  numberOfEmployees?: number;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  companyWebsite?: string;
  companyPhoneNumber?: string;
  invoiceEmail?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  notes: string;
  createdAt: string;
  companyId?: string;
}

export interface Goal {
  id: string;
  type: 'daily' | 'weekly';
  goalType: 'sales';
  target: number;
  companyId?: string;
}


export interface Pitch {
    id: string;
    name: string;
    content: string;
    createdAt: string;
    companyId?: string;
}

export interface KnowledgeBasePitch extends Pitch {
  promotedBy: string;
  note: string;
  branchName?: string;
}

export interface MotivationPost {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  title: string;
  content: string;
  createdAt: string; // ISO 8601 format
  keep?: boolean;
  companyId?: string;
  branchName?: string;
}

export interface CompetitorNote {
  id: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  competitor: string;
  industry: 'telecom' | 'energy' | 'beide';
  notes: string;
  usps: string;
  companyId?: string;
  branchName?: string;
  
  telecom_packageType?: 'internet' | 'tv' | 'telefonie' | 'internet_tv' | 'internet_telefonie' | 'alles_in_1';
  telecom_internetSpeed?: string;
  telecom_monthlyPrice?: string;
  telecom_tvDetails?: string;
  telecom_phoneDetails?: string;

  energy_powerRate?: string;
  energy_powerRateLow?: string;
  energy_gasRate?: string;
  energy_contractDuration?: '1 jaar' | '3 jaar';
  energy_rateType?: 'enkel' | 'dubbel';
}

// FIX: Export the TelecomOffer interface so it can be imported in other files.
export interface TelecomOffer {
    packageName: string;
    internetSpeed: number | null;
    monthlyPrice: number | null;
    setupFee: number | null;
    discount: number | null;
    usps: string[];
}

export interface TelecomCompetitorData {
    companyName: string;
    standardOffer: TelecomOffer;
    newCustomerOffer: TelecomOffer;
}

// FIX: Export the EnergyOffer interface so it can be imported in other files.
export interface EnergyOffer {
    contractType: string;
    powerRateNormal: number | null;
    powerRateLow?: number | null;
    gasRate: number | null;
    fixedCostMonthly: number | null;
    welcomeBonus: number | null;
    usps: string[];
}

export interface EnergyCompetitorData {
    companyName: string;
    standardOffer: EnergyOffer;
    newCustomerOffer: EnergyOffer;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface WeeklyReview {
    generatedAt: string;
    content: string;
}

export interface Planning {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  companyId?: string;
}

// --- HIER ZAT DE FOUT ---
// Ik heb taggedUsers en ownerId toegevoegd zodat Planning.tsx en AuthContext.tsx werken.
export interface Appointment {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  notes: string;
  companyId?: string;
  taggedUsers?: string[]; // NIEUW: Lijst met managers die dit mogen zien
  ownerId?: string;       // NIEUW: De ID van de maker (nodig voor filtering)
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD format
  amount: number;
  currency: 'EUR' | 'GBP';
  status: 'Betaald' | 'Openstaand';
  downloadUrl: string;
}

export interface MarketIntelligenceNote {
  id: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO 8601 format
  category: 'Infrastructuur' | 'Demografie' | 'Markttrends' | 'Concurrentie Actie' | 'Algemeen';
  content: string;
  companyId?: string;
  branchName?: string;
}

export interface TrainingResult {
  id: string;
  traineeId: string;
  traineeName: string;
  superiorId: string;
  superiorName: string;
  pitchName: string;
  transcript: string;
  feedback: string;
  createdAt: string;
  companyId: string;
  branchName: string;
  isReviewed: boolean;
}