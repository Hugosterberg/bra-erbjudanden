/**
 * Email content as pure functions so that the mandatory parts of a marketing
 * mail (who sent it, that it advertises, how to leave) can be tested.
 */
export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type CampaignOffer = {
  id: string;
  title: string;
  deal: string;
  storeName: string | null;
  discountCode: string | null;
};

export type Sender = {
  siteName: string;
  siteUrl: string;
  companyName: string | null;
  address: string | null;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function senderLine(sender: Sender) {
  return [sender.companyName ?? sender.siteName, sender.address].filter(Boolean).join(", ");
}

function layout(body: string, footer: string) {
  return `<!doctype html><html lang="sv"><body style="margin:0;background:#f5f6f5;font-family:Arial,Helvetica,sans-serif;color:#1c211d"><div style="max-width:560px;margin:0 auto;padding:24px"><div style="background:#ffffff;border-radius:12px;padding:24px">${body}</div><p style="font-size:12px;line-height:18px;color:#5f6861;padding:16px 8px">${footer}</p></div></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#1f7a4d;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 16px;border-radius:8px">${escapeHtml(label)}</a>`;
}

export function buildConfirmationEmail(input: { confirmUrl: string; sender: Sender }): EmailContent {
  const subject = `Bekräfta din prenumeration på ${input.sender.siteName}`;
  const intro = `Tack för att du vill få erbjudanden från ${input.sender.siteName}. Bekräfta din adress så börjar vi skicka.`;
  const notice = "Har du inte anmält dig? Då kan du bortse från det här mejlet, så händer inget mer.";

  return {
    subject,
    html: layout(
      `<h1 style="font-size:20px;margin:0 0 12px">Bekräfta din e-postadress</h1><p style="line-height:22px">${escapeHtml(intro)}</p><p style="margin:20px 0">${button(input.confirmUrl, "Bekräfta prenumerationen")}</p><p style="font-size:13px;line-height:20px;color:#5f6861">${escapeHtml(notice)}</p>`,
      escapeHtml(senderLine(input.sender)),
    ),
    text: `${intro}\n\nBekräfta här: ${input.confirmUrl}\n\n${notice}\n\n${senderLine(input.sender)}`,
  };
}

export function buildCampaignEmail(input: {
  subject: string;
  intro: string | null;
  offers: CampaignOffer[];
  unsubscribeUrl: string;
  sender: Sender;
}): EmailContent {
  const offerUrl = (offer: CampaignOffer) => `${input.sender.siteUrl}/go/${offer.id}`;
  const notice = "Reklam från " + input.sender.siteName + ". Länkarna är annonslänkar och vi kan få provision om du handlar.";

  const offersHtml = input.offers
    .map(
      (offer) =>
        `<div style="border-top:1px solid #e4e7e4;padding:16px 0"><p style="margin:0 0 4px;font-size:13px;color:#5f6861">${escapeHtml(offer.storeName ?? "")}</p><p style="margin:0 0 4px;font-weight:bold;line-height:22px">${escapeHtml(offer.title)}</p><p style="margin:0 0 12px;color:#1f7a4d;font-weight:bold">${escapeHtml(offer.deal)}</p>${offer.discountCode ? `<p style="margin:0 0 12px">Kod: <strong>${escapeHtml(offer.discountCode)}</strong></p>` : ""}${button(offerUrl(offer), "Till erbjudandet")}</div>`,
    )
    .join("");

  const offersText = input.offers
    .map((offer) =>
      [
        offer.storeName,
        offer.title,
        offer.deal,
        offer.discountCode ? `Kod: ${offer.discountCode}` : null,
        offerUrl(offer),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return {
    subject: input.subject,
    html: layout(
      `<p style="font-size:12px;color:#5f6861;margin:0 0 12px">${escapeHtml(notice)}</p>${input.intro ? `<p style="line-height:22px">${escapeHtml(input.intro)}</p>` : ""}${offersHtml}`,
      `${escapeHtml(senderLine(input.sender))}<br>Du får det här mejlet eftersom du har bekräftat en prenumeration. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#5f6861">Avsluta prenumerationen</a>.`,
    ),
    text: `${notice}\n\n${input.intro ? `${input.intro}\n\n` : ""}${offersText}\n\n${senderLine(input.sender)}\nAvsluta prenumerationen: ${input.unsubscribeUrl}`,
  };
}
