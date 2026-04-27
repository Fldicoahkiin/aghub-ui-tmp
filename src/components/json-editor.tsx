import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import { useState } from "react";

function flattenJson(
	obj: Record<string, unknown>,
	prefix = "",
): Array<{ key: string; value: unknown }> {
	const result: Array<{ key: string; value: unknown }> = [];

	for (const [k, v] of Object.entries(obj)) {
		const key = prefix ? `${prefix}.${k}` : k;
		if (v !== null && typeof v === "object" && !Array.isArray(v)) {
			result.push(...flattenJson(v as Record<string, unknown>, key));
		} else {
			result.push({ key, value: v });
		}
	}

	return result;
}

function maskString(str: string): string {
	if (str.length <= 8) return "\u2022".repeat(str.length);
	return str.slice(0, 4) + "\u2022".repeat(str.length - 8) + str.slice(-4);
}

export function JsonEditor({ content }: { content: string }) {
	const [mode, setMode] = useState<"formatted" | "raw">("formatted");
	const [rawContent, setRawContent] = useState(content);
	const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

	let parsed: Record<string, unknown> | null = null;
	try {
		parsed = JSON.parse(content);
	} catch {
		// invalid JSON — fall through to raw mode
	}

	return (
		<div className="flex h-full flex-col">
			{/* Mode toggle */}
			<div className="mb-3 flex gap-1">
				<Button
					size="sm"
					variant={mode === "formatted" ? "secondary" : "ghost"}
					onPress={() => setMode("formatted")}
				>
					Formatted
				</Button>
				<Button
					size="sm"
					variant={mode === "raw" ? "secondary" : "ghost"}
					onPress={() => setMode("raw")}
				>
					Raw
				</Button>
			</div>

			{mode === "raw" || !parsed ? (
				<textarea
					value={rawContent}
					onChange={(e) => setRawContent(e.target.value)}
					className="h-full w-full resize-none rounded-md border border-border bg-surface p-3 font-mono text-sm leading-6 text-foreground outline-none focus:border-primary"
					spellCheck={false}
				/>
			) : (
				<div className="space-y-0.5">
					{flattenJson(parsed).map(({ key, value }) => {
						const isSecret =
							typeof key === "string" &&
							(key.toLowerCase().includes("key") ||
								key.toLowerCase().includes("token") ||
								key.toLowerCase().includes("secret"));
						const isShown = showSecret[key] ?? false;
						const displayValue =
							isSecret && !isShown && typeof value === "string"
								? maskString(value)
								: String(value);

						return (
							<div
								key={key}
								className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-secondary"
							>
								<span className="w-48 shrink-0 truncate text-sm text-muted" title={key}>
									{key}
								</span>
								<input
									type={isSecret && !isShown ? "password" : "text"}
									defaultValue={displayValue}
									className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
								/>
								{isSecret && (
									<button
										type="button"
										onClick={() =>
											setShowSecret((prev) => ({
												...prev,
												[key]: !prev[key],
											}))
										}
										className="shrink-0 text-muted hover:text-foreground"
									>
										{isShown ? (
											<EyeSlashIcon className="size-4" />
										) : (
											<EyeIcon className="size-4" />
										)}
									</button>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
