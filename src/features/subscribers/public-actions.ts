"use server";

import { redirect } from "next/navigation";

import { confirmSubscriberByToken, unsubscribeByToken } from "./subscribe";

export async function confirmSubscriptionAction(formData: FormData) {
  const confirmed = await confirmSubscriberByToken(String(formData.get("token") ?? ""));
  redirect(`/nyhetsbrev/bekrafta?resultat=${confirmed ? "klart" : "ogiltig"}`);
}

export async function unsubscribeAction(formData: FormData) {
  const done = await unsubscribeByToken(String(formData.get("token") ?? ""));
  redirect(`/nyhetsbrev/avregistrera?resultat=${done ? "klart" : "ogiltig"}`);
}
