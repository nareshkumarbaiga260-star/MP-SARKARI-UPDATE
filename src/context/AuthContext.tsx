import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updatePassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  ActionCodeSettings
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

// The SOLE authorized administrator email
export const AUTHORIZED_ADMIN_EMAIL = 'nareshkumarbaiga260@gmail.com';

function extractAuthErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
    return (err as { code: string }).code;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return '';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminEmail: string;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (password: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  verifyResetCode: (code: string) => Promise<string>;
  confirmReset: (code: string, newPass: string) => Promise<void>;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  authSuccess: string | null;
  clearError: () => void;
  clearSuccess: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  adminEmail: AUTHORIZED_ADMIN_EMAIL,
  signInWithGoogle: async () => {},
  signInWithCredentials: async () => {},
  sendPasswordReset: async () => {},
  verifyResetCode: async () => '',
  confirmReset: async () => {},
  updateAdminPassword: async () => {},
  signOut: async () => {},
  authError: null,
  authSuccess: null,
  clearError: () => {},
  clearSuccess: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userEmail = currentUser.email?.toLowerCase();
        // Strictly verify that the user is the one and only authorized admin
        if (userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
          setUser(currentUser);
          setIsAdmin(true);
          setAuthError(null);
        } else {
          // Force logout immediately for any other account
          await firebaseSignOut(auth);
          setUser(null);
          setIsAdmin(false);
          setAuthError(
            `अनधिकृत प्रवेश: केवल अधिकृत पोर्टल व्यवस्थापक (${AUTHORIZED_ADMIN_EMAIL}) को ही लॉगिन करने की अनुमति है।`
          );
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Google Sign-In with single-owner verification
  const signInWithGoogle = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email?.toLowerCase();
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await firebaseSignOut(auth);
        setUser(null);
        setIsAdmin(false);
        throw new Error(
          `अनधिकृत ईमेल: ${result.user.email}। केवल अधिकृत व्यवस्थापक (${AUTHORIZED_ADMIN_EMAIL}) ही लॉगिन कर सकते हैं।`
        );
      }
      setAuthSuccess('सफलतापूर्वक एडमिन लॉगिन किया गया!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।';
      setAuthError(errorMsg);
      console.error('Admin Sign-in error:', err);
      throw err;
    }
  };

  // 2. Email & Password Sign-In for the single authorized admin
  const signInWithCredentials = async (password: string) => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const result = await signInWithEmailAndPassword(auth, AUTHORIZED_ADMIN_EMAIL, password);
      const email = result.user.email?.toLowerCase();
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        await firebaseSignOut(auth);
        setUser(null);
        setIsAdmin(false);
        throw new Error('अनधिकृत खाता। प्रवेश अस्वीकृत।');
      }
      setAuthSuccess('सफलतापूर्वक एडमिन लॉगिन किया गया!');
    } catch (err: unknown) {
      const code = extractAuthErrorCode(err);
      let message = 'लॉगिन विफल रहा: पासवर्ड की पुष्टि करें।';
      if (code.includes('operation-not-allowed') || code.includes('PASSWORD_LOGIN_DISABLED')) {
        message =
          'Firebase Console में Email/Password लॉगिन सक्षम (Enabled) नहीं है। कृपया Firebase Console → Authentication → Sign-in method में Email/Password चालू करें, अथवा Google से लॉगिन करें।';
      } else if (code.includes('user-not-found') || code.includes('invalid-credential')) {
        message = 'अमान्य पासवर्ड या क्रेडेंशियल। कृपया सही पासवर्ड दर्ज करें अथवा "पासवर्ड रीसेट करें" का उपयोग करें।';
      } else if (code.includes('wrong-password')) {
        message = 'गलत पासवर्ड दर्ज किया गया है। कृपया पुनः प्रयास करें।';
      } else if (code.includes('too-many-requests')) {
        message = 'अत्यधिक असफल प्रयासों के कारण यह खाता अस्थायी रूप से ब्लॉक किया गया है। कृपया कुछ देर बाद प्रयास करें या पासवर्ड रीसेट करें।';
      } else if (err instanceof Error) {
        message = err.message;
      }
      setAuthError(message);
      console.error('Password Sign-in error:', err);
      throw new Error(message);
    }
  };

  // 3. Send Password Reset Email strictly to AUTHORIZED_ADMIN_EMAIL
  // Uses handleCodeInApp: false with the website's /reset-password continueUrl
  const sendPasswordReset = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: false
      };

      await sendPasswordResetEmail(auth, AUTHORIZED_ADMIN_EMAIL, actionCodeSettings);
      setAuthSuccess(
        `पासवर्ड रीसेट ईमेल सफलतापूर्वक अधिकृत ईमेल ${AUTHORIZED_ADMIN_EMAIL} पर भेज दिया गया है। कृपया केवल नवीनतम (Latest) ईमेल का लिंक ही खोलें।`
      );
    } catch (err: unknown) {
      const code = extractAuthErrorCode(err);
      let errorMsg = 'पासवर्ड रीसेट लिंक भेजने में त्रुटि हुई।';
      if (code.includes('operation-not-allowed') || code.includes('PASSWORD_LOGIN_DISABLED')) {
        errorMsg =
          'Firebase Console में Email/Password साइन-इन प्रदाता बंद है। कृपया Firebase Console → Authentication → Sign-in method में जाकर Email/Password को Enable करें।';
      } else if (code.includes('unauthorized-continue-uri') || code.includes('invalid-continue-uri')) {
        errorMsg =
          `वर्तमान वेबसाइट डोमेन (${window.location.hostname}) Firebase Authentication के Authorized Domains में अनुमत नहीं है। कृपया Firebase Console में इसे जोड़ें।`;
      } else if (code.includes('user-not-found')) {
        errorMsg = `व्यवस्थापक ईमेल (${AUTHORIZED_ADMIN_EMAIL}) Firebase Authentication में पंजीकृत नहीं है। कृपया पहले Google Sign-In द्वारा एक बार लॉगिन करें।`;
      } else if (code.includes('too-many-requests')) {
        errorMsg = 'बहुत अधिक रीसेट अनुरोध भेजे गए हैं। कृपया कुछ मिनट प्रतीक्षा करके पुनः प्रयास करें।';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      console.error('Password reset error:', err);
      throw new Error(errorMsg);
    }
  };

  // 4. Validate reset code using verifyPasswordResetCode() without consuming it
  const verifyResetCode = async (code: string): Promise<string> => {
    setAuthError(null);
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      const emptyMsg = 'रीसेट कोड (oobCode) लिंक में मौजूद नहीं है। कृपया नया रीसेट लिंक अनुरोध करें।';
      setAuthError(emptyMsg);
      throw new Error(emptyMsg);
    }

    try {
      const email = await verifyPasswordResetCode(auth, trimmedCode);
      // Strictly verify returned email matches the sole authorized admin
      if (email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        throw new Error(
          `अनाधिकृत खाता: यह रीसेट लिंक केवल ${AUTHORIZED_ADMIN_EMAIL} के लिए मान्य है।`
        );
      }
      return email;
    } catch (err: unknown) {
      const errCode = extractAuthErrorCode(err);
      let message = 'रीसेट लिंक अमान्य या समाप्त (Expired) हो चुका है।';
      if (errCode.includes('operation-not-allowed') || errCode.includes('PASSWORD_LOGIN_DISABLED')) {
        message =
          'Firebase Console में Email/Password साइन-इन बंद है (PASSWORD_LOGIN_DISABLED)। इस वजह से कोई भी पासवर्ड रीसेट कोड सत्यापित नहीं हो पा रहा है। कृपया Firebase Console → Authentication → Sign-in method → Email/Password को Enable करें।';
      } else if (errCode.includes('expired-action-code')) {
        message = 'यह पासवर्ड रीसेट लिंक समाप्त (Expired) हो चुका है। कृपया नीचे दिए गए बटन से नया ताज़ा लिंक भेजें।';
      } else if (errCode.includes('invalid-action-code')) {
        message = 'यह पासवर्ड रीसेट लिंक अमान्य है या पहले ही उपयोग किया जा चुका है (अथवा बाद में नया रीसेट ईमेल भेजने से पुराना कोड निष्क्रिय हो गया है)। कृपया नवीनतम लिंक उपयोग करें या नया लिंक मंगाएं।';
      } else if (err instanceof Error) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 5. Confirm new password using confirmPasswordReset() ONLY on explicit form submit
  const confirmReset = async (code: string, newPass: string): Promise<void> => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await confirmPasswordReset(auth, code.trim(), newPass);
      setAuthSuccess(
        'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप अपने नए पासवर्ड के साथ एडमिन पैनल में लॉगिन कर सकते हैं।'
      );
    } catch (err: unknown) {
      const errCode = extractAuthErrorCode(err);
      let message = 'पासवर्ड अपडेट करने में त्रुटि हुई।';
      if (errCode.includes('operation-not-allowed') || errCode.includes('PASSWORD_LOGIN_DISABLED')) {
        message =
          'Firebase Console में Email/Password प्रदाता बंद (Disabled) है। कृपया पहले इसे Enable करें।';
      } else if (errCode.includes('weak-password')) {
        message = 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 8 अक्षरों का मजबूत पासवर्ड दर्ज करें।';
      } else if (errCode.includes('expired-action-code') || errCode.includes('invalid-action-code')) {
        message = 'यह रीसेट कोड समाप्त या पहले ही उपयोग हो चुका है। कृपया नया रीसेट ईमेल भेजें।';
      } else if (err instanceof Error) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 6. Update or link password directly for the currently authenticated single authorized admin
  const updateAdminPassword = async (currentPass: string, newPass: string): Promise<void> => {
    setAuthError(null);
    setAuthSuccess(null);

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
      const unauthMsg = `केवल अधिकृत व्यवस्थापक (${AUTHORIZED_ADMIN_EMAIL}) ही पासवर्ड अपडेट कर सकते हैं।`;
      setAuthError(unauthMsg);
      throw new Error(unauthMsg);
    }

    const hasPasswordProvider = currentUser.providerData.some(
      (provider) => provider.providerId === 'password'
    );

    try {
      if (hasPasswordProvider) {
        if (!currentPass) {
          throw new Error('कृपया अपना वर्तमान पासवर्ड दर्ज करें।');
        }
        const credential = EmailAuthProvider.credential(AUTHORIZED_ADMIN_EMAIL, currentPass);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPass);
      } else {
        const newCredential = EmailAuthProvider.credential(AUTHORIZED_ADMIN_EMAIL, newPass);
        try {
          await linkWithCredential(currentUser, newCredential);
        } catch (linkErr: unknown) {
          const linkCode = extractAuthErrorCode(linkErr);
          if (linkCode.includes('requires-recent-login')) {
            await reauthenticateWithPopup(currentUser, googleProvider);
            await linkWithCredential(currentUser, newCredential);
          } else {
            throw linkErr;
          }
        }
      }

      setAuthSuccess(
        'एडमिन पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है! अब आप नए मजबूत पासवर्ड से लॉगिन कर सकते हैं।'
      );
    } catch (err: unknown) {
      const errCode = extractAuthErrorCode(err);
      let message = 'पासवर्ड अपडेट करने में त्रुटि हुई।';
      if (errCode.includes('operation-not-allowed') || errCode.includes('PASSWORD_LOGIN_DISABLED')) {
        message =
          'Firebase Console में Email/Password साइन-इन प्रदाता बंद (Disabled) है। कृपया Firebase Console → Authentication → Sign-in method → Email/Password को Enable करें।';
      } else if (errCode.includes('wrong-password') || errCode.includes('invalid-credential')) {
        message = 'वर्तमान पासवर्ड गलत है। कृपया सही वर्तमान पासवर्ड दर्ज करें।';
      } else if (errCode.includes('weak-password')) {
        message = 'नया पासवर्ड बहुत कमजोर है। कृपया सुरक्षा मानकों के अनुसार मजबूत पासवर्ड चुनें।';
      } else if (errCode.includes('requires-recent-login')) {
        message = 'सुरक्षा कारणों से कृपया लॉगआउट करके पुनः लॉगिन करें और फिर पासवर्ड अपडेट करें।';
      } else if (errCode.includes('too-many-requests')) {
        message = 'अत्यधिक प्रयासों के कारण अनुरोध अस्थायी रूप से रोका गया है। कृपया कुछ देर बाद प्रयास करें।';
      } else if (err instanceof Error) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAuthSuccess('सफलतापूर्वक लॉगआउट किया गया।');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const clearError = () => setAuthError(null);
  const clearSuccess = () => setAuthSuccess(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        adminEmail: AUTHORIZED_ADMIN_EMAIL,
        signInWithGoogle,
        signInWithCredentials,
        sendPasswordReset,
        verifyResetCode,
        confirmReset,
        updateAdminPassword,
        signOut,
        authError,
        authSuccess,
        clearError,
        clearSuccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
