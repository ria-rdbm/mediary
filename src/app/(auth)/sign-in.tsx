import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { PrimaryButton } from '@/components/ui/Button';
import { colors, typography, spacing, radius } from '@/theme';
import { useAuth, isGoogleSignInCancelled } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleApple = async () => {
    setError(null);
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'ERR_REQUEST_CANCELED') {
        setError('Sign in with Apple failed. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (err) {
      if (!isGoogleSignInCancelled(err)) {
        setError('Sign in with Google failed. Please try again.');
      }
    } finally {
      setLoading(null);
    }
  };

  // Dev-only bypass so the rest of the app can be exercised on a simulator,
  // where native Sign in with Apple/Google can't complete (no real device
  // attestation / OAuth client). __DEV__ is false in any real release
  // build, so this never ships. Uses Supabase's standard email/password
  // provider (on by default, unlike anonymous sign-ins) to get a REAL
  // session (real auth.uid(), real RLS) against one fixed dev account —
  // remove this block once device testing with real Apple/Google
  // credentials replaces it.
  const DEV_EMAIL = 'riaai1218+mediarydev@gmail.com';
  const DEV_PASSWORD = 'MediaryDevPreview-2026!';

  const handleDevSkip = async () => {
    setError(null);
    setLoading('apple');
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });
      if (!signInError && signInData.session) return;

      const { error: signUpError } = await supabase.auth.signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });
      if (signUpError && !/already registered/i.test(signUpError.message)) {
        throw signUpError;
      }
      setError('확인 이메일을 Gmail로 보냈어요. 메일의 확인 링크를 한 번 클릭한 뒤, 이 버튼을 다시 눌러주세요.');
    } catch (err) {
      console.warn('Dev skip sign-in failed', err);
      setError((err as { message?: string })?.message ?? 'Dev skip failed.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Screen>
      <View style={styles.content}>
        {__DEV__ && (
          <PrimaryButton
            label="DEV SKIP →"
            onPress={handleDevSkip}
            loading={loading === 'apple'}
            disabled={loading !== null}
            style={styles.devSkipTop}
          />
        )}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={30} color={colors.accentStrong} />
          </View>
          <Text style={typography.display}>Mediary</Text>
          <Text style={[typography.bodySecondary, styles.subtitle]}>Injection & Treatment Tracker</Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.pill}
              style={styles.appleButton}
              onPress={handleApple}
            />
          )}
          <PrimaryButton
            label="Continue with Google"
            icon="logo-google"
            onPress={handleGoogle}
            loading={loading === 'google'}
            disabled={loading !== null}
            style={styles.googleButton}
          />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to Mediary&apos;s{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/legal/terms')}>
            Terms
          </Text>{' '}
          and acknowledge the{' '}
          <Text style={styles.legalLink} onPress={() => router.push('/legal/privacy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  brand: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    marginTop: spacing.xxs,
  },
  buttons: {
    gap: spacing.sm,
  },
  devSkipTop: {
    backgroundColor: '#C0392B',
    marginBottom: spacing.lg,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  googleButton: {
    backgroundColor: colors.textPrimary,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  legal: {
    ...typography.caption,
    textAlign: 'center',
  },
  legalLink: {
    color: colors.textLink,
    fontWeight: '600',
  },
});
