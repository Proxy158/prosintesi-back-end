// receive-order — Stub predisposto per e-commerce monoprodotti
// Quando avrai STRIPE_SECRET_KEY, questa function creerà ordini + sessioni Stripe Checkout

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')

  if (!stripeKey) {
    console.warn('[RECEIVE-ORDER] STRIPE_SECRET_KEY non configurata. E-commerce non attivo.')
    return new Response(
      JSON.stringify({ warning: 'Stripe non configurato. Aggiungi STRIPE_SECRET_KEY nelle env vars.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // TODO: implementare logica completa quando si attiva il progetto monoprodotti
  // 1. Validare payload cliente
  // 2. Calcolare totale (prodotto × qty + spedizione)
  // 3. Inserire ordine in tabella [stato = 'pending']
  // 4. Creare Stripe Checkout Session
  // 5. Aggiornare ordine con stripe_session_id e stripe_checkout_url
  // 6. Restituire { checkout_url } al frontend

  return new Response(
    JSON.stringify({ message: 'receive-order stub attivo. Implementazione completa nel prossimo step.' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
