import { Button } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { AGHUB_DARK_THEME } from "./monaco-theme";

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

function renderPreview(content: string) {
	return content.split("\n").map((line, i) => {
		if (line.startsWith("# ")) return <h1 key={i} className="mb-2 text-base font-semibold text-foreground">{line.slice(2)}</h1>;
		if (line.startsWith("## ")) return <h2 key={i} className="mt-4 mb-1 text-sm font-semibold text-foreground">{line.slice(3)}</h2>;
		if (line.startsWith("### ")) return <h3 key={i} className="mt-2 mb-1 text-xs font-semibold text-foreground">{line.slice(4)}</h3>;
		if (line.startsWith("```")) return <div key={i} className="text-xs text-muted/50">{line}</div>;
		if (line.startsWith("- ")) return (
			<div key={i} className="flex gap-1.5 py-0.5 text-[13px] text-muted">
				<span className="shrink-0 text-muted/40">•</span>
				<span>{renderInline(line.slice(2))}</span>
			</div>
		);
		if (line.startsWith("   - ")) return (
			<div key={i} className="flex gap-1.5 py-0.5 pl-4 text-[13px] text-muted">
				<span className="shrink-0 text-muted/40">•</span>
				<span>{renderInline(line.slice(5))}</span>
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
		if (!line.trim()) return <div key={i} className="h-2" />;
		return <div key={i} className="py-0.5 text-[13px] text-muted">{renderInline(line)}</div>;
	});
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function MarkdownEditor({ content }: { content: string }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(content);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	useEffect(() => {
		setDraft(content);
		setEditing(false);
	}, [content]);

	const isDirty = draft !== content;

	return (
		<div className="flex h-full flex-col">
			{/* Save/Cancel bar — only when dirty */}
			{isDirty && (
				<div className="mb-2 flex justify-end gap-2">
					<Button variant="tertiary" size="sm" onPress={() => { setDraft(content); setEditing(false); }}>Cancel</Button>
					<Button size="sm" onPress={() => setEditing(false)}>Save</Button>
				</div>
			)}

			{editing ? (
				<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
					<Editor
						height="100%"
						defaultLanguage="markdown"
						value={draft}
						onChange={(v) => setDraft(v ?? "")}
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
				<div
					className="min-h-0 flex-1 cursor-text overflow-y-auto rounded-md p-1 transition-colors hover:bg-surface-secondary/20"
					onClick={() => setEditing(true)}
				>
					{renderPreview(draft)}
				</div>
			)}
		</div>
	);
}
