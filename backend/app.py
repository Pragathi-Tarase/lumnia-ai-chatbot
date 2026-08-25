import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)

backend_env = os.path.join(backend_dir, ".env")
root_env = os.path.join(project_root, ".env")

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
    dist_folder = os.path.join(project_root, "dist")
    has_dist = os.path.exists(dist_folder)

    if has_dist:
        app = Flask(__name__, static_folder=dist_folder, static_url_path="")
        logger.info(f"Serving built React SPA assets from: {dist_folder}")
    else:
        app = Flask(__name__)
        logger.info("Dist directory not found. Flask running in API-only mode.")

    # CORS configuration
    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,*"
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

    # Register API blueprints first
    from routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp)

    # Serve built React SPA for all non-API client routes if dist folder exists
    if has_dist:
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path and not path.startswith("api/") and os.path.exists(os.path.join(dist_folder, path)):
                return send_from_directory(dist_folder, path)
            elif not path.startswith("api/"):
                return send_from_directory(dist_folder, "index.html")
            return jsonify({"error": "API route not found."}), 404

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
    logger.info(f"Starting Lumnia Single Web Service on port {port} (debug={debug_mode})...")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
