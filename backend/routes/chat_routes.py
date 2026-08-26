import time
import logging
from flask import Blueprint, request, jsonify

try:
    from backend.services.gemini_service import GeminiService
except ImportError:
    from services.gemini_service import GeminiService

logger = logging.getLogger("lumnia_backend")
chat_bp = Blueprint("chat", __name__)
gemini_service = GeminiService()

@chat_bp.route("/api/health", methods=["GET"])
def health_check():
    api_key_set = bool(gemini_service.api_key and gemini_service.api_key != "your_gemini_api_key_here")
    logger.info(f"[HEALTH_CHECK] status=healthy, gemini_configured={api_key_set}")
    return jsonify({
        "status": "healthy",
        "gemini_configured": api_key_set
    }), 200

@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    start_time = time.perf_counter()
    logger.info("[CHAT_STEP_1] CHAT REQUEST RECEIVED")

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            logger.warning("[CHAT_ERROR] Invalid request body format (HTTP 400)")
            return jsonify({"error": "Invalid request body. JSON payload expected."}), 400

        message = data.get("message")
        if not message or not isinstance(message, str) or not message.strip():
            logger.warning("[CHAT_ERROR] Missing or empty message parameter (HTTP 400)")
            return jsonify({"error": "Message parameter is required and cannot be empty."}), 400

        history = data.get("history", [])
        if not isinstance(history, list):
            history = []

        logger.info(f"[CHAT_STEP_2] AUTH COMPLETE / DATA VALIDATED (message_len={len(message.strip())}, history_count={len(history)})")

        logger.info(f"[CHAT_STEP_3] GEMINI REQUEST START (model={gemini_service.model_name})")
        result = gemini_service.generate_chat_and_analysis(message=message.strip(), history=history)
        logger.info(f"[CHAT_STEP_4] GEMINI RESPONSE RECEIVED (reply_len={len(result.get('reply', ''))})")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000)

        response_data = {
            "reply": result["reply"],
            "analysis": result["analysis"],
            "latency_ms": elapsed_ms
        }

        logger.info(f"[CHAT_STEP_5] RESPONSE SERIALIZATION START (latency_ms={elapsed_ms})")
        resp = jsonify(response_data)
        logger.info("[CHAT_STEP_6] CHAT RESPONSE SENT (HTTP 200)")
        return resp, 200

    except ValueError as ve:
        logger.warning(f"[CHAT_ERROR] Validation error: {ve} (HTTP 400)")
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        logger.error(f"[CHAT_ERROR] Runtime error: {re} (HTTP 500)")
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        logger.exception(f"[CHAT_ERROR] Unexpected error: {e} (HTTP 500)")
        return jsonify({"error": "An unexpected error occurred while processing your request."}), 500
