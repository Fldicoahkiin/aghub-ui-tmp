import Editor, { useMonaco } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import { AGHUB_DARK_THEME } from "./monaco-theme";

export function TomlEditor({ content }: { content: string }) {
	const [value, setValue] = useState(content);
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) {
			monaco.editor.defineTheme("aghub-dark", AGHUB_DARK_THEME);
		}
	}, [monaco]);

	return (
		<div className="h-full overflow-hidden rounded-md border border-border">
			<Editor
				height="100%"
				defaultLanguage="ini"
				value={value}
				onChange={(v) => setValue(v ?? "")}
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
	);
}
