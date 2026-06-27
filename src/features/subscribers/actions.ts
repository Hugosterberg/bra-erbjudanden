"use server";

import { initialSubscriberState, registerDealSubscriber, type SubscriberResult } from "./subscribe";

export { initialSubscriberState };

export async function subscribeToDealsAction(
  _state: SubscriberResult,
  formData: FormData,
): Promise<SubscriberResult> {
  return registerDealSubscriber(formData);
}
