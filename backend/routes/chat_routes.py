import time
import logging
from flask import Blueprint, request, jsonify

try:
    from backend.services.gemini_service import GeminiService
except ImportError:
    from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)
chat_bp = Blueprint("chat", __name__)
gemini_service = GeminiService()

@chat_bp.route("/api/health", methods=["GET"])
def health_check():
    api_key_set = bool(gemini_service.api_key and gemini_service.api_key != "your_gemini_api_key_here")
    return jsonify({
        "status": "healthy",
        "gemini_configured": api_key_set
    }), 200

@chat_bp.route("/api/chat", methods=["POST"])
def chat():
    start_time = time.perf_counter()

    try:
        data = request.get_json(silent=True)
        if not data or not isinstance(data, dict):
            return jsonify({"error": "Invalid request body. JSON payload expected."}), 400

        message = data.get("message")
        if not message or not isinstance(message, str) or not message.strip():
            return jsonify({"error": "Message parameter is required and cannot be empty."}), 400

        history = data.get("history", [])
        if not isinstance(history, list):
            history = []

        # Generate response & sequential analysis via Gemini service
        result = gemini_service.generate_chat_and_analysis(message=message.strip(), history=history)

        elapsed_ms = round((time.perf_counter() - start_time) * 1000)

        response_data = {
            "reply": result["reply"],
            "analysis": result["analysis"],
            "latency_ms": elapsed_ms
        }

        return jsonify(response_data), 200

    except ValueError as ve:
        logger.warning(f"Validation error in /api/chat: {ve}")
        return jsonify({"error": str(ve)}), 400
    except RuntimeError as re:
        logger.error(f"Runtime error in /api/chat: {re}")
        return jsonify({"error": str(re)}), 500
    except Exception as e:
        logger.exception(f"Unexpected error in /api/chat: {e}")
        return jsonify({"error": "An unexpected error occurred while processing your request."}), 500
