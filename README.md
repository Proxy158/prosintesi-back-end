# prosintesi-back-end

Backend del progetto **Saturata** — assegnazione automatica lead, notifiche email (Resend) e sincronizzazione contatti (Brevo).

> **Regola d'oro:** `receive-lead` NON si tocca. Funziona perfettamente così com'è.

---

## Struttura

```
prosintesi-back-end/
├── README.md
└── supabase/
    ├── functions/
    │   └── process-lead/
    │       └── index.ts          # Edge Function
    └── migrations/
        └── 001_create_triggers.sql  # Trigger PostgreSQL per le 6 tabelle lead
```

---

## Deploy passo-passo

### 1. Prerequisiti

- [Supabase CLI](https://supabase.com/docs/guides/cli) installato
- Account GitHub con accesso all'organizzazione `Proxy158`

### 2. Clona / crea la repo

```bash
git clone https://github.com/Proxy158/prosintesi-back-end.git
cd prosintesi-back-end
```

Se la repo non esiste ancora, creala su GitHub e poi:

```bash
git init
git remote add origin https://github.com/Proxy158/prosintesi-back-end.git
```

### 3. Linka il progetto Supabase

```bash
supabase login
supabase link --project-ref cadgobdxuqioaghstcry
```

### 4. Configura le variabili d'ambiente

Vai su **Supabase Dashboard** → *Project Settings* → *Edge Functions* → *Environment Variables* e aggiungi:

| Variabile | Valore | Obbligatoria |
|-----------|--------|--------------|
| `SUPABASE_URL` | `https://cadgobdxuqioaghstcry.supabase.co` | Sì |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Sì |
| `RESEND_API_KEY` | `re_xxxxxxxx` | No — logga warning se mancante |
| `BREVO_API_KEY` | `xkeysib-xxxxxxxx` | No — logga warning se mancante |

> Le API key di Resend e Brevo sono **facoltative per ora**. Il codice funziona comunque: assegna l'agente e logga un warning in console.

### 5. Deploy della Edge Function

```bash
supabase functions deploy process-lead
```

### 6. Abilita l'estensione `pg_net`

L'estensione `pg_net` permette a PostgreSQL di fare richieste HTTP (necessaria per chiamare la Edge Function dai trigger).

Vai su **Supabase Dashboard** → *Database* → *Extensions* → cerca `pg_net` → abilitala.

Oppure esegui nello **SQL Editor**:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 7. Esegui le migrazioni SQL

Apri **Supabase SQL Editor** → *New query* → incolla il contenuto di:

```
supabase/migrations/001_create_triggers.sql
```

→ Clicca **Run**.

Questo crea:
- La funzione `trigger_process_lead()`
- I 6 trigger `AFTER INSERT` sulle tabelle lead

---

## Come funziona

```
Landing Page → receive-lead → Supabase DB (lead inserito)
                                      │
                                      ▼ (TRIGGER PostgreSQL)
                           ┌─────────────────────┐
                           │  Edge Function      │
                           │  "process-lead"     │  ← repo separata
                           └─────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Assegna Agente      Email (Resend)     Sync Brevo
```

1. `receive-lead` scrive il lead nel DB (una delle 6 tabelle).
2. Il **trigger PostgreSQL** scatta su `AFTER INSERT` e chiama in modo asincrono `process-lead` via `pg_net`.
3. `process-lead`:
   - Identifica il servizio dal nome della tabella
   - Cerca un agente `attivo` con il servizio abilitato e sotto il `max_lead_giorno`
   - Assegna il lead (`agente_assegnato_id` + `status = 'assegnato'`)
   - Se `RESEND_API_KEY` è presente → invia email all'agente
   - Se `BREVO_API_KEY` è presente → aggiunge/sincronizza il contatto in Brevo
   - Se le API key mancano → logga warning e continua comunque

---

## Test rapido

1. Inserisci un lead di test in una tabella (es. `lead_immobiliare`):

```sql
INSERT INTO lead_immobiliare (nome, cognome, email, telefono, privacy, marketing)
VALUES ('Mario', 'Rossi', 'test@example.com', '3331234567', true, false);
```

2. Vai su **Supabase Dashboard** → *Edge Functions* → *process-lead* → **Logs** e verifica:
   - Assegnazione agente
   - Eventuale warning Resend/Brevo

3. Controlla che il record abbia `status = 'assegnato'` e `agente_assegnato_id` popolato.

---

## Note

- `pg_net` è **asincrono**: il trigger non attende la risposta della Edge Function. Il lead viene scritto immediatamente; l'assegnazione avviene qualche istante dopo.
- Se nessun agente è disponibile (tutti inattivi o sopra il limite giornaliero), il lead resta con `status = 'nuovo'` e `agente_assegnato_id = NULL`.
- Per aggiungere un dominio verificato su Resend, vai su [resend.com](https://resend.com) e aggiorna il campo `from` nella Edge Function.
- Per Brevo, configura le `listIds` desiderate nella Edge Function quando avrai le API key.

---

**Generato il 26 Luglio 2026 — Fase 2 Saturata**
