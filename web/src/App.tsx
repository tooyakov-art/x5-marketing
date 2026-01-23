
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Home, GraduationCap, User as UserIcon, MessageCircle, LogOut, Zap, BarChart2, Briefcase, MessageSquare, Plus, Sparkles, Grid3X3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DesignView } from './views/DesignView';
import { PhotoView } from './views/PhotoView';
import { ContractView } from './views/ContractView';
import { VideoCreativeView } from './views/VideoCreativeView';
import { CoursesView } from './views/CoursesView';
import { ProfileView } from './views/ProfileView';
import { HomeView } from './views/HomeView';
import { AdminView } from './views/AdminView';
import { AdminApiKeyView } from './views/AdminApiKeyView';
import { AllTechView } from './views/AllTechView';
import { LanguageView } from './views/LanguageView';
import { ChatView } from './views/ChatView';
import { InstagramView } from './views/InstagramView';
import { VideoGenView } from './views/VideoGenView';
import { SuccessView } from './views/SuccessView';
import { MockPaymentView } from './views/MockPaymentView';
import { AnalyticsView } from './views/AnalyticsView';
import { HireView } from './views/HireView';
import { ChatsListView } from './views/ChatsListView';
import { PaywallView } from './views/PaywallView';
import { CourseEditorView } from './views/CourseEditorView';
import { WhatsAppBotView } from './views/WhatsAppBotView';
import { RedirectView } from './views/RedirectView';
import { ViewState, User, Language, HistoryItem, AppConfig, ChatMessage, UsageState, Course, Platform, Specialist } from './types';
import { auth, db } from './firebase';
import { detectPlatform } from './utils/platformUtils';
import { t } from './services/translations';
import { useToast } from './components/Toast';
import { useConfirmDialog } from './components/ConfirmDialog';
import firebase from 'firebase/compat/app';

const defaultConfig: AppConfig = {
    photo: true,
    design: true,
    contract: true,
    video: true,
    courses: true
};

const MAIN_TABS: ViewState[] = ['home', 'courses', 'hire', 'chats_list', 'profile'];

const GUEST_USER: User = {
    id: 'guest',
    name: 'Гость',
    isGuest: true,
    plan: 'free',
    credits: 0
};

const Background = memo(({ view }: { view: ViewState }) => {
    const isHome = view === 'home';
    return (
        <div className={`liquid-bg ${isHome ? 'orange-theme' : ''}`}>
            <div className={`liquid-blob ${isHome ? 'blob-orange-1' : 'blob-1'}`}></div>
            <div className={`liquid-blob ${isHome ? 'blob-orange-2' : 'blob-2'}`}></div>
            <div className={`liquid-blob ${isHome ? 'blob-orange-3' : 'blob-3'}`}></div>
        </div>
    );
});

