import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OWNER_USER_ID = '48218afa-906b-44ed-903c-fb4dcc6473aa'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

type ServiceKey = 'listing-video' | 'social-retainer' | 'paid-ads' | 'bundle'

const SERVICE_MAP: Record<ServiceKey, { deal_type: string; value: number }> = {
  'listing-video':  { deal_type: 'listing-video', value: 999  },
  'social-retainer': { deal_type: 'social-video',  value: 2250 },
  'paid-ads':       { deal_type: 'ads',            value: 0    },
  'bundle':         { deal_type: 'ads',            value: 0    },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  // ── Parse body ────────────────────────────────────────────────
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  const { name, email, phone, service_label, service_value, shootDate, address, message } = body

  // ── Validate required fields ──────────────────────────────────
  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return json({ ok: false, error: 'name, email, and phone are required' }, 400)
  }

  if (!service_value || !(service_value in SERVICE_MAP)) {
    return json(
      { ok: false, error: `service_value must be one of: ${Object.keys(SERVICE_MAP).join(', ')}` },
      400,
    )
  }

  // ── Map service → deal_type + value ───────────────────────────
  const { deal_type, value } = SERVICE_MAP[service_value as ServiceKey]

  // ── Compose note text ─────────────────────────────────────────
  const parts: string[] = []
  if (service_label?.trim()) parts.push(`Service: ${service_label.trim()}`)
  if (shootDate?.trim())     parts.push(`Shoot date: ${shootDate.trim()}`)
  if (address?.trim())       parts.push(`Address: ${address.trim()}`)
  if (message?.trim())       parts.push(`Message: ${message.trim()}`)

  const note = {
    id:    crypto.randomUUID(),
    text:  parts.join(' • '),
    ts:    Date.now(),
    stage: 'Prospect',
  }

  // ── Insert deal (service role bypasses RLS) ───────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: insertError } = await supabase.from('deals').insert({
    user_id:   OWNER_USER_ID,
    stage:     0,
    status:    'active',
    name:      name.trim(),
    email:     email.trim(),
    phone:     phone.trim(),
    deal_type,
    value,
    notes:     [note],
    next_step: null,
  })

  if (insertError) {
    console.error('Insert failed:', insertError)
    return json({ ok: false, error: 'Failed to save inquiry' }, 500)
  }

  // ── Send SMS via Twilio (non-fatal) ───────────────────────────
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')
  const toNumber   = Deno.env.get('TWILIO_TO_NUMBER')

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('Twilio env vars not set — SMS skipped')
  } else {
    const smsText =
      `🎬 New Blu Sky Films inquiry: ${name.trim()} · ` +
      `${service_label?.trim() || service_value} · ` +
      `${phone.trim()} · ${email.trim()}`

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            'Content-Type':  'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: fromNumber, To: toNumber, Body: smsText }),
        },
      )
      if (!res.ok) {
        console.error('Twilio error:', res.status, await res.text())
      }
    } catch (err) {
      console.error('Twilio request failed:', err)
    }
  }

  return json({ ok: true })
})
