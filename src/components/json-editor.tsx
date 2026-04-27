import {
	ChevronRightIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import { cn } from "../lib/utils";

/* ------------------------------------------------------------------ */
/*  Tree node types                                                    */
/* ------------------------------------------------------------------ */

interface TreeNode {
	key: string;
	label: string;
	depth: number;
	type: "object" | "array" | "value";
	value?: unknown;
	childCount?: number;
}

function buildTree(
	obj: unknown,
	prefix: string,
	label: string,
	depth: number,
): TreeNode[] {
	const nodes: TreeNode[] = [];

	if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
		const entries = Object.entries(obj as Record<string, unknown>);
		nodes.push({ key: prefix || "root", label, depth, type: "object", childCount: entries.length });
		for (const [k, v] of entries) {
			const childKey = prefix ? `${prefix}.${k}` : k;
			if (v !== null && typeof v === "object") {
				nodes.push(...buildTree(v, childKey, k, depth + 1));
			} else {
				nodes.push({ key: childKey, label: k, depth: depth + 1, type: "value", value: v });
			}
		}
	} else if (Array.isArray(obj)) {
		nodes.push({ key: prefix || "root", label, depth, type: "array", childCount: obj.length });
		for (let i = 0; i < obj.length; i++) {
			const childKey = `${prefix}[${i}]`;
			const item = obj[i];
			if (item !== null && typeof item === "object") {
				nodes.push(...buildTree(item, childKey, `[${i}]`, depth + 1));
			} else {
				nodes.push({ key: childKey, label: `[${i}]`, depth: depth + 1, type: "value", value: item });
			}
		}
	}

	return nodes;
}

function isSecret(key: string): boolean {
	const lower = key.toLowerCase();
	return lower.includes("key") || lower.includes("token") || lower.includes("secret");
}

function maskString(str: string): string {
	if (str.length <= 8) return "\u2022".repeat(str.length);
	return str.slice(0, 4) + "\u2022".repeat(str.length - 8) + str.slice(-4);
}

/* ------------------------------------------------------------------ */
/*  Formatted Tree View                                                */
/* ------------------------------------------------------------------ */

function FormattedView({ content }: { content: string }) {
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

	let parsed: unknown;
	try {
		parsed = JSON.parse(content);
	} catch {
		return <div className="p-3 text-sm text-danger">Invalid JSON</div>;
	}

	const allNodes = buildTree(parsed, "", "root", -1);
	// Skip the synthetic root node
	const nodes = allNodes.slice(1);

	const toggleCollapse = (key: string) => {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	// Determine which nodes are visible (not under a collapsed parent)
	const visible: TreeNode[] = [];
	const collapsedPrefixes: string[] = [];
	for (const node of nodes) {
		const isHidden = collapsedPrefixes.some((p) =>
			node.key.startsWith(p + ".") || node.key.startsWith(p + "["),
		);
		if (isHidden) continue;
		visible.push(node);
		if ((node.type === "object" || node.type === "array") && collapsed.has(node.key)) {
			collapsedPrefixes.push(node.key);
		}
	}

	return (
		<div className="space-y-px">
			{visible.map((node) => {
				const isGroup = node.type === "object" || node.type === "array";
				const isCollapsed = collapsed.has(node.key);
				const secret = node.type === "value" && isSecret(node.label);
				const isShown = showSecret[node.key] ?? false;

				return (
					<div
						key={node.key}
						className={cn(
							"flex items-center gap-1 rounded-sm px-2 py-1 text-[13px] transition-colors",
							isGroup ? "hover:bg-surface-secondary/80" : "hover:bg-surface-secondary/50",
						)}
						style={{ paddingLeft: `${8 + node.depth * 16}px` }}
					>
						{/* Collapse toggle */}
						{isGroup ? (
							<button
								type="button"
								onClick={() => toggleCollapse(node.key)}
								className="flex size-4 shrink-0 items-center justify-center text-muted"
							>
								<ChevronRightIcon className={cn("size-3 transition-transform", !isCollapsed && "rotate-90")} />
							</button>
						) : (
							<span className="size-4 shrink-0" />
						)}

						{/* Label */}
						<span className={cn(
							"shrink-0",
							isGroup ? "font-medium text-foreground" : "text-muted",
						)}>
							{node.label}
						</span>

						{/* Group badge */}
						{isGroup && (
							<span className="ml-1 text-xs text-muted/60">
								{node.type === "array" ? `[${node.childCount}]` : `{${node.childCount}}`}
							</span>
						)}

						{/* Value */}
						{node.type === "value" && (
							<>
								<span className="mx-1 text-muted/40">:</span>
								{secret && !isShown ? (
									<span className="min-w-0 flex-1 truncate font-mono text-muted">
										{typeof node.value === "string" ? maskString(node.value) : String(node.value)}
									</span>
								) : (
									<span className={cn(
										"min-w-0 flex-1 truncate font-mono",
										typeof node.value === "string" ? "text-green-400/80"
											: typeof node.value === "number" ? "text-blue-400/80"
											: typeof node.value === "boolean" ? "text-yellow-400/80"
											: "text-foreground",
									)}>
										{typeof node.value === "string" ? `"${node.value}"` : String(node.value)}
									</span>
								)}
								{secret && (
									<button
										type="button"
										onClick={() => setShowSecret((prev) => ({ ...prev, [node.key]: !prev[node.key] }))}
										className="shrink-0 text-muted/60 hover:text-foreground"
									>
										{isShown ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
									</button>
								)}
							</>
						)}
					</div>
				);
			})}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function JsonEditor({ content }: { content: string }) {
	const [mode, setMode] = useState<"formatted" | "raw">("formatted");
	const [rawContent, setRawContent] = useState(content);

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex gap-1">
				<Button size="sm" variant={mode === "formatted" ? "secondary" : "ghost"} onPress={() => setMode("formatted")}>
					Formatted
				</Button>
				<Button size="sm" variant={mode === "raw" ? "secondary" : "ghost"} onPress={() => setMode("raw")}>
					Raw
				</Button>
			</div>

			{mode === "raw" ? (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="json"
						value={rawContent}
						onChange={(value) => setRawContent(value ?? "")}
						theme="vs-dark"
						options={{
							minimap: { enabled: false },
							fontSize: 13,
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							wordWrap: "on",
							tabSize: 2,
							formatOnPaste: true,
							automaticLayout: true,
							padding: { top: 12 },
						}}
					/>
				</div>
			) : (
				<div className="min-h-0 flex-1 overflow-y-auto">
					<FormattedView content={content} />
				</div>
			)}
		</div>
	);
}
