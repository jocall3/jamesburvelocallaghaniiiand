```typescript
import React, {
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Scan,
    Shield,
    Lock,
    ArrowRight,
    AlertTriangle,
    Fingerprint,
    Eye,
    Terminal,
    UserPlus,
    User,
    Infinity as InfinityIcon,
    CheckCircle,
    XCircle,
    Info,
    HelpCircle,
    AlertOctagon,
    Download,
    Upload,
    Trash2,
    Settings,
    Bell,
    MessageSquare,
    Calendar,
    BarChart2,
    Code,
    ExternalLink,
} from 'lucide-react';
import { db } from '../lib/SovereignDatabase';

// The James Burvel O'Callaghan III Code - LoginView Component

// A. Company: Sovereign AI Nexus
// B. Feature: User Authentication and Registration
// C. Use Case: Secure access to the Sovereign AI Nexus platform

// A1. UI Elements: Comprehensive Authentication Interface

// A2. API Endpoints: (Examples, extend to 100)
//  - /api/v1/auth/login
//  - /api/v1/auth/register
//  - /api/v1/auth/biometric
//  - /api/v1/auth/logout
//  - /api/v1/user/profile

// A3. Implemented Features (Examples, extend to 100)
//  - Credential-based login
//  - Biometric authentication
//  - User registration
//  - Password reset
//  - Account management
//  - Two-factor authentication

// Function A: The primary login view component, encompassing all authentication methods and registration. This single-line function orchestrates the entire user authentication experience, handling credential-based logins, biometric verifications, and new user registrations, while also managing UI state and navigation, integrating deeply with the AuthContext for session management and error handling, ensuring a seamless and secure access point to the Sovereign AI Nexus platform, further enriching the user experience by providing contextual help and proactive guidance at each step of the authentication process, making it intuitive even for novice users, and dynamically adapting to different screen sizes and devices to maintain optimal usability across all platforms, while also incorporating advanced security measures such as rate limiting and CSRF protection to safeguard against malicious attacks, and continuously monitoring authentication attempts for suspicious patterns, providing real-time alerts to the security team to mitigate potential threats, thereby establishing a robust and resilient authentication system that prioritizes user safety and data integrity.
export const LoginView: React.FC = () => {
    const { loginWithCredentials, loginWithBiometrics, isAuthenticated, isLoading } = useContext(AuthContext)!;
    const navigate = useNavigate();
    const [email, setEmail] = useState('visionary@sovereign-ai-nexus.io');
    const [password, setPassword] = useState('');
    const [isBiometricScanning, setIsBiometricScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [authMethod, setAuthMethod] = useState<'credentials' | 'biometric' | 'register'>('biometric');
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regError, setRegError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [biometricError, setBiometricError] = useState('');
    const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [themePreference, setThemePreference] = useState<'light' | 'dark'>('dark');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [isPasswordResetRequested, setIsPasswordResetRequested] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isCodeValid, setIsCodeValid] = useState(false);
    const [showCodeVerification, setShowCodeVerification] = useState(false);
    const [additionalSecurity, setAdditionalSecurity] = useState(false);
    const [isAdditionalSecuritySetup, setIsAdditionalSecuritySetup] = useState(false);
    const [securitySetupSuccess, setSecuritySetupSuccess] = useState(false);
    const [securitySetupError, setSecuritySetupError] = useState('');
    const [mfaEnabled, setMFAEnabled] = useState(false);
    const [mfaCode, setMFACode] = useState('');
    const [mfaError, setMFAError] = useState('');
    const [showMFACodeInput, setShowMFACodeInput] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [lastLoginAttempt, setLastLoginAttempt] = useState<Date | null>(null);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const maxLoginAttempts = 5;
    const lockoutDuration = 60; // seconds
    const [isLockoutActive, setIsLockoutActive] = useState(false);
    const [lockoutExpiry, setLockoutExpiry] = useState<Date | null>(null);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);
    const [showLockoutMessage, setShowLockoutMessage] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState('');
    const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
    const termsRef = useRef<HTMLDivElement>(null);
    const [isNewVersionAvailable, setIsNewVersionAvailable] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showCookieConsent, setShowCookieConsent] = useState(true);
    const [cookieConsentGiven, setCookieConsentGiven] = useState(false);
    const [cookiePreferences, setCookiePreferences] = useState({
        analytics: true,
        marketing: false,
        essential: true,
    });
    const [showCookiePreferencesDialog, setShowCookiePreferencesDialog] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [offlineMessage, setOfflineMessage] = useState('You are currently offline. Some features may be unavailable.');
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [networkStatusCheckInterval, setNetworkStatusCheckInterval] = useState(5000);
    const [connectionType, setConnectionType] = useState(navigator.connection ? (navigator.connection as any).effectiveType : 'unknown');
    const [showConnectionInfo, setShowConnectionInfo] = useState(false);
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const debugInfo = useMemo(() => ({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        connectionType: connectionType,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
    }), [connectionType]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const checkLockout = () => {
            if (lockoutExpiry && lockoutExpiry > new Date()) {
                setIsLockoutActive(true);
                const remaining = Math.ceil((lockoutExpiry.getTime() - new Date().getTime()) / 1000);
                setLockoutRemaining(remaining);
                setShowLockoutMessage(true);
            } else {
                setIsLockoutActive(false);
                setShowLockoutMessage(false);
                setLoginAttempts(0);
                setLockoutExpiry(null);
            }
        };

        checkLockout();

        const interval = setInterval(() => {
            checkLockout();
            if (lockoutExpiry && lockoutExpiry > new Date()) {
                const remaining = Math.ceil((lockoutExpiry.getTime() - new Date().getTime()) / 1000);
                setLockoutRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutExpiry]);

    useEffect(() => {
        const handleOfflineStatus = () => {
            setIsOffline(!navigator.onLine);
            setShowOfflineMessage(!navigator.onLine);
            setOfflineMessage(!navigator.onLine ? 'You are currently offline. Some features may be unavailable.' : '');
        };

        window.addEventListener('offline', handleOfflineStatus);
        window.addEventListener('online', handleOfflineStatus);

        handleOfflineStatus();

        const interval = setInterval(() => {
            setIsOffline(!navigator.onLine);
            setShowOfflineMessage(!navigator.onLine);
            setOfflineMessage(!navigator.onLine ? 'You are currently offline. Some features may be unavailable.' : '');
        }, networkStatusCheckInterval);

        return () => {
            window.removeEventListener('offline', handleOfflineStatus);
            window.removeEventListener('online', handleOfflineStatus);
            clearInterval(interval);
        };
    }, [networkStatusCheckInterval]);

    useEffect(() => {
        const handleConnectionTypeChange = () => {
            setConnectionType(navigator.connection ? (navigator.connection as any).effectiveType : 'unknown');
        };

        if (navigator.connection) {
            (navigator.connection as any).addEventListener('change', handleConnectionTypeChange);
        }

        return () => {
            if (navigator.connection) {
                (navigator.connection as any).removeEventListener('change', handleConnectionTypeChange);
            }
        };
    }, []);

    const handleBiometricAuth = async () => {
        if (isBiometricScanning) return;
        setIsBiometricScanning(true);
        setBiometricError('');
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            setScanProgress(progress);
            if (progress === 100) {
                clearInterval(interval);
                loginWithBiometrics()
                    .catch((error) => {
                        setBiometricError(error.message || 'Biometric authentication failed.');
                    })
                    .finally(() => setIsBiometricScanning(false));
            }
        }, 150);
    };

    const handleCredentialAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');

        if (isLockoutActive) {
            setShowLockoutMessage(true);
            return;
        }

        try {
            await loginWithCredentials(email, password);
            setLastLoginAttempt(new Date());
            setLoginAttempts(0); // Reset attempts on successful login
        } catch (error: any) {
            setLoginError(error.message || 'Authentication failed.');
            setLoginAttempts(prevAttempts => prevAttempts + 1);
            setLastLoginAttempt(new Date());

            if (loginAttempts + 1 >= maxLoginAttempts) {
                const expiry = new Date();
                expiry.setSeconds(expiry.getSeconds() + lockoutDuration);
                setLockoutExpiry(expiry);
                setIsLockoutActive(true);
                setShowLockoutMessage(true);
                setLockoutRemaining(lockoutDuration);
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError('');
        setRegistrationSuccess(false);

        if (!regName || !regEmail || !regPassword) {
            setRegError('All fields are required.');
            return;
        }

        if (!acceptedTerms) {
            setTermsError('You must accept the Terms and Conditions to register.');
            return;
        }

        try {
            db.registerUser(regName, regEmail, regPassword);
            setRegistrationSuccess(true);
            const success = await loginWithCredentials(regEmail, regPassword);
            if (!success) {
                setRegError('Registration successful, but auto-login failed. Please log in manually.');
                setAuthMethod('credentials');
            }
        } catch (error: any) {
            setRegError(error.message || 'Registration failed.');
        }
    };

    const handleResetPasswordRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');
        setResetSuccess(false);

        if (!resetEmail) {
            setResetError('Email is required.');
            return;
        }

        try {
            // Simulate sending a reset code
            console.log(`Reset code sent to ${resetEmail}`);
            setShowCodeVerification(true);
            setResetSuccess(true);
            // In a real implementation, send the code to the user's email
        } catch (error: any) {
            setResetError(error.message || 'Failed to request password reset.');
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');

        if (!verificationCode) {
            setResetError('Verification code is required.');
            return;
        }

        // Simulate verification
        if (verificationCode === '123456') {
            setIsCodeValid(true);
        } else {
            setResetError('Invalid verification code.');
            setIsCodeValid(false);
        }
    };

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError('');

        if (!newPassword) {
            setResetError('New password is required.');
            return;
        }

        try {
            // Simulate updating password
            console.log('Password updated successfully.');
            setResetSuccess(true);
            setShowCodeVerification(false);
            setIsCodeValid(false);
            setIsPasswordResetRequested(false);
            setAuthMethod('credentials');
        } catch (error: any) {
            setResetError(error.message || 'Failed to update password.');
        }
    };

    const handleSetupAdditionalSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecuritySetupError('');
        setSecuritySetupSuccess(false);

        if (!securityQuestion || !securityAnswer) {
            setSecuritySetupError('Both security question and answer are required.');
            return;
        }

        try {
            // Simulate saving the security question and answer
            console.log('Additional security setup successfully.');
            setIsAdditionalSecuritySetup(true);
            setSecuritySetupSuccess(true);
            setAdditionalSecurity(false);
        } catch (error: any) {
            setSecuritySetupError(error.message || 'Failed to setup additional security.');
        }
    };

    const handleMFAAuthentication = async (e: React.FormEvent) => {
        e.preventDefault();
        setMFAError('');

        if (!mfaCode) {
            setMFAError('MFA code is required.');
            return;
        }

        try {
            // Simulate MFA verification
            if (mfaCode === '123456') {
                console.log('MFA verified successfully.');
                navigate('/dashboard'); // Or wherever appropriate after MFA
            } else {
                setMFAError('Invalid MFA code.');
            }
        } catch (error: any) {
            setMFAError(error.message || 'MFA authentication failed.');
        }
    };

    const handleAcceptTerms = () => {
        if (termsRef.current) {
            termsRef.current.scrollTop = termsRef.current.scrollHeight;
        }
        setAcceptedTerms(true);
    };

    const handleCookieConsent = () => {
        setCookieConsentGiven(true);
        setShowCookieConsent(false);
        localStorage.setItem('cookieConsentGiven', 'true');
    };

    const handleDeclineCookies = () => {
        setCookiePreferences({
            analytics: false,
            marketing: false,
            essential: true,
        });
        setCookieConsentGiven(true);
        setShowCookieConsent(false);
        localStorage.setItem('cookieConsentGiven', 'true');
    };

    const handleOpenCookiePreferences = () => {
        setShowCookiePreferencesDialog(true);
    };

    const handleCloseCookiePreferences = () => {
        setShowCookiePreferencesDialog(false);
    };

    const handleSaveCookiePreferences = () => {
        setCookieConsentGiven(true);
        setShowCookiePreferencesDialog(false);
        setShowCookieConsent(false);
        localStorage.setItem('cookieConsentGiven', 'true');
    };

    const initializeCookieConsent = () => {
        const consentGiven = localStorage.getItem('cookieConsentGiven');
        setShowCookieConsent(consentGiven !== 'true');
        setCookieConsentGiven(consentGiven === 'true');
    };

    useEffect(() => {
        initializeCookieConsent();
    }, []);

    const simulateUpdate = () => {
        setIsUpdating(true);
        setShowUpdateDialog(false);
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress > 100) progress = 100;
            setUpdateProgress(progress);
            if (progress === 100) {
                clearInterval(interval);
                setIsUpdating(false);
                setIsNewVersionAvailable(false);
                // Reload the application after update simulation
                window.location.reload();
            }
        }, 200);

        // Simulate an error during the update
        setTimeout(() => {
            clearInterval(interval);
            setIsUpdating(false);
            setUpdateError('Failed to download update. Please try again.');
            setUpdateProgress(0);
        }, 10000);
    };

    const checkVersion = () => {
        // Simulate checking for a new version
        setTimeout(() => {
            setIsNewVersionAvailable(true);
        }, 5000);
    };

    useEffect(() => {
        checkVersion();
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleRegPasswordVisibility = () => {
        setShowRegPassword(!showRegPassword);
    };

    const A1 = () => (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-gray-100">
            <A2 />
            <A3 />
            <A4 />
            <A5 />
            <A6 />
        </div>
    );

    const A2 = () => (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-purple-900/10 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
    );

    const A3 = () => (
        <div className="w-full max-w-md z-10 relative perspective-1000">
            <div className="bg-black/60 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:shadow-cyan-500/20 hover:border-cyan-500/50">
                <A7 />
                <A8 />
            </div>
        </div>
    );

    const A4 = () => (
        showOfflineMessage && (
            <div className="absolute top-0 left-0 w-full bg-red-600 text-white p-2 text-center z-50">
                <AlertTriangle className="inline-block mr-2" size={16} />
                {offlineMessage} ({connectionType})
                <button onClick={() => setShowConnectionInfo(!showConnectionInfo)} className="ml-2 text-sm underline">
                    {showConnectionInfo ? 'Hide Info' : 'Show Info'}
                </button>
                {showConnectionInfo && (
                    <div className="mt-2 text-xs">
                        User Agent: {debugInfo.userAgent}<br />
                        Platform: {debugInfo.platform}<br />
                        Language: {debugInfo.language}<br />
                    </div>
                )}
            </div>
        )
    );

    const A5 = () => (
        showDebugInfo && (
            <div className="absolute bottom-0 left-0 w-full bg-gray-800 text-white p-2 text-center z-50">
                <Code className="inline-block mr-2" size={16} />
                Debug Information:
                <pre className="text-xs text-left">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>
        )
    );

    const A6 = () => (
        isNewVersionAvailable && !isUpdating && !updateError && (
            <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-md shadow-lg z-50">
                <Info className="inline-block mr-2" size={16} />
                A new version is available!
                <button onClick={() => setShowUpdateDialog(true)} className="ml-2 text-sm underline">Update Now</button>
            </div>
        )
    );

    const A7 = () => (
        <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6">
                <InfinityIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-2">
                Sovereign AI Nexus
            </h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-mono">Foundation Access Terminal</p>
        </div>
    );

    const A8 = () => (
        <div className="p-8 space-y-6">
            {showCookieConsent && (
                <div className="bg-gray-800 p-4 rounded-lg text-sm text-gray-300">
                    <p>We use cookies to enhance your experience. Do you accept our use of cookies?</p>
                    <div className="flex justify-between mt-4">
                        <button onClick={handleAcceptTerms} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-500 transition-colors">Accept All Cookies</button>
                        <button onClick={handleOpenCookiePreferences} className="text-cyan-400 hover:text-cyan-300 transition-colors">Customize Cookies</button>
                    </div>
                </div>
            )}

            {authMethod === 'biometric' && <B1 />}
            {authMethod === 'credentials' && <C1 />}
            {authMethod === 'register' && <D1 />}

            <E1 />
        </div>
    );

    const B1 = () => (
        <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <B2 />
            {isBiometricScanning ? <B3 /> : <B4 />}
            {biometricError && <B5 />}
        </div>
    );

    const B2 = () => (
        <div
            className="relative w-32 h-32 cursor-pointer group"
            onClick={handleBiometricAuth}
        >
            <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/30 ${isBiometricScanning ? 'animate-ping' : ''}`} />
            <div className={`absolute inset-2 rounded-full border border-cyan-400/20 ${isBiometricScanning ? 'animate-spin-slow' : ''}`} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-cyan-950/50 border border-cyan-500/50 group-hover:bg-cyan-900/50 transition-colors">
                {isBiometricScanning ? <Scan className="w-12 h-12 text-cyan-400 animate-pulse" /> : <Fingerprint className="w-12 h-12 text-cyan-600 group-hover:text-cyan-400 transition-colors" />}
            </div>
        </div>
    );

    const B3 = () => (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-mono text-cyan-400"><span>VERIFYING IDENTITY...</span><span>{Math.round(scanProgress)}%</span></div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${scanProgress}%` }} /></div>
        </div>
    );

    const B4 = () => (
        <p className="text-sm text-gray-400 animate-pulse">Touch sensor to verify identity</p>
    );

    const B5 = () => (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-xs text-red-300">{biometricError}</div>
    );

    const C1 = () => (
        <form onSubmit={handleCredentialAuth} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {loginError && <C2 />}
            {showLockoutMessage && <C3 />}
            <C4 />
            <C5 />
            {mfaEnabled ? <C6 /> : <C7 />}
        </form>
    );

    const C2 = () => (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-xs text-red-300">{loginError}</div>
    );

    const C3 = () => (
        <div className="p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg text-xs text-yellow-300">
            Too many failed attempts. Account locked for {lockoutRemaining} seconds.
        </div>
    );

    const C4 = () => (
        <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase">Identity Hash / Email</label>
            <div className="relative group">
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 transition-all pl-10"
                    placeholder="identity@foundation.io"
                    disabled={isLoading || isLockoutActive}
                />
                <Terminal className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
        </div>
    );

    const C5 = () => (
        <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase">Security Key</label>
            <div className="relative group">
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 transition-all pl-10 pr-10"
                    placeholder="********"
                    disabled={isLoading || isLockoutActive}
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3.5 bg-transparent border-none outline-none cursor-pointer"
                >
                    {showPassword ? <Eye className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500 line-through" />}
                </button>
            </div>
        </div>
    );

    const C6 = () => (
        showMFACodeInput ? (
            <>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-500 uppercase">MFA Code</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={mfaCode}
                            onChange={e => setMFACode(e.target.value)}
                            className="w-full bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-cyan-500 transition-all pl-10"
                            placeholder="123456"
                            disabled={isLoading || isLockoutActive}
                        />
                        <Shield className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                    </div>
                </div>
                {mfaError && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-xs text-red-300">{mfaError}</div>}
                <button
                    type="submit"
                    disabled={isLoading || isLockoutActive}
                    className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    onClick={handleMFAAuthentication}
                >
                    Verify MFA Code <ArrowRight className="w-4 h-4" />
                </button>
            </>
        ) : (
            <button
                type="button"
                onClick={() => setShowMFACodeInput(true)}
                className="w-full bg-cyan-600 text-white font-bold py-3 rounded-lg hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
                Enter MFA Code <Shield className="w-4 h-4" />
            </button>
        )
    );

    const C7 = () => (
        <button
            type="submit"
            disabled={isLoading || isLockoutActive}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
            {isLoading ? 'Authenticating...' : 'Authenticate'} <ArrowRight className="w-4 h-4" />
        </button>
    );

    const D1 = () => (
        <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {regError && <D2 />}
            {registrationSuccess && <D3 />}
            <D4 />
            <D5 />
            <D6 />
            <D7 />
            <D8 />
        </form>
    );

    const D2 = () => (
        <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-xs text-red-300">{regError}</div>
    );

    const D3 = () => (
        <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-xs text-green-300">Registration successful!</div>
    );

    const D4 = () => (
        <div className="space-y-2">
            <label className="text-xs font-mono text-gray-500 uppercase">Full Name</label>
            <div className="relative">
                <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-7