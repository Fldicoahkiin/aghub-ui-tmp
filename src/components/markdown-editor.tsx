import { Button } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { AGHUB_DARK_THEME } from "./monaco-theme";

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
				<pre
					className="min-h-0 flex-1 cursor-text overflow-y-auto rounded-md bg-surface-secondary p-3 font-mono text-xs leading-5 whitespace-pre-wrap text-foreground"
					onClick={() => setEditing(true)}
				>
					{draft}
				</pre>
			)}
		</div>
	);
}
