import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const scrapeFollowers = (payload) => api.post('/scrape', payload)
export const getDashboard = () => api.get('/dashboard')
export const downloadExcel = () =>
  api.get('/download-excel', { responseType: 'blob' }).then(res => {
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `ECCHO_Social_Followers_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  })
export const getAggregateReport = () => api.get('/reports/aggregate')
export const getRecurringReport = () => api.get('/reports/recurring')
export const deleteEntry = (id) => api.delete(`/entries/${id}`)
export const deleteAllEntries = () => api.delete('/entries')
