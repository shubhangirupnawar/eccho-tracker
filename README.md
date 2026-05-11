# ECCHO Social Follower Tracker

Automated social media follower tracking with AI validation and reporting.

## 🚀 Features
- **AI-Powered Scraping**: Uses Gemini AI for high-accuracy numeric follower extraction.
- **Brand Validation**: AI verifies if URLs belong to the selected brand before scraping.
- **Reporting**:
  - **Aggregate Table**: Monthly snapshots.
  - **Recurring Table**: 15th and End-of-Month snapshots.
- **Excel Export**: Download consolidated brand reports.
- **Dashboard**: Comparison graphs and history logs.

## 🛠️ Setup

### Backend (Python/FastAPI)
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create a `.env` file in the `backend/` directory (see `.env.example`).
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend (React/Vite)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables
Create a `backend/.env` file with:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_KEY`: Your Supabase Service/Anon Role Key.
- `GEMINI_API_KEY`: Your Google Gemini API Key.
