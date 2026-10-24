'use client';

import React, { useState } from 'react';
import { COIN_PACKAGES } from '@/data/stories';
import { CoinPackage } from '@/types';
import { getUserCoins, setUserCoins } from '@/lib/storage';
import { X, CheckCircle2, QrCode, Sparkles, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated?: (newBalance: number) => void;
}

export default function PaymentModal({ isOpen, onClose, onBalanceUpdated }: PaymentModalProps) {
  const [selectedPack, setSelectedPack] = useState<CoinPackage>(COIN_PACKAGES[1]);
  const [orderCreated, setOrderCreated] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Format tiền VND
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleSimulatePayment = () => {
    const current = getUserCoins();
    const added = selectedPack.coins + selectedPack.bonusCoins;
    const newTotal = current + added;
    setUserCoins(newTotal);
    if (onBalanceUpdated) onBalanceUpdated(newTotal);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOrderCreated(false);
      onClose();
    }, 1500);
  };

  // URL VietQR tạo mã động theo chuẩn NAPAS
  const qrUrl = `https://img.vietqr.io/image/MB-0388888888-compact2.png?amount=${selectedPack.priceVnd}&addInfo=NAPXU%20BT${selectedPack.id}&accountName=BIEN%20TRUYEN%20MEDIA`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-amber-50/50 dark:bg-neutral-800/50">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Nạp Xu Đọc Truyện</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Tự động kích hoạt qua chuyển khoản VietQR 24/7</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-neutral-900 dark:text-white">Nạp Xu Thành Công!</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Đã cộng <strong className="text-amber-600 dark:text-amber-400">+{selectedPack.coins + selectedPack.bonusCoins} Xu</strong> vào tài khoản của bạn.
              </p>
            </div>
          ) : !orderCreated ? (
            <div className="space-y-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                1. Chọn gói Xu ưu đãi
              </label>

              <div className="grid grid-cols-2 gap-3">
                {COIN_PACKAGES.map((pkg) => {
                  const isSelected = selectedPack.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPack(pkg)}
                      className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-800/50'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm">
                          Hot nhất
                        </span>
                      )}
                      <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                        {pkg.coins} Xu
                        {pkg.bonusCoins > 0 && (
                          <span className="ml-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            +{pkg.bonusCoins}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                        {formatMoney(pkg.priceVnd)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setOrderCreated(true)}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Tạo Mã VietQR Thanh Toán</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bảo mật chuẩn ngân hàng NAPAS 24/7</span>
              </div>
            </div>
          ) : (
            /* Bước hiển thị mã VietQR */
            <div className="space-y-4 text-center">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl inline-block border border-neutral-200 dark:border-neutral-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="Mã VietQR"
                  className="w-56 h-56 mx-auto rounded-lg object-contain bg-white"
                />
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-neutral-900 dark:text-white">
                  Số tiền: <span className="text-amber-600 font-bold">{formatMoney(selectedPack.priceVnd)}</span>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Nội dung chuyển khoản: <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">NAPXU BT{selectedPack.id}</span>
                </p>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
                Hệ thống ngân hàng đang chờ quét mã. Sau khi chuyển tiền, số Xu sẽ được cộng tự động vào ví của bạn.
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setOrderCreated(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSimulatePayment}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Nạp (Test Ngay)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
