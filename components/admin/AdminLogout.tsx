'use client';
import{useState}from'react';
import{useRouter}from'next/navigation';
import{getSupabaseBrowser}from'@/lib/supabase/browser';
export function AdminLogout(){const[busy,setBusy]=useState(false);const router=useRouter();async function logout(){setBusy(true);await getSupabaseBrowser().auth.signOut();router.replace('/admin/login');router.refresh();}return <button type="button" onClick={logout} disabled={busy} className="btn btn-outline !border-white/30 !text-white hover:!bg-white/10 !px-3 !py-2 text-xs">{busy?'Signing out…':'Sign out'}</button>}