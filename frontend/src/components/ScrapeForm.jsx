import { useState } from "react"
import { scrapeFollowers } from "../lib/api"

const PLATFORMS = [
  { key: "facebook",  label: "Facebook",    color: "#1877F2", domains: ["facebook.com", "fb.watch", "fb.com"] },
  { key: "instagram", label: "Instagram",   color: "#E1306C", domains: ["instagram.com", "instagr.am"] },
  { key: "twitter",   label: "X / Twitter", color: "#1DA1F2", domains: ["twitter.com", "x.com"] },
  { key: "linkedin",  label: "LinkedIn",    color: "#0A66C2", domains: ["linkedin.com", "lnkd.in"] },
  { key: "youtube",   label: "YouTube",     color: "#FF0000", domains: ["youtube.com", "youtu.be", "m.youtube.com"] },
]

function detectPlatform(url) {
  if (!url) return null
  const lower = url.toLowerCase()
  return PLATFORMS.find(p => p.domains.some(domain => lower.includes(domain)))
}

export default function ScrapeForm({ onSuccess }) {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const platform = detectPlatform(url)

  const handleScrape = async () => {
    setError("")
    setSuccess("")

    if (!url.trim()) {
      setError("Paste a social media URL.")
      return
    }
    if (!platform) {
      setError("Unsupported link. Use Facebook, Instagram, X, LinkedIn, or YouTube.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        brand: platform.label,
        facebook_url: platform.key === "facebook" ? url : "",
        instagram_url: platform.key === "instagram" ? url : "",
        twitter_url: platform.key === "twitter" ? url : "",
        linkedin_url: platform.key === "linkedin" ? url : "",
        youtube_url: platform.key === "youtube" ? url : "",
      }

      const res = await scrapeFollowers(payload)
      setSuccess("Saved successfully!")
      setUrl("")
      onSuccess?.(res.data)
    } catch (err) {
      setError(err.message || "Scrape failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <label style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Social Media URL</label>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Facebook, Instagram, X, LinkedIn, or YouTube profile/video URL"
          style={{ width:"100%", marginTop:6, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", fontSize:14, color:"var(--text)", boxSizing:"border-box" }}
        />
      </div>

      {platform && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:12, background:"var(--bg2)", borderRadius:10, border:"1px solid var(--border)" }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:platform.color }} />
          <span style={{ fontSize:13, fontWeight:700 }}>{platform.label} link detected</span>
        </div>
      )}

      {error && <div style={{ background:"rgba(255,60,60,0.1)", border:"1px solid rgba(255,60,60,0.3)", borderRadius:8, padding:"10px 14px", color:"#ff6b6b", fontSize:13 }}>{error}</div>}
      {success && <div style={{ background:"rgba(100,255,100,0.1)", border:"1px solid rgba(100,255,100,0.3)", borderRadius:8, padding:"10px 14px", color:"#6bff6b", fontSize:13 }}>{success}</div>}

      <button onClick={handleScrape} disabled={loading} style={{ padding:"14px", borderRadius:8, background:"var(--accent)", color:"#000", fontWeight:700, fontSize:14, border:"none", cursor:"pointer" }}>
        {loading ? "Scraping…" : "Scrape and Save"}
      </button>
    </div>
  )
}
