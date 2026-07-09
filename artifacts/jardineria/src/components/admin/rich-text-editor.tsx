import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ value, onChange, placeholder, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const editorEl = document.createElement("div");
    containerRef.current.appendChild(editorEl);

    const quill = new Quill(editorEl, {
      theme: "snow",
      placeholder: placeholder ?? "Escribe el contenido aquí...",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "blockquote"],
          ["clean"],
        ],
      },
    });

    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on("text-change", () => {
      if (!isInternalUpdate.current) {
        const html = editorEl.querySelector(".ql-editor")?.innerHTML ?? "";
        onChangeRef.current(html === "<p><br></p>" ? "" : html);
      }
    });

    return () => {
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const editorEl = quill.root;
    const current = editorEl.innerHTML;
    const normalized = current === "<p><br></p>" ? "" : current;
    if (normalized !== value) {
      isInternalUpdate.current = true;
      const sel = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(value ?? "");
      if (sel) {
        try { quill.setSelection(sel); } catch {}
      }
      isInternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div className="rich-text-editor-wrapper border border-border rounded-lg overflow-hidden">
      <div ref={containerRef} style={{ minHeight: height }} />
      <style>{`
        .rich-text-editor-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.4);
        }
        .rich-text-editor-wrapper .ql-container {
          border: none;
          font-family: inherit;
          font-size: 0.9rem;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${height}px;
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}
