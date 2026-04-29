import {
	ChevronUpDownIcon,
	PlusIcon,
	TrashIcon,
} from "@heroicons/react/24/solid";
import { Button, Chip, Label, ListBox, Modal } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
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
/*  Piece catalog (aghub marketplace)                                  */
/* ------------------------------------------------------------------ */

const PIECE_CATALOG: PieceDef[] = [
	{
		id: "instruction-precedence",
		heading: "Instruction Precedence",
		description: "Override hierarchy for project instructions",
		source: "aghub",
		body: "- Repository-local instructions override this file: `AGENTS.md`, `CLAUDE.md`, `justfile`, `Cargo.toml`, `package.json`, formatter/linter configs.\n- When prose documentation conflicts with code or build scripts, trust the executable. Briefly note the mismatch.",
	},
	{
		id: "language",
		heading: "Language",
		description: "Response language and tone preferences",
		source: "aghub",
		body: "- Respond in Chinese throughout.\n- Keep proper nouns in English: API, CLI, JSON, shell, prompt, tool, etc.\n- Engineer tone: direct, calm, precise. No hype, no self-congratulation.",
	},
	{
		id: "safety",
		heading: "Safety",
		description: "Destructive operation prevention rules",
		source: "aghub",
		body: '- Never use `rm` in any form.\n- Never read credential dirs: `~/.ssh/`, `~/.aws/`, `~/.gnupg/`, etc.\n- For deletion, use `trash` or confirm before any destructive action.',
	},
	{
		id: "code-consistency",
		heading: "Code Consistency",
		description: "Naming, style, and modification rules",
		source: "aghub",
		body: '- No simplification of features, data shape, or architecture intent without explicit approval.\n- Modify in-place. Never create renamed "new version" files or symbols.\n- Banned suffixes/prefixes: `_enhanced`, `_improved`, `_v2`, `_fixed`, `_new`, `_better`, `_optimized`, `_refactored`.\n- Domain-first naming. Preserve the project\'s established vocabulary.\n- No prompt artifacts in identifiers, comments, commit messages, or replies.',
	},
	{
		id: "architecture",
		heading: "Architecture",
		description: "System design and config file conventions",
		source: "aghub",
		body: "- In registry-, descriptor-, or capability-driven codebases, extend existing tables and wiring points. Don't scatter special cases.\n- For user-owned config files (JSON, TOML, YAML): minimal, non-destructive edits. Preserve unknown fields, ordering, comments, and unrelated sections.\n- No silent fallbacks across tool or provider boundaries. Prefer explicit errors or logs.\n- Network and process calls must have timeouts.",
	},
	{
		id: "validation",
		heading: "Validation",
		description: "Post-change verification workflow",
		source: "aghub",
		body: "Post-change order:\n1. Check if the repo defines a `justfile` — if yes, use `just fmt` and `just lint`.\n2. Otherwise use language defaults:\n   - Rust: `cargo fmt` + `cargo clippy`\n   - Frontend: the repo's package manager lint, typecheck, build scripts\n3. Verify in browser after frontend changes. Build passing is not enough.",
	},
	{
		id: "frontend",
		heading: "Frontend",
		description: "Frontend development conventions",
		source: "aghub",
		body: "- Default package manager: `pnpm`.\n- No emoji as icons — use an icon library (e.g. lucide-react).\n- One component, one responsibility. Split when > 300 lines or > 5 `useState`.\n- State at the smallest scope that needs it.\n- No `any` or `as any`. Explicit casts require a concrete reason.",
	},
	{
		id: "git",
		heading: "Git",
		description: "Git workflow and commit conventions",
		source: "aghub",
		body: "- Conventional Commits format.\n- Breaking changes: `!` after type, e.g. `refactor!: remove legacy module`.\n- Never push unless explicitly asked.",
	},
	{
		id: "npm-rules",
		heading: "npm / Node.js",
		description: "Package management and Node.js conventions",
		source: "aghub",
		body: "- Use `pnpm` as default package manager unless repo specifies otherwise.\n- Never use `npm install` without `--save-exact`.\n- Lock files must be committed.\n- Prefer ESM over CJS for new code.",
	},
	{
		id: "docker-rules",
		heading: "Docker",
		description: "Container build and deployment conventions",
		source: "aghub",
		body: "- Use multi-stage builds to minimize image size.\n- Pin base image versions explicitly (`node:20.11-alpine`, not `node:latest`).\n- `.dockerignore` must exclude `node_modules`, `.git`, and build artifacts.\n- Health checks required for production images.",
	},
	{
		id: "testing-rules",
		heading: "Testing",
		description: "Test coverage and quality standards",
		source: "aghub",
		body: "- Write tests for business logic, not for boilerplate.\n- Prefer integration tests over unit tests for API endpoints.\n- Use `vitest` for frontend, `pytest` for Python.\n- Test names describe behavior, not implementation.",
	},
	{
		id: "api-design",
		heading: "API Design",
		description: "REST and GraphQL API conventions",
		source: "aghub",
		body: "- RESTful endpoints use kebab-case plural nouns (`/api/user-profiles`).\n- Always return consistent error response shape: `{ error: string, code: string }`.\n- Paginate list endpoints by default.\n- Version APIs via URL path (`/v1/...`), not headers.",
	},
];

