from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import re
import json
import httpx
import asyncio
import time
import google.generativeai as genai
import yfinance as yf
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from simulator_router import router as sim_router
from sqlalchemy.exc import SQLAlchemyError

load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sim_router)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request, exc):
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database is temporarily unavailable. Please try again shortly."
        },
    )

class QueryRequest(BaseModel):
    query: str

class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Message]] = []

class ChatResponse(BaseModel):
    response: str
    status: str

class AffordabilityRequest(BaseModel):
    salary: float
    emi: float
    savings: float
    expenses: float

# ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are FinSmart AI, a elite financial advisor. 
Your goal is to provide **premium, structured, and highly readable** advice.

STRICT FORMATTING RULES:
1. **Always** use standard Markdown.
2. **Headers**: Use `###` for main headers. Do not use `#` or `##`.
3. **Typography**: Use `**bold**` for key terms, numbers, or specific actions.
4. **Lists**: Use `•` or `-` for bullet points. Use `1.` for steps.
5. **Cleanliness**: Do not include raw symbols like `*` (unless as a bullet) or `_` if they aren't part of standard markdown formatting.
6. **Structure**: Start with a summary, use sections, and end with a "Next Step".

DISCLAIMER: Always include this at the very end:
*⚠️ Not SEBI-registered advice. Consult a certified advisor before investing.*"""

@app.post("/api/ask-ai")
async def ask_ai(req: QueryRequest):
    if not req.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    prompt = f"""
    You are a financial expert explaining concepts simply.
    Explain the financial term/concept: "{req.query}".
    Provide your answer strictly as a JSON object with the following keys:
    "definition": A clear, simple definition of the term in 1-2 sentences.
    "analogy": A relatable real-world analogy to explain the concept.
    "example": A practical numerical or scenario-based example.
    
    Do not use markdown blocks or any text outside the JSON. Return ONLY the raw valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            data = {}
        
        return {
            "type": "single",
            "term": req.query,
            "definition": data.get("definition", "Definition unavailable."),
            "analogy": data.get("analogy", "Analogy unavailable."),
            "example": data.get("example", "Example unavailable.")
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Gemini API Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate AI response. Error: {str(e)}")

@app.post("/api/affordability")
async def check_affordability(req: AffordabilityRequest):
    try:
        disposable = req.salary - (req.emi + req.expenses)
        
        prompt = f"""
        You are an elite financial advisor named FinSmart AI. A user has requested an 'Affordability DNA' check.
        Their profile:
        - Monthly Salary: ₹{req.salary}
        - Existing EMI: ₹{req.emi}
        - Total Savings: ₹{req.savings}
        - Monthly Expenses: ₹{req.expenses}
        - Disposable Income: ₹{disposable}

        Evaluate their profile and tell them:
        1. If they are in a good position to invest or should focus on debt/saving.
        2. Specifically how much of their disposable income they should invest per month.
        3. Specifically what *type* of investments align with their risk capacity based on this profile (e.g., SIPs, high-growth, debt funds).

        Keep your answer VERY concise (3 to 4 sentences maximum). Be direct, professional, and encouraging. Use elegant Markdown for formatting. Do NOT include boilerplate legal disclaimers.
        """
        response = model.generate_content(prompt)
        return {"response": response.text.strip()}
    except Exception as e:
         print(f"Affordability Error: {str(e)}")
         raise HTTPException(status_code=500, detail="Failed to analyze affordability.")

class CompareRequest(BaseModel):
    amount: float
    period: int
    periodType: str

@app.post("/api/compare-strategy")
async def compare_strategy(req: CompareRequest):
    try:
        amount = req.amount
        period = req.period
        
        # Standard Indian Market Rates
        SIP_RATE = 12.0
        LUMPSUM_RATE = 12.0
        FD_RATE = 7.0
        RD_RATE = 6.5
        PPF_RATE = 7.1
        
        months = period * 12 if req.periodType == 'years' else period
        years = months / 12
        
        monthly_rate_sip = SIP_RATE / 100 / 12
        
        # 1. SIP (Monthly contributions totaling 'amount')
        monthly_sip = amount / months if months > 0 else 0
        
        sip_total_invested = amount
        sip_value = 0
        if months > 0:
            sip_value = monthly_sip * (((1 + monthly_rate_sip) ** months - 1) / monthly_rate_sip) * (1 + monthly_rate_sip)
            
        # 2. Lumpsum 
        lumpsum_value = amount * ((1 + LUMPSUM_RATE / 100) ** years)
        
        # 3. Fixed Deposit (Quarterly compounding)
        quarters = months / 3
        fd_value = amount * ((1 + (FD_RATE / 100) / 4) ** quarters)
        
        # 4. Recurring Deposit 
        r_rd = RD_RATE / 400
        rd_value = amount # fallback
        if r_rd > 0 and months > 0:
             monthly_rd = amount / months
             fv = monthly_rd * ((pow(1 + r_rd, 4 * years) - 1) / (1 - pow(1 + r_rd, -1/3)))
             rd_value = fv
             
        # 5. PPF (Yearly deposits)
        ppf_value = amount
        if years >= 1:
             yearly_ppf = amount / years
             val = 0
             for _ in range(int(years)):
                 val = (val + yearly_ppf) * (1 + PPF_RATE / 100)
             ppf_value = val
        
        comparison_data = {
            "amountInvested": round(amount),
            "sipValue": round(sip_value),
            "lumpsumValue": round(lumpsum_value),
            "fdValue": round(fd_value),
            "rdValue": round(rd_value),
            "ppfValue": round(ppf_value),
            "rates": {
                "sip": SIP_RATE,
                "lumpsum": LUMPSUM_RATE,
                "fd": FD_RATE,
                "rd": RD_RATE,
                "ppf": PPF_RATE
            }
        }
        
        # Get AI Strategy Recommendation
        prompt = f"""
        You are FinSmart AI, an elite and highly articulate financial advisor algorithm specializing in the Indian market context.
        A user wants to invest a TOTAL capital of ₹{amount} over a timeframe of {period} {req.periodType}.
        
        Using realistic, standardized Indian market assumptions, here are the projected returns for various standardized strategies over the given timeframe:
        - Monthly SIP (Mutual Funds @ {SIP_RATE}%): ₹{round(sip_value)}
        - Lumpsum Investment (Upfront @ {LUMPSUM_RATE}%): ₹{round(lumpsum_value)}
        - Fixed Deposit (FD Safe @ {FD_RATE}%): ₹{round(fd_value)}
        - Recurring Deposit (RD Safe @ {RD_RATE}%): ₹{round(rd_value)}
        - Public Provident Fund (PPF @ {PPF_RATE}%): ₹{round(ppf_value)}
        
        INSTRUCTIONS:
        1. Compare these specific strategies and outcome values.
        2. Give a deep but accessible analytical recommendation on WHICH strategy or blend is the absolute best for their capital and timeframe.
        3. Explain WHY, taking into account the magic of compounding, the time value of money, and the impact of the investment timeframe on equities vs fixed income risk profiles.
        4. Briefly contrast the risk of Equities vs the safety of FD/PPFs.
        5. DO NOT provide generic advice. Be decisive. Provide a rich, insightful response that feels premium.
        6. Format strictly in Markdown. Use well-structured headings, bolding, and bullet points to make it highly scannable and visually appealing. No standard boilerplate disclaimers. Give a sophisticated financial verdict.
        """
        response = model.generate_content(prompt)
        ai_recommendation = response.text.strip()
        
        return {
            "comparisons": comparison_data,
            "aiRecommendation": ai_recommendation
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Compare Strategy Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate strategy comparison.")

class CalcRequest(BaseModel):
    type: str
    amount: float
    rate: float
    period: int
    periodType: str
    stepUpRate: float = 10.0

@app.post("/api/calculate")
async def calculate(req: CalcRequest):
    amount = req.amount
    rate = req.rate
    period = req.period
    
    total_invested = 0
    estimated_value = 0
    
    months = period * 12 if req.periodType == 'years' else period
    monthly_rate = rate / 100 / 12
    
    if req.type == 'sip':
        total_invested = amount * months
        # SIP Formula: M = P × ({[1 + i]^n – 1} / i) × (1 + i)
        estimated_value = amount * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
        
    elif req.type == 'lumpsum':
        total_invested = amount
        # Lumpsum Formula: A = P(1 + r/n)^(nt)
        estimated_value = amount * ((1 + rate / 100) ** (months / 12))
        
    elif req.type == 'fd':
        # Fixed Deposit (Quarterly Compounding is standard in India)
        total_invested = amount
        quarters = months / 3
        estimated_value = amount * ((1 + (rate / 100) / 4) ** quarters)
        
    elif req.type == 'rd':
        # Recurring Deposit
        total_invested = amount * months
        # RD Formula: A = P * n + P * (n * (n + 1) / 2) * (r / 100) * (1 / 12)
        # Simplified standard RD maturity assuming simple interest on each installment
        r = rate / 400  # quarterly rate (annual rate / 4 / 100)
        years = months / 12
        fv = amount * ((pow(1 + r, 4 * years) - 1) / (1 - pow(1 + r, -1/3)))
        interest = fv - (amount * months)
        estimated_value = total_invested + interest
        
    elif req.type == 'ppf':
        # PPF (Public Provident Fund)
        # Compounded annually, amount is treated as yearly investment
        years = int(months / 12)
        total_invested = amount * years
        for _ in range(years):
            estimated_value = (estimated_value + amount) * (1 + rate / 100)
            
    elif req.type == 'step_up_sip':
        # Step-Up SIP (annual increase in investment)
        step_up_rate = req.stepUpRate / 100.0
        current_amount = amount
        for m in range(1, int(months) + 1):
            total_invested += current_amount
            estimated_value = (estimated_value + current_amount) * (1 + monthly_rate)
            if m % 12 == 0:
                current_amount *= (1 + step_up_rate)
                
    else:
        raise HTTPException(status_code=400, detail="Invalid investment type.")

    estimated_gain = estimated_value - total_invested

    return {
        "totalInvested": round(total_invested),
        "estimatedValue": round(estimated_value),
        "estimatedGain": round(estimated_gain)
    }

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        chat_session = model.start_chat(
            history=[
                {"role": "user" if m.role == "user" else "model", "parts": [m.content]}
                for m in req.history
            ]
        )
        
        prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {req.message}"
        response = chat_session.send_message(prompt)
        
        return ChatResponse(response=response.text, status="success")
    except Exception as e:
        print(f"Chat Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/quick-topics")
async def quick_topics():
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

# ─── Market Data Logic ────────────────────────────────────────────────────────
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "").strip('"').strip("'")
FINNHUB_BASE = "https://finnhub.io/api/v1"

# ─── Cache ────────────────────────────────────────────────────────────────────
_market_cache: dict = {}
_cache_ts: dict = {}
CACHE_TTL = 120  # 2 minutes refresh

def cache_get(key: str):
    if key in _market_cache and (time.time() - _cache_ts.get(key, 0)) < CACHE_TTL:
        return _market_cache[key]
    return None

def cache_set(key: str, value):
    _market_cache[key] = value
    _cache_ts[key] = time.time()

# ─── Dual Sources: Finnhub + Yahoo Finance (India only) ───────────────────────

TOP_INDICES = [
    # US / Global (Finnhub)
    {"symbol": "SPY",  "label": "S&P 500 ETF",    "region": "US", "source": "finnhub"},
    {"symbol": "DIA",  "label": "Dow Jones ETF",  "region": "US", "source": "finnhub"},
    {"symbol": "QQQ",  "label": "NASDAQ ETF",     "region": "US", "source": "finnhub"},
    {"symbol": "IWM",  "label": "Russell 2000",   "region": "US", "source": "finnhub"},
    {"symbol": "VGK",  "label": "FTSE Europe",    "region": "EU", "source": "finnhub"},
    {"symbol": "EWJ",  "label": "MSCI Japan",     "region": "JP", "source": "finnhub"},
    
    # India (Yahoo Finance)
    {"symbol": "^NSEI",   "label": "NIFTY 50",        "region": "IN", "source": "yf"},
    {"symbol": "^BSESN",  "label": "SENSEX",          "region": "IN", "source": "yf"},
    {"symbol": "^NSMIDCP","label": "NIFTY Midcap 50", "region": "IN", "source": "yf"},
    {"symbol": "^CNXIT",  "label": "NIFTY IT",        "region": "IN", "source": "yf"},
]

TOP_STOCKS = [
    # US Mega Cap (Finnhub)
    {"symbol": "AAPL",  "label": "Apple",          "region": "US", "source": "finnhub"},
    {"symbol": "MSFT",  "label": "Microsoft",      "region": "US", "source": "finnhub"},
    {"symbol": "NVDA",  "label": "NVIDIA",         "region": "US", "source": "finnhub"},
    {"symbol": "GOOGL", "label": "Alphabet",       "region": "US", "source": "finnhub"},
    {"symbol": "AMZN",  "label": "Amazon",         "region": "US", "source": "finnhub"},
    {"symbol": "META",  "label": "Meta",           "region": "US", "source": "finnhub"},
    {"symbol": "TSLA",  "label": "Tesla",          "region": "US", "source": "finnhub"},
    {"symbol": "BRK.B", "label": "Berkshire B",    "region": "US", "source": "finnhub"},
    {"symbol": "JPM",   "label": "JPMorgan",       "region": "US", "source": "finnhub"},
    {"symbol": "V",     "label": "Visa",           "region": "US", "source": "finnhub"},
    
    # India (Yahoo Finance)
    {"symbol": "RELIANCE.NS", "label": "Reliance",      "region": "IN", "source": "yf"},
    {"symbol": "TCS.NS",      "label": "TCS",           "region": "IN", "source": "yf"},
    {"symbol": "HDFCBANK.NS", "label": "HDFC Bank",     "region": "IN", "source": "yf"},
    {"symbol": "INFY.NS",     "label": "Infosys",       "region": "IN", "source": "yf"},
    {"symbol": "ICICIBANK.NS","label": "ICICI Bank",    "region": "IN", "source": "yf"},
    {"symbol": "SBIN.NS",     "label": "State Bank IN", "region": "IN", "source": "yf"},
    {"symbol": "BHARTIARTL.NS","label": "Bharti Airtel","region": "IN", "source": "yf"},
    {"symbol": "ITC.NS",      "label": "ITC",           "region": "IN", "source": "yf"},
]

TOP_METALS = [
    # Commodities / Forex (Finnhub)
    {"symbol": "GLD",  "label": "Gold Trust",      "unit": "USD", "source": "finnhub"},
    {"symbol": "SLV",  "label": "Silver Trust",    "unit": "USD", "source": "finnhub"},
    {"symbol": "PPLT", "label": "Platinum Trust",  "unit": "USD", "source": "finnhub"},
    {"symbol": "PALL", "label": "Palladium Trust", "unit": "USD", "source": "finnhub"},
    {"symbol": "CPER", "label": "Copper Trust",    "unit": "USD", "source": "finnhub"},
    {"symbol": "USO",  "label": "US Oil Fund",     "unit": "USD", "source": "finnhub"},
    {"symbol": "UNG",  "label": "Nat Gas Fund",    "unit": "USD", "source": "finnhub"},
    {"symbol": "DBA",  "label": "Agric. Fund",     "unit": "USD", "source": "finnhub"},
    
    # Optional India proxy metals if needed (YF)
    # {"symbol": "GOLDBEES.NS", "label": "Gold ETF IN", "unit": "INR", "source": "yf"},
]

TOP_CRYPTO = [
    {"id": "bitcoin", "symbol": "BTC", "label": "Bitcoin", "currency": "USD", "exchange": "Crypto"},
    {"id": "ethereum", "symbol": "ETH", "label": "Ethereum", "currency": "USD", "exchange": "Crypto"},
    {"id": "tether", "symbol": "USDT", "label": "Tether", "currency": "USD", "exchange": "Crypto"},
    {"id": "binancecoin", "symbol": "BNB", "label": "BNB", "currency": "USD", "exchange": "Crypto"},
    {"id": "solana", "symbol": "SOL", "label": "Solana", "currency": "USD", "exchange": "Crypto"},
    {"id": "ripple", "symbol": "XRP", "label": "XRP", "currency": "USD", "exchange": "Crypto"},
    {"id": "dogecoin", "symbol": "DOGE", "label": "Dogecoin", "currency": "USD", "exchange": "Crypto"},
    {"id": "cardano", "symbol": "ADA", "label": "Cardano", "currency": "USD", "exchange": "Crypto"},
]

# ─── Fetchers ─────────────────────────────────────────────────────────────────

async def fetch_finnhub_price(client: httpx.AsyncClient, item: dict) -> dict:
    url_quote = f"{FINNHUB_BASE}/quote"
    params_quote = {"symbol": item["symbol"], "token": FINNHUB_API_KEY}
    try:
        r = await client.get(url_quote, params=params_quote, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data and "c" in data and data["c"] != 0:
            return {
                **item,
                "price": round(data["c"], 4),
                "change_pct_1h": None,   # Finnhub quote doesn't provide 1h
                "change_pct_24h": round(data["dp"], 2) if data["dp"] else 0.0,
                "change_pct_7d": None,   # Finnhub quote doesn't provide 7d
                "currency": "USD",
                "exchange": "US",
                "sparkline": [],
            }
    except Exception as e:
        print(f"Finnhub price fetch error for {item['symbol']}: {e}")
    return {**item, "price": None, "change_pct_1h": None, "change_pct_24h": 0.0, "change_pct_7d": None, "currency": "USD", "sparkline": []}

async def fetch_yf_full(item: dict) -> dict:
    try:
        history = await asyncio.to_thread(yf.Ticker(item['symbol']).history, period='7d')
        if not history.empty and "Close" in history:
            closes = history["Close"].dropna().tolist()
            if len(closes) > 0:
                price = closes[-1]
                prev_close = closes[-2] if len(closes) > 1 else price
                change_pct_24h = round(((price - prev_close) / prev_close) * 100, 2) if prev_close > 0 else 0.0
                # Approximate 7d change using first vs last close
                change_pct_7d = round(((closes[-1] - closes[0]) / closes[0]) * 100, 2) if len(closes) > 1 and closes[0] > 0 else None
                sparkline = [round(c, 2) for c in closes]
                return {
                    **item,
                    "price": round(price, 4),
                    "change_pct_1h": None,  # YF daily history doesn't give 1h
                    "change_pct_24h": change_pct_24h,
                    "change_pct_7d": change_pct_7d,
                    "currency": "INR",
                    "exchange": "NSE",
                    "sparkline": sparkline,
                }
    except Exception as e:
        print(f"YF full error for {item['symbol']}: {e}")
    return {**item, "price": None, "change_pct_1h": None, "change_pct_24h": 0.0, "change_pct_7d": None, "currency": "INR", "sparkline": []}

async def fetch_yf_sparkline(item: dict, yf_sym: str):
    try:
        history = await asyncio.to_thread(yf.Ticker(yf_sym).history, period='7d')
        if not history.empty and "Close" in history:
            closes = history["Close"].dropna().tolist()
            if closes:
                return item["symbol"], [round(c, 2) for c in closes]
    except Exception as e:
        print(f"Sparkline error for {yf_sym}: {e}")
    return item["symbol"], []

# ─── Main Endpoint ────────────────────────────────────────────────────────────
@app.get("/api/market-data/{category}")
async def get_market_data(category: str):
    if category not in ("stocks", "indices", "metals", "crypto"):
        raise HTTPException(status_code=400, detail="category must be: stocks, indices, metals, crypto")

    cached = cache_get(category)
    if cached is not None:
        return {"category": category, "data": cached, "cached": True}

    items_list = []
    if category == "stocks":
        items_list = TOP_STOCKS
    elif category == "indices":
        items_list = TOP_INDICES
    elif category == "metals":
        items_list = TOP_METALS
    elif category == "crypto":
        items_list = TOP_CRYPTO

    results = []
    
    if category == "crypto":
        # Fetch top 50 from CoinGecko with retry logic and exponential backoff
        url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d"
        max_retries = 3
        retry_delay = 1  # Start with 1 second delay
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient() as client:
                    # Add headers to identify the request
                    headers = {
                        "User-Agent": "FinSmart-API/1.0"
                    }
                    r = await client.get(url, timeout=15, headers=headers)
                    
                    # Check for rate limiting
                    if r.status_code == 429:
                        if attempt < max_retries - 1:
                            wait_time = retry_delay * (2 ** attempt)
                            print(f"Rate limited (429). Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            print("Max retries exceeded for CoinGecko API. Using cached data if available.")
                            break
                    
                    r.raise_for_status()
                    data = r.json()
                    
                    for coin_data in data:
                        sparkline = coin_data.get("sparkline_in_7d", {}).get("price", [])
                        pcp = coin_data.get("price_change_percentage_1h_in_currency")
                        results.append({
                            "symbol": coin_data.get("symbol", "").upper(),
                            "label": coin_data.get("name"),
                            "price": coin_data.get("current_price"),
                            "change_pct_1h": round(pcp, 2) if pcp is not None else None,
                            "change_pct_24h": round(coin_data.get("price_change_percentage_24h", 0) or 0, 2),
                            "change_pct_7d": round(coin_data.get("price_change_percentage_7d_in_currency", 0) or 0, 2),
                            "currency": "USD",
                            "exchange": "Crypto",
                            "sparkline": [round(p, 2) for p in sparkline] if sparkline else []
                        })
                    # Success - break out of retry loop
                    break
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)
                        print(f"Rate limited (429). Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                        await asyncio.sleep(wait_time)
                    else:
                        print("Max retries exceeded for CoinGecko API")
                else:
                    print(f"HTTP Error {e.response.status_code}: {e}")
                    break
            except Exception as e:
                print(f"CoinGecko fetch error (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)
                    await asyncio.sleep(wait_time)
                
        cache_set(category, results)
        return {"category": category, "data": results, "cached": False}
    async with httpx.AsyncClient() as client:
        
        # 1. Fetch individual Indian assets and Finnhub live prices concurrently
        tasks = []
        finnhub_items = []
        for item in items_list:
            if item.get("source") == "yf":
                tasks.append(fetch_yf_full(item))
            else:
                tasks.append(fetch_finnhub_price(client, item))
                finnhub_items.append(item)
                
        responses = await asyncio.gather(*tasks)
        
        # 2. Bulk-fetch sparklines for all Finnhub items in exactly 1 request
        finnhub_sparklines_map = {}
        if finnhub_items:
            yf_syms = [item["symbol"].replace(".", "-") for item in finnhub_items] # BRK.B -> BRK-B
            spark_tasks = [fetch_yf_sparkline(item, sym) for item, sym in zip(finnhub_items, yf_syms)]
            spark_results = await asyncio.gather(*spark_tasks)
            for sym, sparkline in spark_results:
                finnhub_sparklines_map[sym] = sparkline

        # 3. Assemble final response
        for response in responses:
            sym = response["symbol"]
            response.pop("source", None)  # Clean up internal source key
            
            # Inject bulk-fetched sparklines into Finnhub responses
            if not response["sparkline"] and sym in finnhub_sparklines_map:
                response["sparkline"] = finnhub_sparklines_map[sym]
                
            results.append(response)

    cache_set(category, results)
    return {"category": category, "data": results, "cached": False}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


