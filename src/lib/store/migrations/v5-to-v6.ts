interface Store { get: <T>(key: string) => Promise<T | null>; set: (key: string, value: unknown) => Promise<void>; save: () => Promise<void>; }
import { DEFAULT_SIDEBAR_ITEMS } from "../types";

export async function migrateV5ToV6(store: Store): Promise<void> {
	await store.set("sidebarItems", DEFAULT_SIDEBAR_ITEMS);
}
