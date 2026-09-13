import argparse
import json
import os
import sys
import time

def get_device():
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda", torch.cuda.get_device_name(0)
    except Exception:
        pass
    return "cpu", "CPU"

def is_model_cached(model_id: str) -> bool:
    try:
        from huggingface_hub import try_to_load_from_cache
        # Check config or weights in HF cache
        cached = try_to_load_from_cache(model_id, "config.json")
        return cached is not None and isinstance(cached, str)
    except Exception:
        return False

def check_health(model_id: str):
    device, device_name = get_device()
    cached = is_model_cached(model_id)
    status = "READY" if cached else "DOWNLOAD_REQUIRED"
    return {
        "status": status,
        "model": model_id,
        "device": device,
        "deviceName": device_name,
        "cudaAvailable": device == "cuda",
        "cached": cached,
        "license": "Apache-2.0",
        "runtime": "local"
    }

def transcribe_audio(audio_path: str, model_id: str, language: str = None):
    start_total = time.time()
    device, device_name = get_device()
    
    if not os.path.exists(audio_path):
        return {
            "success": False,
            "error": f"Audio file not found: {audio_path}",
            "model": model_id,
            "transcript": "",
            "latencyMs": 0,
            "device": device
        }

    try:
        import torch
        import soundfile as sf
        from transformers import pipeline

        load_start = time.time()
        dtype = torch.float16 if device == "cuda" else torch.float32
        
        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_id,
            torch_dtype=dtype,
            device=0 if device == "cuda" else -1
        )
        cold_start_ms = round((time.time() - load_start) * 1000)

        # Read audio to verify
        audio_data, sr = sf.read(audio_path)
        
        infer_start = time.time()
        generate_kwargs = {}
        if language:
            generate_kwargs["language"] = language

        result = pipe(audio_path, generate_kwargs=generate_kwargs if generate_kwargs else None)
        infer_latency_ms = round((time.time() - infer_start) * 1000)
        total_latency_ms = round((time.time() - start_total) * 1000)

        transcript = result.get("text", "").strip() if isinstance(result, dict) else str(result).strip()

        return {
            "success": True,
            "transcript": transcript,
            "model": model_id,
            "latencyMs": infer_latency_ms,
            "warmInferenceLatencyMs": infer_latency_ms,
            "coldStartMs": cold_start_ms,
            "totalLatencyMs": total_latency_ms,
            "device": device,
            "deviceName": device_name,
            "runtime": "local"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "model": model_id,
            "transcript": "",
            "latencyMs": round((time.time() - start_total) * 1000),
            "device": device,
            "runtime": "local"
        }

def main():
    parser = argparse.ArgumentParser(description="Local Whisper ASR Worker")
    parser.add_argument("--health", action="store_true", help="Perform health check")
    parser.add_argument("--audio", type=str, help="Path to audio file")
    parser.add_argument("--model", type=str, default=os.getenv("WHISPER_MODEL_ID", "openai/whisper-large-v3"), help="Model identifier")
    parser.add_argument("--language", type=str, default=None, help="Language code")
    parser.add_argument("--stdin", action="store_true", help="Read input JSON from stdin")
    args = parser.parse_args()

    if args.health:
        res = check_health(args.model)
        print(json.dumps(res))
        return

    if args.stdin or (not args.audio and not sys.stdin.isatty()):
        try:
            raw_input = sys.stdin.read()
            if raw_input.strip():
                payload = json.loads(raw_input)
                audio_path = payload.get("audioPath")
                model_id = payload.get("model", args.model)
                language = payload.get("language", args.language)
                res = transcribe_audio(audio_path, model_id, language)
                print(json.dumps(res))
                return
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Failed to parse stdin payload: {e}"}))
            return

    if args.audio:
        res = transcribe_audio(args.audio, args.model, args.language)
        print(json.dumps(res))
        return

    # Fallback to health
    print(json.dumps(check_health(args.model)))

if __name__ == "__main__":
    main()