/* ------------------------------------------------------------------ */
/*  Default active pieces for CLAUDE.md                                */
/* ------------------------------------------------------------------ */

const DEFAULT_ACTIVE_IDS = [
	"instruction-precedence",
	"language",
	"safety",
	"code-consistency",
	"architecture",
	"validation",
	"frontend",
	"git",
];

/* ------------------------------------------------------------------ */
/*  Generate markdown from pieces                                      */
/* ------------------------------------------------------------------ */

function piecesToMarkdown(pieces: PieceDef[], title: string): string {
	const sections = pieces.map((p) => `## ${p.heading}\n\n${p.body}`);
	return `# ${title}\n\n${sections.join("\n\n")}`;
}

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
/*  Piece row                                                          */
/* ------------------------------------------------------------------ */

function PieceRow({
	piece,
	onRemove,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: {
	piece: PieceDef;
	onRemove: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="rounded-lg border border-border bg-surface">
			<div className="flex items-center gap-2 px-3 py-2">
				{/* Reorder */}
				<div className="flex flex-col gap-px">
					<button type="button" disabled={isFirst} onClick={onMoveUp} className="text-muted/40 hover:text-muted disabled:opacity-20 transition-colors rotate-180">
						<ChevronUpDownIcon className="size-3" />
					</button>
					<button type="button" disabled={isLast} onClick={onMoveDown} className="text-muted/40 hover:text-muted disabled:opacity-20 transition-colors">
						<ChevronUpDownIcon className="size-3" />
					</button>
				</div>

				{/* Heading + description */}
				<button type="button" onClick={() => setExpanded(!expanded)} className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
					<span className="text-sm font-medium text-foreground">{piece.heading}</span>
					{!expanded && <span className="truncate text-xs text-muted">{piece.description}</span>}
				</button>

				{/* Source chip */}
				<Chip size="sm" variant={piece.source === "aghub" ? "soft" : "secondary"}>
					{piece.source === "aghub" ? "aghub" : "custom"}
				</Chip>

				{/* Remove */}
				<button type="button" onClick={onRemove} className="shrink-0 text-muted/40 hover:text-danger transition-colors">
					<TrashIcon className="size-3.5" />
				</button>
			</div>

			{/* Expanded preview */}
			{expanded && (
				<div className="border-t border-border/50 px-4 py-3">
					{renderBody(piece.body)}
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
	const [mode, setMode] = useState<"pieces" | "preview" | "raw">("pieces");
	const [activeIds, setActiveIds] = useState<string[]>(DEFAULT_ACTIVE_IDS);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	const activePieces = activeIds
		.map((id) => PIECE_CATALOG.find((p) => p.id === id))
		.filter((p): p is PieceDef => !!p);

	const generatedMarkdown = piecesToMarkdown(activePieces, "Global Rules");

	const handleRemove = (id: string) => {
		setActiveIds((prev) => prev.filter((i) => i !== id));
	};

	const handleAdd = (id: string) => {
		setActiveIds((prev) => [...prev, id]);
	};

	const handleMoveUp = (index: number) => {
		if (index === 0) return;
		setActiveIds((prev) => {
			const next = [...prev];
			[next[index - 1], next[index]] = [next[index], next[index - 1]];
			return next;
		});
	};

	const handleMoveDown = (index: number) => {
		setActiveIds((prev) => {
			if (index >= prev.length - 1) return prev;
			const next = [...prev];
			[next[index], next[index + 1]] = [next[index + 1], next[index]];
			return next;
		});
	};

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex items-center gap-1">
				<Button size="sm" variant={mode === "pieces" ? "secondary" : "ghost"} onPress={() => setMode("pieces")}>Pieces</Button>
				<Button size="sm" variant={mode === "preview" ? "secondary" : "ghost"} onPress={() => setMode("preview")}>Preview</Button>
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
					{activePieces.map((piece, index) => (
						<PieceRow
							key={piece.id}
							piece={piece}
							onRemove={() => handleRemove(piece.id)}
							onMoveUp={() => handleMoveUp(index)}
							onMoveDown={() => handleMoveDown(index)}
							isFirst={index === 0}
							isLast={index === activePieces.length - 1}
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
			) : mode === "preview" ? (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={generatedMarkdown}
						theme="aghub-dark"
						options={{
							readOnly: true,
							minimap: { enabled: false },
							fontSize: 13,
							lineNumbers: "off",
							scrollBeyondLastLine: false,
							wordWrap: "on",
							automaticLayout: true,
							padding: { top: 12 },
						}}
					/>
				</div>
			) : (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={content}
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
				onAdd={handleAdd}
				onClose={() => setShowAddDialog(false)}
			/>
		</div>
	);
}
