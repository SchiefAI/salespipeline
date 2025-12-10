# Pipeline - Sales Overview

Een simpele, persoonlijke sales pipeline app geïnspireerd door Pipedrive. Geeft direct overzicht van waar je sales acties nodig zijn.

![Pipeline Screenshot](./docs/screenshot-pipeline.png)
*Screenshot: voeg hier een screenshot toe van de pipeline view*

![Login Screenshot](./docs/screenshot-login.png)
*Screenshot: voeg hier een screenshot toe van het login scherm*

## Features

- 🔐 Google OAuth authenticatie via Supabase
- 📊 Kanban-style pipeline met 7 fases
- 💰 Deal overzicht met bedragen en laatste activiteit
- 🔄 Verplaats deals tussen fases
- ➕ Voeg nieuwe deals toe
- 📱 Responsive design (desktop & mobiel)

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v6
- **Backend:** Supabase (Auth + Database)
- **Hosting:** Vercel of Netlify

---

## Lokaal opstarten

### 1. Clone en installeer

```bash
git clone <your-repo-url>
cd salespipeline
npm install
```

### 2. Supabase project opzetten

1. Ga naar [supabase.com](https://supabase.com) en maak een nieuw project
2. Wacht tot het project klaar is (~2 minuten)

### 3. Database tabellen aanmaken

Ga naar **SQL Editor** in je Supabase dashboard en voer onderstaande SQL uit:

```sql
-- Deals tabel
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stage_id TEXT NOT NULL,
  organization TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor snelle queries per user
CREATE INDEX deals_user_id_idx ON deals(user_id);
CREATE INDEX deals_stage_id_idx ON deals(stage_id);

-- Row Level Security inschakelen
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: gebruikers zien alleen hun eigen deals
CREATE POLICY "Users can view own deals"
  ON deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals"
  ON deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals"
  ON deals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deals"
  ON deals FOR DELETE
  USING (auth.uid() = user_id);
```

### 4. Google OAuth configureren

1. Ga naar [Google Cloud Console](https://console.cloud.google.com)
2. Maak een nieuw project (of gebruik een bestaand project)
3. Ga naar **APIs & Services > Credentials**
4. Klik **Create Credentials > OAuth client ID**
5. Kies **Web application**
6. Voeg toe bij **Authorized redirect URIs:**
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
7. Kopieer je **Client ID** en **Client Secret**

8. In Supabase dashboard, ga naar **Authentication > Providers**
9. Schakel **Google** in
10. Plak je Client ID en Client Secret
11. Sla op

### 5. Environment variables

Maak een `.env` bestand in de root:

```bash
cp .env.example .env
```

Vul de waardes in (te vinden in Supabase: **Settings > API**):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Starten

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Vercel

1. Push je code naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en importeer je repository
3. Voeg environment variables toe:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

5. **Belangrijk:** Voeg je Vercel URL toe aan Google OAuth redirect URIs:
   ```
   https://your-app.vercel.app
   ```

6. En in Supabase onder **Authentication > URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Netlify

Zelfde stappen als Vercel, maar bij Netlify.

---

## Project structuur

```
src/
├── components/
│   ├── auth/
│   │   └── AuthGuard.tsx       # Route protection + useAuth hook
│   ├── layout/
│   │   └── AppShell.tsx        # Header + user menu
│   └── pipeline/
│       ├── PipelineBoard.tsx   # Main board with data fetching
│       ├── StageColumn.tsx     # Single stage column
│       ├── DealCard.tsx        # Individual deal card
│       └── NewDealForm.tsx     # Modal form for new deals
├── lib/
│   └── supabaseClient.ts       # Supabase client instance
├── pages/
│   ├── LoginPage.tsx           # Google OAuth login
│   └── PipelinePage.tsx        # Main pipeline view
├── types/
│   ├── deal.ts                 # Deal types
│   └── stage.ts                # Stage types + constants
├── App.tsx                     # Route definitions
├── main.tsx                    # Entry point
└── index.css                   # Tailwind + custom styles
```

---

## Uitbreidingsmogelijkheden

Ideeën voor toekomstige features:

- [ ] Deal details pagina met notities
- [ ] Drag & drop tussen kolommen (met @dnd-kit)
- [ ] Filters (op bedrag, datum, etc.)
- [ ] Export naar CSV
- [ ] Meerdere pipelines
- [ ] Team support (meerdere gebruikers)
- [ ] Email notificaties voor inactieve deals
- [ ] Dashboard met statistieken

---

## License

MIT
