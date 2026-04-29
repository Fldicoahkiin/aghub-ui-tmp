import {
	ChevronRightIcon,
	PlusIcon,
	XMarkIcon,
} from "@heroicons/react/24/solid";
import { Button, Chip, Modal, ListBox, Label } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { AGHUB_DARK_THEME } from "./monaco-theme";

/* ------------------------------------------------------------------ */
/*  Piece types                                                        */
/* ------------------------------------------------------------------ */

type PieceSource = "aghub" | "user";

interface Piece {
	id: string;
	heading: string;
	body: string;
	source: PieceSource;
}

/* ------------------------------------------------------------------ */
/*  Mock piece catalog (aghub marketplace)                             */
/* ------------------------------------------------------------------ */

const PIECE_CATALOG: { id: string; heading: string; description: string; body: string }[] = [
	{
		id: "npm-rules",
		heading: "npm / Node.js",
		description: "Package management and Node.js conventions",
		body: "- Use `pnpm` as default package manager unless repo specifies otherwise.\n- Never use `npm install` without `--save-exact`.\n- Lock files must be committed.\n- Prefer ESM over CJS for new code.",
	},
	{
		id: "docker-rules",
		heading: "Docker",
		description: "Container build and deployment conventions",
		body: "- Use multi-stage builds to minimize image size.\n- Pin base image versions explicitly (`node:20.11-alpine`, not `node:latest`).\n- `.dockerignore` must exclude `node_modules`, `.git`, and build artifacts.\n- Health checks required for production images.",
	},
	{
		id: "testing-rules",
		heading: "Testing",
		description: "Test coverage and quality standards",
		body: "- Write tests for business logic, not for boilerplate.\n- Prefer integration tests over unit tests for API endpoints.\n- Use `vitest` for frontend, `pytest` for Python.\n- Test names describe behavior, not implementation.",
	},
	{
		id: "api-design",
		heading: "API Design",
		description: "REST and GraphQL API conventions",
		body: "- RESTful endpoints use kebab-case plural nouns (`/api/user-profiles`).\n- Always return consistent error response shape: `{ error: string, code: string }`.\n- Paginate list endpoints by default.\n- Version APIs via URL path (`/v1/...`), not headers.",
	},
	{
		id: "security-hardening",
		heading: "Security Hardening",
		description: "Additional security practices beyond basics",
		body: "- Validate all external input at system boundaries.\n- Use parameterized queries — no string concatenation for SQL.\n- Secrets must come from environment variables or secret managers, never hardcoded.\n- Enforce HTTPS for all external API calls.\n- Set `Content-Security-Policy` headers for web applications.",
	},
];

/* ------------------------------------------------------------------ */
/*  Classify pieces by source (mock: headings from CLAUDE.md pattern)  */
/* ------------------------------------------------------------------ */

const AGHUB_MANAGED_HEADINGS = new Set([
	"Instruction Precedence",
	"Language",
	"Safety",
	"Code Consistency",
	"Architecture",
	"Validation",
	"Frontend",
	"Git",
	"Comments",
]);

