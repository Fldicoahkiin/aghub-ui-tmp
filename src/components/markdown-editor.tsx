import { Button } from "@heroui/react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import { BASE_MONACO_OPTIONS } from "./monaco-options";
import { AGHUB_DARK_THEME } from "./monaco-theme";

export function MarkdownEditor({ content }: { content: string }) {
	const [draft, setDraft] = useState(content);
	const [editing, setEditing] = useState(false);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	useEffect(() => {
		setDraft(content);
		setEditing(false);
	}, [content]);

	const isDirty = draft !== content;

	const handleEditorMount = (ed: editor.IStandaloneCodeEditor) => {
		editorRef.current = ed;
		// Click anywhere in readOnly editor → switch to editing
		ed.onMouseDown(() => {
			if (ed.getOption(monaco!.editor.EditorOption.readOnly)) {
				setEditing(true);
			}
		});
	};

	// Update readOnly when editing state changes
	useEffect(() => {
		if (editorRef.current && monaco) {
			editorRef.current.updateOptions({ readOnly: !editing });
			if (editing) editorRef.current.focus();
		}
	}, [editing, monaco]);

	return (
		<div className="flex h-full flex-col">
			{isDirty && (
				<div className="mb-2 flex justify-end gap-2">
					<Button variant="tertiary" size="sm" onPress={() => { setDraft(content); setEditing(false); }}>Cancel</Button>
					<Button size="sm" onPress={() => setEditing(false)}>Save</Button>
				</div>
			)}

			<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
				<Editor
					height="100%"
					defaultLanguage="markdown"
					value={draft}
					onChange={(v) => setDraft(v ?? "")}
					onMount={handleEditorMount}
					theme="aghub-dark"
					options={{
						...BASE_MONACO_OPTIONS,
						readOnly: !editing,
						renderLineHighlight: editing ? "line" : "none",
					}}
				/>
			</div>
		</div>
	);
}
