#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script 10 dòng kiểm tra đối chiếu API thực tế của thư viện VieNeu v3 Nano trên VPS
Chạy: python3 scripts/test_vieneu_api.py
"""
import sys, os

print("=== TEST SCRIPT: ĐỐI CHIẾU API THẬT CỦA THƯ VIỆN VIENEU V3 NANO ===")
try:
    from vieneu import Vieneu
    tts = Vieneu(mode="v3nano")
    print("1. Khởi tạo đối tượng mode='v3nano':", type(tts))
    print("2. Kiểm tra phương thức tts.tts:", hasattr(tts, 'tts') or hasattr(tts, 'infer'))
    out_file = "/tmp/vieneu_test_output.wav"
    if hasattr(tts, 'tts'):
        tts.tts(text="Xin chào, đây là kiểm tra VieNeu v3 Nano.", output_path=out_file)
    else:
        audio = tts.infer(text="Xin chào, đây là kiểm tra VieNeu v3 Nano.")
        tts.save(audio, out_file)
    print("✅ TEST THÀNH CÔNG: Kích thước file sinh ra =", os.path.getsize(out_file), "bytes")
except Exception as e:
    print(f"❌ TEST LỖI: {e}")
    sys.exit(1)
