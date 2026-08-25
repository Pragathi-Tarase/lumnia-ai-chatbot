import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
backend_env = os.path.join(os.path.dirname(__file__), ".env")
root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
if os.path.exists(root_env):
    load_dotenv(root_env)
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("lumnia_backend")

def create_app():
    app = Flask(__name__)

    # CORS configuration
    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    ).split(",")
    
    CORS(
        app,
        resources={r"/api/*": {"origins": [origin.strip() for origin in allowed_origins if origin.strip()]}},
        supports_credentials=True
    )

    # Rate Limiting setup to protect endpoints against abuse
    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["100 per minute", "20 per second"],
        storage_uri="memory://"
    )

    # Register blueprints
    from routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp)

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded. Please wait before sending more messages."}), 429

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error."}), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    logger.info(f"Starting Lumnia Python Flask Backend on port {port} (debug={debug_mode})...")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
