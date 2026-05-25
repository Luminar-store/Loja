'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLogin() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      await authService.signIn(email, password);
      // O redirect acontecerá no useEffect assim que o estado 'user' for atualizado pelo Context
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0B] p-4 font-sans text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#131313] border border-white/5 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-[#d4af37] tracking-widest uppercase mb-2">Luminar</h1>
          <p className="text-white/50 text-sm tracking-widest uppercase">Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                placeholder="admin@luminarjoias.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#d4af37] text-black font-bold uppercase tracking-widest text-sm py-4 rounded-lg hover:bg-[#ebd070] transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
