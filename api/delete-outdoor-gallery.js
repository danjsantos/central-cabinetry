const SUPABASE_URL = 'https://apxelbabvviuwqpfivtr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { id, token } = req.body || {};
    if (!id || !token) return res.status(400).json({ error: 'Missing photo or login information' });

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Please sign in again' });

    const deleteRes = await fetch(`${SUPABASE_URL}/rest/v1/outdoor_images?id=eq.${encodeURIComponent(id)}&slug=like.product-gallery-*`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
        }
    });
    if (!deleteRes.ok) {
        const err = await deleteRes.json().catch(() => ({}));
        return res.status(deleteRes.status).json({ error: err.message || 'Photo could not be removed' });
    }
    return res.status(200).json({ ok: true });
}
