export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const RESEND_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = 'sales@centralhomeco.com';
  const FROM_EMAIL = 'noreply@centralhomeco.com';

  const { type } = body;

  let subject, html;

  if (type === 'contact') {
    const { name, email, phone, customerType, interest, message } = body;
    subject = `New Contact Form Submission - ${name}`;
    html = `
      <h2>New Contact Message</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold;width:140px">Name</td><td style="padding:8px;border:1px solid #ddd">${name || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${email}">${email || '-'}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${phone || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Customer Type</td><td style="padding:8px;border:1px solid #ddd">${customerType || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Interest</td><td style="padding:8px;border:1px solid #ddd">${interest || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${(message || '-').replace(/\n/g, '<br>')}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:20px">Sent from centralhomeco.com contact form</p>
    `;
  } else if (type === 'appointment') {
    const { name, email, phone, customerType, date, time, appointmentType, notes } = body;
    subject = `New Appointment Request - ${name} on ${date}`;
    html = `
      <h2>New Appointment Request</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif">
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold;width:160px">Name</td><td style="padding:8px;border:1px solid #ddd">${name || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${email}">${email || '-'}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${phone || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Customer Type</td><td style="padding:8px;border:1px solid #ddd">${customerType || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Requested Date</td><td style="padding:8px;border:1px solid #ddd"><strong>${date || '-'}</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Requested Time</td><td style="padding:8px;border:1px solid #ddd"><strong>${time || '-'}</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Appointment Type</td><td style="padding:8px;border:1px solid #ddd">${appointmentType || '-'}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;background:#f5f5f5;font-weight:bold">Notes</td><td style="padding:8px;border:1px solid #ddd">${(notes || '-').replace(/\n/g, '<br>')}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:20px">Sent from centralhomeco.com appointment form</p>
    `;
  } else {
    return new Response(JSON.stringify({ error: 'Unknown form type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject,
      html
    })
  });

  const data = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: data }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
