import React, { useState } from "react";
import { EditorRoot, EditorContent } from "novel";

interface EditorProps {
  initialValue?: any;
  onChange?: (value: any) => void;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ initialValue, onChange, readOnly }) => {
  const [content, setContent] = useState(initialValue || {});

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <EditorRoot>
        <EditorContent
          initialContent={content}
          onUpdate={({ editor }) => {
            const json = editor?.getJSON();
            setContent(json);
            if (onChange) onChange(json);
          }}
          editable={!readOnly}
          className="min-h-[200px] p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 focus:outline-none"
        />
      </EditorRoot>
    </div>
  );
};
