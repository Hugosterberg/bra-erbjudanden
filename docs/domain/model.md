# Domänmodell

## Kärnobjekt

### Offer

Ett erbjudande som visas på sajten.

Viktiga fält:

- id
- title
- slug
- description
- store_id
- category_id
- discount_type: percentage | fixed_amount
- discount_value
- discount_code
- affiliate_url
- starts_at
- ends_at
- status: draft | published | archived
- rank_position
- is_featured
- is_sponsored
- last_verified_at
- original_price / current_price
- created_at
- updated_at

### Store

Butik eller varumärke som erbjudandet tillhör.

Viktiga fält:

- id
- name
- slug
- description
- seo_intro
- saving_tips
- website_url
- affiliate_url
- logo_url
- is_featured
- status
- created_at
- updated_at

### Category

Kategori för att gruppera erbjudanden.

Viktiga fält:

- id
- name
- slug
- description
- seo_intro
- created_at
- updated_at

### Product

Produkt som kan recenseras eller jämföras i Bäst i test.

### Article

Redaktionellt innehåll: Bäst i test, recension eller guide.

### CouponFeedback

Anonym röst (ja/nej) per erbjudande och IP-hash.

### DiscoveryEvent

Förstapartshändelser som deal_view, coupon_copy, search och newsletter_signup.

### ClickEvent

Registrerat klick på ett erbjudande.

Viktiga fält:

- id
- offer_id
- store_id
- clicked_at
- referrer
- user_agent
- ip_hash

## Rabattlogik

Första versionen ska fokusera på:

- Procentuell rabatt, exempel: 20 % rabatt.
- Fast belopp, exempel: 150 kr rabatt.

Fri frakt ska inte vara huvudcase i första versionen.

## Publiceringslogik

Ett erbjudande ska visas publikt när:

- status är `published`
- starts_at är tomt eller passerat
- ends_at är tomt eller framtida

Utgångna URL:er kan ligga kvar med tydlig “har gått ut”-status.

## Sortering

Standard publikt:

1. Featured först, om relevant.
2. Manuell rank_position.
3. Senast uppdaterad eller skapad som fallback.

Deal Score är en separat ranking och påverkas inte av sponsring.
