"""
Script Đo Đạc Hiệu Năng Thực Tế (Benchmark) VieNeu v3 Nano Trên VPS 1 vCPU
Cách chạy đo RAM và Thời gian chính xác:
    /usr/bin/time -v /opt/vieneu-venv/bin/python scripts/benchmark_chapter.py
"""

import time
import os
import sys
from pathlib import Path

# Văn bản mẫu 1 chương truyện tiêu chuẩn (~600 từ, ~3.500 ký tự)
SAMPLE_CHAPTER_TEXT = (
    "Đêm đã về khuya. Cả không gian chìm vào tĩnh mịch, chỉ còn tiếng gió rít qua khe cửa sổ "
    "của căn phòng trên tầng gác mái. Lâm ngồi tựa lưng vào chiếc ghế bành cũ kỹ, tay cầm tách trà "
    "hoa cúc đã nguội ngắt từ bao giờ. Trên bàn, cuốn sách cổ phủ bìa da sờn rách vẫn đang mở ra ở "
    "trang thứ bốn mươi chín. Những dòng chữ Nôm cổ kính tựa như những vệt mực nhảy múa dưới ánh "
    "đèn vàng leo lét.\n\n"
    "Hắn thở dài một tiếng, khẽ đưa tay lật nhẹ sang trang tiếp theo. Một luồng khí lạnh đột ngột "
    "thổi thốc từ ngoài ban công vào phòng, làm tấm rèm cửa lay động dữ dội. Ngọn nến đặt nơi góc "
    "bàn chập chờn rồi phụt tắt. Không gian bỗng chốc tối sầm lại, chỉ còn lại ánh trăng bàng bạc "
    "chiếu rọi qua khung kính vỡ. Trong màn đêm sâu thẳm, dường như có một tiếng bước chân nhẹ tênh "
    "đang chậm rãi tiến lại gần ngưỡng cửa."
)

def run_benchmark():
    print("=" * 60)
    print(" BẮT ĐẦU ĐO ĐẠC HIỆU NĂNG THỰC TẾ VIENEU V3 NANO TRÊN VPS")
    print("=" * 60)
    print(f"Số ký tự văn bản: {len(SAMPLE_CHAPTER_TEXT)}")
    print(f"Số từ văn bản: ~{len(SAMPLE_CHAPTER_TEXT.split())} từ")
    
    t0_load = time.time()
    try:
        from vieneu import Vieneu
        print("\n1. Đang nạp model Vieneu(mode='v3nano')...")
        model = Vieneu(mode="v3nano")
        t_loaded = time.time() - t0_load
        print(f"✅ Nạp model thành công sau: {t_loaded:.2f} giây")
    except Exception as e:
        print(f"❌ Không thể nạp model: {e}")
        sys.exit(1)

    output_wav = "benchmark_output.wav"
    print("\n2. Đang render âm thanh bằng CPU...")
    t0_render = time.time()
    
    try:
        model.tts(
            text=SAMPLE_CHAPTER_TEXT,
            output_path=output_wav
        )
        render_seconds = time.time() - t0_render
        print(f"✅ Render xong sau: {render_seconds:.2f} giây")
    except Exception as e:
        print(f"❌ Lỗi trong quá trình render: {e}")
        sys.exit(1)

    # Đo độ dài file âm thanh tạo ra
    import wave
    with wave.open(output_wav, 'r') as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        audio_duration = frames / float(rate)

    file_size_kb = os.path.getsize(output_wav) / 1024
    rtf = render_seconds / audio_duration if audio_duration > 0 else 0

    print("\n" + "=" * 60)
    print(" KẾT QUẢ ĐO ĐẠC THỰC TẾ:")
    print("=" * 60)
    print(f"⏱️  Thời gian audio tạo ra: {audio_duration:.2f} giây (~{audio_duration/60:.2f} phút nghe)")
    print(f"⚙️  Thời gian CPU render:  {render_seconds:.2f} giây")
    print(f"🚀 Tỷ lệ Real-Time (RTF): {rtf:.3f}")
    if rtf < 1.0:
        print(f"   => Nhanh hơn thời gian thực {1.0/rtf:.1f} lần (Rất tốt cho nền)")
    else:
        print(f"   => Chậm hơn thời gian thực {rtf:.1f} lần (Bắt buộc pre-render nền)")
    print(f"💾 Dung lượng WAV thô:    {file_size_kb:.1f} KB")
    print("=" * 60)

    # Dọn dẹp
    if os.path.exists(output_wav):
        os.remove(output_wav)

if __name__ == "__main__":
    run_benchmark()
