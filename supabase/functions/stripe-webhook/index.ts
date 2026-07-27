// stripe-webhook — Stub predisposto per e-commerce monoprodotti
// Riceve eventi da Stripe e aggiorna gli ordini nel database

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    console.warn('[STRIPE-WEBHOOK] Chiavi Stripe non configurate.')
    return new Response(
      JSON.stringify({ warning: 'Stripe non configurato.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // TODO: implementare quando si attiva il progetto monoprodotti
  // Eventi da gestire:
  // - checkout.session.completed → stato = 'pagato'
  // - payment_intent.payment_failed → stato = 'annullato'
  // - charge.refunded → stato = 'rimborsato'

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
