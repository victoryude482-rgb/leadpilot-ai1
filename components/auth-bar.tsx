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
  const [noticeType, setNoticeType] = useState<'info' | 'error'>('info');
  const client = getSupabaseBrowserClient();

  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      setUserEmail(session?.user.email || '');
      onTokenChange(session?.access_token || '');
      if (session) window.location.replace('/workspace');
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserEmail(session?.user.email || '');
      onTokenChange(session?.access_token || '');
      if (session) window.location.replace('/workspace');
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [client, onTokenChange]);

  async function sendSignupCode() {
    if (!client || !email.trim()) {
      setNoticeType('error');
      setMessage('Enter a valid email address first.');
      return;
    }
    setBusy(true); setMessage(''); setNoticeType('info');

    // OTP is preferred because it works directly with the 6-digit code UI.
    const { data, error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/workspace`,
      },
    });

    if (!error) {
      if (data.session) {
        onTokenChange(data.session.access_token);
        window.location.replace('/workspace');
        return;
      }
      setCodeSent(true);
      setMessage('Verification sent. Check Inbox, Spam and Promotions. Your Supabase email template may send a 6-digit code or a verification link.');
      setBusy(false);
      return;
    }

    // Fallback for projects where the OTP endpoint/template is unavailable.
    // This still creates the account and asks Supabase to send its confirmation email.
    const { data: signupData, error: signupError } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/workspace` },
    });

    if (signupError) {
      setNoticeType('error');
      setMessage(`Verification could not be sent: ${error.message}. Fallback signup: ${signupError.message}`);
      setBusy(false);
      return;
    }

    if (signupData.session) {
      onTokenChange(signupData.session.access_token);
      window.location.replace('/workspace');
      return;
    }

    setCodeSent(false);
    setMessage('Account created. Supabase sent a confirmation email. Open that email to activate your account, then sign in here.');
    setMode('signin');
    setBusy(false);
  }

  async function verifySignupCode() {
    if (!client || !email.trim() || code.trim().length < 6) {
      setNoticeType('error');
      setMessage('Enter the 6-digit verification code from your email.');
      return;
    }
    setBusy(true); setMessage(''); setNoticeType('info');
    const { data, error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    if (error) {
      setNoticeType('error');
      setMessage(`Verification failed: ${error.message}`);
      setBusy(false);
      return;
    }
    if (password) {
      const { error: passwordError } = await client.auth.updateUser({ password });
      if (passwordError) {
        setNoticeType('error');
        setMessage(`Account verified, but password setup failed: ${passwordError.message}`);
        setBusy(false);
        return;
      }
    }
    if (data.session) {
      onTokenChange(data.session.access_token);
      window.location.replace('/workspace');
    } else {
      setNoticeType('error');
      setMessage('Your account was verified, but a session was not created. Please sign in.');
      setMode('signin');
      setCodeSent(false);
      setBusy(false);
    }
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!client || !email.trim()) return;
    if (mode === 'signup') {
      if (!codeSent) await sendSignupCode();
      else await verifySignupCode();
      return;
    }
    setBusy(true); setMessage(''); setNoticeType('info');
    if (!password) {
      setNoticeType('error');
      setMessage('Enter your password to sign in.');
      setBusy(false);
      return;
    }
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setNoticeType('error');
      setMessage(`Sign in failed: ${error.message}`);
    } else if (data.session) {
      onTokenChange(data.session.access_token);
      window.location.replace('/workspace');
      return;
    }
    setBusy(false);
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
    setCode('');
    setCodeSent(false);
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
      {mode === 'signup' && codeSent && <input className="codeInput" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} required />}
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? (codeSent ? 'Verify & open workspace' : 'Send verification') : 'Sign in'}</button>
    </form>
    {mode === 'signup' && codeSent && <button type="button" className="resend" disabled={busy} onClick={sendSignupCode}>Didn't get it? Resend</button>}
    {mode === 'signup' && codeSent && <span className="hint">If the email contains a verification link instead of a code, open the link. It will activate the same account.</span>}
    {message && <span className={`victory-auth-message ${noticeType}`}>{message}</span>}
    <style jsx>{styles}</style>
  </div>;
}

const styles = `.victory-auth,.victory-auth-signed{display:flex;align-items:center;justify-content:flex-end;gap:8px;max-width:100%;position:relative}.victory-auth-tabs{display:flex;gap:4px}.victory-auth button,.victory-auth-signed a{font:600 11px/1.2 Inter,system-ui,sans-serif;cursor:pointer;box-sizing:border-box;white-space:nowrap}.victory-auth-tabs button,.victory-auth-form button,.victory-auth-signed button,.resend{height:34px;padding:0 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#a9e7d6}.victory-auth-tabs button.active,.victory-auth-form button{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}.victory-auth-form{display:flex;align-items:center;gap:6px}.victory-auth-form input{width:145px!important;height:34px!important;margin:0!important;padding:0 9px!important;border:1px solid #2a4655!important;border-radius:8px!important;background:#07121b!important;color:#e8f3f7!important;font:11px Inter,system-ui,sans-serif!important;box-sizing:border-box!important}.victory-auth-form .codeInput{width:110px!important;letter-spacing:.2em}.victory-auth-signed{color:#91a6b6;font:10px Inter,system-ui,sans-serif}.victory-auth-signed a{color:#74dfbd;text-decoration:none}.victory-auth-message{position:absolute;right:0;top:42px;z-index:20;max-width:380px;padding:9px 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#b9d0dc;font:10px/1.4 Inter,system-ui,sans-serif}.victory-auth-message.error{border-color:#7b3c48;color:#ffc0c7}.resend{height:28px;font-size:10px}.hint{position:absolute;right:0;top:76px;z-index:19;max-width:380px;color:#7890a1;font:9px/1.4 Inter,system-ui,sans-serif;text-align:right}.victory-auth-missing{color:#ff9da5;font:9px Inter,system-ui,sans-serif}@media(max-width:760px){.topActions{display:block!important}.victory-auth{width:100%;display:block}.victory-auth-tabs{margin-bottom:7px}.victory-auth-form{display:grid;grid-template-columns:1fr 1fr;gap:5px}.victory-auth-form input{width:100%!important}.victory-auth-form button{grid-column:1/-1;width:100%}.victory-auth-message{top:145px;left:0;right:0;max-width:none}.hint{top:210px;left:0;right:0;max-width:none;text-align:left}.resend{width:100%;margin-top:6px}}@media(max-width:360px){.victory-auth-form{grid-template-columns:1fr}.victory-auth-form button{grid-column:auto}}`;