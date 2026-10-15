import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Mail, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assets/images/logo_mkn.png';

const SAVED_EMAIL_KEY = 'mkn_admin_saved_email';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem(SAVED_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast.error('Gagal masuk: ' + error.message);
    } else {
      toast.success('Berhasil masuk');
      const fromPath = (location.state as any)?.from?.pathname || '/admin';
      navigate(fromPath, { replace: true });
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Masukkan alamat email Anda terlebih dahulu');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/profile`,
    });

    if (error) {
      toast.error('Gagal mengirim email reset: ' + error.message);
    } else {
      toast.success('Tautan reset password telah dikirim ke email Anda');
      setIsResetMode(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0A192F] px-4">
      {/* Modern CSS Background - Abstract glowing orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[60%] rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[40%] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[420px] p-8 sm:p-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-white/80 p-4 rounded-2xl shadow-inner mb-6 backdrop-blur-sm">
            <img src={logo} alt="MKN Logo" className="h-10 object-contain drop-shadow-sm" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isResetMode ? 'Reset Password' : 'Selamat Datang'}
          </h2>
          <p className="text-blue-100/70 text-sm font-medium">
            {isResetMode
              ? 'Masukkan email akun Anda untuk menerima tautan pemulihan password'
              : 'Masukkan kredensial akun Anda untuk mengakses dashboard'}
          </p>
        </div>
        
        {isResetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-blue-100/80 uppercase tracking-wider ml-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-200/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:bg-white/10 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all outline-none backdrop-blur-sm"
                  placeholder="admin@mkncorp.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-pulse">Mengirim...</span>
              ) : (
                <>
                  Kirim Tautan Reset
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-300 hover:text-white font-medium transition-colors pt-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Halaman Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-blue-100/80 uppercase tracking-wider ml-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-200/50" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:bg-white/10 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all outline-none backdrop-blur-sm"
                  placeholder="admin@mkncorp.com"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-blue-100/80 uppercase tracking-wider ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-blue-200/50" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-200/30 focus:bg-white/10 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 transition-all outline-none backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 mb-8">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 transition-colors"
                />
                <span className="text-sm text-blue-100/70 group-hover:text-blue-100 transition-colors">Ingat email saya</span>
              </label>
              <button
                type="button"
                onClick={() => setIsResetMode(true)}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <span className="inline-block animate-pulse">Memverifikasi...</span>
              ) : (
                <>
                  Masuk Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
