import type { editor } from "monaco-editor";

/** Shared Monaco editor options used across all editors (json, toml, markdown) */
export const BASE_MONACO_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
	minimap: { enabled: false },
	fontSize: 13,
	lineNumbers: "on",
	scrollBeyondLastLine: false,
	wordWrap: "on",
	tabSize: 2,
	automaticLayout: true,
	padding: { top: 12 },
	glyphMargin: false,
	folding: false,
};
