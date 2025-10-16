# Kalendarz sobót — Netlify

Gotowy projekt do wrzucenia na Netlify. Zawiera:
- Frontend (Vite + React + Tailwind + lucide-react)
- Netlify Functions: `login` (sprawdza hasło) i `signups` (pobieranie/dodawanie zapisów)
- Trwałość danych w Netlify Blob Store

## Szybki start (lokalnie)
1. Zainstaluj zależności:
   ```bash
   npm i
   ```

2. Ustaw zmienne środowiskowe (lokalnie możesz użyć pliku `.env` albo `netlify env:set`):
   - `SITE_PASSWORD` — hasło do strony (np. `netlify env:set SITE_PASSWORD "MojeHaslo123"`)
   - `JWT_SECRET` — sekret do podpisu tokenów (np. `netlify env:set JWT_SECRET "długi-losowy-sekret"`)

3. Uruchom:
   ```bash
   npm run dev
   ```

> Uwaga: wywołania API lokalnie będą działać poprawnie, jeśli użyjesz `netlify dev`, który uruchamia funkcje i przekierowania:
```bash
npm i -g netlify-cli
netlify dev
```

## Deploy na Netlify
1. Utwórz nowy projekt w Netlify i podłącz repo **lub** wgraj ZIP z folderem.
2. W **Site settings → Environment variables** dodaj:
   - `SITE_PASSWORD`
   - `JWT_SECRET`
3. Zatwierdź build (Netlify wykona `npm run build`).
4. Aplikacja będzie dostępna pod Twoją domeną Netlify.
5. API dostępne jest pod:
   - `POST /api/login` — body: `{ "password": "..." }`
   - `GET /api/signups` — nagłówek `Authorization: Bearer <token>`
   - `POST /api/signups` — body: `{ "date": "YYYY-MM-DD", "name": "Imię Nazwisko", "note": "opcjonalne" }` + nagłówek `Authorization: Bearer <token>`

## Bezpieczeństwo
- Hasło **nie** jest osadzone w kliencie; sprawdzane jest na serwerze (Netlify Function).
- Dostęp do odczytu i zapisu wymaga ważnego tokena JWT.
- Pamiętaj, aby trzymać `SITE_PASSWORD` i `JWT_SECRET` jako sekrety w konfiguracji Netlify.

## Dostosowanie UI
- Tailwind CSS → edytuj `src/styles.css` i `tailwind.config.js`.
- Ikony → `lucide-react` (np. zamień/rozszerz zestaw ikon).
- Logika → `src/App.jsx`.

## Limitacje / Notatki
- Każdy, kto zna hasło, może przeglądać i dopisywać się.
- Brak edycji/usuwania wpisów (do dodania według potrzeb).
- Dni generowane są po stronie klienta (wszystkie soboty w ciągu 2 lat od „dziś”). Walidacja daty odbywa się też na serwerze.

Miłego korzystania! ✨

## Tryb administratora (edycja/usuwanie)
- Ustaw zmienną środowiskową `ADMIN_PASSWORD` w Netlify (Site settings → Environment variables).
- W aplikacji, nad listą, wpisz hasło w sekcji „Tryb administratora”.
- Po aktywacji pojawią się przyciski ✏️ (Edytuj) i 🗑 (Usuń) przy każdym wpisie.
- Edycja/Usuwanie działa przez `PUT` / `DELETE` na `/api/signups` z nagłówkiem `X-Admin-Password`.


---
## Netlify Blobs — konfiguracja
Jeśli widzisz błąd `MissingBlobsEnvironmentError`, oznacza to, że Blobs nie są włączone/Skonfigurowane dla strony.

### Produkcja (Netlify Dashboard)
1. Wejdź w **Site settings → Storage & databases → Blobs** i kliknij **Enable** (jeśli dostępne).
2. Zrób **Deploys → Trigger deploy → Clear cache and deploy site**.

### Lokalnie (netlify dev) — manualna konfiguracja
Ustaw zmienne środowiskowe (CLI albo `.env`):
```
NETLIFY_SITE_ID=<ID_twojej_strony>
NETLIFY_AUTH_TOKEN=<token Netlify z konta>
```
Następnie uruchom:
```
netlify dev
```

> Alternatywnie możesz użyć innych nazw (`SITE_ID`, `BLOBS_TOKEN`) – funkcja je również rozpoznaje.
