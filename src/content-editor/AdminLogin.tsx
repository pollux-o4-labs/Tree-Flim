import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminSession, signInAdmin } from './adminSession';
import './admin-login.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { admin, ready } = useAdminSession();
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  if (admin) return <Navigate to="/admin/editor" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    const signedIn = await signInAdmin(email, password);
    setBusy(false);
    if (!signedIn) { setError('이메일 또는 비밀번호를 확인해 주세요.'); return; }
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from?.startsWith('/admin/') ? from : '/admin/editor', { replace: true });
  }
  return <main className="admin-login"><section><a href={import.meta.env.BASE_URL + 'prototype/total'}>TREE FILM</a><div><span>CONTENT STUDIO</span><h1>사이트를<br />함께 다듬어요.</h1><p>사진과 글을 고르고, 실제 화면에서 바로 확인하세요.</p></div></section><form onSubmit={submit}><span>관리자 로그인</span><h2>다시 오셨네요.</h2><label>이메일<input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} autoFocus required /></label><label>비밀번호<div><input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /><button type="button" aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setShow(value => !value)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p role="alert">{error}</p>}<button className="admin-login-submit" type="submit" disabled={busy || !ready}>{busy ? '로그인 중…' : '로그인'} <ArrowRight size={16} /></button></form></main>;
}
