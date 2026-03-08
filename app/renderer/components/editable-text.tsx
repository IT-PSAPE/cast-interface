import { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onCommit: (newValue: string) => void;
  editing?: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableText({ value, onCommit, editing = false, placeholder = 'Untitled', className = '' }: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(editing);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== value) {
      onCommit(trimmed);
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setDraft(value);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDraft(e.target.value);
  }

  function handleBlur() {
    commit();
  }

  function handleMouseDownInput(e: React.MouseEvent<HTMLInputElement>) {
    e.stopPropagation();
  }

  function handleClickInput(e: React.MouseEvent<HTMLInputElement>) {
    e.stopPropagation();
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseDown={handleMouseDownInput}
        onClick={handleClickInput}
        placeholder={placeholder}
        className={`bg-background-primary_alt border border-brand rounded-sm px-1 py-0 text-text-primary outline-none ${className}`}
      />
    );
  }

  return (
    <span onDoubleClick={handleDoubleClickSpan} className={`cursor-default select-none truncate ${className}`}>
      {value || placeholder}
    </span>
  );
}
