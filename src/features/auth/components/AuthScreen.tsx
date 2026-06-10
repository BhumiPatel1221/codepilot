'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Zap, Users, Terminal, Code2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import AuthCodePreview from '@/features/auth/components/AuthCodePreview';
import { useAuth } from '@/context/AuthContext';

type Mode = 'login' | 'signup';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

interface SignupErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: '',
    password: '',
    remember: false,
  });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});

  const validateLogin = (): boolean => {
    const errs: LoginErrors = {};
    if (!loginForm.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(loginForm.email)) errs.email = 'Enter a valid email';
    if (!loginForm.password) errs.password = 'Password is required';
    else if (loginForm.password.length < 6) errs.password = 'Minimum 6 characters';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = (): boolean => {
    const errs: SignupErrors = {};
    if (!signupForm.name) errs.name = 'Name is required';
    if (!signupForm.email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(signupForm.email)) errs.email = 'Enter a valid email';
    if (!signupForm.password) errs.password = 'Password is required';
    else if (signupForm.password.length < 8) errs.password = 'Minimum 8 characters';
    if (!signupForm.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (signupForm.password !== signupForm.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setSignupErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsLoading(true);
    setAuthError('');
    try {
      await signIn(loginForm.email, loginForm.password);
      router.push('/homepage');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setIsLoading(true);
    setAuthError('');
    setSuccessMessage('');
    try {
      await signUp(signupForm.email, signupForm.password, { fullName: signupForm.name });
      setSuccessMessage('Account created! Please check your email to verify your account, then sign in.');
      setMode('login');
      setLoginForm({ email: signupForm.email, password: '', remember: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px] space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <AppLogo size={42} />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {mode === 'login' ? 'Sign in to CodePilot' : 'Create an account'}
          </h2>
          <p className="mt-2.5 text-[14px] text-muted-foreground">
            {mode === 'login' ? (
              <>
                New to CodePilot?{' '}
                <button 
                  onClick={() => { setMode('signup'); setAuthError(''); setLoginErrors({}); }} 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => { setMode('login'); setAuthError(''); setSignupErrors({}); }} 
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-background py-8 px-6 shadow-sm border border-border/80 rounded-xl sm:px-8">
          
          {authError && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[13px] font-medium text-red-600 dark:text-red-400 text-center">{authError}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-[13px] font-medium text-green-600 dark:text-green-400 text-center">{successMessage}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                {loginErrors.email && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{loginErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[14px] font-medium text-foreground">Password</label>
                  <a href="#" className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginErrors.password && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{loginErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center py-2.5 mt-2 rounded-lg text-[14px] font-semibold disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={onSignup} className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-foreground mb-1.5">Full name</label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                {signupErrors.name && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{signupErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-[14px] font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                />
                {signupErrors.email && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{signupErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-[14px] font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupErrors.password && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{signupErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-[14px] font-medium text-foreground mb-1.5">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 text-[14px] bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {signupErrors.confirmPassword && (
                  <p className="mt-1 text-[12px] font-medium text-red-500">{signupErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center py-2.5 mt-4 rounded-lg text-[14px] font-semibold disabled:opacity-60 transition-colors"
              >
                {isLoading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[12px] uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-input rounded-lg text-[14px] font-medium text-foreground hover:bg-muted transition-colors">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-input rounded-lg text-[14px] font-medium text-foreground hover:bg-muted transition-colors">
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>

          <p className="mt-8 text-center text-[12px] text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="font-medium hover:text-foreground transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="font-medium hover:text-foreground transition-colors">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
