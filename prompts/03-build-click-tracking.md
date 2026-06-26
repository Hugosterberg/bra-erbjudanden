# Prompt: bygg klickspårning

Bygg klickspårning för erbjudanden.

Krav:

- Publika CTA-länkar ska gå via intern route, exempel `/go/[offerId]`.
- Servern ska registrera klick i `click_events`.
- Servern ska redirecta till erbjudandets `affiliate_url`.
- Klick ska summeras i admin.
- Lösningen ska vara enkel, robust och integritetsmedveten.
