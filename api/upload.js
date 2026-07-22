// api/upload.js — Vercel serverless function (no external dependencies)
// Proxies file uploads to Supabase Storage using the service role key (server-side only).
// The service role key is never exposed to the browser.
//
// Usage: POST /api/upload  (multipart/form-data)
//   Fields: file (binary), path (string), token (string)

const SUPABASE_URL = 'https://apxelbabvviuwqpfivtr.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = { api: { bodyParser: false } };

// Parse multipart/form-data without external libraries
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)$/);
        if (!boundaryMatch) return reject(new Error('No boundary found'));
        const boundary = boundaryMatch[1];

        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const body = Buffer.concat(chunks);
            const fields = {};
            const files = {};

            const delimiter = Buffer.from('\r\n--' + boundary);
            const closeDelimiter = Buffer.from('\r\n--' + boundary + '--');

            let start = body.indexOf('--' + boundary + '\r\n');
            if (start === -1) return reject(new Error('No parts found'));
            start += ('--' + boundary + '\r\n').length;

            while (start < body.length) {
                let end = body.indexOf(delimiter, start);
                const isLast = end === -1;
                if (isLast) {
                    end = body.indexOf(closeDelimiter, start);
                    if (end === -1) end = body.length;
                }

                const part = body.slice(start, end);
                const headerEnd = part.indexOf('\r\n\r\n');
                if (headerEnd === -1) break;

                const headerStr = part.slice(0, headerEnd).toString();
                const partBody = part.slice(headerEnd + 4);

                const nameMatch = headerStr.match(/name="([^"]+)"/);
                const filenameMatch = headerStr.match(/filename="([^"]+)"/);
                const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

                if (nameMatch) {
                    const name = nameMatch[1];
                    if (filenameMatch) {
                        files[name] = {
                            buffer: partBody,
                            filename: filenameMatch[1],
                            mimetype: contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream'
                        };
                    } else {
                        fields[name] = partBody.toString();
                    }
                }

                if (isLast) break;
                start = end + delimiter.length + '\r\n'.length;
            }

            resolve({ fields, files });
        });
        req.on('error', reject);
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let fields, files;
    try {
        ({ fields, files } = await parseMultipart(req));
    } catch (err) {
        return res.status(400).json({ error: 'Failed to parse form: ' + err.message });
    }

    const storagePath = fields.path;
    const userToken = fields.token;
    const uploadedFile = files.file;

    if (!storagePath || !uploadedFile) {
        return res.status(400).json({ error: 'Missing path or file' });
    }

    if (!userToken || userToken.length < 20) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/images/${storagePath}`,
        {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': uploadedFile.mimetype,
                'x-upsert': 'true'
            },
            body: uploadedFile.buffer
        }
    );

    if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        return res.status(uploadRes.status).json({ error: err.message || 'Upload failed' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${storagePath}`;

    // Gallery rows must be created server-side because the browser user is only
    // allowed to edit the fixed outdoor image records.
    if (fields.galleryProductId) {
        const galleryRes = await fetch(`${SUPABASE_URL}/rest/v1/outdoor_images`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                slug: fields.gallerySlug,
                label: fields.galleryLabel || 'Additional product photo',
                image_url: publicUrl,
                sort_order: Number(fields.gallerySortOrder) || Date.now()
            })
        });
        if (!galleryRes.ok) {
            const err = await galleryRes.json().catch(() => ({}));
            return res.status(galleryRes.status).json({ error: err.message || 'Photo could not be added to the gallery' });
        }
    }

    return res.status(200).json({ url: publicUrl });
}
