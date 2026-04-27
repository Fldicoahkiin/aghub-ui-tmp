import { CURRENT_VERSION } from "../types";

interface StoreLike {
	get: <T>(key: string) => Promise<T | null>;
	set: (key: string, value: unknown) => Promise<void>;
	save: () => Promise<void>;
}

export async function migrate(store: StoreLike): Promise<void> {
	const version = (await store.get<number>("version")) ?? 0;

	if (version === CURRENT_VERSION) return;

	// In the browser prototype we skip legacy migrations;
	// just bump the version marker.
	await store.set("version", CURRENT_VERSION);
	await store.save();
}
