import { useState, useRef, useEffect } from 'react';

interface EditableTextAreaProps {
  value: string;
  onCommit: (newValue: string) => void;
  editing?: boolean;
  placeholder?: string;
  className?: string;
  trimOnCommit?: boolean;
}

export function EditableTextArea({
  value,
  onCommit,
  editing = false,
  placeholder = 'Untitled',
  className = '',
  trimOnCommit = true,
}: EditableTextAreaProps) {
  const [isEditing, setIsEditing] = useState(editing);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setIsEditing(true);
      setDraft(value);
    }
  }, [editing, value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
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

  function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    e.stopPropagation();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setDraft(value);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value);
  }

  function handleBlur() {
    commit();
  }

  function handleMouseDownInput(e: React.MouseEvent<HTMLTextAreaElement>) {
    e.stopPropagation();
  }

  function handleClickInput(e: React.MouseEvent<HTMLTextAreaElement>) {
    e.stopPropagation();
  }

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
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
    <div onDoubleClick={handleDoubleClick} className={`cursor-default select-none whitespace-pre-wrap ${className}`}>
      {value || placeholder}
    </div>
  );
}
