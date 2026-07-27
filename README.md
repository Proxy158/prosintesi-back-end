# prosintesi-back-end

Backend unificato per **Prosintesi** (lead) e futuro **E-Commerce Monoprodotti**.

> **Regola d'oro:** `receive-lead` NON si tocca. Funziona perfettamente così com'è.

---

## 📁 Struttura

```
prosintesi-back-end/
├── .env.example
├── README.md
└── supabase/
    ├── functions/
    │   ├── process-lead/       # ✅ ATTIVA — lead + Resend + Brevo + ARCHIVIO EMAIL
    │   ├── receive-order/      # ⏳ STUB — e-commerce (Stripe)
    │   └── stripe-webhook/     # ⏳ STUB — webhook Stripe
    └── migrations/
        └── 001_create_triggers.sql
```

---

## 🔑 Variabili d'Ambiente

| Variabile | Stato | Descrizione |
|-----------|-------|-------------|
| `SUPABASE_URL` | ✅ | URL progetto |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chiave servizio |
| `RESEND_API_KEY` | ✅ | Email transazionali |
| `RESEND_FROM_EMAIL` | ✅ | `onboarding@resend.dev` |
| `ARCHIVE_EMAIL` | ✅ **NUOVO** | `prosintesi@gmail.com` — ogni email in BCC |
| `BREVO_API_KEY` | ⏳ | Sync contatti marketing |
| `STRIPE_SECRET_KEY` | ⏳ | Pagamenti e-commerce |
| `STRIPE_WEBHOOK_SECRET` | ⏳ | Verifica webhook Stripe |

---

## 📧 Archivio Email (NUOVO)

Ogni email inviata dal sistema (lead agli agenti, notifiche, ecc.) viene automaticamente copiata in **BCC** a `ARCHIVE_EMAIL`.

**Per attivarlo:** aggiungi `ARCHIVE_EMAIL=prosintesi@gmail.com` nelle env vars di Supabase.

Nessuna modifica al codice necessaria.

---

## 🚀 Deploy

```bash
supabase functions deploy process-lead
supabase functions deploy receive-order
supabase functions deploy stripe-webhook
```

---

**Generato il 26 Luglio 2026 — Backend unificato Prosintesi**
