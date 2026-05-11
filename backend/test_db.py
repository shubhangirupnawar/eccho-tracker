import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_KEY")

print(f"URL: {URL}")
print(f"Key starts with: {KEY[:10] if KEY else 'None'}")

if not URL or not KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_KEY missing in .env")
    exit(1)

try:
    supabase = create_client(URL, KEY)
    
    try:
        supabase.table("social_followers").select("*").limit(1).execute()
        print("SUCCESS: Connected to social_followers table!")
    except Exception as e:
        print(f"FAILED: social_followers table issue: {e}")
        
    try:
        supabase.table("aggregate_followers").select("*").limit(1).execute()
        print("SUCCESS: Connected to aggregate_followers table!")
    except Exception as e:
        print(f"FAILED: aggregate_followers table issue: {e}")
        
    try:
        supabase.table("recurring_followers").select("*").limit(1).execute()
        print("SUCCESS: Connected to recurring_followers table!")
    except Exception as e:
        print(f"FAILED: recurring_followers table issue: {e}")

except Exception as e:
    print(f"ERROR: Global connection failed: {e}")
