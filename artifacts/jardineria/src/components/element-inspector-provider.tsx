import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/lib/site-settings";
import {
  applyElementOverrides,
  parseOverrides,
  tagEditableElements,
  rgbStringToHslString,
  firstFontFamily,
  type ElementOverrideMap,
} from "@/lib/element-inspector";

/**
 * Mounted once on public (non-admin) pages. Handles two independent jobs:
 * 1. Always: tags editable text/button elements with a stable `data-el-id`
 *    and applies any saved (or, inside the admin preview iframe, drafted)
 *    per-element color/font overrides.
 * 2. Only while the parent admin "Editor Visual" has enabled "inspector
 *    mode": highlights hovered elements and reports clicks back to the
 *    parent window so the admin can open a per-element style editor.
 */
export default function ElementInspectorProvider() {
  const settings = useSettings();
  const [inspectorMode, setInspectorMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOverrides, setPreviewOverrides] = useState<ElementOverrideMap | null>(null);
  const mapRef = useRef<Map<string, HTMLElement>>(new Map());
  const observerRef = useRef<MutationObserver | null>(null);
  const hoveredRef = useRef<HTMLElement | null>(null);

  const committedOverrides = useMemo(
    () => parseOverrides(settings["element_style_overrides"]),
    [settings["element_style_overrides"]]
  );

  const effectiveOverrides = previewOverrides ?? committedOverrides;

  // Re-tag elements whenever the DOM changes (route navigation, async data)
  // and keep overrides applied.
  useEffect(() => {
    function retag() {
      // Disconnect while applying to prevent textContent overrides from
      // triggering the observer recursively (infinite loop guard).
      observerRef.current?.disconnect();
      mapRef.current = tagEditableElements();
      applyElementOverrides(effectiveOverrides, mapRef.current);
      if (selectedId) {
        document.querySelectorAll(".sarria-inspect-selected").forEach((el) => el.classList.remove("sarria-inspect-selected"));
        mapRef.current.get(selectedId)?.classList.add("sarria-inspect-selected");
      }
      observerRef.current?.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    retag();
    const observer = new MutationObserver(() => retag());
    observerRef.current = observer;
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); observerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOverrides, selectedId]);

  // Click-to-select behavior, only while inspector mode is enabled.
  useEffect(() => {
    if (!inspectorMode) {
      hoveredRef.current?.classList.remove("sarria-inspect-hover");
      hoveredRef.current = null;
      document.body.classList.remove("sarria-inspect-mode");
      return;
    }

    document.body.classList.add("sarria-inspect-mode");

    function onMouseOver(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("[data-el-id]") as HTMLElement | null;
      if (hoveredRef.current === target) return;
      hoveredRef.current?.classList.remove("sarria-inspect-hover");
      hoveredRef.current = target;
      target?.classList.add("sarria-inspect-hover");
    }

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("[data-el-id]") as HTMLElement | null;
      e.preventDefault();
      e.stopPropagation();
      if (!target) return;
      const id = target.getAttribute("data-el-id")!;
      setSelectedId(id);
      const cs = getComputedStyle(target);
      window.parent.postMessage(
        {
          type: "sarria-element-selected",
          id,
          tag: target.tagName.toLowerCase(),
          text: (target.textContent ?? "").trim().slice(0, 60),
          color: rgbStringToHslString(cs.color),
          font: firstFontFamily(cs.fontFamily),
        },
        "*"
      );
    }

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("click", onClick, true);
      document.body.classList.remove("sarria-inspect-mode");
    };
  }, [inspectorMode]);

  // Messages coming from the parent admin window.
  useEffect(() => {
    function handler(event: MessageEvent) {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "sarria-inspector-mode") {
        setInspectorMode(!!msg.enabled);
        if (!msg.enabled) setSelectedId(null);
      } else if (msg.type === "sarria-style-preview") {
        const overrides = msg.draft?.element_style_overrides
          ?? msg.landingCustomStyles?.elementStyleOverrides;
        if (overrides !== undefined) {
          setPreviewOverrides(parseOverrides(overrides));
        } else if (msg.clearElementPreview) {
          setPreviewOverrides(null);
        }
      } else if (msg.type === "sarria-element-deselect") {
        setSelectedId(null);
        document.querySelectorAll(".sarria-inspect-selected").forEach((el) => el.classList.remove("sarria-inspect-selected"));
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  return null;
}
