function clean(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const toEmail = process.env.CONTACT_TO_EMAIL || 'sales@centralhomeco.com';

    if (!apiKey || !fromEmail) {
        return res.status(503).json({ error: 'Email service is not configured yet.' });
    }

    const body = req.body || {};
    if (body.website) return res.status(200).json({ ok: true });

    const name = clean(body.name, 100);
    const email = clean(body.email, 254);
    const phone = clean(body.phone, 40);
    const customerType = clean(body.customerType, 50);
    const topic = clean(body.topic, 100);
    const message = clean(body.message, 5000);

    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: 'Please enter your name and a valid email address.' });
    }

    const subject = `Website contact: ${topic || 'General question'} — ${name}`;
    const text = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone || 'Not provided'}`,
        `Customer type: ${customerType || 'Not provided'}`,
        `Topic: ${topic || 'Not provided'}`,
        '',
        'Message:',
        message || 'No message provided.'
    ].join('\n');

    try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [toEmail],
                reply_to: email,
                subject,
                text
            })
        });

        const result = await resendResponse.json().catch(() => ({}));
        if (!resendResponse.ok) {
            console.error('Resend contact error:', result);
            return res.status(502).json({ error: 'Your message could not be sent. Please try again.' });
        }

        return res.status(200).json({ ok: true, id: result.id });
    } catch (error) {
        console.error('Contact email error:', error);
        return res.status(500).json({ error: 'Your message could not be sent. Please try again.' });
    }
};
