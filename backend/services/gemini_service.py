import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self._client = None

    @property
    def api_key(self):
        return os.environ.get("GEMINI_API_KEY")

    @property
    def model_name(self):
        return os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

    def _get_client(self):
        current_key = self.api_key
        if not current_key or current_key == "your_gemini_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY environment variable is missing or unconfigured. "
                "Please configure your Gemini API key in the backend environment."
            )

        if self._client is None:
            try:
                from google import genai
                self._client = genai.Client(api_key=current_key)
            except Exception as e:
                logger.error(f"Failed to initialize google.genai Client: {e}")
                raise RuntimeError(f"Unable to initialize Gemini API client: {str(e)}")

        return self._client

    def generate_chat_and_analysis(self, message: str, history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates a chatbot response using Gemini AI and analyzes the response
        for sentiment, intent, tone, and confidence score. Uses combined single-call
        optimization for speed and reliability, with fallback to 2-stage execution.
        """
        if not message or not message.strip():
            raise ValueError("Message cannot be empty.")

        client = self._get_client()
        history = history or []

        # Map history for Gemini API
        formatted_contents = []
        for item in history:
            role = "user" if item.get("role") == "user" else "model"
            text = item.get("text", "")
            if text:
                formatted_contents.append({
                    "role": role,
                    "parts": [{"text": text}]
                })

        formatted_contents.append({
            "role": "user",
            "parts": [{"text": message}]
        })

        from google.genai import types

        # Try Single-Call Combined Generation & Analysis (Optimized Latency)
        try:
            system_instruction = (
                "You are Lumina, a helpful, engaging, intelligent AI assistant. "
                "Respond to the user's message and provide real-time analysis of your response. "
                "Return ONLY a valid JSON object matching this structure:\n"
                "{\n"
                '  "reply": "<your response text>",\n'
                '  "analysis": {\n'
                '    "sentiment": "positive" | "neutral" | "negative",\n'
                '    "intent": "informational" | "emotional" | "transactional",\n'
                '    "tone": "formal" | "casual" | "empathetic",\n'
                '    "confidence": 0.95\n'
                "  }\n"
                "}"
            )

            response = client.models.generate_content(
                model=self.model_name,
                contents=formatted_contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json"
                )
            )

            if response and response.text:
                raw_text = response.text.strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```")[1]
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:]
                    raw_text = raw_text.strip()

                parsed = json.loads(raw_text)
                reply_text = parsed.get("reply", "").strip()
                analysis_data = parsed.get("analysis", {})

                if reply_text and isinstance(analysis_data, dict):
                    validated_analysis = self._sanitize_analysis(analysis_data)
                    return {
                        "reply": reply_text,
                        "analysis": validated_analysis
                    }
        except Exception as e:
            logger.warning(f"Single-call combined generation failed or timed out: {e}. Falling back to standard generation.")

        # Fallback: Standard Chat Generation followed by Analysis
        try:
            response = client.models.generate_content(
                model=self.model_name,
                contents=formatted_contents,
                config=types.GenerateContentConfig(
                    system_instruction="You are Lumina, a helpful, engaging, intelligent AI assistant. Provide concise, well-structured, and helpful answers."
                )
            )
            reply_text = response.text if response and response.text else "I'm sorry, I could not generate a reply at this time."
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Gemini response generation error: {err_msg}")
            if "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                raise RuntimeError("Gemini API rate limit or quota exceeded. Please try again in a few moments.")
            elif "INVALID_ARGUMENT" in err_msg or "API_KEY" in err_msg:
                raise RuntimeError("Invalid Gemini API key or request parameters.")
            else:
                raise RuntimeError(f"Unable to connect to the AI service: {err_msg}")

        analysis = self._analyze_reply(reply_text)

        return {
            "reply": reply_text,
            "analysis": analysis
        }

    def _sanitize_analysis(self, raw_analysis: Dict[str, Any]) -> Dict[str, Any]:
        sentiment = str(raw_analysis.get("sentiment", "neutral")).lower()
        if sentiment not in ["positive", "neutral", "negative"]:
            sentiment = "neutral"

        intent = str(raw_analysis.get("intent", "informational")).lower()
        if intent not in ["informational", "emotional", "transactional"]:
            intent = "informational"

        tone = str(raw_analysis.get("tone", "casual")).lower()
        if tone not in ["formal", "casual", "empathetic"]:
            tone = "casual"

        try:
            confidence = float(raw_analysis.get("confidence", 0.85))
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 0.85

        return {
            "sentiment": sentiment,
            "intent": intent,
            "tone": tone,
            "confidence": round(confidence, 2)
        }

    def _analyze_reply(self, reply_text: str) -> Dict[str, Any]:
        default_analysis = {
            "sentiment": "neutral",
            "intent": "informational",
            "tone": "casual",
            "confidence": 0.85
        }

        try:
            client = self._get_client()
            from google.genai import types

            prompt = f"""Analyze the following chatbot response and extract sentiment, intent, tone, and confidence score.
Return ONLY a valid JSON object strictly matching this format without markdown wrappers or code blocks:
{{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "informational" | "emotional" | "transactional",
  "tone": "formal" | "casual" | "empathetic",
  "confidence": number between 0.0 and 1.0
}}

Chatbot Response:
"{reply_text}"
"""

            analysis_response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )

            raw_text = analysis_response.text.strip() if analysis_response and analysis_response.text else "{}"
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
                raw_text = raw_text.strip()

            parsed = json.loads(raw_text)
            return self._sanitize_analysis(parsed)
        except Exception as e:
            logger.warning(f"Analysis parsing warning, utilizing default fallback: {e}")
            return default_analysis
