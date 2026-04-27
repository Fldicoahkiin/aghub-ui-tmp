import { Button } from "@heroui/react";
import { useState } from "react";

export function MarkdownEditor({ content }: { content: string }) {
	const [mode, setMode] = useState<"preview" | "edit">("preview");

	return (
		<div className="flex h-full flex-col">
			<div className="mb-3 flex gap-1">
				<Button
					size="sm"
					variant={mode === "preview" ? "secondary" : "ghost"}
					onPress={() => setMode("preview")}
				>
					Preview
				</Button>
				<Button
					size="sm"
					variant={mode === "edit" ? "secondary" : "ghost"}
					onPress={() => setMode("edit")}
				>
					Edit
				</Button>
			</div>

			{mode === "preview" ? (
				<div className="prose prose-sm max-w-none dark:prose-invert">
					<pre className="whitespace-pre-wrap text-sm">{content}</pre>
				</div>
			) : (
				<textarea
					defaultValue={content}
					className="h-full w-full resize-none rounded-md border border-border bg-surface p-3 font-mono text-sm leading-6 text-foreground outline-none focus:border-primary"
					spellCheck={false}
				/>
			)}
		</div>
	);
}
