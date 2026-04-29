import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { AGHUB_DARK_THEME } from "./monaco-theme";

/* ------------------------------------------------------------------ */
/*  Parse markdown into pieces by ## headings                          */
/* ------------------------------------------------------------------ */

interface Piece {
	id: string;
	heading: string;
	body: string;
}

function parseMarkdownPieces(content: string): Piece[] {
	const lines = content.split("\n");
	const pieces: Piece[] = [];
	let currentHeading = "";
	let currentBody: string[] = [];
	let pieceIndex = 0;

	for (const line of lines) {
		if (line.startsWith("## ")) {
			// Flush previous piece
			if (currentHeading || currentBody.length > 0) {
				pieces.push({
					id: `piece-${pieceIndex++}`,
					heading: currentHeading || "Header",
					body: currentBody.join("\n").trim(),
				});
			}
			currentHeading = line.replace(/^## /, "").trim();
			currentBody = [];
		} else if (pieces.length === 0 && currentHeading === "" && line.startsWith("# ")) {
			// Top-level title — use as header piece heading
			currentHeading = line.replace(/^# /, "").trim();
		} else {
			currentBody.push(line);
		}
	}

	// Flush last piece
	if (currentHeading || currentBody.length > 0) {
		pieces.push({
			id: `piece-${pieceIndex}`,
			heading: currentHeading || "Header",
			body: currentBody.join("\n").trim(),
		});
	}

	return pieces;
}

/* ------------------------------------------------------------------ */
/*  Piece card                                                         */
/* ------------------------------------------------------------------ */

function PieceCard({ piece }: { piece: Piece }) {
	const [collapsed, setCollapsed] = useState(false);

	// Render body lines with basic markdown formatting
	const renderBody = (body: string) => {
		const lines = body.split("\n");
		return lines.map((line, i) => {
			const key = `${piece.id}-${i}`;

			// Code block fence
			if (line.startsWith("```")) {
				return <div key={key} className="text-xs text-muted/50">{line}</div>;
			}

			// ### sub-heading
			if (line.startsWith("### ")) {
				return <div key={key} className="mt-2 mb-1 text-xs font-semibold text-foreground">{line.replace(/^### /, "")}</div>;
			}

			// Bullet point
			if (line.startsWith("- ")) {
				const content = line.replace(/^- /, "");
				return (
					<div key={key} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
						<span className="shrink-0 text-muted/40">•</span>
						<span>{renderInlineCode(content)}</span>
					</div>
				);
			}

			// Numbered list
			if (/^\d+\.\s/.test(line)) {
				const match = line.match(/^(\d+)\.\s(.*)$/);
				if (match) {
					return (
						<div key={key} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
							<span className="shrink-0 text-muted/40">{match[1]}.</span>
							<span>{renderInlineCode(match[2])}</span>
						</div>
					);
				}
			}

			// Empty line
			if (line.trim() === "") {
				return <div key={key} className="h-1" />;
			}

			// Normal text
			return <div key={key} className="py-0.5 text-[13px] text-muted">{renderInlineCode(line)}</div>;
		});
	};

	return (
		<div className="rounded-lg border border-border bg-surface">
			{/* Header */}
			<button
				type="button"
				onClick={() => setCollapsed(!collapsed)}
				className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
			>
				<ChevronRightIcon className={cn("size-3 shrink-0 text-muted transition-transform", !collapsed && "rotate-90")} />
				<span className="text-xs font-semibold uppercase tracking-wider text-muted">{piece.heading}</span>
			</button>

			{/* Body */}
			{!collapsed && piece.body && (
				<div className="border-t border-border px-4 py-3">
					{renderBody(piece.body)}
				</div>
			)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Inline code renderer                                               */
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
		// Bold
		const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
		return boldParts.map((bp, j) => {
			if (bp.startsWith("**") && bp.endsWith("**")) {
				return <strong key={`${i}-${j}`} className="font-medium text-foreground/90">{bp.slice(2, -2)}</strong>;
			}
			return <span key={`${i}-${j}`}>{bp}</span>;
		});
	});
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function MarkdownEditor({ content }: { content: string }) {
	const [mode, setMode] = useState<"pieces" | "raw">("pieces");
	const [currentContent, setCurrentContent] = useState(content);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	useEffect(() => {
		setCurrentContent(content);
	}, [content]);

	const pieces = parseMarkdownPieces(currentContent);

	return (
		<div className="flex h-full flex-col">
			<div className="mb-2 flex gap-1">
				<Button size="sm" variant={mode === "pieces" ? "secondary" : "ghost"} onPress={() => setMode("pieces")}>Pieces</Button>
				<Button size="sm" variant={mode === "raw" ? "secondary" : "ghost"} onPress={() => setMode("raw")}>Raw</Button>
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
				<div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
					{pieces.map((piece) => (
						<PieceCard key={piece.id} piece={piece} />
					))}
				</div>
			)}
		</div>
	);
}
