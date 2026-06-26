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
- created_at
- updated_at

### Store

Butik eller varumärke som erbjudandet tillhör.

Viktiga fält:

- id
- name
- slug
- description
- website_url
- logo_url
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
- created_at
- updated_at

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

## Sortering

Standard publikt:

1. Featured först, om relevant.
2. Manuell rank_position.
3. Senast uppdaterad eller skapad som fallback.
