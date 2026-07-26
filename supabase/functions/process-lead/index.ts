import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadRecord {
  id: string
  nome?: string
  cognome?: string
  email?: string
  telefono?: string
  fonte?: string
  [key: string]: any
}

const SERVICE_MAP: Record<string, string> = {
  lead_immobiliare: 'immobiliare',
  lead_fotovoltaico: 'fotovoltaico',
  lead_cessione_quinto: 'cessione_quinto',
  lead_mutui: 'mutui',
  lead_climatizzazione: 'climatizzazione',
  lead_efficienza_energetica: 'efficienza_energetica',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { table, record }: { table: string; record: LeadRecord } = await req.json()

    const servizio = SERVICE_MAP[table]
    if (!servizio) {
      console.error(`[PROCESS-LEAD] Tabella non riconosciuta: ${table}`)
      return new Response(JSON.stringify({ error: 'Tabella non riconosciuta' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti nelle env vars')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // --- 1. Trova agenti attivi per questo servizio ---
    const { data: agents, error: agentsError } = await supabase
      .from('agenti')
      .select('*')
      .eq('status', 'attivo')
      .contains('servizi_abilitati', [servizio])
      .order('performance_score', { ascending: false })

    if (agentsError) throw agentsError

    if (!agents || agents.length === 0) {
      console.warn(`[PROCESS-LEAD] Nessun agente attivo per servizio: ${servizio}`)
      return new Response(JSON.stringify({ warning: 'Nessun agente disponibile' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 2. Filtra per max_lead_giorno ---
    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00+00:00`
    const todayEnd = `${today}T23:59:59+00:00`

    let assignedAgent = null

    for (const agent of agents) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('agente_assegnato_id', agent.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)

      if (countError) {
        console.error(`[PROCESS-LEAD] Errore conteggio lead agente ${agent.id}:`, countError)
        continue
      }

      const maxLeads = agent.max_lead_giorno ?? 10
      if ((count || 0) < maxLeads) {
        assignedAgent = agent
        break
      }
    }

    if (!assignedAgent) {
      console.warn(`[PROCESS-LEAD] Tutti gli agenti hanno raggiunto il limite giornaliero per ${servizio}`)
      return new Response(JSON.stringify({ warning: 'Limite giornaliero raggiunto per tutti gli agenti' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 3. Assegna il lead ---
    const { error: updateError } = await supabase
      .from(table)
      .update({
        agente_assegnato_id: assignedAgent.id,
        status: 'assegnato',
      })
      .eq('id', record.id)

    if (updateError) throw updateError

    console.log(`[SATURATA] Lead ${record.id} (${servizio}) → Agente ${assignedAgent.id} (${assignedAgent.email})`)

    // --- 4. Email via Resend ---
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Saturata <noreply@saturata.it>',
            to: assignedAgent.email,
            subject: `Nuovo lead ${servizio} — ${record.nome || ''} ${record.cognome || ''}`,
            html: `
              <h2>Nuovo lead assegnato</h2>
              <p><strong>Servizio:</strong> ${servizio}</p>
              <p><strong>Nome:</strong> ${record.nome || 'N/D'} ${record.cognome || ''}</p>
              <p><strong>Email:</strong> ${record.email || 'N/D'}</p>
              <p><strong>Telefono:</strong> ${record.telefono || 'N/D'}</p>
              <p><strong>Fonte:</strong> ${record.fonte || 'N/D'}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
              <hr>
              <p><small>Generato automaticamente da Saturata</small></p>
            `,
          }),
        })

        if (!emailRes.ok) {
          console.error('[RESEND] Errore invio email:', await emailRes.text())
        } else {
          console.log('[RESEND] Email inviata a', assignedAgent.email)
        }
      } catch (e) {
        console.error('[RESEND] Eccezione:', e)
      }
    } else {
      console.warn('[RESEND] RESEND_API_KEY non configurata. Email non inviata.')
    }

    // --- 5. Sync contatto Brevo ---
    const brevoKey = Deno.env.get('BREVO_API_KEY')
    if (brevoKey) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: record.email,
            attributes: {
              NOME: record.nome || '',
              COGNOME: record.cognome || '',
              TELEFONO: record.telefono || '',
              SERVIZIO: servizio,
              FONTESITO: record.fonte || '',
            },
            listIds: [],
            updateEnabled: true,
          }),
        })

        if (!brevoRes.ok && brevoRes.status !== 409) {
          console.error('[BREVO] Errore sync contatto:', await brevoRes.text())
        } else {
          console.log('[BREVO] Contatto sincronizzato:', record.email)
        }
      } catch (e) {
        console.error('[BREVO] Eccezione:', e)
      }
    } else {
      console.warn('[BREVO] BREVO_API_KEY non configurata. Contatto non sincronizzato.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        agente_id: assignedAgent.id,
        agente_email: assignedAgent.email,
        servizio,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[PROCESS-LEAD] Errore generale:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
