import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { BASE_MONACO_OPTIONS } from "./monaco-options";
import { AGHUB_DARK_THEME } from "./monaco-theme";

export function TomlEditor({ content }: { content: string }) {
	const [value, setValue] = useState(content);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
	}, [monaco]);

	return (
		<div className="h-full overflow-hidden rounded-md border border-border">
			<Editor
				height="100%"
				defaultLanguage="ini"
				value={value}
				onChange={(v) => setValue(v ?? "")}
				theme="aghub-dark"
				options={BASE_MONACO_OPTIONS}
			/>
		</div>
	);
}
