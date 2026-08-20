-- Development/editorial seed: shopping guides only.
-- Never invent physical product tests or fake review counts.

insert into public.articles (
  article_type,
  title,
  slug,
  excerpt,
  body,
  methodology,
  author_name,
  status,
  published_at
)
values
  (
    'guide',
    'Så använder du rabattkoder utan att bli lurad',
    'sa-anvander-du-rabattkoder',
    'En kort guide till hur rabattkoder fungerar, vad du ska kolla innan du handlar och hur braerbjudanden.se visar att en kod fortfarande gäller.',
    $body$En rabattkod är bara värd något om den faktiskt går att använda i kassan. På braerbjudanden.se visar vi därför utgångsdatum, villkor och när koden senast verifierades.

Så använder du koden
1. Kopiera koden från erbjudandet.
2. Gå vidare till butiken via vår länk.
3. Lägg varorna i varukorgen.
4. Klistra in koden i kassan innan du betalar.

Vad du bör läsa i villkoren
Många koder gäller bara över ett visst belopp, bara på utvalda varor eller bara för nya kunder. Om något av det står i villkoren syns det på erbjudandet – inte gömt i finstilt efter klick.

När en kod har gått ut
Utgångna erbjudanden tas bort från aktiva listor, men den gamla adressen kan ligga kvar så att du hittar nya deals från samma butik. Vi visar då tydligt att erbjudandet har gått ut.

Hur vi tänker kring tillit
Vi fabricerar inte “fungerar för 98 %”. En synlig framgångsprocent visas först när tillräckligt många har svarat på om koden fungerade.$body$,
    'editorial_evaluation',
    'braerbjudanden.se',
    'published',
    now()
  ),
  (
    'guide',
    'Så förbereder du Black Friday-shoppingen',
    'sa-forbereder-du-black-friday',
    'En evergreen checklista för Black Friday, Black Week och Cyber Monday – utan att lova priser vi inte kan bevisa.',
    $body$Black Friday och Black Week är högsäsong för rabatter, men också för brus. Den här guiden hjälper dig att förbereda köpen utan att jaga varje blinkande banner.

Innan rean börjar
- Skriv en kort lista på det du faktiskt behöver.
- Spara butiker du litar på under /butiker.
- Kolla om det finns en relevant kategori under /kategorier.

Under rean
Jämför inte bara procent. En skyltad 50 % rabatt kan vara sämre än en tydlig kampanj på en produkt du ändå skulle köpt. Deal Score på braerbjudanden.se är vår ranking utifrån rabatt, aktualitet och verifiering – inte ett historiskt lägsta pris.

Efter rean
Mellandagsrea och Cyber Monday kan vara bättre för vissa kategorier. Om ett erbjudande hunnit gå ut tar vi bort det från aktiva listor och pekar vidare till nya deals från samma butik.$body$,
    'editorial_evaluation',
    'braerbjudanden.se',
    'published',
    now()
  )
on conflict (slug) do nothing;
