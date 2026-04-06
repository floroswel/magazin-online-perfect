const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'no-reply@mamalucica.ro';

    const { email, name, phone, message, receiverEmail } = await req.json();

    if (!email || !name || !phone || !message) {
      return new Response(JSON.stringify({ error: 'Toate câmpurile sunt obligatorii' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Email invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (phone.replace(/\D/g, '').length < 10) {
      return new Response(JSON.stringify({ error: 'Telefon invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (message.length < 20) {
      return new Response(JSON.stringify({ error: 'Mesaj prea scurt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const to = receiverEmail || 'contact@mamalucica.ro';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#333;border-bottom:2px solid #0066FF;padding-bottom:10px">📩 Mesaj nou de contact</h2>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr><td style="padding:8px;font-weight:bold;color:#555;width:120px">Nume:</td><td style="padding:8px">${name}</td></tr>
          <tr style="background:#f8f8f8"><td style="padding:8px;font-weight:bold;color:#555">Email:</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;color:#555">Telefon:</td><td style="padding:8px"><a href="tel:${phone}">${phone}</a></td></tr>
        </table>
        <div style="background:#f0f7ff;border-left:4px solid #0066FF;padding:15px;margin:20px 0">
          <strong style="color:#333">Mesaj:</strong>
          <p style="color:#555;margin:8px 0 0;white-space:pre-wrap">${message}</p>
        </div>
        <p style="color:#999;font-size:12px;margin-top:30px">Trimis de pe mamalucica.ro — formularul de contact</p>
      </div>
    `;

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `Mama Lucica <${RESEND_FROM_EMAIL}>`,
        to: [to],
        reply_to: email,
        subject: `[Contact] Mesaj de la ${name}`,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Contact email error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
