'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Sparkles, PlusSquare } from 'lucide-react';

export default function PwaRegisterAndBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 0. Ép chặt Viewport Mobile 100% kể cả khi WebAPK Android bị kẹt Desktop Flag
    try {
      let vp = document.querySelector('meta[name="viewport"]');
      if (!vp) {
        vp = document.createElement('meta');
        vp.setAttribute('name', 'viewport');
        document.head.appendChild(vp);
      }
      vp.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    } catch (e) {}

    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      });
    }

    // 2. Check if already running in standalone mode (installed app)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 86400000 * 3) {
      // 3 days cooldown
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Listen for Chrome / Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS Safari, show prompt banner if mobile
    if (isIosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to install prompt:', outcome);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-neutral-900/95 text-white border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-3 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-neutral-400 hover:text-white transition"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          {/* App Icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt="Tả Ao Reader Icon"
            className="w-12 h-12 rounded-xl border border-amber-500/40 shadow-md object-cover shrink-0"
          />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-white">Tả Ao Reader</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PWA
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              Cài app đọc sách toàn màn hình, mượt mà & không giật lag.
            </p>
          </div>
        </div>

        {isIos ? (
          <div className="text-xs bg-neutral-800/90 rounded-xl p-2.5 border border-neutral-700/60 text-neutral-200 space-y-1">
            <p className="flex items-center gap-1 text-amber-400 font-semibold">
              <Share2 className="w-3.5 h-3.5" />
              <span>Cách cài trên iPhone/iPad:</span>
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              Nhấn nút <strong>Chia sẻ</strong> (biểu tượng mũi tên hướng lên) ở thanh dưới cùng Safari, sau đó cuộn chọn <strong>&quot;Thêm vào MH chính&quot;</strong> (<PlusSquare className="w-3 h-3 inline mx-0.5" />).
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold text-xs text-white shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Cài Đặt Ứng Dụng Ngay (1 Chạm)</span>
          </button>
        )}
      </div>
    </div>
  );
}
