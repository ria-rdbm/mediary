import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { configureRevenueCat, resetRevenueCatIdentity } from '@/lib/revenuecat';
import { exchangeAppleAuthorizationCode, startTrialIfNeeded } from '@/services/account';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

type AuthStatus = 'loading' | 'signed_out' | 'signed_in';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  userId: string | null;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? 'signed_in' : 'signed_out');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? 'signed_in' : 'signed_out');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (status === 'signed_in' && session?.user) {
      configureRevenueCat(session.user.id);
      startTrialIfNeeded().catch((err) => console.warn('start_trial failed', err));
    }
  }, [status, session]);

  const signInWithApple = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;

    if (credential.fullName?.givenName || credential.fullName?.familyName) {
      await supabase.auth.updateUser({
        data: {
          given_name: credential.fullName.givenName,
          family_name: credential.fullName.familyName,
        },
      });
    }

    if (credential.authorizationCode) {
      void exchangeAppleAuthorizationCode(credential.authorizationCode);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response) || !response.data.idToken) {
      throw new Error('Google sign-in was cancelled.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.data.idToken,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    resetRevenueCatIdentity();
    await supabase.auth.signOut();
    try {
      await GoogleSignin.signOut();
    } catch {
      // Not signed in with Google — fine.
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      userId: session?.user.id ?? null,
      signInWithApple,
      signInWithGoogle,
      signOut,
    }),
    [status, session, signInWithApple, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isGoogleSignInCancelled(err: unknown): boolean {
  return isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED;
}
