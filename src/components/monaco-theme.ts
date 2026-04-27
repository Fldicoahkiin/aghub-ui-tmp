import type { editor } from "monaco-editor";

export const AGHUB_DARK_THEME: editor.IStandaloneThemeData = {
	base: "vs-dark",
	inherit: true,
	rules: [
		{ token: "comment", foreground: "6b7280" },
		{ token: "string", foreground: "a5b4c8" },
		{ token: "number", foreground: "93b5e8" },
		{ token: "keyword", foreground: "c4a5e0" },
		{ token: "type", foreground: "8ec8d8" },
		{ token: "delimiter", foreground: "6b7280" },
	],
	colors: {
		"editor.background": "#00000000",
		"editor.foreground": "#d4d4d8",
		"editor.lineHighlightBackground": "#ffffff08",
		"editor.selectionBackground": "#3b82f640",
		"editorCursor.foreground": "#d4d4d8",
		"editorLineNumber.foreground": "#52525b",
		"editorLineNumber.activeForeground": "#a1a1aa",
		"editor.inactiveSelectionBackground": "#3b82f620",
		"editorIndentGuide.background": "#27272a",
		"editorIndentGuide.activeBackground": "#3f3f46",
		"scrollbarSlider.background": "#ffffff10",
		"scrollbarSlider.hoverBackground": "#ffffff20",
	},
};

export const AGHUB_LIGHT_THEME: editor.IStandaloneThemeData = {
	base: "vs",
	inherit: true,
	rules: [
		{ token: "comment", foreground: "9ca3af" },
		{ token: "string", foreground: "5b6e88" },
		{ token: "number", foreground: "3b6faf" },
		{ token: "keyword", foreground: "7c3aed" },
		{ token: "type", foreground: "0d9488" },
		{ token: "delimiter", foreground: "9ca3af" },
	],
	colors: {
		"editor.background": "#00000000",
		"editor.foreground": "#27272a",
		"editor.lineHighlightBackground": "#00000006",
		"editor.selectionBackground": "#3b82f630",
		"editorCursor.foreground": "#27272a",
		"editorLineNumber.foreground": "#d4d4d8",
		"editorLineNumber.activeForeground": "#71717a",
		"editorIndentGuide.background": "#e4e4e7",
		"editorIndentGuide.activeBackground": "#d4d4d8",
		"scrollbarSlider.background": "#00000010",
		"scrollbarSlider.hoverBackground": "#00000020",
	},
};
