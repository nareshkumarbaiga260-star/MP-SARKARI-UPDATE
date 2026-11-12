import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  ActionCodeSettings
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

// The SOLE authorized administrator email
export const AUTHORIZED_ADMIN_EMAIL = 'nareshkumarbaiga260@gmail.com';

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
          // If any unauthorized user attempts sign in, immediately force logout
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
      let message = 'लॉगिन विफल रहा: पासवर्ड की पुष्टि करें।';
      if (err instanceof Error) {
        if (err.message.includes('user-not-found') || err.message.includes('invalid-credential')) {
          message = 'अमान्य पासवर्ड या क्रेडेंशियल। कृपया सही पासवर्ड दर्ज करें अथवा "पासवर्ड रीसेट करें" का उपयोग करें।';
        } else if (err.message.includes('wrong-password')) {
          message = 'गलत पासवर्ड दर्ज किया गया है। कृपया पुनः प्रयास करें।';
        } else if (err.message.includes('too-many-requests')) {
          message = 'अत्यधिक असफल प्रयासों के कारण यह खाता अस्थायी रूप से ब्लॉक किया गया है। कृपया कुछ देर बाद प्रयास करें या पासवर्ड रीसेट करें।';
        } else {
          message = err.message;
        }
      }
      setAuthError(message);
      console.error('Password Sign-in error:', err);
      throw err;
    }
  };

  // 3. Send Password Reset Email with dynamic ActionCodeSettings directing back to web app
  const sendPasswordReset = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      // Directs the link back to our custom web app with mode=resetPassword & oobCode
      const actionCodeSettings: ActionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true
      };

      await sendPasswordResetEmail(auth, AUTHORIZED_ADMIN_EMAIL, actionCodeSettings);
      setAuthSuccess(
        `पासवर्ड रीसेट लिंक सफलतापूर्वक अधिकृत ईमेल ${AUTHORIZED_ADMIN_EMAIL} पर भेज दिया गया है। कृपया अपना Gmail इनबॉक्स (या स्पैम फ़ोल्डर) देखें।`
      );
    } catch (err: unknown) {
      let errorMsg = 'पासवर्ड रीसेट लिंक भेजने में त्रुटि हुई।';
      if (err instanceof Error) {
        if (err.message.includes('user-not-found')) {
          errorMsg = `व्यवस्थापक ईमेल (${AUTHORIZED_ADMIN_EMAIL}) Firebase Authentication में पंजीकृत नहीं है। कृपया पहले Google Sign-In द्वारा इसे सक्रिय करें।`;
        } else {
          errorMsg = err.message;
        }
      }
      setAuthError(errorMsg);
      console.error('Password reset error:', err);
      throw err;
    }
  };

  // 4. Validate reset code using verifyPasswordResetCode()
  const verifyResetCode = async (code: string): Promise<string> => {
    setAuthError(null);
    try {
      const email = await verifyPasswordResetCode(auth, code);
      // Strictly verify returned email matches the only authorized admin
      if (email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        throw new Error(
          `यह रीसेट कोड अधिकृत व्यवस्थापक (${AUTHORIZED_ADMIN_EMAIL}) के लिए नहीं है।`
        );
      }
      return email;
    } catch (err: unknown) {
      let message = 'रीसेट लिंक अमान्य या समाप्त (Expired) हो चुका है।';
      if (err instanceof Error) {
        if (err.message.includes('expired-action-code')) {
          message = 'यह पासवर्ड रीसेट लिंक समाप्त (Expired) हो चुका है। कृपया एक नया लिंक अनुरोध करें।';
        } else if (err.message.includes('invalid-action-code')) {
          message = 'यह पासवर्ड रीसेट लिंक अमान्य है या पहले ही उपयोग किया जा चुका है।';
        } else {
          message = err.message;
        }
      }
      setAuthError(message);
      throw new Error(message);
    }
  };

  // 5. Confirm new password using confirmPasswordReset()
  const confirmReset = async (code: string, newPass: string): Promise<void> => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      await confirmPasswordReset(auth, code, newPass);
      setAuthSuccess(
        'पासवर्ड सफलतापूर्वक बदल दिया गया है! अब आप अपने नए पासवर्ड के साथ एडमिन पैनल में प्रवेश कर सकते हैं।'
      );
    } catch (err: unknown) {
      let message = 'पासवर्ड अपडेट करने में त्रुटि हुई।';
      if (err instanceof Error) {
        if (err.message.includes('weak-password')) {
          message = 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 6 अक्षरों का मजबूत पासवर्ड दर्ज करें।';
        } else if (err.message.includes('expired-action-code') || err.message.includes('invalid-action-code')) {
          message = 'यह रीसेट कोड समाप्त या अमान्य हो चुका है। कृपया नया लिंक भेजें।';
        } else {
          message = err.message;
        }
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
