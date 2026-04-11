import { useState, useRef, useEffect } from 'react';
import { Label } from '../display/text';

interface EditableTextProps {
  value: string;
  onCommit: (newValue: string) => void;
  editing?: boolean;
  placeholder?: string;
  className?: string;
  trimOnCommit?: boolean;
}

export function EditableText({
  value,
  onCommit,
  editing = false,
  placeholder = 'Untitled',
  className = '',
  trimOnCommit = true,
}: EditableTextProps) {
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
    const nextValue = trimOnCommit ? draft.trim() : draft;
    setIsEditing(false);
    if (trimOnCommit && !nextValue) return;
    if (nextValue !== value) {
      onCommit(nextValue);
    }
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLSpanElement>) {
    e.stopPropagation();
    setDraft(value);
    setIsEditing(true);
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
        className={`all-unset m-0 border-none bg-transparent p-0 text-inherit font-inherit outline-none ${className}`}
      />
    );
  }

  return (
    <Label.sm onDoubleClick={handleDoubleClick} className={`cursor-default select-none truncate ${className}`}>
      {value || placeholder}
    </Label.sm>
  );
}
