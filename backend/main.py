from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import re
import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from supabase import create_client, Client
from datetime import datetime
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import calendar

load_dotenv()

# API Setup

app = FastAPI(title="ECCHO Social Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


class SocialLinks(BaseModel):
    brand: str
    facebook_url: Optional[str] = ""
    instagram_url: Optional[str] = ""
    twitter_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    youtube_url: Optional[str] = ""


async def fetch_follower_count(url: str, platform: str) -> Optional[int]:
    """Scrape follower count from social media page with LLM fallback."""
    if not url or not url.strip():
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                print(f"Failed to fetch {url}: {resp.status_code}")
                return None
            
            text = resp.text
            
            # 1. Try Regex first (Fast & Free)
            if platform == "facebook":
                m = re.search(r'"follower_count":(\d+)', text)
                if m: return int(m.group(1))
                m = re.search(r'([\d,]+)\s*(?:people\s*)?follow', text, re.I)
                if m: return int(m.group(1).replace(",", ""))
            
            elif platform == "instagram":
                m = re.search(r'"edge_followed_by":\{"count":(\d+)\}', text)
                if m: return int(m.group(1))
            
            elif platform == "youtube":
                m = re.search(r'([\d,]+)\s*subscribers', text, re.I)
                if m: return int(m.group(1).replace(",", ""))



    except Exception as e:
        print(f"Error fetching {platform}: {e}")
    return None

def is_last_day_of_month(date_obj):
    last_day = calendar.monthrange(date_obj.year, date_obj.month)[1]
    return date_obj.day == last_day


@app.get("/")
async def root():
    return {"status": "ECCHO Tracker API running"}


@app.post("/api/scrape")
async def scrape_followers(links: SocialLinks):
    """Scrape all social media follower counts for a brand."""
    results = {}

    tasks = {
        "facebook": links.facebook_url,
        "instagram": links.instagram_url,
        "twitter": links.twitter_url,
        "linkedin": links.linkedin_url,
        "youtube": links.youtube_url,
    }

    # 1. Validation: ALL provided URLs must be valid for their platforms
    valid_tasks = {}
    domain_map = {
        "facebook": "facebook.com",
        "instagram": "instagram.com",
        "twitter": ["twitter.com", "x.com"],
        "linkedin": "linkedin.com",
        "youtube": ["youtube.com", "youtu.be"]
    }

    for platform, url in tasks.items():
        if url and url.strip():
            allowed = domain_map.get(platform)
            is_valid = False
            if isinstance(allowed, list):
                is_valid = any(d in url.lower() for d in allowed)
            else:
                is_valid = allowed in url.lower()

            if not is_valid:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid URL for {platform.capitalize()}. Please check the link."
                )
            valid_tasks[platform] = url

    if not valid_tasks:
        raise HTTPException(status_code=400, detail="Please provide at least one social media URL.")



    # 3. Run scraping for valid tasks
    for platform, url in valid_tasks.items():
        count = await fetch_follower_count(url, platform)
        results[platform] = count

    now = datetime.now()
    record = {
        "brand": links.brand,
        "facebook_url": links.facebook_url,
        "instagram_url": links.instagram_url,
        "twitter_url": links.twitter_url,
        "linkedin_url": links.linkedin_url,
        "youtube_url": links.youtube_url,
        "facebook_followers": results.get("facebook"),
        "instagram_followers": results.get("instagram"),
        "twitter_followers": results.get("twitter"),
        "linkedin_followers": results.get("linkedin"),
        "youtube_subscribers": results.get("youtube"),
        "scraped_at": now.isoformat(),
    }

    if supabase:
        try:
            # 1. Save to raw history
            supabase.table("social_followers").insert(record).execute()
            
            # 2. Logic for reporting tables
            month_name = now.strftime("%B")
            is_last_day = is_last_day_of_month(now)
            is_15th = now.day == 15
            
            report_data = {
                "brand": links.brand,
                "facebook": results.get("facebook"),
                "instagram": results.get("instagram"),
                "twitter": results.get("twitter"),
                "linkedin": results.get("linkedin"),
                "youtube": results.get("youtube"),
            }

            # A. RECURRING TABLE (15th or Last Day)
            # For testing, we allow all days. For production, uncomment the if condition.
            if True: # is_15th or is_last_day: 
                date_label = "15th" if is_15th else (f"{now.day}th" if not is_last_day else "Last Day")
                recurring_record = {
                    **report_data,
                    "month": month_name,
                    "date_label": date_label,
                    "scraped_at": now.isoformat()
                }
                supabase.table("recurring_followers").insert(recurring_record).execute()

            # B. AGGREGATE TABLE (Last Day of Month)
            # For testing, we allow all days. For production, uncomment the if condition.
            if True: # is_last_day:
                supabase.table("aggregate_followers").upsert({
                    **report_data,
                    "last_updated": now.date().isoformat()
                }).execute()

        except Exception as e:
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

    return {"success": True, "brand": links.brand, "data": record}

