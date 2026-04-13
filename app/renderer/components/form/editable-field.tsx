import { useState, useRef, useEffect } from 'react';
import { Label } from '../display/text';

interface EditableFieldProps {
  value: string;
  onCommit: (newValue: string) => void;
  editing?: boolean;
  placeholder?: string;
  className?: string;
  trimOnCommit?: boolean;
  multiline?: boolean;
}

export function EditableField({
  value,
  onCommit,
  editing = false,
  placeholder = 'Untitled',
  className = '',
  trimOnCommit = true,
  multiline = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(editing);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

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

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(value);
    setIsEditing(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
    if (multiline) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit();
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
      }
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

  function handleMouseDownInput(e: React.MouseEvent) {
    e.stopPropagation();
  }

  function handleClickInput(e: React.MouseEvent) {
    e.stopPropagation();
  }

  if (isEditing) {
    const sharedProps = {
      value: draft,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      onMouseDown: handleMouseDownInput,
      onClick: handleClickInput,
      placeholder,
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          {...sharedProps}
          rows={Math.max(3, draft.split('\n').length || 1)}
          className={`m-0 w-full resize-y border-none bg-transparent p-0 text-inherit font-inherit outline-none ${className}`}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        {...sharedProps}
        className={`all-unset m-0 border-none bg-transparent p-0 text-inherit font-inherit outline-none ${className}`}
      />
    );
  }

  if (multiline) {
    return (
      <div onDoubleClick={handleDoubleClick} className={`cursor-default select-none whitespace-pre-wrap ${className}`}>
        {value || placeholder}
      </div>
    );
  }

  return (
    <Label.sm onDoubleClick={handleDoubleClick} className={`cursor-default select-none truncate ${className}`}>
      {value || placeholder}
    </Label.sm>
  );
}
