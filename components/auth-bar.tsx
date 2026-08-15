'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

type Props = { onTokenChange: (token: string) => void };
type Mode = 'signin' | 'signup';

export default function AuthBar({ onTokenChange }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const client = getSupabaseBrowserClient();

  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      setUserEmail(session?.user.email || '');
      onTokenChange(session?.access_token || '');
      if (session) window.location.href = '/workspace';
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserEmail(session?.user.email || '');
      onTokenChange(session?.access_token || '');
      if (session) window.location.href = '/workspace';
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client, onTokenChange]);

  async function sendSignupCode() {
    if (!client || !email.trim()) return;
    setBusy(true); setMessage('');
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/workspace` },
    });
    if (error) {
      setMessage(`Could not send the verification email: ${error.message}`);
    } else {
      setCodeSent(true);
      setMessage('Verification email sent. Check Inbox, Spam and Promotions. Enter the 6-digit code if your email template provides one.');
    }
    setBusy(false);
  }

  async function verifySignupCode() {
    if (!client || !email.trim() || !code.trim()) return;
    setBusy(true); setMessage('');
    const { error } = await client.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error) {
      setMessage(`Verification failed: ${error.message}`);
      setBusy(false);
      return;
    }
    if (password) {
      const { error: passwordError } = await client.auth.updateUser({ password });
      if (passwordError) {
        setMessage(`Account verified, but password setup failed: ${passwordError.message}`);
        setBusy(false);
        return;
      }
    }
    window.location.replace('/workspace');
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!client || !email.trim()) return;
    if (mode === 'signup') {
      if (!codeSent) await sendSignupCode();
      else await verifySignupCode();
      return;
    }
    setBusy(true); setMessage('');
    if (!password) { setMessage('Enter your password to sign in.'); setBusy(false); return; }
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(`Sign in failed: ${error.message}`);
    else window.location.replace('/workspace');
    setBusy(false);
  }

  async function signOut() { if (!client) return; await client.auth.signOut(); window.location.href = '/'; }
  function changeMode(next: Mode) { setMode(next); setMessage(''); setCode(''); setCodeSent(false); }

  if (!client) return <span className="victory-auth-missing">AUTH NOT CONFIGURED</span>;
  if (userEmail) return <div className="victory-auth-signed"><a href="/workspace">Workspace</a><span title={userEmail}>{userEmail}</span><button type="button" onClick={signOut}>Sign out</button><style jsx>{styles}</style></div>;

  return <div className="victory-auth">
    <div className="victory-auth-tabs"><button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => changeMode('signin')}>Sign in</button><button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Sign up</button></div>
    <form onSubmit={submitAuth} className="victory-auth-form">
      <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" required />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder={mode === 'signup' ? 'Create password' : 'Password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
      {mode === 'signup' && codeSent && <input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} required />}
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? (codeSent ? 'Verify & open workspace' : 'Send verification code') : 'Sign in'}</button>
    </form>
    {mode === 'signup' && codeSent && <button type="button" className="resend" disabled={busy} onClick={sendSignupCode}>Resend</button>}
    {message && <span className="victory-auth-message">{message}</span>}
    <style jsx>{styles}</style>
  </div>;
}

const styles = `.victory-auth,.victory-auth-signed{display:flex;align-items:center;justify-content:flex-end;gap:8px;max-width:100%;position:relative}.victory-auth-tabs{display:flex;gap:4px}.victory-auth button,.victory-auth-signed a{font:600 11px/1.2 Inter,system-ui,sans-serif;cursor:pointer;box-sizing:border-box;white-space:nowrap}.victory-auth-tabs button,.victory-auth-form button,.victory-auth-signed button,.resend{height:34px;padding:0 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#a9e7d6}.victory-auth-tabs button.active,.victory-auth-form button{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}.victory-auth-form{display:flex;align-items:center;gap:6px}.victory-auth-form input{width:145px!important;height:34px!important;margin:0!important;padding:0 9px!important;border:1px solid #2a4655!important;border-radius:8px!important;background:#07121b!important;color:#e8f3f7!important;font:11px Inter,system-ui,sans-serif!important;box-sizing:border-box!important}.victory-auth-signed{color:#91a6b6;font:10px Inter,system-ui,sans-serif}.victory-auth-signed a{color:#74dfbd;text-decoration:none}.victory-auth-message{position:absolute;right:0;top:42px;z-index:20;max-width:340px;padding:8px 10px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#b9d0dc;font:10px/1.4 Inter,system-ui,sans-serif}.resend{height:28px;font-size:10px}.victory-auth-missing{color:#ff9da5;font:9px Inter,system-ui,sans-serif}@media(max-width:760px){.victory-auth{width:100%;display:block}.victory-auth-tabs{margin-bottom:7px}.victory-auth-form{display:grid;grid-template-columns:1fr 1fr;gap:5px}.victory-auth-form input{width:100%!important}.victory-auth-form button{grid-column:1/-1;width:100%}.victory-auth-message{top:140px}.resend{width:100%;margin-top:6px}}@media(max-width:360px){.victory-auth-form{grid-template-columns:1fr}.victory-auth-form button{grid-column:auto}}`;
