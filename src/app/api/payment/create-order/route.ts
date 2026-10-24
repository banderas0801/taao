import { NextResponse } from 'next/server';
import { COIN_PACKAGES } from '@/data/stories';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { packageId } = body;

    const pkg = COIN_PACKAGES.find((p) => p.id === packageId) || COIN_PACKAGES[1];
    const orderId = `BT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const bankAccount = '0388888888';
    const bankCode = 'MB'; // MBBank
    const memo = `NAPXU ${orderId}`;
    const qrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${pkg.priceVnd}&addInfo=${encodeURIComponent(memo)}&accountName=BIEN%20TRUYEN%20MEDIA`;

    return NextResponse.json({
      success: true,
      orderId,
      packageId: pkg.id,
      amountVnd: pkg.priceVnd,
      coins: pkg.coins,
      bonusCoins: pkg.bonusCoins,
      qrUrl,
      bankAccount,
      bankCode,
      memo,
      status: 'pending',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Không thể khởi tạo đơn nạp VietQR' },
      { status: 500 }
    );
  }
}
