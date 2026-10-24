#!/usr/bin/env bash
# ==============================================================================
# Script Triển Khai VieNeu v3 Nano Chuẩn Xác Trên VPS (1 vCPU, ~1.6GB RAM trống)
# - Tạo venv độc lập, không cài vào python hệ thống
# - Không nuốt lỗi (không dùng || true hay 2>/dev/null)
# - Dọn dẹp process cũ trước khi chạy mới (pm2 delete vieneu-tts)
# - Chạy ưu tiên nice -n 10 để nhường CPU cho TaxCouncil
# - Lắng nghe DUY NHẤT trên 127.0.0.1:8005 (không mở ra Internet)
# ==============================================================================

set -euo pipefail

echo "=========================================="
echo " [1/5] Kiểm tra FFmpeg hệ thống"
echo "=========================================="
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️ ffmpeg chưa được cài đặt. Đang cài đặt..."
    sudo apt-get update && sudo apt-get install -y ffmpeg
fi
ffmpeg -version | head -n 1
echo "✅ FFmpeg đã sẵn sàng."

echo ""
echo "=========================================="
echo " [2/5] Khởi tạo Python Virtualenv độc lập"
echo "=========================================="
VENV_DIR="/opt/vieneu-venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Tạo venv tại $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
fi

"$VENV_DIR/bin/pip" install --upgrade pip setuptools wheel
echo "Cài đặt thư viện AI từ scripts/requirements-vieneu.txt..."
"$VENV_DIR/bin/pip" install -r scripts/requirements-vieneu.txt

echo "✅ Đã cài đặt xong thư viện vào venv."

echo ""
echo "=========================================="
echo " [2.5/5] Đối chiếu API thật của VieNeu (Probe 10 dòng)"
echo "=========================================="
echo "Chạy script kiểm tra API VieNeu..."
"$VENV_DIR/bin/python" scripts/test_vieneu_api.py
echo "✅ Đối chiếu API thành công!"

echo ""
echo "=========================================="
echo " [3/5] Khởi động lại dịch vụ qua PM2"
echo "=========================================="
# Xoá process cũ trong PM2 nếu đã tồn tại để tránh lỗi duplicate
if pm2 list | grep -q "vieneu-tts"; then
    echo "Phát hiện vieneu-tts đang có trong PM2. Đang dừng và xoá process cũ..."
    pm2 delete vieneu-tts
fi

echo "Khởi chạy vieneu-tts với nice -n 10 (nhường CPU cho TaxCouncil)..."
# Chạy với nice -n 10 để tránh ngốn hết 1 vCPU làm đơ các dịch vụ khác
nice -n 10 pm2 start scripts/vieneu_service.py \
    --name vieneu-tts \
    --interpreter "$VENV_DIR/bin/python" \
    --env HOST=127.0.0.1 \
    --env PORT=8005 \
    --time

pm2 save

echo ""
echo "=========================================="
echo " [4/5] Chờ model nạp và kiểm tra /health"
echo "=========================================="
echo "Đang đợi tiến trình nạp model VieNeu v3 Nano (khoảng 3-5 giây)..."
sleep 4

HEALTH_URL="http://127.0.0.1:8005/health"
echo "Gọi test: $HEALTH_URL"
HEALTH_RESP=$(curl -s "$HEALTH_URL" || echo '{"status":"failed"}')
echo "Phản hồi: $HEALTH_RESP"

if echo "$HEALTH_RESP" | grep -q '"model_loaded":true'; then
    echo "🎉 THÀNH CÔNG: Model VieNeu v3 Nano đã nạp vào RAM và sẵn sàng 100%!"
else
    echo "⚠️ CẢNH BÁO: Model chưa nạp xong hoặc có lỗi. Xem chi tiết log bằng:"
    echo "   pm2 logs vieneu-tts --lines 100 --nostream"
    exit 1
fi

echo ""
echo "=========================================="
echo " [5/5] Kiểm tra bộ nhớ RAM thực tế trên VPS"
echo "=========================================="
free -h
echo "=========================================="
