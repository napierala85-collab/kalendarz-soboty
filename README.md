# Kalendarz sobót — Netlify (READY)

Funkcje:
- Dostęp po haśle (login → JWT)
- Zapisy na **soboty** (od dziś do **2030-12-31**)
- **Lista zamykana** w **piątki 11:00** (czas PL) — UI blokuje przycisk, backend egzekwuje
- Admin (hasło): **edycja/usuwanie** wpisów
- Trwałość danych: **Netlify Blobs** (z bezpieczną inicjalizacją)
- UI: wybór **roku/miesiąca**, responsywne karty, **timestamp** przy każdym wpisie

## Szybki start
```
npm i -g netlify-cli
npm i
netlify dev
```

## Deploy na Netlify
1. Podłącz repo (Import from Git) i ustaw build:
   - Build: `npm run build`
   - Publish: `dist`
   - Functions: `netlify/functions`
2. W **Site settings → Environment variables** ustaw:
   - `SITE_PASSWORD` — hasło użytkowników
   - `JWT_SECRET` — długi losowy sekret (JWT)
   - `ADMIN_PASSWORD` — tajne hasło admina (edycja/usuwanie)
   - `TZ=Europe/Warsaw` — poprawna strefa dla „piątek 11:00”
   - (Jeśli trzeba ręcznie) `NETLIFY_SITE_ID` i `NETLIFY_AUTH_TOKEN` — dla Blobs
3. **Deploys → Trigger deploy → Clear cache and deploy site**

## API (skrót)
- `POST /api/login` → `{ password }` → `{ token }`
- `GET /api/signups` (JWT)
- `POST /api/signups` (JWT) → `date, name, note` → dodaje wpis z `ts` (timestamp)
- `PUT /api/signups` (JWT + `X-Admin-Password`) → edycja po `ts`
- `DELETE /api/signups` (JWT + `X-Admin-Password`) → usunięcie po `ts`

## Lokalnie (env)
Skopiuj `.env.example` → `.env` i uzupełnij wartości. Dla `netlify dev` możesz też użyć:
```
netlify env:set SITE_PASSWORD "..."
netlify env:set JWT_SECRET "..."
netlify env:set ADMIN_PASSWORD "..."
netlify env:set TZ "Europe/Warsaw"
netlify env:set NETLIFY_SITE_ID "..."
netlify env:set NETLIFY_AUTH_TOKEN "..."
```

Miłego korzystania! ✨