#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Probe script kiểm tra cấu trúc shape thực tế của VieNeu v3 Nano
Chạy trên VPS: /opt/vieneu-venv/bin/python scripts/probe_vieneu_shapes.py
"""
import sys
import numpy as np

print("=== PROBE: KIỂM TRA SHAPE THẬT SỰ CỦA VIENEU V3 NANO ===")
try:
    from vieneu import Vieneu
    tts = Vieneu(mode="v3nano")
    print("1. Đã khởi tạo Vieneu(mode='v3nano') thành công.")
    
    # Kiểm tra các phương thức
    print("2. Danh sách methods liên quan:", [m for m in dir(tts) if not m.startswith('_')])
    
    # Thử gọi encode_reference nếu có file wav mẫu
    import tempfile, wave
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        # Tạo file wav dummy 24kHz mono 16-bit
        with wave.open(tmp.name, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(b'\x00\x00' * 24000 * 5)
        
        if hasattr(tts, 'encode_reference'):
            out = tts.encode_reference(tmp.name)
            if isinstance(out, tuple):
                print("3. encode_reference trả về tuple độ dài:", len(out))
                for i, item in enumerate(out):
                    arr = np.asarray(item)
                    print(f"   - Phân tử [{i}]: shape = {arr.shape}, dtype = {arr.dtype}")
            elif isinstance(out, dict):
                print("3. encode_reference trả về dict keys:", list(out.keys()))
                for k, v in out.items():
                    arr = np.asarray(v)
                    print(f"   - Key '{k}': shape = {arr.shape}, dtype = {arr.dtype}")
            else:
                arr = np.asarray(out)
                print(f"3. encode_reference trả về array: shape = {arr.shape}")
        else:
            print("3. SDK không có phương thức encode_reference.")
except Exception as e:
    print(f"❌ Lỗi probe: {e}")
