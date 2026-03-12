from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import json
import os

# ─── CONFIG ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyA7jTc7nKmG0vralQRARwHQp9pe3SREmUw").strip()
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
GEMINI_URL     = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are FinSmart AI, a world-class AI financial advisor and fintech expert.

YOUR CORE EXPERTISE:
• Stock Markets (NSE, BSE, NYSE, NASDAQ) — fundamentals, technicals, valuations
• Mutual Funds — equity, debt, hybrid, index, ELSS, NFOs
• SIP & Goal-based Investing — SIP calculations, SWP, step-up SIPs
• Cryptocurrency & Blockchain — Bitcoin, Ethereum, altcoins, DeFi, Web3
• Portfolio Management — asset allocation, rebalancing, diversification
• Personal Finance — budgeting, emergency funds, debt management
• Tax Planning — 80C, 80D, LTCG, STCG, new vs old tax regime (India)
• Fixed Income — FDs, bonds, PPF, NPS, SGBs, RBI bonds
• Insurance — term, health, ULIP comparisons
• IPOs & New Issues — GMP, subscription analysis, allotment
• Derivatives — Futures & Options (educational explanations)
• Macroeconomics — RBI policy, inflation, GDP, FII/DII flows
• Real Estate — REITs, rental yield, EMI calculations
• Retirement Planning — FIRE, NPS, EPF, annuity
• Global Markets — Fed policy, DXY impact, global ETFs
• Financial Ratios — P/E, P/B, ROCE, ROE, EV/EBITDA

RESPONSE RULES:
1. Be DIRECT and CONCISE — give the answer first, details after
2. Use bullet points for lists, numbered steps for processes
3. Include actual numbers/formulas where useful (e.g., SIP returns, EMI calc)
4. For market queries: mention key factors affecting the instrument
5. Always include a short risk note at the end for investment advice
6. Answer general/non-finance questions too — just keep them brief
7. Never hallucinate stock prices or specific returns — say "as of my training data" if needed
8. Format: use **bold** for key terms, emoji sparingly for headers only

DISCLAIMER (add only for investment recommendations):
*⚠️ Not SEBI-registered advice. Consult a certified advisor before investing.*"""

# ─── APP ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="FinSmart AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []


class ChatResponse(BaseModel):
    response: str
    status: str


def build_gemini_payload(message: str, history: List[Message]) -> dict:
    """Build Gemini API request payload with full conversation history."""
    contents = []

    # Convert history to Gemini format
    for msg in history:
        role = "user" if msg.role == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    # Add current user message
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    return {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
            "stopSequences": []
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]
    }


@app.get("/")
def root():
    return {"message": "API is running", "model": GEMINI_MODEL}


@app.get("/health")
def health():
    return {"status": "ok", "model": GEMINI_MODEL, "version": "2.0.0"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    payload = build_gemini_payload(req.message, req.history or [])

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(GEMINI_URL, json=payload)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Gemini API timed out. Try again.")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Network error: {str(e)}")

    if resp.status_code != 200:
        try:
            err = resp.json()
            detail = err.get("error", {}).get("message", resp.text)
        except Exception:
            detail = resp.text
        raise HTTPException(status_code=resp.status_code, detail=f"Gemini error: {detail}")

    data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        # Handle blocked / empty responses
        finish = data.get("candidates", [{}])[0].get("finishReason", "UNKNOWN")
        if finish == "SAFETY":
            text = "⚠️ I couldn't answer that due to safety filters. Please rephrase your question."
        else:
            text = f"⚠️ Unexpected response from Gemini (finishReason: {finish}). Please try again."

    return ChatResponse(response=text, status="success")


@app.get("/quick-topics")
def quick_topics():
    return {
        "topics": [
            {"icon": "📈", "label": "Stock Market Basics",    "query": "Explain stock market basics for a complete beginner"},
            {"icon": "💰", "label": "SIP vs Lump Sum",        "query": "SIP vs lump sum investment — which is better and when?"},
            {"icon": "🏦", "label": "Best Mutual Funds",      "query": "What are the top-performing mutual fund categories in India right now?"},
            {"icon": "₿",  "label": "Crypto for Beginners",   "query": "How should a beginner start investing in cryptocurrency safely?"},
            {"icon": "📊", "label": "Build a Portfolio",      "query": "How do I build a diversified investment portfolio on ₹10,000/month?"},
            {"icon": "💡", "label": "Tax Saving Investments", "query": "Best tax saving options under Section 80C in India with pros and cons"},
            {"icon": "🏠", "label": "Real Estate vs Stocks",  "query": "Is real estate or stock market a better investment in India?"},
            {"icon": "📉", "label": "Bear Market Strategy",   "query": "How should I manage my portfolio during a bear market or market crash?"},
        ]
    }