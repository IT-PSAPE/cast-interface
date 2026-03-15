import { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onCommit: (newValue: string) => void;
  editing?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  trimOnCommit?: boolean;
}

export function EditableText({
  value,
  onCommit,
  editing = false,
  multiline = false,
  placeholder = 'Untitled',
  className = '',
  trimOnCommit = true,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(editing);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  function setInputRef(node: HTMLInputElement | HTMLTextAreaElement | null) {
    inputRef.current = node;
  }

  useEffect(() => {
    if (editing) {
      setIsEditing(true);
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function commit() {
    const nextValue = trimOnCommit ? draft.trim() : draft;
    setIsEditing(false);
    if (trimOnCommit && !nextValue) return;
    if (nextValue !== value) {
      onCommit(nextValue);
    }
  }

  function handleDoubleClick() {
    setDraft(value);
    setIsEditing(true);
  }

  function handleDoubleClickSpan(e: React.MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    handleDoubleClick();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.stopPropagation();
    if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setDraft(value);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setDraft(e.target.value);
  }

  function handleBlur() {
    commit();
  }

  function handleMouseDownInput(e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.stopPropagation();
  }

  function handleClickInput(e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.stopPropagation();
  }

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={setInputRef}
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onMouseDown={handleMouseDownInput}
          onClick={handleClickInput}
          placeholder={placeholder}
          rows={Math.max(3, draft.split('\n').length || 1)}
          className={`m-0 w-full resize-y border-none bg-transparent p-0 text-inherit font-inherit outline-none ${className}`}
        />
      );
    }

    return (
      <input
        ref={setInputRef}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseDown={handleMouseDownInput}
        onClick={handleClickInput}
        placeholder={placeholder}
        className={`m-0 border-none bg-transparent p-0 text-inherit font-inherit outline-none ${className}`}
      />
    );
  }

  if (multiline) {
    return (
      <div onDoubleClick={handleDoubleClickSpan} className={`cursor-default select-none whitespace-pre-wrap ${className}`}>
        {value || placeholder}
      </div>
    );
  }

  return (
    <span onDoubleClick={handleDoubleClickSpan} className={`cursor-default select-none truncate ${className}`}>
      {value || placeholder}
    </span>
  );
}