@app.get("/api/reports/aggregate")
async def get_aggregate_report():
    if not supabase: return {"data": []}
    resp = supabase.table("aggregate_followers").select("*").order("brand").execute()
    return {"data": resp.data}

@app.get("/api/reports/recurring")
async def get_recurring_report():
    if not supabase: return {"data": []}
    resp = supabase.table("recurring_followers").select("*").order("scraped_at", desc=True).execute()
    return {"data": resp.data}


@app.get("/api/dashboard")
async def get_dashboard():
    """Get all saved records from Supabase."""
    if not supabase:
        return {"data": [], "error": "Supabase not configured"}
    try:
        resp = supabase.table("social_followers").select("*").order("scraped_at", desc=True).execute()
        return {"data": resp.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download-excel")
async def download_excel():
    """Generate and download Excel report from Supabase data."""
    records = []
    if supabase:
        try:
            resp = supabase.table("social_followers").select("*").order("scraped_at", desc=True).execute()
            records = resp.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    wb = openpyxl.Workbook()

    # --- Aggregate Sheet ---
    ws_agg = wb.active
    ws_agg.title = "Aggregate"

    header_fill = PatternFill("solid", fgColor="1A1A2E")
    header_font = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
    alt_fill = PatternFill("solid", fgColor="F0F4FF")
    border = Border(
        bottom=Side(style='thin', color='DDDDDD'),
        right=Side(style='thin', color='DDDDDD')
    )

    agg_headers = ["Brand", "Facebook", "Instagram", "X / Twitter", "LinkedIn", "YouTube", "Last Updated"]
    for col, h in enumerate(agg_headers, 1):
        cell = ws_agg.cell(row=1, column=col, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = border

    # Group by brand, take latest
    latest = {}
    for r in records:
        b = r.get("brand", "")
        if b not in latest:
            latest[b] = r

    for i, (brand, r) in enumerate(latest.items(), 2):
        row_fill = PatternFill("solid", fgColor="F8F9FF") if i % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")
        vals = [
            brand,
            r.get("facebook_followers") or "",
            r.get("instagram_followers") or "",
            r.get("twitter_followers") or "",
            r.get("linkedin_followers") or "",
            r.get("youtube_subscribers") or "",
            r.get("scraped_at", "")[:10] if r.get("scraped_at") else "",
        ]
        for col, v in enumerate(vals, 1):
            cell = ws_agg.cell(row=i, column=col, value=v)
            cell.fill = row_fill
            cell.alignment = Alignment(horizontal='center' if col > 1 else 'left', vertical='center')
            cell.border = border
            if isinstance(v, int) and col > 1:
                cell.number_format = '#,##0'

    for col in ws_agg.columns:
        max_len = max((len(str(c.value or '')) for c in col), default=10)
        ws_agg.column_dimensions[col[0].column_letter].width = min(max_len + 4, 30)
    ws_agg.row_dimensions[1].height = 24

    # --- History Sheet ---
    ws_hist = wb.create_sheet("Full History")
    hist_headers = ["Date", "Brand", "Facebook", "Instagram", "X / Twitter", "LinkedIn", "YouTube"]
    for col, h in enumerate(hist_headers, 1):
        cell = ws_hist.cell(row=1, column=col, value=h)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = border

    for i, r in enumerate(records, 2):
        row_fill = PatternFill("solid", fgColor="F8F9FF") if i % 2 == 0 else PatternFill("solid", fgColor="FFFFFF")
        vals = [
            r.get("scraped_at", "")[:10],
            r.get("brand", ""),
            r.get("facebook_followers") or "",
            r.get("instagram_followers") or "",
            r.get("twitter_followers") or "",
            r.get("linkedin_followers") or "",
            r.get("youtube_subscribers") or "",
        ]
        for col, v in enumerate(vals, 1):
            cell = ws_hist.cell(row=i, column=col, value=v)
            cell.fill = row_fill
            cell.alignment = Alignment(horizontal='center' if col > 2 else 'left', vertical='center')
            cell.border = border
            if isinstance(v, int) and col > 2:
                cell.number_format = '#,##0'

    for col in ws_hist.columns:
        max_len = max((len(str(c.value or '')) for c in col), default=10)
        ws_hist.column_dimensions[col[0].column_letter].width = min(max_len + 4, 30)

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"ECCHO_Social_Followers_{datetime.now().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )