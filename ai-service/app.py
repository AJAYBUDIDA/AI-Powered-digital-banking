import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
from fraud_model import predict_fraud_risk

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for frontend or backend requests

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
use_gemini = False

if GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        use_gemini = True
        print("Gemini API configured successfully.")
    except Exception as e:
        print(f"Failed to configure Gemini API: {e}. Falling back to Rule-Based Chatbot.")
else:
    print("No valid GEMINI_API_KEY found. Falling back to Rule-Based Chatbot.")

SYSTEM_INSTRUCTION = """
You are Antigravity Bank's AI Financial Assistant. You are professional, friendly, and helpful. 
You provide financial guidance, spending insights, savings suggestions, answers to banking FAQs, and personalized recommendations. 
Make sure you only answer questions related to banking, finance, personal budgeting, or Antigravity Bank. 
If the user asks about unrelated topics, politely redirect them to banking and finance. Keep answers clear and relatively concise.
"""

def rule_based_chat_fallback(message):
    """
    Intelligent fallback response generator for banking & finance queries when LLM is unavailable.
    """
    msg = message.lower()
    
    # FAQs & Keyword Matches
    if re.search(r'\b(hello|hi|hey|greetings)\b', msg):
        return "Hello! I am your Antigravity Bank AI Assistant. How can I help you with your banking, budgeting, or savings today?"
    
    elif re.search(r'\b(save|saving|savings|budget|budgeting)\b', msg):
        return ("To boost your savings, we recommend following the 50/30/20 rule: allocate 50% of your income "
                "to Needs, 30% to Wants, and 20% directly to Savings. You can also open a High-Yield Savings Account "
                "with us, currently offering a competitive 4.5% APY! Let me know if you would like tips on setting up automated transfers.")
        
    elif re.search(r'\b(interest|rate|rates|apy)\b', msg):
        return ("Antigravity Bank offers standard checking accounts at 0.05% APY, High-Yield Savings Accounts "
                "at 4.50% APY, and 12-month Certificates of Deposit (CDs) at 5.10% APY. Rates are subject to market conditions.")
        
    elif re.search(r'\b(fraud|scam|security|suspicious|alert|freeze)\b', msg):
        return ("Security is our top priority. If you notice suspicious transactions, you can freeze your account "
                "instantly from the Admin Dashboard or contact our Fraud Operations unit at 1-800-BANK-SAFE immediately. "
                "Our automated AI systems continuously screen transactions for abnormal patterns.")
        
    elif re.search(r'\b(loan|mortgage|borrow|rate)\b', msg):
        return ("We offer personal loans starting at 6.99% APR, auto loans starting at 4.49% APR, and fixed 30-year home mortgages. "
                "Interest rates depend on your credit score. You can contact an agent in our Loans Department to apply.")
        
    elif re.search(r'\b(fee|fees|charge|cost)\b', msg):
        return ("Antigravity Bank believes in transparent banking. There are zero maintenance fees for accounts maintaining "
                "a minimum daily balance of $100. ATM withdrawals inside our network are completely free. Out-of-network ATMs carry a $2.50 fee.")
        
    elif re.search(r'\b(contact|support|phone|number|email|help)\b', msg):
        return ("You can reach Customer Support 24/7 at support@antigravitybank.com or call us at 1-800-123-4567. "
                "For fraud-related emergency calls, dial 1-800-999-0000.")
        
    else:
        return ("I appreciate your question. As your financial assistant, I can help you set up budget goals, "
                "analyze your transaction history, check on account interest rates, or guide you through setting up savings accounts. "
                "Could you please elaborate or ask about our financial services?")

@app.route("/detect-fraud", methods=["POST"])
def detect_fraud():
    """
    API endpoint to detect fraud.
    Expected Payload:
    {
        "amount": float,
        "distance": float,
        "hour": int,
        "frequency": int
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing payload"}), 400
            
        amount = float(data.get("amount", 0.0))
        distance = float(data.get("distance", 0.0))
        hour = int(data.get("hour", 12))
        frequency = int(data.get("frequency", 1))
        
        # Calculate risk score
        risk_score = predict_fraud_risk(amount, distance, hour, frequency)
        
        # Flag suspicious if risk score is high
        # We classify as suspicious if risk score exceeds 0.70
        is_suspicious = risk_score >= 0.70
        
        return jsonify({
            "risk_score": risk_score,
            "is_suspicious": is_suspicious
        })
        
    except ValueError as ve:
        return jsonify({"error": f"Invalid numerical value: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route("/chat", methods=["POST"])
def chat():
    """
    API endpoint for AI Chatbot.
    Expected Payload:
    {
        "message": str,
        "history": list (optional)
    }
    """
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "Missing 'message' field"}), 400
            
        message = data.get("message")
        history = data.get("history", []) # For future multi-turn support
        
        if use_gemini:
            try:
                # Format chat history if any
                formatted_contents = []
                for turn in history:
                    role = "user" if turn.get("role") == "user" else "model"
                    formatted_contents.append({"role": role, "parts": turn.get("parts", [])})
                
                # Setup model
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=SYSTEM_INSTRUCTION
                )
                
                # Start chat session or generate content
                # For simplicity, generate text considering context
                prompt = message
                if formatted_contents:
                    # Append history to prompt or use chat API
                    chat_session = model.start_chat(history=formatted_contents)
                    response = chat_session.send_message(prompt)
                else:
                    response = model.generate_content(prompt)
                    
                return jsonify({
                    "response": response.text,
                    "model": "gemini-1.5-flash"
                })
            except Exception as e:
                print(f"Gemini API execution error: {e}. Reverting to rule-based fallback.")
                # Fallback to rule-based inside except
                reply = rule_based_chat_fallback(message)
                return jsonify({
                    "response": reply,
                    "model": "rule-based-fallback"
                })
        else:
            # Direct fallback
            reply = rule_based_chat_fallback(message)
            return jsonify({
                "response": reply,
                "model": "rule-based-fallback"
            })
            
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
