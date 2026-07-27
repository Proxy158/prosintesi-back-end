# prosintesi-back-end

Backend unificato per **Prosintesi** (lead) e futuro **E-Commerce Monoprodotti**.

> **Regola d'oro:** `receive-lead` NON si tocca. Funziona perfettamente così com'è.

---

## 📁 Struttura

```
prosintesi-back-end/
├── .env.example                          # Template variabili d'ambiente
├── README.md
└── supabase/
    ├── functions/
    │   ├── process-lead/                 # ✅ ATTIVA — assegnazione lead + Resend + Brevo
    │   │   └── index.ts
    │   ├── receive-order/              # ⏳ STUB — carrello e-commerce (attiva con STRIPE_SECRET_KEY)
    │   │   └── index.ts
    │   └── stripe-webhook/             # ⏳ STUB — eventi Stripe (attiva con STRIPE_WEBHOOK_SECRET)
    │       └── index.ts
    └── migrations/
        └── 001_create_triggers.sql       # Trigger PostgreSQL per le 6 tabelle lead
```

---

## 🔑 Variabili d'Ambiente

Vai su **Supabase Dashboard → Project Settings → Edge Functions → Environment Variables**.

| Variabile | Stato | Descrizione |
|-----------|-------|-------------|
| `SUPABASE_URL` | ✅ Configurata | URL progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Configurata | Chiave servizio (server-side) |
| `RESEND_API_KEY` | ✅ Configurata | Email transazionali agli agenti |
| `RESEND_FROM_EMAIL` | ✅ Configurata | `onboarding@resend.dev` (cambia quando verifichi dominio) |
| `BREVO_API_KEY` | ⏳ Da aggiungere | Sync contatti marketing |
| `STRIPE_SECRET_KEY` | ⏳ Da aggiungere | Pagamenti e-commerce |
| `STRIPE_WEBHOOK_SECRET` | ⏳ Da aggiungere | Verifica webhook Stripe |

**Nessuna modifica al codice necessaria.** Aggiungi solo la chiave nelle env vars e l'integrazione si attiva automaticamente.

---

## 🚀 Deploy

### Deploy tutte le functions

```bash
supabase login
supabase link --project-ref cadgobdxuqioaghstcry
supabase functions deploy process-lead
supabase functions deploy receive-order
supabase functions deploy stripe-webhook
```

### Oppure deploy singola

```bash
supabase functions deploy process-lead
```

---

## ⚙️ process-lead (ATTIVA)

**Flusso:**
```
Landing Page → receive-lead → DB (lead inserito)
                                      │
                                      ▼ (TRIGGER)
                           ┌─────────────────────┐
                           │  process-lead       │
                           └─────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Assegna Agente      Email (Resend)     Sync Brevo
```

**Cosa fa:**
1. Identifica servizio dal nome tabella
2. Cerca agente attivo con servizio abilitato e sotto `max_lead_giorno`
3. Assegna lead (`agente_assegnato_id` + `status = 'assegnato'`)
4. Se `RESEND_API_KEY` → email all'agente con template HTML
5. Se `BREVO_API_KEY` → sync contatto in Brevo
6. Se chiavi mancanti → logga warning, continua

---

## ⏳ receive-order (STUB — E-commerce)

Si attiva automaticamente quando aggiungi `STRIPE_SECRET_KEY`.

**Flusso futuro:**
```
Carrello → receive-order → Crea ordine (pending)
                                ↓
                         Stripe Checkout Session
                                ↓
                         Redirect cliente su Stripe
                                ↓
                         Pagamento → stripe-webhook → Aggiorna ordine
```

---

## ⏳ stripe-webhook (STUB — E-commerce)

Si attiva automaticamente quando aggiungi `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`.

**Eventi futuri:**
| Evento | Azione |
|--------|--------|
| `checkout.session.completed` | Ordine → `pagato` |
| `payment_intent.payment_failed` | Ordine → `annullato` |
| `charge.refunded` | Ordine → `rimborsato` |

---

## 🧪 Test

```sql
INSERT INTO lead_immobiliare (nome, cognome, email, telefono, privacy, marketing)
VALUES ('Test', 'Resend', 'test@example.com', '3331234567', true, false);
```

Poi controlla i log di `process-lead` su Supabase Dashboard.

---

**Generato il 26 Luglio 2026 — Backend unificato Prosintesi**
