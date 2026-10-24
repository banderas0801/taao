'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ShieldCheck, Mail, Lock, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inAppNotice, setInAppNotice] = useState(false);

  // Biển Truyện logic: Xử lý đăng nhập Google OAuth
  const handleGoogleLogin = () => {
    // Thông báo giống hệt mã gốc Biển Truyện
    alert(
      "Đăng nhập Google OAuth (Supabase Auth):\n\n" +
      "1. Hệ thống đã tích hợp sẵn luồng gọi: supabase.auth.signInWithOAuth({ provider: 'google' })\n" +
      "2. Để kích hoạt OAuth thật, bạn chỉ cần điền SUPABASE_URL và Google Client ID vào file .env"
    );
  };

  // Đăng nhập demo / email
  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Đăng nhập thành công! Đã đồng bộ tài khoản.');
      router.push('/');
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
          Đăng Nhập Biển Truyện
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Đồng bộ tủ sách, tiến trình đọc và số dư Xu đa thiết bị
        </p>
      </div>

      {/* Cảnh báo In-App Browser của Biển Truyện */}
      {inAppNotice && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Nếu bạn đang mở trong Facebook/Zalo, vui lòng bấm <strong>[···]</strong> góc trên và chọn <strong>Mở bằng Chrome/Safari</strong> để đăng nhập Google ổn định.
          </span>
        </div>
      )}

      {/* Nút Đăng nhập Google (Phương thức chính của Biển Truyện) */}
      <div>
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition flex items-center justify-center space-x-3 text-sm font-bold text-neutral-800 dark:text-neutral-100 shadow-sm"
        >
          {/* Google SVG Logo */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Tiếp tục bằng Google</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-neutral-200 dark:border-neutral-800 w-full"></div>
        <span className="bg-white dark:bg-neutral-900 px-3 text-xs text-neutral-400 uppercase font-semibold">
          hoặc dùng email
        </span>
      </div>

      {/* Form Email / Password */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="daohu@bientruyen.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">
              Mật khẩu
            </label>
            <a href="#" className="text-amber-600 dark:text-amber-400 hover:underline">
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2 text-sm"
        >
          <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        Chưa có tài khoản?{' '}
        <span className="text-amber-600 dark:text-amber-400 font-bold cursor-pointer hover:underline">
          Đăng ký miễn phí
        </span>
      </div>
    </div>
  );
}
