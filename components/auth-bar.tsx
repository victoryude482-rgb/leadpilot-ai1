'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

type Props = { onTokenChange: (token: string) => void };
type Mode = 'signin' | 'signup';
type SessionLike = { access_token: string } | null | undefined;

function accessToken(session: SessionLike): string {
  return session?.access_token || '';
}

export default function AuthBar({ onTokenChange }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [noticeType, setNoticeType] = useState<'info' | 'error'>('info');
  const client = getSupabaseBrowserClient();
  const tokenChangeRef = useRef(onTokenChange);

  // Keep the latest callback without making the Supabase subscription restart
  // every time the parent renders. This prevents a visible auth/UI refresh loop.
  useEffect(() => {
    tokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    let redirecting = false;

    const applySession = (session: SessionLike) => {
      if (!active) return;
      setUserEmail(session?.user.email || '');
      tokenChangeRef.current(accessToken(session));
      if (session && !redirecting && window.location.pathname !== '/workspace') {
        redirecting = true;
        window.location.replace('/workspace');
      }
    };

    client.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = client.auth.onAuthStateChange((_event, session) => applySession(session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
    // The Supabase browser client is intentionally subscribed once per mount.
    // Callback changes are handled through tokenChangeRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  async function signUp() {
    if (!client || !email.trim() || !password) {
      setNoticeType('error');
      setMessage('Enter an email address and a password.');
      return;
    }
    if (password.length < 6) {
      setNoticeType('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setBusy(true); setMessage(''); setNoticeType('info');

    const { data, error } = await client.auth.signUp({ email: email.trim(), password });

    if (error) {
      setNoticeType('error');
      setMessage(`Sign up failed: ${error.message}`);
      setBusy(false);
      return;
    }

    if (data.session) {
      tokenChangeRef.current(accessToken(data.session));
      window.location.replace('/workspace');
      return;
    }

    setNoticeType('error');
    setMessage('Account created, but Supabase is still requiring email confirmation. In Supabase Dashboard go to Authentication → Providers → Email and turn OFF "Confirm email", then sign in here.');
    setBusy(false);
  }

  async function signIn() {
    if (!client || !email.trim() || !password) {
      setNoticeType('error');
      setMessage('Enter your email and password.');
      return;
    }

    setBusy(true); setMessage(''); setNoticeType('info');
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setNoticeType('error');
      setMessage(`Sign in failed: ${error.message}`);
      setBusy(false);
      return;
    }

    if (data.session) {
      tokenChangeRef.current(accessToken(data.session));
      window.location.replace('/workspace');
      return;
    }

    setNoticeType('error');
    setMessage('Sign in did not create a session. Check the Supabase Email provider settings.');
    setBusy(false);
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (mode === 'signup') await signUp();
    else await signIn();
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    window.location.href = '/';
  }

  function changeMode(next: Mode) {
    setMode(next);
    setMessage('');
    setNoticeType('info');
  }

  if (!client) return <span className="victory-auth-missing">AUTH NOT CONFIGURED</span>;
  if (userEmail) return <div className="victory-auth-signed"><a href="/workspace">Workspace</a><span title={userEmail}>{userEmail}</span><button type="button" onClick={signOut}>Sign out</button><style jsx>{styles}</style></div>;

  return <div className="victory-auth">
    <div className="victory-auth-tabs">
      <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => changeMode('signin')}>Sign in</button>
      <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Sign up</button>
    </div>
    <form onSubmit={submitAuth} className="victory-auth-form">
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" required />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder={mode === 'signup' ? 'Create password' : 'Password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
    </form>
    {message && <span className={`victory-auth-message ${noticeType}`}>{message}</span>}
    <style jsx>{styles}</style>
  </div>;
}

const styles = `.victory-auth,.victory-auth-signed{display:flex;align-items:center;justify-content:flex-end;gap:8px;max-width:100%;position:relative}.victory-auth-tabs{display:flex;gap:4px}.victory-auth button,.victory-auth-signed a{font:600 11px/1.2 Inter,system-ui,sans-serif;cursor:pointer;box-sizing:border-box;white-space:nowrap}.victory-auth-tabs button,.victory-auth-form button,.victory-auth-signed button{height:34px;padding:0 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#a9e7d6}.victory-auth-tabs button.active,.victory-auth-form button{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}.victory-auth-form{display:flex;align-items:center;gap:6px}.victory-auth-form input{width:145px!important;height:34px!important;margin:0!important;padding:0 9px!important;border:1px solid #2a4655!important;border-radius:8px!important;background:#07121b!important;color:#e8f3f7!important;font:11px Inter,system-ui,sans-serif!important;box-sizing:border-box!important}.victory-auth-signed{color:#91a6b6;font:10px Inter,system-ui,sans-serif}.victory-auth-signed a{color:#74dfbd;text-decoration:none}.victory-auth-message{position:absolute;right:0;top:42px;z-index:20;max-width:430px;padding:9px 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#b9d0dc;font:10px/1.4 Inter,system-ui,sans-serif}.victory-auth-message.error{border-color:#7b3c48;color:#ffc0c7}.victory-auth-missing{color:#ff9da5;font:9px Inter,system-ui,sans-serif}@media(max-width:760px){.topActions{display:block!important}.victory-auth{width:100%;display:block}.victory-auth-tabs{margin-bottom:7px}.victory-auth-form{display:grid;grid-template-columns:1fr 1fr;gap:5px}.victory-auth-form input{width:100%!important}.victory-auth-form button{grid-column:1/-1;width:100%}.victory-auth-message{top:115px;left:0;right:0;max-width:none}}@media(max-width:360px){.victory-auth-form{grid-template-columns:1fr}.victory-auth-form button{grid-column:auto}}`;