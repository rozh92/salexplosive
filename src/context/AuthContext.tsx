import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole, Sale, Pitch, KnowledgeBasePitch, Client, Goal, MotivationPost, CompetitorNote, Planning, Appointment, ProductPackage, MarketIntelligenceNote, Invoice, TrainingResult } from '../types';
import { auth, db, firebaseConfig, app } from '../firebase/config';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updatePassword,
    getAuth,
} from 'firebase/auth';
// --- AANGEPAST: 'or' toegevoegd aan imports ---
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, addDoc, deleteDoc, writeBatch, arrayUnion, onSnapshot, Unsubscribe, or } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { checkAndAwardBadges } from '../utils/gamification';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getSalesValueForPeriod } from '../utils/salesUtils';

// Secondary Firebase app for user creation without automatic login
const secondaryApp = !getApps().some(a => a.name === "secondaryApp") 
    ? initializeApp(firebaseConfig, "secondaryApp") 
    : getApp("secondaryApp");
const secondaryAuth = getAuth(secondaryApp);

interface AuthContextType {
    user: User | null;
    users: User[]; 
    allUsers: User[]; 
    loading: boolean;
    error: string | null;
    pitches: Pitch[];
    knowledgeBasePitches: KnowledgeBasePitch[];
    clients: Client[];
    goals: Goal[];
    motivationPosts: MotivationPost[];
    competitorNotes: CompetitorNote[];
    plannings: Planning[];
    appointments: Appointment[];
    productPackages: ProductPackage[];
    marketIntelligenceNotes: MarketIntelligenceNote[];
    invoices: Invoice[];
    login: (email: string, password: string) => Promise<void>;
    registerManagerAccount: (managerData: Partial<User>) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updatedData: Partial<User>) => Promise<void>;
    addTeamMember: (memberData: Omit<User, 'role' | 'teamMembers' | 'sales' | 'forcePasswordChange' | 'profilePicture' | 'badges' | 'totalSalesToday' | 'totalSalesWeek' | 'totalSalesMonth'>, role: UserRole) => Promise<void>;
    createBranchAndManager: (branchName: string, managerData: Omit<User, 'role' | 'teamMembers' | 'sales' | 'forcePasswordChange' | 'profilePicture' | 'badges' | 'totalSalesToday' | 'totalSalesWeek' | 'totalSalesMonth' | 'branchName' | 'company' | 'industry' | 'salesChannel'>, purchasedLicenses: number) => Promise<void>;
    updateBranchDetails: (originalBranchName: string, newBranchName: string, newManagerEmail?: string) => Promise<void>;
    logSale: (pkg: ProductPackage) => Promise<void>;
    changePassword: (newPassword: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    addPitch: (pitch: Omit<Pitch, 'id'>) => Promise<Pitch>;
    updatePitch: (pitch: Pitch) => Promise<void>;
    deletePitch: (pitchId: string) => Promise<void>;
    promotePitchToKB: (pitch: Pitch, note: string) => Promise<void>;
    addKnowledgeBasePost: (title: string, content: string) => Promise<void>;
    deleteKnowledgeBasePost: (postId: string) => Promise<void>;
    addContentToKB: (postData: { title: string; content: string; note: string; }) => Promise<void>;
    updateTeamMemberRole: (memberEmail: string, newRole: UserRole) => Promise<void>;
    addClient: (clientData: Omit<Client, 'id'>) => Promise<Client>;
    updateClient: (client: Client) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;
    addGoal: (goalData: Omit<Goal, 'id' | 'goalType'>) => Promise<Goal>;
    deleteGoal: (goalId: string) => Promise<void>;
    addMotivationPost: (postData: Omit<MotivationPost, 'id' | 'authorId' | 'authorName' | 'authorProfilePicture' | 'createdAt'>) => Promise<void>;
    updateMotivationPost: (post: MotivationPost) => Promise<void>;
    deleteMotivationPost: (postId: string) => Promise<void>;
    addCompetitorNote: (noteData: Omit<CompetitorNote, 'id' | 'authorId' | 'authorName' | 'createdAt'>) => Promise<void>;
    updateCompetitorNote: (note: CompetitorNote) => Promise<void>;
    deleteCompetitorNote: (noteId: string) => Promise<void>;
    addMarketIntelligenceNote: (noteData: Omit<MarketIntelligenceNote, 'id' | 'authorId' | 'authorName' | 'createdAt'>) => Promise<void>;
    addPlanning: (planningData: Omit<Planning, 'id'>) => Promise<Planning>;
    deletePlanning: (planningId: string) => Promise<void>;
    addAppointment: (appointmentData: Omit<Appointment, 'id'>) => Promise<Appointment>;
    updateAppointment: (appointment: Appointment) => Promise<void>;
    deleteAppointment: (appointmentId: string) => Promise<void>;
    addProductPackage: (packageData: Omit<ProductPackage, 'id'>) => Promise<void>;
    updateProductPackage: (pkg: ProductPackage) => Promise<void>;
    deleteProductPackage: (packageId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    deleteBranch: (branchName: string) => Promise<number>;
    decreasePurchasedLicenses: (amount: number) => Promise<void>;
    sharePracticeResults: (data: { pitchName: string; transcript: string; feedback: string; }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [pitches, setPitches] = useState<Pitch[]>([]);
    const [knowledgeBasePitches, setKnowledgeBasePitches] = useState<KnowledgeBasePitch[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [motivationPosts, setMotivationPosts] = useState<MotivationPost[]>([]);
    const [competitorNotes, setCompetitorNotes] = useState<CompetitorNote[]>([]);
    const [plannings, setPlannings] = useState<Planning[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [productPackages, setProductPackages] = useState<ProductPackage[]>([]);
    const [marketIntelligenceNotes, setMarketIntelligenceNotes] = useState<MarketIntelligenceNote[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [activeListeners, setActiveListeners] = useState<Unsubscribe[]>([]);
    
    const cleanupListeners = () => {
        activeListeners.forEach(unsubscribe => unsubscribe());
        setActiveListeners([]);
    };

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            cleanupListeners(); 

            if (firebaseUser) {
                setLoading(true);
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                let innerListeners: Unsubscribe[] = [];

                const userUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
                    innerListeners.forEach(unsub => unsub());
                    innerListeners = [];

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data() as User;
    
                        if (userData.status === 'pending') {
                            signOut(auth);
                            setUser(null);
                            setLoading(false);
                            return;
                        }

                        const salesUnsubscribe = onSnapshot(collection(db, 'users', firebaseUser.uid, 'sales'), (salesSnap) => {
                            const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
                             const fullUserData: User = {
                                uid: firebaseUser.uid, ...userData, sales,
                                totalSalesToday: getSalesValueForPeriod(sales, 'today'),
                                totalSalesWeek: getSalesValueForPeriod(sales, 'week'),
                                totalSalesMonth: getSalesValueForPeriod(sales, 'month'),
                            };
                            setUser(fullUserData);

                            const newBadges = checkAndAwardBadges(sales.reduce((acc, s) => acc + s.value, 0), userData.badges || []);
                            if (JSON.stringify(newBadges) !== JSON.stringify(userData.badges)) {
                                updateDoc(userDocRef, { badges: newBadges });
                            }
                        });
                        innerListeners.push(salesUnsubscribe);
                        
                        if (userData.companyId) {
                            const companyId = userData.companyId;

                            const allUsersQuery = query(collection(db, 'users'), where('companyId', '==', companyId));
                            innerListeners.push(onSnapshot(allUsersQuery, async (snapshot) => {
                                const allCompanyUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
                                const allCompanyUsersWithSales = await Promise.all(allCompanyUsers.map(async (u) => {
                                    if (!u.uid) return u;
                                    const salesSnap = await getDocs(collection(db, 'users', u.uid, 'sales'));
                                    const sales = salesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
                                    return {
                                        ...u, sales,
                                        totalSalesToday: getSalesValueForPeriod(sales, 'today'),
                                        totalSalesWeek: getSalesValueForPeriod(sales, 'week'),
                                        totalSalesMonth: getSalesValueForPeriod(sales, 'month'),
                                    };
                                }));
                                setAllUsers(allCompanyUsersWithSales);
                                setUsers(allCompanyUsersWithSales.filter(u => u.branchName === userData.branchName));
                            }));
                            
                            const companyCollections: Record<string, React.Dispatch<any>> = {
                                knowledgeBase: setKnowledgeBasePitches, motivationPosts: setMotivationPosts,
                                competitorNotes: setCompetitorNotes, productPackages: setProductPackages,
                                marketIntelligenceNotes: setMarketIntelligenceNotes
                            };
                            Object.keys(companyCollections).forEach(col => {
                                innerListeners.push(onSnapshot(query(collection(db, col), where('companyId', '==', companyId)), (snapshot) => {
                                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                    if (data.length > 0 && 'createdAt' in data[0]) {
                                        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                    }
                                    companyCollections[col](data);
                                }));
                            });

                            // --- AANGEPAST: 'appointments' verwijderd uit deze lijst, want die heeft nu speciale logica ---
                            const userSubCollections: Record<string, React.Dispatch<any>> = {
                                pitches: setPitches, clients: setClients, goals: setGoals,
                                plannings: setPlannings
                            };
                            Object.keys(userSubCollections).forEach(col => {
                                innerListeners.push(onSnapshot(collection(db, 'users', firebaseUser.uid, col), (snapshot) => {
                                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                    if (data.length > 0 && 'createdAt' in data[0]) {
                                        data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                    }
                                    userSubCollections[col](data);
                                }));
                            });

                            // --- AANGEPAST: Nieuwe listener voor APPOINTMENTS ---
                            // Deze zoekt in de HOOFDCOLLECTIE 'appointments' naar items waar:
                            // 1. Jij de eigenaar bent (ownerId == jouw ID)
                            // 2. OF waar jij getagd bent (taggedUsers bevat jouw ID)
                            const appointmentsQuery = query(
                                collection(db, 'appointments'),
                                or(
                                    where('ownerId', '==', firebaseUser.uid),
                                    where('taggedUsers', 'array-contains', firebaseUser.uid)
                                )
                            );
                            
                            innerListeners.push(onSnapshot(appointmentsQuery, (snapshot) => {
                                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                // Sorteren op datum/tijd (optioneel, maar handig)
                                // data.sort((a: any, b: any) => ... ); 
                                setAppointments(data as Appointment[]);
                            }));

                            
                            if(userData.role === 'owner'){
                                innerListeners.push(onSnapshot(query(collection(db, 'invoices'), where('companyId', '==', companyId)), (snapshot) => {
                                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                    if (data.length > 0 && 'date' in data[0]) {
                                        data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                    }
                                    setInvoices(data as Invoice[]);
                                }));
                            }
                        }
                    } else {
                        signOut(auth);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user document:", error);
                    setError("Kon gebruikersgegevens niet live bijwerken.");
                    setLoading(false);
                });
                setActiveListeners([userUnsubscribe, () => innerListeners.forEach(unsub => unsub())]);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsubscribe();
            cleanupListeners();
        };
    }, []);


    const login = async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists() && userDocSnap.data().status === 'pending') {
            await signOut(auth);
            const pendingError = new Error("Account is in afwachting van goedkeuring.");
            pendingError.name = "PendingApproval";
            throw pendingError;
        }
    };

    const registerManagerAccount = async (managerData: Partial<User>) => {
        const { email, password, ...restData } = managerData;
        if (!email || !password) throw new Error("Email and password are required.");
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const { user: firebaseUser } = userCredential;

        const numberOfEmployees = restData.numberOfEmployees || 0;
        const purchasedLicenses = numberOfEmployees + 1;

        const newManager: User = {
            name: restData.name || '',
            email: firebaseUser.email || '', 
            industry: restData.industry || 'telecom',
            company: restData.companyName || '',
            branchName: restData.companyName || '',
            salesChannel: restData.salesChannel || 'deur-aan-deur',
            role: 'owner',
            companyId: firebaseUser.uid,
            status: 'pending',
            ...restData,
            purchasedLicenses: purchasedLicenses,
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newManager);
        await signOut(secondaryAuth);
    };
    
    const createBranchAndManager = async (branchName: string, managerData: Omit<User, 'role' | 'teamMembers' | 'sales' | 'forcePasswordChange' | 'profilePicture' | 'badges' | 'totalSalesToday' | 'totalSalesWeek' | 'totalSalesMonth' | 'branchName' | 'company' | 'industry' | 'salesChannel'>, purchasedLicenses: number) => {
        if (!user || user.role !== 'owner' || !user.companyId) throw new Error("Permission denied");
        
        const { email, password, ...restData } = managerData;
        if (!email || !password) throw new Error("Email and password are required for the new manager.");

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const { user: firebaseUser } = userCredential;

        const newManagerRef = doc(db, 'users', firebaseUser.uid);
        const newManager: Partial<User> = {
            ...restData,
            email: firebaseUser.email || '', 
            role: 'manager',
            branchName,
            company: user.company,
            industry: user.industry,
            salesChannel: user.salesChannel,
            companyId: user.companyId,
            forcePasswordChange: true,
            lang: user.lang,
            // FIX: Ensure purchasedLicenses has a fallback value to prevent 'undefined' error in Firestore
            purchasedLicenses: purchasedLicenses || 1,
        };
        await setDoc(newManagerRef, newManager);

        await signOut(secondaryAuth);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUsers([]);
        setAllUsers([]);
        setError(null);
        setPitches([]);
        setKnowledgeBasePitches([]);
        setClients([]);
        setGoals([]);
        setMotivationPosts([]);
        setCompetitorNotes([]);
        setMarketIntelligenceNotes([]);
        setPlannings([]);
        setAppointments([]);
        setProductPackages([]);
        setInvoices([]);
        cleanupListeners();
    };
    
    const updateUser = async (updatedData: Partial<User>) => {
        if (!auth.currentUser) throw new Error("Not authenticated");
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, updatedData);
    };
    
    const addTeamMember = async (memberData: Omit<User, 'role' | 'teamMembers' | 'sales' | 'forcePasswordChange' | 'profilePicture' | 'badges' | 'totalSalesToday' | 'totalSalesWeek' | 'totalSalesMonth'>, role: UserRole) => {
        if (!auth.currentUser || !user) throw new Error("Not authenticated.");

        const isLeadership = user.role === 'manager' || user.role === 'team-leader' || user.role === 'leader';
        if (isLeadership) {
            const usedLicenses = allUsers.filter(u => u.branchName === user.branchName).length;
            const branchManager = allUsers.find(u => u.branchName === user.branchName && u.role === 'manager');
            const purchasedLicenses = branchManager?.purchasedLicenses || 0;

            if (usedLicenses >= purchasedLicenses) {
                if (user.role === 'manager') {
                    throw new Error("Alle licenties voor uw filiaal zijn in gebruik. Koop alstublieft extra licenties via de 'Mijn Filiaal' pagina.");
                } else { // Leader or Team-Leader
                    throw new Error("Alle licenties voor uw filiaal zijn in gebruik. Vraag uw manager om extra licenties aan te schaffen.");
                }
            }
        }
        
        const { email, password, ...restData } = memberData;
        if (!email || !password) throw new Error("Email and password are required.");

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const { user: firebaseUser } = userCredential;

        const newMember: Partial<User> = {
            ...restData,
            email,
            role,
            forcePasswordChange: true,
            companyId: user.companyId,
            branchName: user.branchName,
            lang: user.lang,
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), newMember);
        await signOut(secondaryAuth);
        
        if (user.role === 'leader' || user.role === 'team-leader') {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { teamMembers: arrayUnion(email) });
        }
    };

    const logSale = async (pkg: ProductPackage) => {
        if (!auth.currentUser || !user) throw new Error("Not authenticated");
        const newSale: Omit<Sale, 'id'> = {
            date: new Date().toISOString(),
            packageId: pkg.id,
            packageName: pkg.name,
            value: pkg.value,
            companyId: user.companyId,
        };
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'sales'), newSale);
    };

    const changePassword = async (newPassword: string) => {
        if (!auth.currentUser) throw new Error("Not authenticated");
        await updatePassword(auth.currentUser, newPassword);
        if (user?.forcePasswordChange) {
            await updateUser({ forcePasswordChange: false });
        }
    };
    
    const resetPassword = async (email: string) => {
        const functions = getFunctions(app, 'europe-west3'); 
        const requestPasswordResetFn = httpsCallable(functions, 'requestPasswordReset');
        await requestPasswordResetFn({ email });
    };

    const createCrudFunctions = <T extends {id: string}>(collectionName: string, isSubCollection = false) => {
        const getColRef = () => isSubCollection && auth.currentUser
            ? collection(db, 'users', auth.currentUser.uid, collectionName)
            : collection(db, collectionName);

        const add = async (data: Omit<T, 'id'>): Promise<T> => {
            if (!user || !user.companyId || !auth.currentUser) throw new Error("Not authenticated");
            // --- AANGEPAST: ownerId toegevoegd aan elk document voor identificatie ---
            const dataWithCompanyId = { 
                ...data, 
                companyId: user.companyId, 
                ownerId: auth.currentUser.uid, // Belangrijk voor filtering!
                createdAt: new Date().toISOString() 
            };
            const colRef = getColRef();
            if (!colRef) throw new Error("Could not create collection reference.");
            const docRef = await addDoc(colRef, dataWithCompanyId);
            return { id: docRef.id, ...dataWithCompanyId } as unknown as T;
        };
        const update = async (updatedData: T) => {
            // Check if updates are needed in root or subcollection
            const docPath = isSubCollection && auth.currentUser ? `users/${auth.currentUser.uid}/${collectionName}` : collectionName;
            const docRef = doc(db, docPath, updatedData.id);
            await updateDoc(docRef, updatedData as { [x: string]: any });
        };
        const remove = async (id: string) => {
            const docPath = isSubCollection && auth.currentUser ? `users/${auth.currentUser.uid}/${collectionName}` : collectionName;
            const docRef = doc(db, docPath, id);
            await deleteDoc(docRef);
        };
        return { add, update, remove };
    };

    const { add: addPitch, update: updatePitch, remove: deletePitch } = createCrudFunctions<Pitch>('pitches', true);
    const { add: addClient, update: updateClient, remove: deleteClient } = createCrudFunctions<Client>('clients', true);
    const { remove: deleteGoal } = createCrudFunctions<Goal>('goals', true);
    const { add: addPlanning, remove: deletePlanning } = createCrudFunctions<Planning>('plannings', true);
    
    // --- AANGEPAST: Appointments staan nu op 'false' (hoofdcollectie) ---
    const { add: addAppointment, update: updateAppointment, remove: deleteAppointment } = createCrudFunctions<Appointment>('appointments', false);

    const addGoal = async (goalData: Omit<Goal, 'id' | 'goalType'>): Promise<Goal> => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        
        const newGoalData: Omit<Goal, 'id'> = {
            ...goalData,
            goalType: 'sales', 
            companyId: user.companyId
        };
        
        const colRef = collection(db, 'users', auth.currentUser.uid, 'goals');
        const docRef = await addDoc(colRef, newGoalData);
        
        return { id: docRef.id, ...newGoalData } as Goal;
    };

    const promotePitchToKB = async (pitch: Pitch, note: string) => {
        if (!user || (user.role !== 'manager' && user.role !== 'leader' && user.role !== 'team-leader')) throw new Error("Permission denied");
        const kbPitch: Omit<KnowledgeBasePitch, 'id'> = {
            ...pitch,
            promotedBy: user.name,
            note,
            branchName: user.branchName,
            companyId: user.companyId,
        };
        await addDoc(collection(db, 'knowledgeBase'), kbPitch);
    };
    
     const addKnowledgeBasePost = async (title: string, content: string) => {
        if (!user) throw new Error("Permission denied");
        
        const newPost: any = {
            name: title,
            content: `**Mededeling: ${title}**\n\n${content}`,
            createdAt: new Date().toISOString(),
            promotedBy: user.name,
            note: user.role === 'owner' ? "Mededeling van de directie" : "Mededeling van de manager",
            companyId: user.companyId,
            branchName: user.role === 'owner' ? '__ORGANIZATION__' : user.branchName,
        };

        await addDoc(collection(db, 'knowledgeBase'), newPost);
    };

    const addContentToKB = async (postData: { title: string; content: string; note: string; }) => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        const { title, content, note } = postData;
        const kbPost: Omit<KnowledgeBasePitch, 'id'> = {
            name: title,
            content: content,
            createdAt: new Date().toISOString(),
            promotedBy: user.name,
            note: note,
            branchName: user.role === 'owner' ? '__ORGANIZATION__' : user.branchName,
            companyId: user.companyId,
        };
        await addDoc(collection(db, 'knowledgeBase'), kbPost);
    };

    const deleteKnowledgeBasePost = async (postId: string) => {
        if (!user || (user.role !== 'manager' && user.role !== 'owner')) throw new Error("Permission denied");
        await deleteDoc(doc(db, 'knowledgeBase', postId));
    };

    const updateTeamMemberRole = async (memberEmail: string, newRole: UserRole) => {
        if (!user || (user.role !== 'team-leader' && user.role !== 'manager' && user.role !== 'owner')) {
            throw new Error("Permission denied to change roles.");
        }
        const userToUpdate = allUsers.find(u => u.email === memberEmail);
        if (!userToUpdate) throw new Error("User not found.");

        const q = query(collection(db, 'users'), where("email", "==", memberEmail), where("companyId", "==", user.companyId));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) throw new Error("User not found in your company.");
        
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, { role: newRole });
    };

    const updateBranchDetails = async (originalBranchName: string, newBranchName: string, newManagerEmail?: string) => {
        if (!user || user.role !== 'owner') throw new Error("Permission denied for updating branch details.");
    
        const batch = writeBatch(db);
    
        const usersInBranchQuery = query(collection(db, 'users'), where("companyId", "==", user.companyId), where("branchName", "==", originalBranchName));
        const branchSnapshot = await getDocs(usersInBranchQuery);
    
        if (branchSnapshot.empty && !newManagerEmail) {
            console.warn("No users found in branch:", originalBranchName);
            return;
        }
    
        if (originalBranchName !== newBranchName) {
            branchSnapshot.forEach(userDoc => {
                batch.update(userDoc.ref, { branchName: newBranchName });
            });
        }
    
        if (newManagerEmail) {
            const oldManagerDoc = branchSnapshot.docs.find(doc => doc.data().role === 'manager');
            if (oldManagerDoc) {
                batch.update(oldManagerDoc.ref, { role: 'salesperson' });
            }
    
            const newManagerQuery = query(collection(db, 'users'), where("companyId", "==", user.companyId), where("email", "==", newManagerEmail));
            const newManagerSnapshot = await getDocs(newManagerQuery);
    
            if (newManagerSnapshot.empty) {
                throw new Error(`User with email ${newManagerEmail} not found.`);
            }
            const newManagerDoc = newManagerSnapshot.docs[0];
            const updatePayload: { role: UserRole, branchName?: string } = { role: 'manager' };
            if (newManagerDoc.data().branchName !== newBranchName) {
                updatePayload.branchName = newBranchName;
            }
            batch.update(newManagerDoc.ref, updatePayload);
        }
    
        await batch.commit();
    };

    const addMotivationPost = async (postData: Omit<MotivationPost, 'id' | 'authorId' | 'authorName' | 'authorProfilePicture' | 'createdAt'>) => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        const newPost: any = {
            ...postData,
            authorId: auth.currentUser.uid,
            authorName: user.name,
            createdAt: new Date().toISOString(),
            companyId: user.companyId,
            branchName: user.role === 'owner' ? '__ORGANIZATION__' : user.branchName,
        };
        if (user.profilePicture) {
            newPost.authorProfilePicture = user.profilePicture;
        }
        await addDoc(collection(db, 'motivationPosts'), newPost);
    };
    
    const updateMotivationPost = async (post: MotivationPost) => {
        const postRef = doc(db, 'motivationPosts', post.id);
        await updateDoc(postRef, post as { [x: string]: any });
    };

    const deleteMotivationPost = async (postId: string) => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        const isPrivileged = user.role === 'leader' || user.role === 'team-leader' || user.role === 'manager' || user.role === 'owner';
        const post = motivationPosts.find(p => p.id === postId);
        if (isPrivileged || post?.authorId === auth.currentUser.uid) {
            await deleteDoc(doc(db, 'motivationPosts', postId));
        } else {
            throw new Error("Permission denied");
        }
    };

    const addCompetitorNote = async (noteData: Omit<CompetitorNote, 'id' | 'authorId' | 'authorName' | 'createdAt'>) => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        
        const cleanedData = { ...noteData };
        Object.keys(cleanedData).forEach(key => {
            if ((cleanedData as any)[key] === undefined) {
                delete (cleanedData as any)[key];
            }
        });

        const newNote: any = {
           ...cleanedData,
           authorId: auth.currentUser.uid,
           authorName: user.name,
           createdAt: new Date().toISOString(),
           companyId: user.companyId,
           branchName: user.role === 'owner' ? '__ORGANIZATION__' : user.branchName,
        };
        await addDoc(collection(db, 'competitorNotes'), newNote);
   };
   const updateCompetitorNote = async (note: CompetitorNote) => {
       const cleanedNote = { ...note };
       Object.keys(cleanedNote).forEach(key => {
           if ((cleanedNote as any)[key] === undefined) {
               delete (cleanedNote as any)[key];
           }
       });

       const noteRef = doc(db, 'competitorNotes', cleanedNote.id);
       await updateDoc(noteRef, cleanedNote as { [x: string]: any });
   };
    const deleteCompetitorNote = async (noteId: string) => {
        await deleteDoc(doc(db, 'competitorNotes', noteId));
    };

    const addMarketIntelligenceNote = async (noteData: Omit<MarketIntelligenceNote, 'id' | 'authorId' | 'authorName' | 'createdAt'>) => {
        if (!user || !auth.currentUser) throw new Error("Not authenticated");
        const newNote: any = {
            ...noteData,
            authorId: auth.currentUser.uid,
            authorName: user.name,
            createdAt: new Date().toISOString(),
            companyId: user.companyId,
            branchName: user.role === 'owner' ? '__ORGANIZATION__' : user.branchName,
        };
        await addDoc(collection(db, 'marketIntelligenceNotes'), newNote);
    };
    
    const addProductPackage = async (packageData: Omit<ProductPackage, 'id'>) => {
        if (!user) throw new Error("Not authenticated");
        const branchName = user.role === 'owner' ? '__ORGANIZATION__' : user.branchName;
        const newPackage = { ...packageData, companyId: user.companyId, branchName: branchName };
        await addDoc(collection(db, 'productPackages'), newPackage);
    };

    const updateProductPackage = async (pkg: ProductPackage) => {
        if (!user) throw new Error("Not authenticated");
        const packageToUpdate = { ...pkg, companyId: user.companyId };
        await updateDoc(doc(db, 'productPackages', packageToUpdate.id), packageToUpdate as { [x: string]: any });
    };

    const deleteProductPackage = async (packageId: string) => {
        await deleteDoc(doc(db, 'productPackages', packageId));
    };

    const decreasePurchasedLicenses = async (amount: number) => {
        if (!user || user.role !== 'owner' || !auth.currentUser) throw new Error("Permission denied");
        if (amount <= 0) return;
        const currentLicenses = user.purchasedLicenses || allUsers.length;
        const newLicenseCount = Math.max(allUsers.length, currentLicenses - amount);
        
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { purchasedLicenses: newLicenseCount });
    };

    const deleteUser = async (userId: string) => {
        if (!user || (user.role !== 'owner' && user.role !== 'manager')) throw new Error("Permission denied");
        
        const userToDelete = allUsers.find(u => u.uid === userId);
        if (!userToDelete) throw new Error("User not found");

        const subcollections = ['sales', 'pitches', 'clients', 'goals', 'plannings', 'appointments'];
        for (const sc of subcollections) {
            const scQuery = query(collection(db, 'users', userId, sc));
            const scSnapshot = await getDocs(scQuery);
            const batch = writeBatch(db);
            scSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }

        await deleteDoc(doc(db, 'users', userId));
    };

    const deleteBranch = async (branchName: string): Promise<number> => {
        if (!user || user.role !== 'owner') throw new Error("Permission denied");

        const usersInBranch = allUsers.filter(u => u.branchName === branchName);
        if (usersInBranch.length === 0) {
            return 0;
        };

        const batch = writeBatch(db);
        for (const userToDelete of usersInBranch) {
            if (userToDelete.uid) {
                const userDocRef = doc(db, 'users', userToDelete.uid);
                batch.delete(userDocRef);
            }
        }
        await batch.commit();

        return usersInBranch.length;
    };

    const sharePracticeResults = async (data: { pitchName: string; transcript: string; feedback: string; }) => {
        if (!user || !user.uid || !allUsers.length) throw new Error("User data not available.");

        let superior: User | null = null;

        if (user.role === 'salesperson') {
            superior = allUsers.find(u => (u.role === 'leader' || u.role === 'team-leader') && u.teamMembers?.includes(user.email)) || null;
        } else if (user.role === 'leader') {
            superior = allUsers.find(u => u.role === 'team-leader' && u.teamMembers?.includes(user.email)) || null;
        } else if (user.role === 'team-leader') {
            superior = allUsers.find(u => u.role === 'manager' && u.branchName === user.branchName) || null;
        } else if (user.role === 'manager') {
            superior = allUsers.find(u => u.role === 'owner' && u.companyId === user.companyId) || null;
        }

        if (!superior && (user.role === 'salesperson' || user.role === 'leader' || user.role === 'team-leader')) {
            superior = allUsers.find(u => u.role === 'manager' && u.branchName === user.branchName) || null;
        }
        if (!superior && user.role !== 'owner') {
            superior = allUsers.find(u => u.role === 'owner' && u.companyId === user.companyId) || null;
        }

        if (!superior || !superior.uid) {
            throw new Error("Kon geen leidinggevende vinden om de resultaten mee te delen.");
        }

        const newTrainingResult: Omit<TrainingResult, 'id'> = {
            traineeId: user.uid,
            traineeName: user.name,
            superiorId: superior.uid,
            superiorName: superior.name,
            pitchName: data.pitchName,
            transcript: data.transcript,
            feedback: data.feedback,
            createdAt: new Date().toISOString(),
            companyId: user.companyId || '',
            branchName: user.branchName,
            isReviewed: false,
        };

        await addDoc(collection(db, 'trainingResults'), newTrainingResult);
    };

    const value: AuthContextType = {
        user, users, allUsers, loading, error,
        pitches, knowledgeBasePitches, clients, goals, motivationPosts, competitorNotes, marketIntelligenceNotes, invoices, plannings, appointments, productPackages,
        login, registerManagerAccount, logout, updateUser, addTeamMember, createBranchAndManager, updateBranchDetails,
        logSale, changePassword, resetPassword,
        addPitch, updatePitch, deletePitch, promotePitchToKB, addKnowledgeBasePost, deleteKnowledgeBasePost, addContentToKB,
        updateTeamMemberRole,
        addClient, updateClient, deleteClient,
        addGoal, deleteGoal,
        addMotivationPost, updateMotivationPost, deleteMotivationPost,
        addCompetitorNote, updateCompetitorNote, deleteCompetitorNote,
        addMarketIntelligenceNote,
        addPlanning, deletePlanning,
        addAppointment, updateAppointment, deleteAppointment,
        addProductPackage, updateProductPackage, deleteProductPackage,
        deleteUser,
        deleteBranch,
        decreasePurchasedLicenses,
        sharePracticeResults,
    } as AuthContextType;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};