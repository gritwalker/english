import { GoogleAuth } from 'google-auth-library'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      if (req.method === 'OPTIONS') return res.status(204).end()
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = req.body || {}
    const apiKey = process.env.GOOGLE_TTS_API_KEY
    const saKeyJson = process.env.GCP_SA_KEY

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')

    if (apiKey) {
      const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (!r.ok) return res.status(r.status).json({ error: data.error || 'Google TTS error' })
      return res.status(200).json(data)
    }

    if (saKeyJson) {
      const sa = JSON.parse(saKeyJson)
      const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
      const client = await auth.getClient()
      const token = await client.getAccessToken()
      const endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize'
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.token || token}` },
        body: JSON.stringify(body)
      })
      const data = await r.json()
      if (!r.ok) return res.status(r.status).json({ error: data.error || 'Google TTS error' })
      return res.status(200).json(data)
    }

    return res.status(500).json({ error: 'No credentials configured' })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal error' })
  }
}