function App() {
    const { showToast } = useToast();
    const { confirm } = useConfirmDialog();

    // Check for redirect URL (/r/:shortCode)
    const [redirectShortCode, setRedirectShortCode] = useState<string | null>(() => {
        const path = window.location.pathname;
        if (path.startsWith('/r/')) {
            return path.substring(3); // Extract shortCode
        }
        return null;
    });

    // If we have a redirect shortCode, render the redirect view
    if (redirectShortCode) {
        return <RedirectView shortCode={redirectShortCode} />;
    }

    // Store toast function in ref for use in window callbacks
    const showToastRef = useRef(showToast);
    useEffect(() => {
        showToastRef.current = showToast;
    }, [showToast]);

    const [user, setUser] = useState<User>(() => {
        const saved = localStorage.getItem('x5_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...parsed, plan: parsed.plan || 'free', credits: parsed.credits || 0 };
            } catch (e) { }
        }
        return GUEST_USER;
    });

    // Ref to always have current user in callbacks (fixes stale closure)
    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<ViewState>('home');
    const [initialPrompt, setInitialPrompt] = useState<string>('');
    const [transitionClass, setTransitionClass] = useState('animate-fade-in');
    const [navigationPayload, setNavigationPayload] = useState<any>(null);
    const [isTabBarVisible, setIsTabBarVisible] = useState(true);

    const [platform, setPlatform] = useState<Platform>('web');

    useEffect(() => {
        const detected = detectPlatform();
        const override = localStorage.getItem('x5_platform_override') as Platform | null;
        setPlatform(override || detected);
    }, []);

    const handlePlatformChange = (newPlatform: Platform) => {
        setPlatform(newPlatform);
        localStorage.setItem('x5_platform_override', newPlatform);
    };

    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('x5_language');
        return (saved as Language) || 'ru';
    });

    const [usage, setUsage] = useState<UsageState>({ guestStandardCount: 0, proCount: 0 });
    const [config, setConfig] = useState<AppConfig>(() => {
        const saved = localStorage.getItem('x5_config');
        return saved ? JSON.parse(saved) : defaultConfig;
    });

    const [pendingCourse, setPendingCourse] = useState<Course | null>(null);

    // CHAT STATE
    const [activeSpecialist, setActiveSpecialist] = useState<Specialist | null>(null);
    const [chatsList, setChatsList] = useState<any[]>([]);

    // --- SWIPE LOGIC FOR iOS (REPLACES TAB BAR) ---
    const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;

        // If vertical swipe is dominant, ignore horizontal
        if (Math.abs(distanceY) > Math.abs(distanceX)) return;

        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        if (platform === 'ios') {
            // 4 tabs only: Home, Courses, Hire, Profile
            const TABS: ViewState[] = ['home', 'courses', 'hire', 'profile'];
            const currentIndex = TABS.indexOf(currentView);

            if (currentIndex !== -1) {
                if (isLeftSwipe && currentIndex < TABS.length - 1) {
                    handleNavigate(TABS[currentIndex + 1]);
                }
                if (isRightSwipe && currentIndex > 0) {
                    handleNavigate(TABS[currentIndex - 1]);
                }
            }
        }
    };

    useEffect(() => {
        const memoryInterval = setInterval(() => {
            if ((window as any).gc) {
                try { (window as any).gc(); } catch (e) { /* ignore */ }
            }
        }, 2000);
        return () => clearInterval(memoryInterval);
    }, []);

    // --- NATIVE BRIDGE LISTENER ---
    useEffect(() => {
        // --- GLOBAL FLUTTER LISTENERS ---
        (window as any).onAppPaymentSuccess = (productId: string) => {
            const currentUser = userRef.current; // Use ref for fresh data
            showToastRef.current("Оплата прошла успешно!", "success");
            console.log("[App] onAppPaymentSuccess called with:", productId, "user:", currentUser);

            // Check if user already has active subscription
            const hasActiveSubscription = currentUser.plan === 'pro' &&
                currentUser.subscriptionEndDate &&
                new Date(currentUser.subscriptionEndDate) > new Date();

            let newCreditsReward = 0;
            let newPlan: 'free' | 'pro' | 'black' | undefined = undefined;
            let subscriptionDurationMonths = 0;
            let newSubscriptionType: 'monthly' | 'yearly' | undefined = undefined;
            let purchaseAmount = 0;

            if (productId === 'x5_credits_1000') {
                // Credits purchase - always give credits
                newCreditsReward = 1000;
                purchaseAmount = 9;
            } else if (productId === 'x5_pro_monthly') {
                // Monthly subscription - only give credits if NOT already subscribed
                if (!hasActiveSubscription) {
                    newCreditsReward = 1000;
                }
                newPlan = 'pro';
                newSubscriptionType = 'monthly';
                subscriptionDurationMonths = 1;
                purchaseAmount = 19;
            } else if (productId === 'x5_pro_yearly') {
                // Yearly subscription - only give credits if NOT already subscribed OR upgrading from monthly
                const isUpgrade = hasActiveSubscription && currentUser.subscriptionType === 'monthly';
                if (!hasActiveSubscription || isUpgrade) {
                    newCreditsReward = 12000;
                }
                newPlan = 'pro';
                newSubscriptionType = 'yearly';
                subscriptionDurationMonths = 12;
                purchaseAmount = 199;
            } else {
                // Fallback for legacy ID - only give credits if NOT already subscribed
                if (!hasActiveSubscription) {
                    newCreditsReward = 1000;
                }
                newPlan = 'pro';
                newSubscriptionType = 'monthly';
                subscriptionDurationMonths = 1;
                purchaseAmount = 19;
            }

            // Calculate new subscription end date
            let newSubscriptionEndDate = currentUser.subscriptionEndDate ? new Date(currentUser.subscriptionEndDate) : new Date();
            // If expired, start from now
            if (newSubscriptionEndDate < new Date()) {
                newSubscriptionEndDate = new Date();
            }
            if (subscriptionDurationMonths > 0) {
                newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + subscriptionDurationMonths);
            }

            // Create purchase record
            const purchaseRecord = {
                productId,
                purchaseDate: new Date().toISOString(),
                amount: purchaseAmount,
                currency: 'USD'
            };

            const updatedUser: User = {
                ...currentUser,
                credits: (currentUser.credits || 0) + newCreditsReward,
                plan: newPlan || currentUser.plan,
                subscriptionDate: newPlan === 'pro' ? (currentUser.subscriptionDate || new Date().toISOString()) : currentUser.subscriptionDate,
                subscriptionEndDate: subscriptionDurationMonths > 0 ? newSubscriptionEndDate.toISOString() : currentUser.subscriptionEndDate,
                subscriptionType: newSubscriptionType || currentUser.subscriptionType,
                purchaseHistory: [...(currentUser.purchaseHistory || []), purchaseRecord]
            };

            setUser(updatedUser);
            localStorage.setItem('x5_credits', updatedUser.credits.toString());
            localStorage.setItem('x5_user', JSON.stringify(updatedUser));

            // CRITICAL FIX: Persist to Firestore with full data
            db.collection('users').doc(currentUser.id).set({
                credits: updatedUser.credits,
                plan: updatedUser.plan,
                subscriptionDate: updatedUser.subscriptionDate,
                subscriptionEndDate: updatedUser.subscriptionEndDate,
                subscriptionType: updatedUser.subscriptionType,
                purchaseHistory: updatedUser.purchaseHistory
            }, { merge: true }).catch((e) => console.error("Firestore update failed", e));

            setCurrentView('success');
            setPendingCourse(null);
        };

        (window as any).onAppPaymentFailed = (error: string) => {
            showToastRef.current("Ошибка оплаты: " + error, "error");
        };

        // --- AUTH SUCCESS CALLBACK FROM FLUTTER ---
        (window as any).onAppAuthSuccess = (userData: any) => {
            console.log('[App] Received auth success from Flutter:', userData);

            // Create user object from Flutter auth data
            const newUser: User = {
                id: userData.uid || '',
                name: userData.displayName || 'User',
                email: userData.email || '',
                avatar: userData.photoURL || '',
                isGuest: false,
                plan: 'free',
                credits: 0,
                subscriptionDate: undefined,
                subscriptionEndDate: undefined,
                subscriptionType: undefined,
                purchaseHistory: []
            };

            // Update user state and navigate
            setUser(newUser);
            localStorage.setItem('x5_user', JSON.stringify(newUser));
            setCurrentView('home');

            // Try to sync to Firestore
            if (newUser.id) {
                db.collection('users').doc(newUser.id).set({
                    name: newUser.name,
                    email: newUser.email,
                    avatar: newUser.avatar,
                    plan: newUser.plan,
                    credits: newUser.credits
                }, { merge: true }).catch((e) => console.error("Firestore sync failed:", e));
            }
        };

        // --- AUTH FAILURE CALLBACK FROM FLUTTER ---
        (window as any).onAppAuthFailed = (error: string) => {
            console.error('[App] Auth failed from Flutter:', error);
            showToastRef.current('Ошибка авторизации: ' + error, 'error');
        };


        const handleNativeMessage = (event: MessageEvent) => {
            let data = event.data;
            // Android often sends data as string
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { /* ignore */ }
            }

            if (data?.type === 'AUTH_SUCCESS') {
                console.log("[App] Native Auth Success!", data);
                const p = data.payload || {};
                const newUser: User = {
                    id: p.uid || 'native-' + Date.now(),
                    name: p.displayName || 'Пользователь',
                    email: p.email,
                    avatar: p.photoURL,
                    isGuest: false,
                    plan: 'free',
                    credits: 0,
                    purchasedCourseIds: []
                };
                setUser(newUser);
                localStorage.setItem('x5_user', JSON.stringify(newUser));
                // Optional: sync to Firestore if possible, but for now just login locally
                setCurrentView('home');
            }

            if (data?.type === 'NAVIGATION') {
                console.log("[App] Native Navigation:", data.payload);
                const target = data.payload?.view;
                if (target) {
                    handleNavigate(target);
                }
            }

            if (data?.type === 'PAYMENT_SUCCESS') {
                // Keep legacy listener just in case
                console.log("[App] Native Payment Success (Legacy Event)!", data);
                if ((window as any).onAppPaymentSuccess) (window as any).onAppPaymentSuccess('legacy_event');
            }
        };

        window.addEventListener('message', handleNativeMessage);

        // Cleanup function
        return () => {
            window.removeEventListener('message', handleNativeMessage);
            delete (window as any).onAppAuthSuccess;
            delete (window as any).onAppAuthFailed;
            delete (window as any).onAppPaymentSuccess;
            delete (window as any).onAppPaymentFailed;
        };
    }, []); // Run once on mount (callbacks use closure for latest state)

    // --- REAL CHAT LISTENER ---
    useEffect(() => {
        if (!user?.id) {
            setChatsList([]);
            return;
        }

        const unsubscribe = db.collection('chats')
            .where('participants', 'array-contains', user.id)
            .onSnapshot(async (snapshot) => {
                const loadedChats = await Promise.all(snapshot.docs.map(async doc => {
                    const data = doc.data();
                    const otherUserId = data.participants.find((id: string) => id !== user.id);

                    if (!otherUserId) return null;

                    let profile = { name: 'Пользователь', avatar: '', role: 'Client' };

                    try {
                        const specDoc = await db.collection('specialists').doc(otherUserId).get();
                        if (specDoc.exists) {
                            const sData = specDoc.data();
                            profile = {
                                name: sData?.name || 'Специалист',
                                avatar: sData?.avatar || '',
                                role: sData?.role || 'Исполнитель'
                            };
                        } else {
                            const userDoc = await db.collection('users').doc(otherUserId).get();
                            if (userDoc.exists) {
                                const uData = userDoc.data();
                                profile = {
                                    name: uData?.name || 'Клиент',
                                    avatar: uData?.avatar || '',
                                    role: 'Заказчик'
                                };
                            } else {
                                profile = {
                                    name: 'Гость ' + otherUserId.substring(0, 4),
                                    avatar: '',
                                    role: 'Аноним'
                                };
                            }
                        }
                    } catch (e) { console.error("Error fetching chat profile", e); }

                    return {
                        id: doc.id,
                        timestamp: data.updatedAt?.toMillis() || 0,
                        lastMessage: data.lastMessage || 'Вложение',
                        time: data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        unread: data[`unread_${user.id}`] || 0,
                        specialist: {
                            id: otherUserId,
                            name: profile.name,
                            role: profile.role,
                            avatar: profile.avatar,
                            rating: 5.0,
                            price: '',
                            skills: [],
                            online: true
                        }
                    };
                }));

                const sortedChats = loadedChats
                    .filter((c): c is any => c !== null)
                    .sort((a, b) => b.timestamp - a.timestamp);

                setChatsList(sortedChats);
            });

        return () => unsubscribe();
    }, [user?.id]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('status') === 'success') {
            window.history.replaceState({}, '', window.location.pathname);
            setCurrentView('success');
        }

        localStorage.setItem('x5_language', language);

        const storedUsage = localStorage.getItem('x5_usage');
        if (storedUsage) setUsage(JSON.parse(storedUsage));

        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                // --- LOGGED IN (REAL USER) ---
                let userData: any = {};
                try {
                    const doc = await db.collection('users').doc(firebaseUser.uid).get();
                    if (doc.exists) {
                        userData = doc.data() || {};
                    }
                } catch (e) { console.log("Offline mode or error fetching user data"); }

                // Fallback to localStorage if Firestore data is missing
                const storedCredits = parseInt(localStorage.getItem('x5_credits') || '0', 10);
                const isAnon = firebaseUser.isAnonymous;

                const newUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || (isAnon ? 'Гость' : (firebaseUser.email?.split('@')[0] || 'Пользователь')),
                    email: firebaseUser.email || undefined,
                    avatar: firebaseUser.photoURL || undefined,
                    isGuest: isAnon,
                    // Load from Firestore first, fallback to localStorage/defaults
                    plan: userData.plan || 'free',
                    credits: userData.credits ?? storedCredits ?? 0,
                    purchasedCourseIds: userData.purchasedCourseIds || [],
                    subscriptionDate: userData.subscriptionDate || undefined,
                    subscriptionEndDate: userData.subscriptionEndDate || undefined,
                    subscriptionType: userData.subscriptionType || undefined,
                    purchaseHistory: userData.purchaseHistory || []
                };

                setUser(newUser);
                localStorage.setItem('x5_user', JSON.stringify(newUser));
                localStorage.setItem('x5_credits', String(newUser.credits));

                try {
                    await db.collection('users').doc(firebaseUser.uid).set({
                        name: newUser.name,
                        avatar: newUser.avatar || '',
                        email: newUser.email || '',
                        isAnonymous: isAnon
                    }, { merge: true });
                } catch (e) { }

            } else {
                // --- NOT LOGGED IN (CHECKING LOCAL FALLBACK) ---

                // Check if we have a locally saved user that is NOT a real firebase user (Simulated)
                const savedUserStr = localStorage.getItem('x5_user');
                let shouldUseLocal = false;

                if (savedUserStr) {
                    try {
                        const savedUser = JSON.parse(savedUserStr);
                        // If ID starts with 'guest-' or 'simulated-', it's a local-only user. Keep it.
                        if (savedUser.id && (savedUser.id.startsWith('guest-') || savedUser.id.startsWith('simulated-'))) {
                            shouldUseLocal = true;
                            setUser(savedUser); // Ensure state matches storage
                        }
                    } catch (e) { }
                }

                if (!shouldUseLocal) {
                    // Only create a NEW anonymous user if we don't have a valid local one
                    auth.signInAnonymously().catch((e) => {
                        console.warn("Anonymous auth failed (API likely disabled). Using offline guest mode.");
                        const offlineGuest: User = {
                            id: 'guest-' + Math.random().toString(36).substr(2, 9),
                            name: 'Гость (Offline)',
                            isGuest: true,
                            plan: 'free',
                            credits: 0
                        };
                        setUser(offlineGuest);
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [language]);

    const handleNavigate = useCallback((view: ViewState, payload?: any) => {
        const prevIndex = MAIN_TABS.indexOf(currentView);
        const nextIndex = MAIN_TABS.indexOf(view);

        // Logic:
        // 1. Tab <-> Tab: Use index comparison
        // 2. Tab -> Detail: Slide Right (Enter "Forward")
        // 3. Detail -> Tab: Slide Left (Enter "Back")
        // 4. Detail -> Detail: Slide Right ("Forward") - default assumption

        let newTransition = 'animate-fade-in';

        if (prevIndex !== -1 && nextIndex !== -1) {
            // Both are tabs
            if (nextIndex > prevIndex) newTransition = 'animate-slide-enter-right';
            else newTransition = 'animate-slide-enter-left';
        } else if (prevIndex !== -1 && nextIndex === -1) {
            // Tab -> Detail
            newTransition = 'animate-slide-enter-right';
        } else if (prevIndex === -1 && nextIndex !== -1) {
            // Detail -> Tab
            newTransition = 'animate-slide-enter-left';
        } else {
            // Detail -> Detail
            newTransition = 'animate-slide-enter-right';
        }

        setTransitionClass(newTransition);
        setNavigationPayload(payload || null);
        setInitialPrompt('');
        setIsTabBarVisible(true);

        if (view === 'chat') {
            if (payload && (payload as Specialist).id) {
                setActiveSpecialist(payload as Specialist);
                setIsTabBarVisible(false);
            } else {
                setActiveSpecialist(null);
            }
        } else {
            if (currentView === 'chat') {
                setIsTabBarVisible(true);
            }
        }

        setCurrentView(view);
    }, [currentView]);

    const handleLogin = (newUser: User) => {
        const upgradedUser = { ...newUser, plan: 'free' as const, credits: 0, purchasedCourseIds: [] };
        setUser(upgradedUser);
        localStorage.setItem('x5_user', JSON.stringify(upgradedUser));
        setCurrentView('home');
    };

    const handleUpdateUser = (updatedUser: User) => {
        console.log("[App] handleUpdateUser called:", updatedUser);
        setUser(updatedUser);
        localStorage.setItem('x5_user', JSON.stringify(updatedUser));
        localStorage.setItem('x5_credits', String(updatedUser.credits || 0));
    };

    const handleLogout = () => {
        auth.signOut().catch(() => { });
        localStorage.removeItem('x5_user');
        setUser(GUEST_USER); // Update state immediately
        setCurrentView('home');
    };

    const checkUsageAndProceed = (tier: 'standard' | 'pro', cost: number = 5): boolean => {
        // Only CHECK if user has enough credits - do NOT deduct here!
        if ((user.credits || 0) < cost) {
            showToast(`Недостаточно кредитов! Нужно: ${cost}, у вас: ${user.credits || 0}`, 'warning');
            return false;
        }
        return true;
    };

    // New function to actually deduct credits AFTER successful generation
    const deductCredits = async (cost: number) => {
        const newAmount = (user.credits || 0) - cost;
        updateCredits(newAmount);

        // Atomic transaction to Firestore
        if (user.id && !user.id.startsWith('guest-')) {
            try {
                await db.runTransaction(async (transaction) => {
                    const userRef = db.collection('users').doc(user.id);
                    const userDoc = await transaction.get(userRef);
                    const currentCredits = userDoc.data()?.credits || 0;
                    if (currentCredits < cost) {
                        throw new Error('Insufficient credits');
                    }
                    transaction.update(userRef, {
                        credits: currentCredits - cost
                    });
                });
            } catch (e) {
                console.error("Failed to sync credits", e);
                // Revert local state if transaction failed
                updateCredits((user.credits || 0));
                showToast("Ошибка списания кредитов", "error");
            }
        }
    };

    const updateCredits = (newAmount: number) => {
        const updatedUser = { ...user, credits: newAmount };
        setUser(updatedUser);
        localStorage.setItem('x5_credits', newAmount.toString());
        localStorage.setItem('x5_user', JSON.stringify(updatedUser));
    };

    const handleRestoreHistory = (item: HistoryItem) => {
        const dataToRestore = item.content || item.prompt || '';
        if (!dataToRestore) return;
        setInitialPrompt(dataToRestore);

        switch (item.type) {
            case 'contract': setCurrentView('contract'); break;
            case 'design': setCurrentView('design'); break;
            case 'photo': setCurrentView('photo'); break;
            case 'video': setCurrentView('video_gen'); break;
            default: setCurrentView('home');
        }
    };

    const handleInitiateCoursePurchase = async (course: Course) => {
        // Проверка: уже куплен?
        if (user.purchasedCourseIds?.includes(course.id)) {
            showToast("Курс уже куплен", "info");
            return;
        }

        // Проверка кредитов
        if (user.credits >= course.price) {
            const confirmed = await confirm({
                title: `Купить курс?`,
                message: `"${course.title}"`,
                type: 'credits',
                creditCost: course.price,
                userCredits: user.credits,
                confirmText: 'Купить',
                cancelText: 'Отмена'
            });

            if (confirmed) {
                const newCredits = user.credits - course.price;
                const newPurchases = [...(user.purchasedCourseIds || []), course.id];

                const updatedUser = {
                    ...user,
                    credits: newCredits,
                    purchasedCourseIds: newPurchases
                };

                setUser(updatedUser);
                localStorage.setItem('x5_user', JSON.stringify(updatedUser));
                localStorage.setItem('x5_credits', newCredits.toString());

                // Atomic transaction for credits
                try {
                    await db.runTransaction(async (transaction) => {
                        const userRef = db.collection('users').doc(user.id);
                        const userDoc = await transaction.get(userRef);
                        const currentCredits = userDoc.data()?.credits || 0;
                        transaction.update(userRef, {
                            credits: currentCredits - course.price,
                            purchasedCourseIds: firebase.firestore.FieldValue.arrayUnion(course.id)
                        });
                    });
                    showToast("Курс куплен!", "success");
                } catch (err) {
                    console.error("Error saving purchase", err);
                    showToast("Ошибка сохранения, но курс доступен", "warning");
                }

                // Show success logic
                setPendingCourse(course);
                setCurrentView('success');
            }
        } else {
            // Not enough credits
            const goToPaywall = await confirm({
                title: "Недостаточно кредитов",
                message: `Нужно ${course.price} кредитов, у вас ${user.credits}. Пополнить баланс?`,
                type: 'credits',
                creditCost: course.price,
                userCredits: user.credits,
                confirmText: 'Пополнить',
                cancelText: 'Отмена'
            });

            if (goToPaywall) {
                setCurrentView('paywall');
            }
        }
    };

    const handleCoursePurchaseSuccess = async () => {
        if (user && pendingCourse) {
            const newPurchases = [...(user.purchasedCourseIds || []), pendingCourse.id];
            const updatedUser: User = { ...user, purchasedCourseIds: newPurchases };
            setUser(updatedUser);
            localStorage.setItem('x5_user', JSON.stringify(updatedUser));
            try {
                await db.collection('users').doc(user.id).set({ purchasedCourseIds: newPurchases }, { merge: true });
            } catch (e) { console.error("Failed to save purchase online", e); }
            setPendingCourse(null);
            setCurrentView('success');
        }
    };

    const handleGeneralPaymentSuccess = () => {
        const updatedUser: User = {
            ...user,
            credits: (user.credits || 0) + 1000,
            plan: 'pro'
        };
        setUser(updatedUser);
        localStorage.setItem('x5_credits', updatedUser.credits.toString());
        localStorage.setItem('x5_user', JSON.stringify(updatedUser));
        setCurrentView('success');
    };

    return (
        <>
            <div
                className="relative w-full h-[100dvh] overflow-hidden text-slate-800 select-none font-sans flex"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <Background view={currentView} />

                {/* DESKTOP SIDEBAR - FIXED */}
                <div className="hidden md:flex w-72 flex-col glass-panel m-4 rounded-[32px] border border-white/40 overflow-y-auto relative z-50 no-scrollbar bg-white/70 backdrop-blur-xl shadow-2xl">
                    <div className="p-8 pb-4 flex-1">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                <span className="font-bold text-lg">X5</span>
                            </div>
                            <span className="text-xl font-extrabold text-slate-900 tracking-tight">OS</span>
                        </div>

                        <div className="space-y-3">
                            <button onClick={() => handleNavigate('home')} className={`w-full p-4 rounded-[20px] flex items-center gap-4 text-left transition-all duration-300 group ${currentView === 'home' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'hover:bg-white/60 text-slate-600'}`}>
                                <Home size={20} strokeWidth={currentView === 'home' ? 2.5 : 2} className={currentView === 'home' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span className="font-bold text-sm">Главная</span>
                            </button>

                            <button onClick={() => handleNavigate('courses')} className={`w-full p-4 rounded-[20px] flex items-center gap-4 text-left transition-all duration-300 group ${currentView === 'courses' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'hover:bg-white/60 text-slate-600'}`}>
                                <GraduationCap size={20} strokeWidth={currentView === 'courses' ? 2.5 : 2} className={currentView === 'courses' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span className="font-bold text-sm">Академия</span>
                            </button>

                            <button onClick={() => handleNavigate('hire')} className={`w-full p-4 rounded-[20px] flex items-center gap-4 text-left transition-all duration-300 group ${currentView === 'hire' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'hover:bg-white/60 text-slate-600'}`}>
                                <Briefcase size={20} strokeWidth={currentView === 'hire' ? 2.5 : 2} className={currentView === 'hire' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span className="font-bold text-sm">Биржа</span>
                            </button>

                            <button onClick={() => handleNavigate('profile')} className={`w-full p-4 rounded-[20px] flex items-center gap-4 text-left transition-all duration-300 group ${currentView === 'profile' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 'hover:bg-white/60 text-slate-600'}`}>
                                <UserIcon size={20} strokeWidth={currentView === 'profile' ? 2.5 : 2} className={currentView === 'profile' ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                                <span className="font-bold text-sm">Профиль</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="w-full bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-bl-[60px] -mr-6 -mt-6 opacity-80"></div>

                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 relative z-10">БАЛАНС</p>

                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <h3 className="text-[42px] font-black text-slate-900 leading-none tracking-tighter">{user?.credits || 0}</h3>
                                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                    <Zap size={20} className="text-yellow-500 fill-yellow-500" />
                                </div>
                            </div>

                            <button
                                onClick={() => handleNavigate('profile')}
                                className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold rounded-[20px] text-[15px] transition-all active:scale-95 border border-slate-100 flex items-center justify-center relative z-10"
                            >
                                Улучшить до Pro
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative z-10 w-full h-full md:max-w-none max-w-md mx-auto flex flex-col md:bg-transparent bg-transparent overflow-hidden">

                    <div className="flex-1 relative overflow-hidden h-full flex flex-col md:m-4 md:rounded-[32px] md:glass-panel md:border md:border-white/40 md:shadow-none shadow-2xl rounded-none w-full max-w-md md:max-w-full mx-auto md:mx-0">

                        <div className={`w-full h-full ${transitionClass} bg-transparent`}>

                            {currentView === 'chat' && (
                                <ChatView
                                    user={user}
                                    specialist={activeSpecialist || undefined}
                                    onBack={() => handleNavigate(activeSpecialist ? 'chats_list' : 'home')}
                                    isVisible={true}
                                />
                            )}

                            {currentView === 'chats_list' && (
                                <ChatsListView
                                    chats={chatsList}
                                    onSelectChat={(spec) => handleNavigate('chat', spec)}
                                    onBack={() => handleNavigate('hire')}
                                />
                            )}

                            {currentView === 'hire' && (
                                <HireView
                                    user={user}
                                    language={language}
                                    onNavigate={handleNavigate}
                                />
                            )}

                            {currentView === 'analytics' && (
                                <AnalyticsView
                                    user={user}
                                    onNavigate={handleNavigate}
                                    onBack={() => handleNavigate('home')}
                                />
                            )}

                            {currentView === 'video' && (
                                <VideoCreativeView
                                    user={user}
                                    onBack={() => handleNavigate('home')}
                                    isVisible={true}
                                    initialPrompt={initialPrompt}
                                    checkUsage={checkUsageAndProceed}
                                />
                            )}

                            {currentView === 'home' && (
                                <HomeView
                                    onNavigate={handleNavigate}
                                    user={user}
                                    language={language}
                                    setLanguage={(l) => { setLanguage(l); localStorage.setItem('x5_language', l); }}
                                />
                            )}

                            {currentView === 'courses' && (
                                <CoursesView
                                    user={user}
                                    onBuyCourse={handleInitiateCoursePurchase}
                                    onNavigate={handleNavigate}
                                    onBack={() => handleNavigate('home')}
                                    onToggleTabBar={setIsTabBarVisible}
                                />
                            )}

                            {currentView === 'profile' && (
                                <ProfileView
                                    user={user}
                                    onLogout={handleLogout}
                                    language={language}
                                    setLanguage={(l) => { setLanguage(l); localStorage.setItem('x5_language', l); }}
                                    onNavigate={handleNavigate}
                                    onUpdateUser={handleUpdateUser}
                                    usage={usage}
                                    onRestoreHistory={handleRestoreHistory}
                                    platform={platform}
                                    onPlatformChange={handlePlatformChange}
                                    onToggleTabBar={setIsTabBarVisible}
                                />
                            )}

                            {/* ... other views ... */}
                            {currentView === 'language' && <LanguageView currentLanguage={language} onSelect={(l) => { setLanguage(l); localStorage.setItem('x5_language', l); handleNavigate('home'); }} onBack={() => handleNavigate('home')} />}
                            {(currentView === 'photo' || currentView === 'logo' || currentView === 'branding') && <PhotoView user={user} onBack={() => handleNavigate('home')} checkUsage={checkUsageAndProceed} deductCredits={deductCredits} initialPrompt={initialPrompt} initialMode={currentView === 'logo' ? 'logo' : currentView === 'branding' ? 'branding' : undefined} onNavigate={handleNavigate} initialImage={navigationPayload} />}
                            {currentView === 'design' && <DesignView user={user} onBack={() => handleNavigate('home')} checkUsage={checkUsageAndProceed} language={language} initialPrompt={initialPrompt} />}
                            {currentView === 'contract' && <ContractView user={user} onBack={() => handleNavigate('home')} checkUsage={checkUsageAndProceed} initialPrompt={initialPrompt} />}
                            {currentView === 'instagram' && <InstagramView user={user} onBack={() => handleNavigate('home')} checkUsage={checkUsageAndProceed} deductCredits={deductCredits} language={language} initialPrompt={initialPrompt} />}
                            {currentView === 'video_gen' && <VideoGenView user={user} onBack={() => handleNavigate('home')} checkUsage={checkUsageAndProceed} deductCredits={deductCredits} initialPrompt={initialPrompt} />}
                            {currentView === 'all_tech' && <AllTechView config={config} onNavigate={handleNavigate} onBack={() => handleNavigate('home')} />}
                            {currentView === 'admin' && <AdminView config={config} onUpdateConfig={setConfig} onBack={() => handleNavigate('profile')} />}
                            {currentView === 'admin_key' && <AdminApiKeyView onBack={() => handleNavigate('profile')} />}
                            {currentView === 'success' && <SuccessView onGoHome={() => { if (pendingCourse) handleNavigate('courses'); else handleNavigate('home'); }} />}
                            {currentView === 'payment_mock' && <MockPaymentView price={pendingCourse ? pendingCourse.price : 4990} title={pendingCourse ? pendingCourse.title : 'X5 Pro'} onSuccess={() => { if (pendingCourse) handleCoursePurchaseSuccess(); else handleGeneralPaymentSuccess(); }} onCancel={() => { setPendingCourse(null); handleNavigate('profile'); }} />}
                            {currentView === 'whatsapp_bot' && (
                                <WhatsAppBotView
                                    user={user}
                                    language={language}
                                    onBack={() => handleNavigate('home')}
                                    onNavigate={handleNavigate}
                                />
                            )}
                        </div>

                    </div>

                    {/* MODERN TAB BAR - Light & Clean */}
                    {isTabBarVisible && platform !== 'ios' && ['home', 'profile', 'courses', 'hire', 'chats_list'].includes(currentView) && (
                        <div className="absolute bottom-0 left-0 w-full z-40 md:hidden pointer-events-none pb-4 px-4">
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="pointer-events-auto"
                            >
                                <div className="relative flex items-center justify-around px-2 py-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-900/10">

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleNavigate('home')}
                                        className="relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                                    >
                                        {currentView === 'home' && (
                                            <motion.div
                                                layoutId="tabIndicator"
                                                className="absolute inset-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl"
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            />
                                        )}
                                        <Home size={20} className={`relative z-10 ${currentView === 'home' ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`text-[10px] font-semibold relative z-10 ${currentView === 'home' ? 'text-white' : 'text-slate-400'}`}>Главная</span>
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleNavigate('courses')}
                                        className="relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                                    >
                                        {currentView === 'courses' && (
                                            <motion.div
                                                layoutId="tabIndicator"
                                                className="absolute inset-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl"
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            />
                                        )}
                                        <GraduationCap size={20} className={`relative z-10 ${currentView === 'courses' ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`text-[10px] font-semibold relative z-10 ${currentView === 'courses' ? 'text-white' : 'text-slate-400'}`}>Курсы</span>
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleNavigate('hire')}
                                        className="relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                                    >
                                        {currentView === 'hire' && (
                                            <motion.div
                                                layoutId="tabIndicator"
                                                className="absolute inset-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl"
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            />
                                        )}
                                        <Briefcase size={20} className={`relative z-10 ${currentView === 'hire' ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`text-[10px] font-semibold relative z-10 ${currentView === 'hire' ? 'text-white' : 'text-slate-400'}`}>Биржа</span>
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleNavigate('profile')}
                                        className="relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1"
                                    >
                                        {currentView === 'profile' && (
                                            <motion.div
                                                layoutId="tabIndicator"
                                                className="absolute inset-1 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl"
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            />
                                        )}
                                        <UserIcon size={20} className={`relative z-10 ${currentView === 'profile' ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`text-[10px] font-semibold relative z-10 ${currentView === 'profile' ? 'text-white' : 'text-slate-400'}`}>Профиль</span>
                                    </motion.button>

                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* iOS Page Indicator (Dots) - 4 tabs only */}
                    {platform === 'ios' && isTabBarVisible && ['home', 'courses', 'hire', 'profile'].includes(currentView) && (
                        <div className="absolute bottom-0 left-0 w-full z-40 pb-6 pointer-events-none md:hidden">
                            <div className="flex items-center justify-center gap-2">
                                {['home', 'courses', 'hire', 'profile'].map((tab) => (
                                    <motion.div
                                        key={tab}
                                        className={`rounded-full transition-all ${
                                            currentView === tab
                                                ? 'w-6 h-2 bg-slate-900'
                                                : 'w-2 h-2 bg-slate-300'
                                        }`}
                                        layoutId={currentView === tab ? "iosPageIndicator" : undefined}
                                        transition={{ type: 'spring', damping: 20 }}
                                    />
                                ))}
                            </div>
                            <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                                {currentView === 'home' && 'Главная'}
                                {currentView === 'courses' && 'Курсы'}
                                {currentView === 'hire' && 'Биржа'}
                                {currentView === 'profile' && 'Профиль'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* OVERLAYS - OUTSIDE of the swipe container to prevent event capturing */}
            {currentView === 'paywall' && (
                <PaywallView
                    language={language}
                    onClose={() => handleNavigate('profile')}
                    onBuy={() => console.log("Web payment triggered (PaywallView)")}
                    platform={platform}
                    user={user}
                />
            )}

            {currentView === 'course_editor' && (
                <CourseEditorView
                    user={user}
                    onBack={() => handleNavigate('courses')}
                    onNavigate={handleNavigate}
                    initialPrompt={navigationPayload ? JSON.stringify(navigationPayload) : undefined}
                />
            )}
        </>
    );
}

export default App;
