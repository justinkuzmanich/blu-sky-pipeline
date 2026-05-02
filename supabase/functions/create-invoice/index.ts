import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OWNER_USER_ID  = '48218afa-906b-44ed-903c-fb4dcc6473aa'
const INVOICED_STAGE = 3
const SQUARE_API     = 'https://connect.squareup.com'
const SQUARE_VERSION = '2024-01-18'

const DEAL_TYPE_LABELS: Record<string, string> = {
  'video':        'Video',
  'listing-video':'Listing Video',
  'social-video': 'Social Video',
  'website':      'Website',
  'social':       'Social Media',
  'ads':          'Paid Ads',
  'photo':        'Photography',
  'consult':      'Consulting',
  'techsupport':  'Tech Support',
  'other':        'Other',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

interface Deal {
  id:          string
  user_id:     string
  stage:       number
  name:        string
  email:       string
  phone:       string
  business:    string
  value:       number
  deal_type:   string
  invoice_url: string | null
}

interface WebhookPayload {
  type:       string
  table:      string
  record:     Deal
  old_record: Deal
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const { record: deal, old_record: oldDeal } = payload

  // Only fire on transition TO Invoiced — ignore all other updates
  if (deal.stage !== INVOICED_STAGE || oldDeal?.stage === INVOICED_STAGE) {
    return json({ ok: true, skipped: true })
  }

  // Safety: only process the owner's deals
  if (deal.user_id !== OWNER_USER_ID) {
    return json({ ok: true, skipped: true })
  }

  // Skip if an invoice was already created (e.g. moved away then back)
  if (deal.invoice_url) {
    return json({ ok: true, skipped: true, reason: 'invoice already exists' })
  }

  if (!deal.email?.trim()) {
    console.warn('Deal has no email — cannot create Square invoice:', deal.id)
    return json({ ok: false, error: 'Deal has no email address' }, 422)
  }

  const squareToken = Deno.env.get('SQUARE_ACCESS_TOKEN')
  const locationId  = Deno.env.get('SQUARE_LOCATION_ID')

  if (!squareToken || !locationId) {
    console.error('Square env vars not configured')
    return json({ ok: false, error: 'Square not configured' }, 500)
  }

  const sq = (path: string, body: unknown) =>
    fetch(`${SQUARE_API}${path}`, {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${squareToken}`,
        'Content-Type':   'application/json',
        'Square-Version': SQUARE_VERSION,
      },
      body: JSON.stringify(body),
    })

  // ── 1. Find or create Square customer ────────────────────────
  let customerId: string

  const searchRes  = await sq('/v2/customers/search', {
    query: { filter: { email_address: { exact: deal.email } } },
  })
  const searchData = await searchRes.json()

  if (searchData.customers?.length > 0) {
    customerId = searchData.customers[0].id
  } else {
    const parts     = deal.name.trim().split(' ')
    const createRes  = await sq('/v2/customers', {
      idempotency_key: `cust-${deal.id}`,
      email_address:   deal.email,
      given_name:      parts[0],
      family_name:     parts.slice(1).join(' ') || '',
      ...(deal.phone    && { phone_number:  deal.phone }),
      ...(deal.business && { company_name: deal.business }),
    })
    const createData = await createRes.json()
    if (!createData.customer?.id) {
      console.error('Failed to create Square customer:', createData)
      return json({ ok: false, error: 'Failed to create customer' }, 500)
    }
    customerId = createData.customer.id
  }

  // ── 2. Create order — line item + 3.4% Tax ───────────────────
  const typeLabel  = DEAL_TYPE_LABELS[deal.deal_type] || deal.deal_type || 'Service'

  // Parse fields from the first note (format: "Service: X • Shoot date: Y • Address: Z • Message: W")
  const noteText   = (deal.notes as any)?.[0]?.text || ''
  const addrMatch  = noteText.match(/Address:\s*([^•\n]+)/)
  const address    = addrMatch?.[1]?.trim() || ''
  const shootMatch = noteText.match(/Shoot date:\s*([^•\n]+)/)
  const shootDate  = shootMatch?.[1]?.trim() || ''
  const msgMatch   = noteText.match(/Message:\s*([^•\n]+)/)
  const message    = msgMatch?.[1]?.trim() || ''

  // Compose line item note: shoot date + message
  const lineNote   = [shootDate ? `Shoot date: ${shootDate}` : '', message].filter(Boolean).join(' · ')

  const orderRes  = await sq('/v2/orders', {
    idempotency_key: `order-${deal.id}`,
    order: {
      location_id: locationId,
      line_items: [{
        name:             typeLabel,
        quantity:         '1',
        base_price_money: {
          amount:   Math.round(Number(deal.value) * 100),
          currency: 'USD',
        },
        applied_taxes: [{ tax_uid: 'tax-1' }],
        ...(lineNote && { note: lineNote }),
      }],
      taxes: [{
        uid:        'tax-1',
        name:       'Tax',
        percentage: '3.4',
        scope:      'LINE_ITEM',
      }],
    },
  })
  const orderData = await orderRes.json()
  const orderId   = orderData.order?.id

  if (!orderId) {
    console.error('Failed to create Square order:', orderData)
    return json({ ok: false, error: 'Failed to create order' }, 500)
  }

  // ── 3. Create invoice ─────────────────────────────────────────
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const invoiceRes  = await sq('/v2/invoices', {
    idempotency_key: `inv-${deal.id}`,
    invoice: {
      location_id:       locationId,
      order_id:          orderId,
      primary_recipient: { customer_id: customerId },
      payment_requests:  [{ request_type: 'BALANCE', due_date: dueDateStr }],
      delivery_method:   'SHARE_MANUALLY',
      title:             address ? `${typeLabel} : ${address}` : typeLabel,
      accepted_payment_methods: {
        card:                true,
        square_gift_card:    false,
        bank_account:        false,
        buy_now_pay_later:   false,
        cash_app_pay:        false,
      },
    },
  })
  const invoiceData    = await invoiceRes.json()
  const invoiceId      = invoiceData.invoice?.id
  const invoiceVersion = invoiceData.invoice?.version

  if (!invoiceId) {
    console.error('Failed to create Square invoice:', invoiceData)
    return json({ ok: false, error: 'Failed to create invoice' }, 500)
  }

  // ── 4. Publish → get public_url ───────────────────────────────
  const publishRes  = await sq(`/v2/invoices/${invoiceId}/publish`, {
    idempotency_key: `pub-${deal.id}`,
    version:         invoiceVersion,
  })
  const publishData = await publishRes.json()
  const invoiceUrl  = publishData.invoice?.public_url

  if (!invoiceUrl) {
    console.error('Failed to publish Square invoice:', publishData)
    return json({ ok: false, error: 'Failed to publish invoice' }, 500)
  }

  // ── 5. Save invoice_url back to deal ──────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: updateError } = await supabase
    .from('deals')
    .update({ invoice_url: invoiceUrl })
    .eq('id', deal.id)

  if (updateError) {
    // Invoice exists — log but don't fail
    console.error('Failed to save invoice_url to deal:', updateError)
  }

  // ── 6. Telegram notification ──────────────────────────────────
  const tgToken  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const tgChatId = Deno.env.get('TELEGRAM_CHAT_ID')

  if (tgToken && tgChatId) {
    const text =
      '🧾 Invoice created\n\n' +
      'Deal: '    + deal.name + '\n' +
      'Amount: $' + Number(deal.value).toFixed(2) + ' + 3.4% tax\n' +
      'Client: '  + deal.email + '\n\n' +
      '💳 ' + invoiceUrl + '\n\n' +
      '👉 https://justinkuzmanich.github.io/blu-sky-pipeline/'

    try {
      await fetch('https://api.telegram.org/bot' + tgToken + '/sendMessage', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text }),
      })
    } catch (err) {
      console.error('Telegram notification failed:', err)
    }
  }

  // ── 7. Create Gmail draft ─────────────────────────────────────
  const gmailClientId     = Deno.env.get('GMAIL_CLIENT_ID')
  const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')
  const gmailRefreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')

  if (!gmailClientId || !gmailClientSecret || !gmailRefreshToken) {
    console.warn('Gmail env vars not set — draft skipped')
  } else {
    try {
      // Exchange refresh token for access token
      const tokenRes  = await fetch('https://oauth2.googleapis.com/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id:     gmailClientId,
          client_secret: gmailClientSecret,
          refresh_token: gmailRefreshToken,
          grant_type:    'refresh_token',
        }),
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.access_token) {
        console.error('Failed to get Gmail access token:', tokenData)
      } else {
        const firstName = deal.name.trim().split(' ')[0]
        const emailBody =
          `Hi ${firstName},\n\n` +
          `Thanks for reaching out to Blu Sky Films. Here is a link to your invoice, once paid, your ${typeLabel} is booked and we are all set to go.\n\n` +
          `${invoiceUrl}\n\n` +
          `Looking forward to creating some engaging marketing with you!\n\n` +
          `Best,\nJustin`

        const rawEmail = [
          `From: justin@bluskyfilms.com`,
          `To: ${deal.email}`,
          `Subject: Your ${typeLabel} Invoice — Blu Sky Films`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          emailBody,
        ].join('\r\n')

        // Base64url encode for Gmail API
        const bytes  = new TextEncoder().encode(rawEmail)
        let binary   = ''
        bytes.forEach(b => binary += String.fromCharCode(b))
        const raw    = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

        const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ message: { raw } }),
        })

        if (!draftRes.ok) {
          console.error('Failed to create Gmail draft:', await draftRes.text())
        } else {
          console.log('Gmail draft created for', deal.email)
        }
      }
    } catch (err) {
      console.error('Gmail draft failed:', err)
    }
  }

  return json({ ok: true, invoice_url: invoiceUrl })
})
