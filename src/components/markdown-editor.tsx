import {
	ChevronRightIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/solid";
import { Button, Chip, Label, ListBox, Modal } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { AGHUB_DARK_THEME } from "./monaco-theme";

/* ------------------------------------------------------------------ */
/*  Piece types                                                        */
/* ------------------------------------------------------------------ */

type PieceSource = "aghub" | "user";

interface PieceDef {
	id: string;
	heading: string;
	description: string;
	body: string;
	source: PieceSource;
}

/* ------------------------------------------------------------------ */
/*  Piece catalog                                                      */
/* ------------------------------------------------------------------ */

const PIECE_CATALOG: PieceDef[] = [
	{ id: "instruction-precedence", heading: "Instruction Precedence", description: "Override hierarchy for project instructions", source: "aghub", body: "- Repository-local instructions override this file: `AGENTS.md`, `CLAUDE.md`, `justfile`, `Cargo.toml`, `package.json`, formatter/linter configs.\n- When prose documentation conflicts with code or build scripts, trust the executable. Briefly note the mismatch." },
	{ id: "language", heading: "Language", description: "Response language and tone preferences", source: "aghub", body: "- Respond in Chinese throughout.\n- Keep proper nouns in English: API, CLI, JSON, shell, prompt, tool, etc.\n- Engineer tone: direct, calm, precise. No hype, no self-congratulation." },
	{ id: "safety", heading: "Safety", description: "Destructive operation prevention rules", source: "aghub", body: "- Never use `rm` in any form.\n- Never read credential dirs: `~/.ssh/`, `~/.aws/`, `~/.gnupg/`, etc.\n- For deletion, use `trash` or confirm before any destructive action." },
	{ id: "code-consistency", heading: "Code Consistency", description: "Naming, style, and modification rules", source: "aghub", body: "- No simplification of features, data shape, or architecture intent without explicit approval.\n- Modify in-place. Never create renamed \"new version\" files or symbols.\n- Banned suffixes/prefixes: `_enhanced`, `_improved`, `_v2`, `_fixed`, `_new`, `_better`, `_optimized`, `_refactored`.\n- Domain-first naming. Preserve the project's established vocabulary." },
	{ id: "architecture", heading: "Architecture", description: "System design and config file conventions", source: "aghub", body: "- In registry-, descriptor-, or capability-driven codebases, extend existing tables and wiring points.\n- For user-owned config files (JSON, TOML, YAML): minimal, non-destructive edits.\n- No silent fallbacks across tool or provider boundaries.\n- Network and process calls must have timeouts." },
	{ id: "validation", heading: "Validation", description: "Post-change verification workflow", source: "aghub", body: "Post-change order:\n1. Check if the repo defines a `justfile` — if yes, use `just fmt` and `just lint`.\n2. Otherwise use language defaults:\n   - Rust: `cargo fmt` + `cargo clippy`\n   - Frontend: the repo's package manager lint, typecheck, build scripts\n3. Verify in browser after frontend changes." },
	{ id: "frontend", heading: "Frontend", description: "Frontend development conventions", source: "aghub", body: "- Default package manager: `pnpm`.\n- No emoji as icons — use an icon library.\n- One component, one responsibility. Split when > 300 lines or > 5 `useState`.\n- No `any` or `as any`. Explicit casts require a concrete reason." },
	{ id: "git", heading: "Git", description: "Git workflow and commit conventions", source: "aghub", body: "- Conventional Commits format.\n- Breaking changes: `!` after type, e.g. `refactor!: remove legacy module`.\n- Never push unless explicitly asked." },
	{ id: "npm-rules", heading: "npm / Node.js", description: "Package management conventions", source: "aghub", body: "- Use `pnpm` as default package manager unless repo specifies otherwise.\n- Lock files must be committed.\n- Prefer ESM over CJS for new code." },
	{ id: "docker-rules", heading: "Docker", description: "Container conventions", source: "aghub", body: "- Use multi-stage builds to minimize image size.\n- Pin base image versions explicitly.\n- Health checks required for production images." },
	{ id: "testing-rules", heading: "Testing", description: "Test quality standards", source: "aghub", body: "- Write tests for business logic, not for boilerplate.\n- Prefer integration tests over unit tests for API endpoints.\n- Test names describe behavior, not implementation." },
	{ id: "api-design", heading: "API Design", description: "REST API conventions", source: "aghub", body: "- RESTful endpoints use kebab-case plural nouns.\n- Always return consistent error response shape.\n- Paginate list endpoints by default." },
];

const DEFAULT_ACTIVE_IDS = ["instruction-precedence", "language", "safety", "code-consistency", "architecture", "validation", "frontend", "git"];

/* ------------------------------------------------------------------ */
/*  Inline markdown rendering                                          */
/* ------------------------------------------------------------------ */

function renderInline(text: string): React.ReactNode {
	const parts = text.split(/(`[^`]+`)/g);
	return parts.map((part, i) => {
		if (part.startsWith("`") && part.endsWith("`")) {
			return <code key={i} className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-xs text-foreground/80">{part.slice(1, -1)}</code>;
		}
		const bold = part.split(/(\*\*[^*]+\*\*)/g);
		return bold.map((b, j) => {
			if (b.startsWith("**") && b.endsWith("**")) return <strong key={`${i}-${j}`} className="font-medium text-foreground/90">{b.slice(2, -2)}</strong>;
			return <span key={`${i}-${j}`}>{b}</span>;
		});
	});
}

function renderBody(body: string) {
	return body.split("\n").map((line, i) => {
		if (line.startsWith("- ")) return (
			<div key={i} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
				<span className="shrink-0 text-muted/40">•</span>
				<span>{renderInline(line.slice(2))}</span>
			</div>
		);
		if (/^\d+\.\s/.test(line)) {
			const m = line.match(/^(\d+)\.\s(.*)$/);
			if (m) return (
				<div key={i} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
					<span className="shrink-0 text-muted/40">{m[1]}.</span>
					<span>{renderInline(m[2])}</span>
				</div>
			);
		}
		if (line.startsWith("   - ")) return (
			<div key={i} className="flex gap-1.5 py-0.5 pl-4 text-[13px] text-muted">
				<span className="shrink-0 text-muted/40">•</span>
				<span>{renderInline(line.slice(5))}</span>
			</div>
		);
		if (!line.trim()) return <div key={i} className="h-1" />;
		return <div key={i} className="py-0.5 text-[13px] text-muted">{renderInline(line)}</div>;
	});
}

/* ------------------------------------------------------------------ */
/*  Editable piece card                                                */
/* ------------------------------------------------------------------ */

function PieceCard({
	piece,
	onRemove,
	onUpdate,
}: {
	piece: PieceDef;
	onRemove: () => void;
	onUpdate: (body: string) => void;
}) {
	const [collapsed, setCollapsed] = useState(false);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(piece.body);
	const isDirty = draft !== piece.body;

	// Reset draft when piece changes
	const prevId = useRef(piece.id);
	useEffect(() => {
		if (prevId.current !== piece.id) {
			setDraft(piece.body);
			setEditing(false);
			prevId.current = piece.id;
		}
	}, [piece.id, piece.body]);

	const handleSave = () => {
		onUpdate(draft);
		setEditing(false);
	};

	const handleCancel = () => {
		setDraft(piece.body);
		setEditing(false);
	};

	return (
		<div className="rounded-lg border border-border bg-surface">
			<div className="flex items-center gap-2 px-3 py-2">
				<button type="button" onClick={() => setCollapsed(!collapsed)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
					<ChevronRightIcon className={cn("size-3 shrink-0 text-muted transition-transform", !collapsed && "rotate-90")} />
					<span className="text-sm font-medium text-foreground">{piece.heading}</span>
					<span className="truncate text-xs text-muted">{piece.description}</span>
				</button>
				<Chip size="sm" variant={piece.source === "aghub" ? "soft" : "secondary"}>
					{piece.source === "aghub" ? "aghub" : "custom"}
				</Chip>
				<button type="button" onClick={onRemove} className="shrink-0 text-muted/40 hover:text-danger transition-colors">
					<TrashIcon className="size-3.5" />
				</button>
			</div>

			{!collapsed && (
				<div className="px-3 pb-3">
					{editing ? (
						<>
							<textarea
								value={draft}
								onChange={(e) => setDraft(e.target.value)}
								className="w-full resize-none rounded-md border border-border bg-surface-secondary/30 p-3 font-mono text-[13px] leading-6 text-foreground outline-none focus:border-primary"
								rows={Math.max(draft.split("\n").length, 3)}
								spellCheck={false}
							/>
							{isDirty && (
								<div className="mt-2 flex justify-end gap-2">
									<Button variant="tertiary" size="sm" onPress={handleCancel}>Cancel</Button>
									<Button size="sm" onPress={handleSave}>Save</Button>
								</div>
							)}
						</>
					) : (
						<div
							className="cursor-text rounded-md px-1 py-1 transition-colors hover:bg-surface-secondary/30"
							onClick={() => setEditing(true)}
						>
							{renderBody(piece.body)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Add piece dialog                                                   */
/* ------------------------------------------------------------------ */

function AddPieceDialog({
	isOpen,
	activeIds,
	onAdd,
	onClose,
}: {
	isOpen: boolean;
	activeIds: Set<string>;
	onAdd: (id: string) => void;
	onClose: () => void;
}) {
	const available = PIECE_CATALOG.filter((p) => !activeIds.has(p.id));

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header><Modal.Heading>Add Piece</Modal.Heading></Modal.Header>
					<Modal.Body>
						{available.length === 0 ? (
							<p className="py-4 text-center text-sm text-muted">All available pieces already added.</p>
						) : (
							<ListBox aria-label="Available pieces" selectionMode="single" onAction={(key) => { onAdd(String(key)); onClose(); }} className="p-1">
								{available.map((item) => (
									<ListBox.Item key={item.id} id={item.id} textValue={item.heading}>
										<div className="grid gap-0.5 py-1">
											<Label className="text-sm">{item.heading}</Label>
											<span className="text-xs text-muted">{item.description}</span>
										</div>
									</ListBox.Item>
								))}
							</ListBox>
						)}
					</Modal.Body>
					<Modal.Footer>
						<Button variant="tertiary" onPress={onClose}>Cancel</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function MarkdownEditor({ content }: { content: string }) {
	const [mode, setMode] = useState<"pieces" | "raw">("pieces");
	const [activeIds, setActiveIds] = useState<string[]>(DEFAULT_ACTIVE_IDS);
	const [overrides, setOverrides] = useState<Record<string, string>>({});
	const [showAddDialog, setShowAddDialog] = useState(false);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	const activePieces = activeIds
		.map((id) => {
			const base = PIECE_CATALOG.find((p) => p.id === id);
			if (!base) return null;
			return overrides[id] ? { ...base, body: overrides[id] } : base;
		})
		.filter((p): p is PieceDef => !!p);

	// Generate raw markdown from pieces
	const generatedMarkdown = activePieces.length > 0
		? `# Global Rules\n\n${activePieces.map((p) => `## ${p.heading}\n\n${p.body}`).join("\n\n")}\n`
		: content;

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex items-center gap-1">
				<Button size="sm" variant={mode === "pieces" ? "secondary" : "ghost"} onPress={() => setMode("pieces")}>Pieces</Button>
				<Button size="sm" variant={mode === "raw" ? "secondary" : "ghost"} onPress={() => setMode("raw")}>Raw</Button>
				{mode === "pieces" && (
					<Button size="sm" variant="ghost" className="ml-auto" onPress={() => setShowAddDialog(true)}>
						<PlusIcon className="size-3.5" />
						Add
					</Button>
				)}
			</div>

			{mode === "pieces" ? (
				<div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
					{activePieces.map((piece) => (
						<PieceCard
							key={piece.id}
							piece={piece}
							onRemove={() => setActiveIds((prev) => prev.filter((i) => i !== piece.id))}
							onUpdate={(body) => setOverrides((prev) => ({ ...prev, [piece.id]: body }))}
						/>
					))}
					{activePieces.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-sm text-muted">
							<p>No pieces selected.</p>
							<Button size="sm" variant="ghost" className="mt-2" onPress={() => setShowAddDialog(true)}>
								<PlusIcon className="size-3.5" />
								Add Piece
							</Button>
						</div>
					)}
				</div>
			) : (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={generatedMarkdown}
						theme="aghub-dark"
						options={{
							minimap: { enabled: false },
							fontSize: 13,
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							wordWrap: "on",
							tabSize: 2,
							automaticLayout: true,
							padding: { top: 12 },
						}}
					/>
				</div>
			)}

			<AddPieceDialog
				isOpen={showAddDialog}
				activeIds={new Set(activeIds)}
				onAdd={(id) => setActiveIds((prev) => [...prev, id])}
				onClose={() => setShowAddDialog(false)}
			/>
		</div>
	);
}
