'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

type Props = { onTokenChange: (token: string) => void };

export default function AuthBar({ onTokenChange }: Props) {
  const [email, setEmail] = useState('');
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

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!client || !email.trim()) return;
    setBusy(true);
    setMessage('');
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : 'Magic link sent. Check your email.');
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
    <form onSubmit={signIn} className="authForm">
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email for magic link" required />
      <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Sign in'}</button>
    </form>
    {message && <span className="authMessage">{message}</span>}
  </div>;
}
