import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Thiếu orderId' }, { status: 400 });
  }

  // Cổng chờ webhook thực tế từ SePay / PayOS / VietQR
  return NextResponse.json({
    orderId,
    status: 'pending', // hoặc 'completed' khi webhook ngân hàng bắn vào
    message: 'Đang lắng nghe giao dịch từ cổng NAPAS...',
  });
}