function parseMarkdownPieces(content: string): Piece[] {
	const lines = content.split("\n");
	const pieces: Piece[] = [];
	let currentHeading = "";
	let currentBody: string[] = [];
	let pieceIndex = 0;

	for (const line of lines) {
		if (line.startsWith("## ")) {
			if (currentBody.join("\n").trim()) {
				const heading = currentHeading;
				pieces.push({
					id: `piece-${pieceIndex++}`,
					heading,
					body: currentBody.join("\n").trim(),
					source: AGHUB_MANAGED_HEADINGS.has(heading) ? "aghub" : "user",
				});
			}
			currentHeading = line.replace(/^## /, "").trim();
			currentBody = [];
		} else if (line.startsWith("# ") && pieces.length === 0 && !currentHeading) {
			continue;
		} else {
			currentBody.push(line);
		}
	}

	if (currentBody.join("\n").trim()) {
		pieces.push({
			id: `piece-${pieceIndex}`,
			heading: currentHeading,
			body: currentBody.join("\n").trim(),
			source: AGHUB_MANAGED_HEADINGS.has(currentHeading) ? "aghub" : "user",
		});
	}

	return pieces;
}

/* ------------------------------------------------------------------ */
/*  Inline markdown renderer                                           */
/* ------------------------------------------------------------------ */

function renderInlineCode(text: string): React.ReactNode {
	const parts = text.split(/(`[^`]+`)/g);
	return parts.map((part, i) => {
		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code key={i} className="rounded bg-surface-secondary px-1 py-0.5 font-mono text-xs text-foreground/80">
					{part.slice(1, -1)}
				</code>
			);
		}
		const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
		return boldParts.map((bp, j) => {
			if (bp.startsWith("**") && bp.endsWith("**")) {
				return <strong key={`${i}-${j}`} className="font-medium text-foreground/90">{bp.slice(2, -2)}</strong>;
			}
			return <span key={`${i}-${j}`}>{bp}</span>;
		});
	});
}

function renderBody(body: string, pieceId: string) {
	return body.split("\n").map((line, i) => {
		const key = `${pieceId}-${i}`;
		if (line.startsWith("```")) return <div key={key} className="text-xs text-muted/50">{line}</div>;
		if (line.startsWith("### ")) return <div key={key} className="mt-2 mb-1 text-xs font-semibold text-foreground">{line.replace(/^### /, "")}</div>;
		if (line.startsWith("- ")) return (
			<div key={key} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
				<span className="shrink-0 text-muted/40">•</span>
				<span>{renderInlineCode(line.replace(/^- /, ""))}</span>
			</div>
		);
		if (/^\d+\.\s/.test(line)) {
			const m = line.match(/^(\d+)\.\s(.*)$/);
			if (m) return (
				<div key={key} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
					<span className="shrink-0 text-muted/40">{m[1]}.</span>
					<span>{renderInlineCode(m[2])}</span>
				</div>
			);
		}
		if (!line.trim()) return <div key={key} className="h-1" />;
		return <div key={key} className="py-0.5 text-[13px] text-muted">{renderInlineCode(line)}</div>;
	});
}

/* ------------------------------------------------------------------ */
/*  Piece card                                                         */
/* ------------------------------------------------------------------ */

function PieceCard({ piece, onRemove }: { piece: Piece; onRemove?: () => void }) {
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="rounded-lg border border-border bg-surface">
			<div className="flex items-center gap-2 px-3 py-2">
				<button
					type="button"
					onClick={() => setCollapsed(!collapsed)}
					className="flex min-w-0 flex-1 items-center gap-2 text-left"
				>
					<ChevronRightIcon className={cn("size-3 shrink-0 text-muted transition-transform", !collapsed && "rotate-90")} />
					<span className="truncate text-sm font-medium text-foreground">{piece.heading || "Untitled"}</span>
				</button>
				<Chip size="sm" variant={piece.source === "aghub" ? "soft" : "secondary"}>
					{piece.source === "aghub" ? "aghub" : "custom"}
				</Chip>
				{onRemove && (
					<button type="button" onClick={onRemove} className="shrink-0 text-muted/50 hover:text-danger transition-colors">
						<XMarkIcon className="size-3.5" />
					</button>
				)}
			</div>

			{!collapsed && piece.body && (
				<div className="border-t border-border px-4 py-3">
					{renderBody(piece.body, piece.id)}
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
	existingIds,
	onAdd,
	onClose,
}: {
	isOpen: boolean;
	existingIds: Set<string>;
	onAdd: (piece: Piece) => void;
	onClose: () => void;
}) {
	const available = PIECE_CATALOG.filter((p) => !existingIds.has(p.id));

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="sm:max-w-md">
					<Modal.CloseTrigger />
					<Modal.Header>
						<Modal.Heading>Add Piece</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						{available.length === 0 ? (
							<p className="py-4 text-center text-sm text-muted">All available pieces are already added.</p>
						) : (
							<ListBox
								aria-label="Available pieces"
								selectionMode="single"
								onAction={(key) => {
									const item = PIECE_CATALOG.find((p) => p.id === key);
									if (item) {
										onAdd({
											id: item.id,
											heading: item.heading,
											body: item.body,
											source: "aghub",
										});
										onClose();
									}
								}}
								className="p-1"
							>
								{available.map((item) => (
									<ListBox.Item key={item.id} id={item.id} textValue={item.heading}>
										<div className="grid gap-0.5 py-1">
											<Label className="truncate text-sm">{item.heading}</Label>
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
	const [currentContent, setCurrentContent] = useState(content);
	const [addedPieces, setAddedPieces] = useState<Piece[]>([]);
	const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
	const [showAddDialog, setShowAddDialog] = useState(false);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	useEffect(() => {
		setCurrentContent(content);
		setAddedPieces([]);
		setRemovedIds(new Set());
	}, [content]);

	const parsedPieces = parseMarkdownPieces(currentContent);
	const visibleParsed = parsedPieces.filter((p) => !removedIds.has(p.id));
	const allPieces = [...visibleParsed, ...addedPieces];

	const existingHeadings = new Set(allPieces.map((p) => p.heading));
	const existingCatalogIds = new Set(
		PIECE_CATALOG.filter((c) => existingHeadings.has(c.heading)).map((c) => c.id),
	);

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex items-center gap-1">
				<Button size="sm" variant={mode === "pieces" ? "secondary" : "ghost"} onPress={() => setMode("pieces")}>Pieces</Button>
				<Button size="sm" variant={mode === "raw" ? "secondary" : "ghost"} onPress={() => setMode("raw")}>Raw</Button>
				{mode === "pieces" && (
					<Button size="sm" variant="ghost" className="ml-auto" onPress={() => setShowAddDialog(true)}>
						<PlusIcon className="size-3.5" />
						Add Piece
					</Button>
				)}
			</div>

			{mode === "raw" ? (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={currentContent}
						onChange={(v) => setCurrentContent(v ?? "")}
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
			) : (
				<div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
					{allPieces.map((piece) => (
						<PieceCard
							key={piece.id}
							piece={piece}
							onRemove={() => {
								if (addedPieces.some((p) => p.id === piece.id)) {
									setAddedPieces((prev) => prev.filter((p) => p.id !== piece.id));
								} else {
									setRemovedIds((prev) => new Set([...prev, piece.id]));
								}
							}}
						/>
					))}
					{allPieces.length === 0 && (
						<div className="flex flex-col items-center justify-center py-12 text-sm text-muted">
							<p>No pieces yet.</p>
							<Button size="sm" variant="ghost" className="mt-2" onPress={() => setShowAddDialog(true)}>
								<PlusIcon className="size-3.5" />
								Add Piece
							</Button>
						</div>
					)}
				</div>
			)}

			<AddPieceDialog
				isOpen={showAddDialog}
				existingIds={existingCatalogIds}
				onAdd={(piece) => setAddedPieces((prev) => [...prev, piece])}
				onClose={() => setShowAddDialog(false)}
			/>
		</div>
	);
}
