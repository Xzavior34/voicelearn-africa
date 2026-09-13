import argparse
import json
import os
import sys
import time

# Force transformers/huggingface_hub to refuse any network access. If the
# local model folder is incomplete this makes loading fail loudly with a
# clear error instead of silently downloading files.
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

# Keep this list in sync with WHISPER_TINY_REQUIRED_FILES in
# lib/speech/model-requirements.ts (Python can't import that TS file).
REQUIRED_FILES = ["config.json", "generation_config.json", "preprocessor_config.json", "tokenizer_config.json", "vocab.json", "merges.txt"]
WEIGHT_FILE_CANDIDATES = ["model.safetensors", "pytorch_model.bin"]


def get_device():
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda", torch.cuda.get_device_name(0)
    except Exception:
        pass
    return "cpu", "CPU"


def check_local_model(model_path: str):
    """Returns (available: bool, missing_description: str | None)."""
    if not model_path or not os.path.isdir(model_path):
        return False, f"Local model directory not found: {model_path}"

    missing_required = [f for f in REQUIRED_FILES if not os.path.exists(os.path.join(model_path, f))]
    weight_found = next((f for f in WEIGHT_FILE_CANDIDATES if os.path.exists(os.path.join(model_path, f))), None)

    problems = []
    if missing_required:
        problems.append(f"missing required file(s): {', '.join(missing_required)}")
    if weight_found is None:
        problems.append(f"missing a weights file (expected one of: {', '.join(WEIGHT_FILE_CANDIDATES)})")

    if problems:
        return False, f"Local model directory {model_path} is incomplete — {'; '.join(problems)}."
    return True, None


def check_health(model_path: str, repo_id: str):
    device, device_name = get_device()
    available, problem = check_local_model(model_path)
    return {
        "status": "READY" if available else "MODEL_NOT_FOUND",
        "model": repo_id,
        "localPath": model_path,
        "device": device,
        "deviceName": device_name,
        "cudaAvailable": device == "cuda",
        "available": available,
        "problem": problem,
        "license": "Apache-2.0",
        "runtime": "local",
        "offline": True,
    }


def transcribe_audio(audio_path: str, model_path: str, repo_id: str, language: str = None):
    start_total = time.time()
    device, device_name = get_device()

    available, problem = check_local_model(model_path)
    if not available:
        return {
            "success": False,
            "errorCode": "MODEL_NOT_FOUND",
            "error": problem,
            "model": repo_id,
            "transcript": "",
            "latencyMs": 0,
            "device": device,
        }

    if not os.path.exists(audio_path):
        return {
            "success": False,
            "errorCode": "EMPTY_AUDIO",
            "error": f"Audio file not found: {audio_path}",
            "model": repo_id,
            "transcript": "",
            "latencyMs": 0,
            "device": device,
        }

    try:
        import torch
        import soundfile as sf
        from transformers import pipeline

        load_start = time.time()
        dtype = torch.float16 if device == "cuda" else torch.float32

        pipe = pipeline(
            "automatic-speech-recognition",
            model=model_path,
            torch_dtype=dtype,
            device=0 if device == "cuda" else -1,
        )
        cold_start_ms = round((time.time() - load_start) * 1000)

        # Read audio to verify it decodes before handing it to the pipeline
        sf.read(audio_path)

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
            "model": repo_id,
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
            "errorCode": "LOCAL_WORKER_ERROR",
            "error": str(e),
            "model": repo_id,
            "transcript": "",
            "latencyMs": round((time.time() - start_total) * 1000),
            "device": device,
            "runtime": "local"
        }


def main():
    parser = argparse.ArgumentParser(description="Local Whisper Tiny ASR Worker (filesystem-only)")
    parser.add_argument("--health", action="store_true", help="Perform health check")
    parser.add_argument("--audio", type=str, help="Path to audio file")
    parser.add_argument("--model", type=str, required=True, help="Local filesystem directory containing the model")
    parser.add_argument("--repo-id", type=str, default="openai/whisper-tiny", help="Repo id, used only as a label")
    parser.add_argument("--language", type=str, default=None, help="Language code")
    parser.add_argument("--stdin", action="store_true", help="Read input JSON from stdin")
    args = parser.parse_args()

    if args.health:
        res = check_health(args.model, args.repo_id)
        print(json.dumps(res))
        return

    if args.stdin or (not args.audio and not sys.stdin.isatty()):
        try:
            raw_input = sys.stdin.read()
            if raw_input.strip():
                payload = json.loads(raw_input)
                audio_path = payload.get("audioPath")
                language = payload.get("language", args.language)
                res = transcribe_audio(audio_path, args.model, args.repo_id, language)
                print(json.dumps(res))
                return
        except Exception as e:
            print(json.dumps({"success": False, "errorCode": "MALFORMED_STDIN", "error": f"Failed to parse stdin payload: {e}"}))
            return

    if args.audio:
        res = transcribe_audio(args.audio, args.model, args.repo_id, args.language)
        print(json.dumps(res))
        return

    print(json.dumps(check_health(args.model, args.repo_id)))


if __name__ == "__main__":
    main()
