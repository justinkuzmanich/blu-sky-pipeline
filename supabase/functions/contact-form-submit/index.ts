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

  // ── Send Telegram notification (non-fatal) ───────────────────
  const tgToken  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const tgChatId = Deno.env.get('TELEGRAM_CHAT_ID')

  if (!tgToken || !tgChatId) {
    console.warn('Telegram env vars not set, notification skipped')
  } else {
    const text =
      '🎬 New Blu Sky Films inquiry\n\n' +
      'Name: ' + name.trim() + '\n' +
      'Service: ' + (service_label?.trim() || service_value) + '\n' +
      'Phone: ' + phone.trim() + '\n' +
      'Email: ' + email.trim() +
      (shootDate?.trim() ? '\nShoot date: ' + shootDate.trim() : '') +
      (address?.trim() ? '\nAddress: ' + address.trim() : '') +
      (message?.trim() ? '\n\nMessage: ' + message.trim() : '') +
      '\n\n👉 https://justinkuzmanich.github.io/blu-sky-pipeline/'

    try {
      const res = await fetch(
        'https://api.telegram.org/bot' + tgToken + '/sendMessage',
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text }),
        },
      )
      if (!res.ok) {
        console.error('Telegram error:', res.status, await res.text())
      }
    } catch (err) {
      console.error('Telegram request failed:', err)
    }
  }

  return json({ ok: true })
})
