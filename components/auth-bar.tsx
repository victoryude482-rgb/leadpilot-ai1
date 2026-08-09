'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

type Props = { onTokenChange: (token: string) => void };
type Mode = 'signin' | 'signup';

export default function AuthBar({ onTokenChange }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const client = getSupabaseBrowserClient();

  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.session?.user.email || '');
      onTokenChange(data.session?.access_token || '');
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email || '');
      onTokenChange(session?.access_token || '');
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client, onTokenChange]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage('');
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!client || !email.trim() || !password) return;

    setBusy(true);
    setMessage('');

    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        setMessage('Account created. You are signed in.');
      } else {
        setMessage('Account created. Check your email to confirm your account.');
      }
    } else {
      const { error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setMessage(error ? error.message : 'Signed in successfully.');
    }

    setBusy(false);
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setMessage('Signed out.');
  }

  if (!client) return <span className="authMissing">AUTH NOT CONFIGURED</span>;
  if (userEmail) return <div className="authSigned"><span>{userEmail}</span><button type="button" onClick={signOut}>Sign out</button></div>;

  return <div className="authWrap">
    <div className="authTabs" role="tablist" aria-label="Account access">
      <button
        type="button"
        className={mode === 'signin' ? 'authTab active' : 'authTab'}
        onClick={() => switchMode('signin')}
        aria-selected={mode === 'signin'}
      >
        Sign in
      </button>
      <button
        type="button"
        className={mode === 'signup' ? 'authTab active' : 'authTab'}
        onClick={() => switchMode('signup')}
        aria-selected={mode === 'signup'}
      >
        Sign up
      </button>
    </div>

    <form onSubmit={submitAuth} className="authForm">
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
        placeholder="Email address"
        autoComplete="email"
        required
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        minLength={6}
        required
      />
      <button type="submit" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
    </form>

    {message && <span className="authMessage">{message}</span>}
  </div>;
}
