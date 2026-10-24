#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dịch vụ VieNeu v3 Nano TTS & Voice Cloning Service (Port 8005)
Chạy nền độc lập qua PM2 trên VPS:
    pm2 start scripts/vieneu_service.py --name vieneu-tts --interpreter /opt/vieneu-venv/bin/python

Bảo mật, Ổn định & Pháp lý theo Blueprint hoàn chỉnh:
1. Chỉ nghe trên 127.0.0.1 (Loopback only, không CORS).
2. Kiểm tra regex ref_id chuẩn ^[a-z0-9_-]{8,40}$, chống Path Traversal qua target_path.is_relative_to(CLONED_VOICES_DIR).
3. Tuân thủ Nghị định 13: KHÔNG lưu file audio gốc (.wav). Artifact lưu dạng {ref_id}.npz gồm embedding + style matrix (nguyên gốc từ encode_reference của SDK) kèm engine: 'vieneu-v3-nano'.
4. Đọc artifact bằng np.load(..., allow_pickle=False), từ chối nếu sai engine.
5. Ghi artifact nguyên tử (Atomic write) qua file tạm và os.replace, trả 409 nếu ref_id đã tồn tại.
6. Mọi file âm thanh tạm thời (.raw, .wav, .mp3) BẮT BUỘC PHẢI BỊ XOÁ trong finally.
7. Đọc chung bộ hằng số kiểm chuẩn từ src/data/audio_thresholds.json (Single Source of Truth).
8. Không block asyncio event loop: Bọc các tác vụ nặng (ffmpeg, trích xuất embedding, VAD, suy luận tts) trong asyncio.to_thread.
9. Bảo vệ 1 vCPU bằng hàng đợi tuần tự asyncio.Lock() và os.nice(10) trực tiếp trong tiến trình.
10. Mode bắt buộc: Vieneu(mode="v3nano"), /health chỉ báo 200 khi model đã thực sự nạp vào RAM.
"""

import os
import sys
import re
import math
import struct
import json
import wave
import tempfile
import asyncio
import uuid
import subprocess
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
import uvicorn

# 1. Thiết lập os.nice(10) ngay tại đầu tiến trình để bảo vệ 1 vCPU
try:
    os.nice(10)
    print("[VieNeu] ✅ Đã thiết lập os.nice(10) thành công cho tiến trình Python.")
except Exception as e:
    print(f"[VieNeu Warning] Không thể set os.nice: {e}")

BASE_DIR = Path(__file__).resolve().parent.parent

# 2. Thư mục tuyệt đối lưu trữ artifact đặc trưng giọng (chỉ lưu {ref_id}.npz)
CLONED_VOICES_DIR = Path(
    os.environ.get("CLONED_VOICES_DIR", str(BASE_DIR / ".cache" / "cloned_voices"))
).resolve()
CLONED_VOICES_DIR.mkdir(parents=True, exist_ok=True)

# 3. Đọc bộ hằng số kiểm chuẩn mẫu thu âm từ file JSON dùng chung (Single Source of Truth)
THRESHOLDS_FILE = BASE_DIR / "src" / "data" / "audio_thresholds.json"
try:
    with open(THRESHOLDS_FILE, "r", encoding="utf-8") as f:
        thresholds_cfg = json.load(f)
        MIN_DURATION_SEC = float(thresholds_cfg.get("MIN_DURATION_SEC", 5.0))
        MAX_DURATION_SEC = float(thresholds_cfg.get("MAX_DURATION_SEC", 8.0))
        MIN_SPEECH_SEC = float(thresholds_cfg.get("MIN_SPEECH_SEC", 3.5))
        RMS_THRESHOLD = float(thresholds_cfg.get("RMS_THRESHOLD", 350.0))
        print(f"[VieNeu] Đã nạp ngưỡng từ audio_thresholds.json: {MIN_DURATION_SEC}s - {MAX_DURATION_SEC}s (Tiếng nói >= {MIN_SPEECH_SEC}s)")
except Exception as err:
    print(f"[VieNeu FATAL] Không thể đọc audio_thresholds.json ({err}). Thoát (sys.exit 1).", file=sys.stderr)
    sys.exit(1)

# Giới hạn kích thước đầu vào
MAX_AUDIO_BYTES = 2 * 1024 * 1024  # ~2MB sau khi decode base64
MAX_AUDIO_B64_CHARS = (MAX_AUDIO_BYTES * 4) // 3 + 16
MAX_TEXT_CHARS = 5000
EXPECTED_EMB_SHAPE = (192,)
EXPECTED_STYLE_SHAPE = (50, 256)

app = FastAPI(title="VieNeu v3 Nano Service", docs_url=None, redoc_url=None)

REF_ID_REGEX = re.compile(r"^[a-z0-9_-]{8,40}$")

def artifactPathFor(ref_id: str) -> Path:
    """
    Xác thực ref_id và trả về đường dẫn artifact .npz an toàn tuyệt đối.
    Ngăn chặn 100% tấn công Path Traversal bằng is_relative_to().
    """
    if not ref_id or not REF_ID_REGEX.match(ref_id):
        raise HTTPException(
            status_code=400,
            detail="ref_id không hợp lệ! Bắt buộc khớp định dạng ^[a-z0-9_-]{8,40}$"
        )
    target_path = (CLONED_VOICES_DIR / f"{ref_id}.npz").resolve()
    if not target_path.is_relative_to(CLONED_VOICES_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Phát hiện tấn công Path Traversal!")
    return target_path

# 4. Khóa hàng đợi xử lý tuần tự (Serial Queue) để bảo vệ 1 vCPU
vieneu_lock = asyncio.Lock()

# 5. Nạp model VieNeu v3 Nano (Fail-fast: Lỗi là thoát ngay)
vieneu_model = None

def init_model():
    global vieneu_model
    try:
        from vieneu import Vieneu
        print("[VieNeu] Đang nạp model Vieneu(mode='v3nano')...")
        vieneu_model = Vieneu(mode="v3nano")
        print("[VieNeu] ✅ Nạp thành công VieNeu v3 Nano vào RAM.")
    except Exception as err:
        print(f"[VieNeu FATAL] Lỗi nạp model v3nano: {err}", file=sys.stderr)
        print("[VieNeu FATAL] Thoát tiến trình ngay lập tức (sys.exit 1) để PM2 ghi nhận lỗi!", file=sys.stderr)
        sys.exit(1)

# Nạp model ngay khi khởi động
init_model()


def analyze_audio_duration_and_speech(wav_path: Path) -> Tuple[float, float]:
    """
    Phân tích file WAV (PCM 16-bit):
    - Tổng thời lượng (giây)
    - Thời lượng tiếng nói hoạt động (giây) bằng thuật toán Energy/RMS VAD
    """
    try:
        with wave.open(str(wav_path), 'rb') as wf:
            channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            framerate = wf.getframerate()
            total_frames = wf.getnframes()
            
            if total_frames == 0 or framerate == 0 or sample_width != 2:
                return 0.0, 0.0
            
            total_duration = total_frames / float(framerate)
            
            chunk_duration = 0.02
            chunk_frames = int(framerate * chunk_duration)
            active_speech_frames = 0
            
            while True:
                raw_chunk = wf.readframes(chunk_frames)
                if not raw_chunk:
                    break
                num_samples = len(raw_chunk) // (sample_width * channels)
                if num_samples == 0:
                    break
                
                fmt = f"<{num_samples * channels}h"
                samples = struct.unpack(fmt, raw_chunk)
                mono_samples = samples[::channels]
                sum_sq = sum(s * s for s in mono_samples)
                rms = math.sqrt(sum_sq / len(mono_samples))
                
                if rms >= RMS_THRESHOLD:
                    active_speech_frames += len(mono_samples)
            
            speech_duration = active_speech_frames / float(framerate)
            return round(total_duration, 2), round(speech_duration, 2)
    except Exception as e:
        # Không đoán thời lượng tiếng nói: WAV không đọc được -> 400
        raise HTTPException(status_code=400, detail=f"Không đọc được file WAV đã chuẩn hoá: {e}")


def normalize_audio_to_wav(input_bytes: bytes) -> Path:
    """
    Chuẩn hoá dữ liệu âm thanh về WAV 24000Hz mono 16-bit PCM bằng ffmpeg.
    Xóa file tạm gốc trong khối finally.
    """
    tmp_in_path = None
    tmp_out_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".raw") as tmp_in:
            tmp_in.write(input_bytes)
            tmp_in_path = tmp_in.name

        tmp_out_path = tmp_in_path + ".wav"
        cmd = [
            "ffmpeg", "-y", "-i", tmp_in_path,
            "-ar", "24000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            tmp_out_path
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return Path(tmp_out_path)
    finally:
        if tmp_in_path and os.path.exists(tmp_in_path):
            try:
                os.remove(tmp_in_path)
            except Exception:
                pass


def _pick(d: dict, *keys):
    for k in keys:
        v = d.get(k)
        if v is not None:
            return v
    return None


def extract_speaker_embedding_and_style(wav_path: Path) -> Tuple[np.ndarray, np.ndarray]:
    """
    Gọi encode_reference của VieNeu SDK (v3nano) để lấy embedding (192,) + style (50, 256).
    KHÔNG có fallback: SDK lỗi / thiếu hàm / sai shape -> HTTP 500, không lưu artifact.
    """
    global vieneu_model
    encode = getattr(vieneu_model, "encode_reference", None)
    if not callable(encode):
        print("[VieNeu SDK ERROR] Model không có encode_reference(); hãy chạy scripts/probe_vieneu_shapes.py để xác nhận API.", file=sys.stderr)
        raise HTTPException(status_code=500, detail="VieNeu SDK thiếu encode_reference() — không thể clone giọng")
    try:
        ref_output = encode(str(wav_path))
    except Exception as e:
        print(f"[VieNeu SDK ERROR] encode_reference thất bại: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail="VieNeu SDK encode_reference thất bại")

    if isinstance(ref_output, tuple) and len(ref_output) >= 2:
        emb, style = ref_output[0], ref_output[1]
    elif isinstance(ref_output, dict):
        emb = _pick(ref_output, "embedding", "speaker_embedding", "emb")
        style = _pick(ref_output, "style", "style_embedding")
    else:
        raise HTTPException(status_code=500, detail=f"encode_reference trả về kiểu không hỗ trợ: {type(ref_output).__name__}")

    if emb is None or style is None:
        raise HTTPException(status_code=500, detail="encode_reference thiếu embedding hoặc style")

    emb_arr = np.asarray(emb, dtype=np.float32)
    style_arr = np.asarray(style, dtype=np.float32)
    if emb_arr.shape != EXPECTED_EMB_SHAPE or style_arr.shape != EXPECTED_STYLE_SHAPE:
        raise HTTPException(
            status_code=500,
            detail=f"Shape không khớp v3nano: emb={emb_arr.shape} (cần {EXPECTED_EMB_SHAPE}), style={style_arr.shape} (cần {EXPECTED_STYLE_SHAPE})"
        )
    if not (np.all(np.isfinite(emb_arr)) and np.all(np.isfinite(style_arr))):
        raise HTTPException(status_code=500, detail="Embedding/style chứa NaN/Inf")
    return emb_arr, style_arr


def _sync_extract_worker(audio_bytes: bytes, target_npz: Path, ref_id: str, gender_hint: str) -> dict:
    """
    Worker đồng bộ chạy trong thread riêng (asyncio.to_thread) để không block event loop
    """
    clean_wav_path = None
    tmp_npz = target_npz.with_suffix(f".tmp_{os.getpid()}_{uuid.uuid4().hex}.npz")
    try:
        clean_wav_path = normalize_audio_to_wav(audio_bytes)
        total_dur, speech_dur = analyze_audio_duration_and_speech(clean_wav_path)
        
        if total_dur < MIN_DURATION_SEC or total_dur > MAX_DURATION_SEC:
            raise HTTPException(
                status_code=400,
                detail=f"Thời lượng mẫu âm thanh không hợp lệ: Cần từ {MIN_DURATION_SEC} đến {MAX_DURATION_SEC} giây (mẫu hiện tại: {total_dur}s)."
            )
        
        if speech_dur < MIN_SPEECH_SEC:
            raise HTTPException(
                status_code=400,
                detail=f"Mẫu âm thanh không đủ tiếng nói rõ ràng: Cần tối thiểu {MIN_SPEECH_SEC} giây tiếng nói (hiện tại: {speech_dur}s). Vui lòng đọc liền mạch và to rõ hơn."
            )

        emb, style = extract_speaker_embedding_and_style(clean_wav_path)

        # Ghi artifact nguyên tử (Atomic write via tmp file + os.replace)
        np.savez_compressed(
            str(tmp_npz),
            embedding=emb,
            style=style,
            engine=np.array("vieneu-v3-nano"),
            ref_id=np.array(ref_id),
            total_duration=np.array(total_dur),
            speech_duration=np.array(speech_dur),
            is_male=np.array(gender_hint == "male")
        )
        os.replace(str(tmp_npz), str(target_npz))

        return {
            "success": True,
            "ref_id": ref_id,
            "artifact_format": "npz",
            "engine": "vieneu-v3-nano",
            "embedding_shape": list(emb.shape),
            "style_shape": list(style.shape),
            "total_duration": total_dur,
            "speech_duration": speech_dur,
            "is_male": gender_hint == "male",
            "message": "Đã trích xuất và lưu artifact đặc trưng giọng VieNeu v3 Nano (.npz) thành công"
        }
    finally:
        # BẮT BUỘC (Nghị định 13): Xoá sạch toàn bộ file âm thanh gốc / tạm trong finally
        if clean_wav_path and clean_wav_path.exists():
            try:
                clean_wav_path.unlink()
            except Exception:
                pass
        if tmp_npz.exists():
            try:
                tmp_npz.unlink()
            except Exception:
                pass


def _sync_synthesize_worker(text: str, speaker_embedding: Optional[np.ndarray], speaker_style: Optional[np.ndarray]) -> bytes:
    """
    Worker đồng bộ chạy trong thread riêng (asyncio.to_thread) để không block event loop
    """
    global vieneu_model
    fd_wav, wav_name = tempfile.mkstemp(suffix=".wav")
    os.close(fd_wav)
    fd_mp3, mp3_name = tempfile.mkstemp(suffix=".mp3")
    os.close(fd_mp3)
    out_wav_path = Path(wav_name)
    out_mp3_path = Path(mp3_name)

    try:
        if speaker_embedding is not None:
            if hasattr(vieneu_model, "infer"):
                audio = vieneu_model.infer(text=text, prompt=speaker_embedding, style=speaker_style)
                vieneu_model.save(audio, str(out_wav_path))
            elif hasattr(vieneu_model, "tts"):
                vieneu_model.tts(
                    text=text,
                    prompt_embedding=speaker_embedding,
                    output_path=str(out_wav_path)
                )
            else:
                raise HTTPException(status_code=500, detail="VieNeu model thiếu phương thức suy luận")
        else:
            if hasattr(vieneu_model, "infer"):
                audio = vieneu_model.infer(text=text)
                vieneu_model.save(audio, str(out_wav_path))
            elif hasattr(vieneu_model, "tts"):
                vieneu_model.tts(text=text, output_path=str(out_wav_path))
            else:
                raise HTTPException(status_code=500, detail="VieNeu model thiếu phương thức suy luận")

        if not out_wav_path.exists() or out_wav_path.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="VieNeu không thể xuất file âm thanh")

        subprocess.run([
            "ffmpeg", "-y", "-i", str(out_wav_path),
            "-codec:a", "libmp3lame", "-b:a", "64k",
            str(out_mp3_path)
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        with open(out_mp3_path, "rb") as f:
            mp3_bytes = f.read()

        return mp3_bytes
    finally:
        if out_wav_path.exists():
            try:
                out_wav_path.unlink()
            except Exception:
                pass
        if out_mp3_path.exists():
            try:
                out_mp3_path.unlink()
            except Exception:
                pass


class ExtractEmbeddingRequest(BaseModel):
    ref_id: str = Field(..., description="Mã định danh giọng (chữ thường, số, _, -, độ dài 8-40)")
    audio_base64: str = Field(..., description="Dữ liệu âm thanh Base64")
    gender_hint: Optional[str] = "male"


class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Văn bản cần đọc")
    ref_id: Optional[str] = Field(None, description="Mã định danh giọng clone")
    refId: Optional[str] = Field(None, description="Mã định danh camelCase")


@app.get("/health")
def health(response: Response):
    """
    Chỉ báo healthy (200) khi model v3nano đã nạp vào RAM thật sự
    """
    if vieneu_model is None:
        response.status_code = 503
        return {
            "status": "unhealthy",
            "engine": "VieNeu v3 Nano",
            "model_loaded": False,
        }
    return {
        "status": "healthy",
        "engine": "VieNeu v3 Nano",
        "model_loaded": True,
        "is_busy": vieneu_lock.locked()
    }


@app.post("/extract_embedding")
async def extract_embedding(req: ExtractEmbeddingRequest):
    """
    POST /extract_embedding (Clone Enrollment):
    - Trả về 409 Conflict nếu ref_id đã tồn tại
    - Xử lý bất đồng bộ qua asyncio.to_thread để tránh nghẽn Event Loop
    - Khóa tuần tự qua vieneu_lock để bảo vệ 1 vCPU
    """
    target_npz = artifactPathFor(req.ref_id)
    if target_npz.exists():
        raise HTTPException(
            status_code=409,
            detail=f"ref_id '{req.ref_id}' đã tồn tại trong kho artifact!"
        )

    clean_b64 = req.audio_base64.split(",")[-1]
    if len(clean_b64) > MAX_AUDIO_B64_CHARS:
        raise HTTPException(status_code=413, detail=f"File âm thanh quá lớn (tối đa {MAX_AUDIO_BYTES // 1024}KB)")
    try:
        import base64
        audio_bytes = base64.b64decode(clean_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Dữ liệu audio_base64 không hợp lệ")

    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail=f"File âm thanh quá lớn (tối đa {MAX_AUDIO_BYTES // 1024}KB)")

    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="File âm thanh quá ngắn hoặc không có dữ liệu")

    async with vieneu_lock:
        res = await asyncio.to_thread(
            _sync_extract_worker,
            audio_bytes,
            target_npz,
            req.ref_id,
            req.gender_hint or "male"
        )
        return res


@app.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    """
    POST /synthesize:
    - Nạp {ref_id}.npz bằng np.load(..., allow_pickle=False)
    - Xác thực nghiêm ngặt engine: 'vieneu-v3-nano'
    - Xử lý qua asyncio.to_thread trong khóa tuần tự vieneu_lock
    """
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Thiếu văn bản cần đọc")
    if len(text) > MAX_TEXT_CHARS:
        raise HTTPException(status_code=400, detail=f"Văn bản quá dài (tối đa {MAX_TEXT_CHARS} ký tự)")

    target_ref_id = req.ref_id or req.refId
    speaker_embedding = None
    speaker_style = None

    if target_ref_id:
        target_npz = artifactPathFor(target_ref_id)
        if not target_npz.exists():
            raise HTTPException(status_code=404, detail=f"Không tìm thấy artifact giọng của ref_id: {target_ref_id}")

        try:
            with np.load(str(target_npz), allow_pickle=False) as artifact_data:
                artifact_engine = str(artifact_data["engine"])
                if artifact_engine != "vieneu-v3-nano":
                    raise HTTPException(
                        status_code=400,
                        detail=f"Artifact engine không khớp! Yêu cầu 'vieneu-v3-nano', nhận được '{artifact_engine}'"
                    )
                speaker_embedding = np.array(artifact_data["embedding"])
                if "style" not in artifact_data.files:
                    raise HTTPException(status_code=500, detail="Artifact thiếu style")
                speaker_style = np.array(artifact_data["style"])
                if speaker_embedding.shape != EXPECTED_EMB_SHAPE or speaker_style.shape != EXPECTED_STYLE_SHAPE:
                    raise HTTPException(status_code=500, detail="Artifact sai shape v3nano")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi nạp artifact giọng: {e}")

    async with vieneu_lock:
        mp3_bytes = await asyncio.to_thread(
            _sync_synthesize_worker,
            text,
            speaker_embedding,
            speaker_style
        )
        return Response(content=mp3_bytes, media_type="audio/mpeg")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8005))
    # BẢO MẬT: Chỉ lắng nghe trên 127.0.0.1 (Loopback only), KHÔNG mở ra Internet, KHÔNG CORS
    print(f"[VieNeu] Khởi chạy dịch vụ an toàn tại http://127.0.0.1:{port} (Loopback only, No CORS)")
    uvicorn.run(app, host="127.0.0.1", port=port)
