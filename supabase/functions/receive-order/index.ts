// receive-order — Stub predisposto per e-commerce monoprodotti
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    console.warn('[RECEIVE-ORDER] STRIPE_SECRET_KEY non configurata.')
    return new Response(JSON.stringify({ warning: 'Stripe non configurato.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify({ message: 'receive-order stub attivo.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
