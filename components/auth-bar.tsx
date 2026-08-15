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

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    if (!client || !email.trim() || !password) return;
    setBusy(true); setMessage('');
    if (mode === 'signup') {
      const { data, error } = await client.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) setMessage(error.message);
      else setMessage(data.session ? 'Account created. You are signed in.' : 'Account created. Check your email to confirm.');
    } else {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      setMessage(error ? error.message : 'Signed in successfully.');
    }
    setBusy(false);
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    setMessage('Signed out.');
  }

  if (!client) return <span className="victory-auth-missing">AUTH NOT CONFIGURED</span>;
  if (userEmail) return <div className="victory-auth-signed"><span title={userEmail}>{userEmail}</span><button type="button" onClick={signOut}>Sign out</button><style jsx>{styles}</style></div>;

  return <div className="victory-auth">
    <div className="victory-auth-tabs" role="tablist" aria-label="Account access">
      <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setMessage(''); }}>Sign in</button>
      <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage(''); }}>Sign up</button>
    </div>
    <form onSubmit={submitAuth} className="victory-auth-form">
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email address" autoComplete="email" required />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
      <button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button>
    </form>
    {message && <span className="victory-auth-message">{message}</span>}
    <style jsx>{styles}</style>
  </div>;
}

const styles = `
  .victory-auth,.victory-auth-signed{display:flex;align-items:center;justify-content:flex-end;gap:8px;max-width:100%;position:relative}
  .victory-auth-tabs{display:flex;gap:4px;flex:0 0 auto}
  .victory-auth button{font:600 11px/1.2 Inter,system-ui,sans-serif;cursor:pointer;box-sizing:border-box;white-space:nowrap}
  .victory-auth-tabs button,.victory-auth-form button,.victory-auth-signed button{height:34px;padding:0 11px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#a9e7d6}
  .victory-auth-tabs button.active,.victory-auth-form button{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}
  .victory-auth-form{display:flex;align-items:center;gap:6px;margin:0}
  .victory-auth-form input{width:145px!important;height:34px!important;min-width:0!important;margin:0!important;padding:0 9px!important;border:1px solid #2a4655!important;border-radius:8px!important;background:#07121b!important;color:#e8f3f7!important;font:11px Inter,system-ui,sans-serif!important;box-sizing:border-box!important;outline:none!important}
  .victory-auth-form input::placeholder{color:#6f8799}
  .victory-auth-form button:disabled{opacity:.55;cursor:wait}
  .victory-auth-signed{color:#91a6b6;font:10px Inter,system-ui,sans-serif}
  .victory-auth-signed>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px}
  .victory-auth-message{position:absolute;right:0;top:42px;z-index:20;max-width:300px;padding:8px 10px;border:1px solid #2b4557;border-radius:8px;background:#10222e;color:#b9d0dc;font:10px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,.3)}
  .victory-auth-missing{color:#ff9da5;font:9px Inter,system-ui,sans-serif}
  @media(max-width:760px){.victory-auth{width:100%;display:grid;grid-template-columns:auto 1fr;align-items:center}.victory-auth-tabs{justify-content:flex-start}.victory-auth-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:5px}.victory-auth-form input{width:100%!important}.victory-auth-form button{width:auto}.victory-auth-message{right:0;top:78px}.victory-auth-signed{justify-content:flex-end;max-width:100%}}
  @media(max-width:560px){.victory-auth{display:block}.victory-auth-tabs{margin-bottom:7px}.victory-auth-form{grid-template-columns:1fr 1fr}.victory-auth-form button{grid-column:1/-1;width:100%}.victory-auth-message{top:110px}}
  @media(max-width:360px){.victory-auth-form{grid-template-columns:1fr}.victory-auth-form button{grid-column:auto}}
`;