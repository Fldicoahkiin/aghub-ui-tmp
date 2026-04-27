import {
	ArrowTopRightOnSquareIcon,
	ChevronRightIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../lib/utils";
import { AGHUB_DARK_THEME } from "./monaco-theme";

/* ------------------------------------------------------------------ */
/*  Semantic sections — classify top-level keys into blocks            */
/* ------------------------------------------------------------------ */

interface SectionDef {
	id: string;
	label: string;
	keys: Set<string>;
	linkTo?: string;
	/** i18n key for the navigation button label */
	linkLabelKey?: string;
}

const SECTION_DEFS: SectionDef[] = [
	{
		id: "provider",
		label: "Provider",
		keys: new Set(["model", "baseUrl", "base_url", "apiBaseUrl", "api_base_url", "apiKey", "api_key", "primaryApiKey"]),
		linkTo: "/inference-providers",
		linkLabelKey: "inferenceProviders",
	},
	{
		id: "permissions",
		label: "Permissions",
		keys: new Set(["permissions"]),
	},
	{
		id: "hooks",
		label: "Hooks",
		keys: new Set(["hooks"]),
	},
	{
		id: "plugins",
		label: "Plugins",
		keys: new Set(["enabledPlugins", "plugin", "pluginConfig"]),
		linkTo: "/plugins",
		linkLabelKey: "plugins",
	},
	{
		id: "mcp",
		label: "MCP",
		keys: new Set(["mcp", "mcp_servers", "mcpServers"]),
		linkTo: "/mcp",
		linkLabelKey: "mcpServers",
	},
	{
		id: "provider-config",
		label: "Provider Config",
		keys: new Set(["provider", "providers"]),
		linkTo: "/inference-providers",
		linkLabelKey: "inferenceProviders",
	},
];

interface Section {
	def: SectionDef | null;
	entries: [string, unknown][];
}

function classifyEntries(obj: Record<string, unknown>): Section[] {
	const sections: Section[] = [];
	const claimed = new Set<string>();

	for (const sectionDef of SECTION_DEFS) {
		const entries: [string, unknown][] = [];
		for (const [k, v] of Object.entries(obj)) {
			if (sectionDef.keys.has(k) && !claimed.has(k)) {
				entries.push([k, v]);
				claimed.add(k);
			}
		}
		if (entries.length > 0) {
			sections.push({ def: sectionDef, entries });
		}
	}

	// Remaining keys → "General"
	const remaining: [string, unknown][] = [];
	for (const [k, v] of Object.entries(obj)) {
		if (!claimed.has(k)) remaining.push([k, v]);
	}
	if (remaining.length > 0) {
		sections.unshift({ def: null, entries: remaining });
	}

	return sections;
}

/* ------------------------------------------------------------------ */
/*  Tree node rendering                                                */
/* ------------------------------------------------------------------ */

interface TreeNode {
	key: string;
	label: string;
	depth: number;
	type: "object" | "array" | "value";
	value?: unknown;
	childCount?: number;
}

function buildNodes(key: string, label: string, value: unknown, depth: number): TreeNode[] {
	const nodes: TreeNode[] = [];
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		const entries = Object.entries(value as Record<string, unknown>);
		nodes.push({ key, label, depth, type: "object", childCount: entries.length });
		for (const [k, v] of entries) {
			nodes.push(...buildNodes(`${key}.${k}`, k, v, depth + 1));
		}
	} else if (Array.isArray(value)) {
		nodes.push({ key, label, depth, type: "array", childCount: value.length });
		for (let i = 0; i < value.length; i++) {
			nodes.push(...buildNodes(`${key}[${i}]`, `[${i}]`, value[i], depth + 1));
		}
	} else {
		nodes.push({ key, label, depth, type: "value", value });
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
/*  Section block                                                      */
/* ------------------------------------------------------------------ */

function SectionBlock({
	section,
	onNavigate,
}: {
	section: Section;
	onNavigate?: (href: string) => void;
}) {
	const { t } = useTranslation();
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
	const [editingKey, setEditingKey] = useState<string | null>(null);

	const allNodes: TreeNode[] = [];
	for (const [k, v] of section.entries) {
		if (v !== null && typeof v === "object") {
			allNodes.push(...buildNodes(k, k, v, 0));
		} else {
			allNodes.push({ key: k, label: k, depth: 0, type: "value", value: v });
		}
	}

	const toggleCollapse = (key: string) => {
		setCollapsed((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
	};

	const visible: TreeNode[] = [];
	const collapsedPrefixes: string[] = [];
	for (const node of allNodes) {
		const isHidden = collapsedPrefixes.some((p) => node.key.startsWith(p + ".") || node.key.startsWith(p + "["));
		if (isHidden) continue;
		visible.push(node);
		if ((node.type === "object" || node.type === "array") && collapsed.has(node.key)) {
			collapsedPrefixes.push(node.key);
		}
	}

	const def = section.def;

	return (
		<div className="rounded-lg border border-border bg-surface">
			{/* Tree rows with optional link floated top-right */}
			<div className="relative py-1">
				{def?.linkTo && def.linkLabelKey && onNavigate && (
					<div className="absolute right-2 top-1 z-10">
						<Button variant="ghost" size="sm" onPress={() => onNavigate(def.linkTo!)}>
							<ArrowTopRightOnSquareIcon className="size-3.5" />
							{t(def.linkLabelKey)}
						</Button>
					</div>
				)}
				{visible.map((node) => {
					const isGroup = node.type === "object" || node.type === "array";
					const isCollapsed = collapsed.has(node.key);
					const secret = node.type === "value" && isSecret(node.label);
					const isShown = showSecret[node.key] ?? false;
					const isEditing = editingKey === node.key;

					return (
						<div
							key={node.key}
							className={cn(
								"flex items-center gap-1 px-2 py-1 text-[13px] transition-colors",
								isGroup ? "hover:bg-surface-secondary/60" : "hover:bg-surface-secondary/40",
							)}
							style={{ paddingLeft: `${8 + node.depth * 16}px` }}
						>
							{isGroup ? (
								<button type="button" onClick={() => toggleCollapse(node.key)} className="flex size-4 shrink-0 items-center justify-center text-muted">
									<ChevronRightIcon className={cn("size-3 transition-transform", !isCollapsed && "rotate-90")} />
								</button>
							) : (
								<span className="size-4 shrink-0" />
							)}

							<span className={cn("shrink-0", isGroup ? "font-medium text-foreground" : "text-muted")}>{node.label}</span>

							{isGroup && <span className="ml-1 text-xs text-muted/50">{node.type === "array" ? `[${node.childCount}]` : `{${node.childCount}}`}</span>}

							{node.type === "value" && (
								<>
									<span className="mx-1 text-muted/30">:</span>
									{typeof node.value === "boolean" ? (
										<button type="button" className={cn("rounded-full px-2 py-0.5 font-mono text-xs font-medium transition-colors", node.value ? "bg-accent/15 text-accent" : "bg-surface-secondary text-muted")}>
											{String(node.value)}
										</button>
									) : isEditing ? (
										<input autoFocus defaultValue={String(node.value)} onBlur={() => setEditingKey(null)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingKey(null); }}
											className="min-w-0 flex-1 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[13px] text-foreground outline-none focus:border-primary"
										/>
									) : (
										<span className="min-w-0 flex-1 cursor-text truncate font-mono text-foreground/80" onDoubleClick={() => !secret && setEditingKey(node.key)} title={String(node.value)}>
											{secret && !isShown && typeof node.value === "string" ? maskString(node.value) : typeof node.value === "string" ? `"${node.value}"` : String(node.value)}
										</span>
									)}
									{secret && (
										<button type="button" onClick={() => setShowSecret((prev) => ({ ...prev, [node.key]: !prev[node.key] }))} className="shrink-0 text-muted/50 hover:text-foreground">
											{isShown ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
										</button>
									)}
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Formatted view                                                     */
/* ------------------------------------------------------------------ */

function FormattedView({ content, onNavigate }: { content: string; onNavigate?: (href: string) => void }) {
	let parsed: unknown;
	try { parsed = JSON.parse(content); } catch { return <div className="p-3 text-sm text-danger">Invalid JSON</div>; }

	if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
		return <div className="p-3 text-sm text-muted">Non-object JSON</div>;
	}

	const sections = classifyEntries(parsed as Record<string, unknown>);

	return (
		<div className="space-y-3">
			{sections.map((section) => (
				<SectionBlock key={section.def?.id ?? "general"} section={section} onNavigate={onNavigate} />
			))}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function JsonEditor({ content, onNavigateToProvider }: { content: string; onNavigateToProvider?: () => void }) {
	const [mode, setMode] = useState<"formatted" | "raw">("formatted");
	const [rawContent, setRawContent] = useState(content);
	const monaco = useMonaco();
	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	const handleNavigate = (href: string) => {
		if (onNavigateToProvider && href === "/inference-providers") {
			onNavigateToProvider();
		} else {
			window.location.href = href;
		}
	};

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex gap-1">
				<Button size="sm" variant={mode === "formatted" ? "secondary" : "ghost"} onPress={() => setMode("formatted")}>Formatted</Button>
				<Button size="sm" variant={mode === "raw" ? "secondary" : "ghost"} onPress={() => setMode("raw")}>Raw</Button>
			</div>
			{mode === "raw" ? (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor height="100%" defaultLanguage="json" value={rawContent} onChange={(v) => setRawContent(v ?? "")} theme="aghub-dark"
						options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: "on", scrollBeyondLastLine: false, wordWrap: "on", tabSize: 2, formatOnPaste: true, automaticLayout: true, padding: { top: 12 } }}
					/>
				</div>
			) : (
				<div className="min-h-0 flex-1 overflow-y-auto">
					<FormattedView content={content} onNavigate={handleNavigate} />
				</div>
			)}
		</div>
	);
}
