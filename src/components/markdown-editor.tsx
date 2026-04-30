import Editor, { useMonaco, type BeforeMount } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { editor } from "monaco-editor";
import { BASE_MONACO_OPTIONS } from "./monaco-options";
import { AGHUB_DARK_THEME } from "./monaco-theme";

export function MarkdownEditor({
	content,
	onDirtyChange,
}: {
	content: string;
	onDirtyChange?: (dirty: boolean) => void;
}) {
	const [draft, setDraft] = useState(content);
	const [editing, setEditing] = useState(false);
	const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
	const monaco = useMonaco();

	const handleBeforeMount: BeforeMount = useCallback((m) => {
		m.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, []);

	// Also define on hot reload
	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	useEffect(() => {
		setDraft(content);
		setEditing(false);
	}, [content]);

	const isDirty = draft !== content;

	useEffect(() => {
		onDirtyChange?.(isDirty);
	}, [isDirty, onDirtyChange]);

	const handleEditorMount = (ed: editor.IStandaloneCodeEditor) => {
		editorRef.current = ed;
		ed.onMouseDown(() => {
			if (ed.getOption(monaco!.editor.EditorOption.readOnly)) {
				setEditing(true);
			}
		});
	};

	useEffect(() => {
		if (editorRef.current && monaco) {
			editorRef.current.updateOptions({ readOnly: !editing });
			if (editing) editorRef.current.focus();
		}
	}, [editing, monaco]);

	return (
		<div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-surface">
			<Editor
				height="100%"
				defaultLanguage="markdown"
				value={draft}
				onChange={(v) => setDraft(v ?? "")}
				beforeMount={handleBeforeMount}
				onMount={handleEditorMount}
				theme="aghub-dark"
				loading={<div className="h-full bg-surface" />}
				options={{
					...BASE_MONACO_OPTIONS,
					readOnly: !editing,
					renderLineHighlight: editing ? "line" : "none",
				}}
			/>
		</div>
	);
}
