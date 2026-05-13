const BASE = "http://localhost:8000"

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "Request failed")
  }
  return res.json()
}

export const getDashboard     = ()       => req("/api/dashboard")
export const scrapeFollowers  = (data)   => req("/api/scrape",       { method:"POST", body:JSON.stringify(data) })
export const deleteEntry      = (id)     => req(`/api/entries/${id}`,{ method:"DELETE" })
export const deleteAllEntries = ()       => req("/api/entries",      { method:"DELETE" })
export const downloadExcel    = async () => {
  const res = await fetch(`${BASE}/api/download-excel`)
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url
  a.download = `ECCHO_Social_${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
