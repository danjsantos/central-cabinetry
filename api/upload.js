// api/upload.js — Vercel serverless function
// Proxies file uploads to Supabase Storage using the service role key (server-side only).
// The service role key is never exposed to the browser.
//
// Usage (multipart/form-data POST):
//   POST /api/upload
//   FormData fields:
//     file     — the binary file
//     path     — storage path inside the "images" bucket, e.g. "door-styles/1234.jpg"
//     token    — the authenticated user's Supabase access_token (for auth check)

const SUPABASE_URL = 'https://apxelbabvviuwqpfivtr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    // CORS headers so admin.html (same domain) can call this
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse multipart form data using the raw stream
    const { IncomingForm } = await import('formidable');
    const form = new IncomingForm({ maxFileSize: 20 * 1024 * 1024 }); // 20 MB limit

    const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });

    const storagePath = Array.isArray(fields.path) ? fields.path[0] : fields.path;
    const userToken = Array.isArray(fields.token) ? fields.token[0] : fields.token;
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!storagePath || !uploadedFile) {
        return res.status(400).json({ error: 'Missing path or file' });
    }

    // Verify the user token is a valid Supabase JWT (basic check — not empty)
    if (!userToken || userToken.length < 20) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Read the file buffer
    const fs = await import('fs');
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const contentType = uploadedFile.mimetype || 'application/octet-stream';

    // Upload to Supabase Storage using service role key
    const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/images/${storagePath}`,
        {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': contentType,
                'x-upsert': 'true'
            },
            body: fileBuffer
        }
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        return res.status(uploadRes.status).json({ error: err.message || 'Upload failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;
    return res.status(200).json({ url: publicUrl });
}
