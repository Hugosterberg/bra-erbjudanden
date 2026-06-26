import type { Tables } from "@/shared/types/database";

export type Store = Tables<"stores">;

export type StoreStatus = Store["status"];
