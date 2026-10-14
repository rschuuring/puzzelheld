# Puzzelheld

Een oefenapp voor fluide redeneren (puzzels, weegschalen, reeksen, logica) in een superhelden-spelwereld.

- `index.html` is de complete app (wordt gehost met GitHub Pages).
- `src/` bevat de bron: `app.template.html` en de puzzelmaker `generator.js`. `index.html` wordt daaruit gebouwd.
- `supabase/setup.sql` maakt de tabel voor de online opslag (met Row Level Security: elk account ziet alleen zijn eigen gegevens).

De app bevat geen geheimen: de Supabase-sleutel in `index.html` is de publieke anon key. Voortgang en wachtwoorden staan niet in deze repository.
