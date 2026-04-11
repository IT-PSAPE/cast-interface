import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@renderer/utils/cn';
import { cv } from '@renderer/utils/cv';
import { Popover } from '../overlays/popover';

const optionStyles = cv({
  base: 'flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer select-none mx-1 rounded',
  variants: {
    highlighted: {
      true: ['bg-secondary'],
      false: [],
    },
    selected: {
      true: ['text-text-primary'],
      false: ['text-text-secondary'],
    },
  },
  defaultVariants: {
    highlighted: false,
    selected: false,
  },
});

interface SelectOption {
  value: string;
  label: string;
  style?: CSSProperties;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  className?: string;
  placeholder?: string;
}

export function CustomSelect({ value, onChange, onBlur, options, className = '', placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [typeAhead, setTypeAhead] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeAheadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder ?? '';

  function handleOpen() {
    setOpen(true);
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }

  function handleClose() {
    setOpen(false);
    setHighlightedIndex(-1);
    setTypeAhead('');
    onBlur?.();
  }

  function handleSelect(optionValue: string) {
    onChange(optionValue);
    handleClose();
    triggerRef.current?.focus();
  }

  const scrollToIndex = useCallback((index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (index >= 0 && index < items.length) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }, []);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = Math.min(highlightedIndex + 1, options.length - 1);
        setHighlightedIndex(next);
        scrollToIndex(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = Math.max(highlightedIndex - 1, 0);
        setHighlightedIndex(prev);
        scrollToIndex(prev);
        break;
      }
      case 'Home': {
        event.preventDefault();
        setHighlightedIndex(0);
        scrollToIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        const last = options.length - 1;
        setHighlightedIndex(last);
        scrollToIndex(last);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;
      }
      case 'Tab': {
        handleClose();
        break;
      }
      default: {
        if (event.key.length === 1) {
          event.preventDefault();
          handleTypeAhead(event.key);
        }
      }
    }
  }

  function handleTypeAhead(char: string) {
    const next = typeAhead + char.toLowerCase();
    setTypeAhead(next);

    clearTimeout(typeAheadTimer.current);
    typeAheadTimer.current = setTimeout(() => setTypeAhead(''), 500);

    const matchIndex = options.findIndex((opt) => opt.label.toLowerCase().startsWith(next));
    if (matchIndex >= 0) {
      setHighlightedIndex(matchIndex);
      scrollToIndex(matchIndex);
    }
  }

  useEffect(() => {
    return () => clearTimeout(typeAheadTimer.current);
  }, []);

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={open ? handleClose : handleOpen}
        onKeyDown={handleKeyDown}
        className="flex min-w-0 w-full items-center min-h-8 rounded-md bg-tertiary text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
      >
        <span className="truncate flex-1 px-1.5 text-left" style={selectedOption?.style}>
          {selectedLabel}
        </span>
        <ChevronDown className="shrink-0 size-3.5 mr-1.5 text-text-tertiary" />
      </button>

      <Popover anchor={triggerRef.current} open={open} onClose={handleClose} placement="bottom" offset={2}>
        <div
          ref={listRef}
          role="listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
          onKeyDown={handleKeyDown}
          className="rounded-lg border border-border-primary bg-primary shadow-lg max-h-60 overflow-y-auto py-1"
          style={{ minWidth: triggerRef.current?.offsetWidth }}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={opt.value}
                id={`option-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setHighlightedIndex(index)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.value)}
                className={optionStyles({ highlighted: isHighlighted, selected: isSelected })}
                style={opt.style}
              >
                <span className="flex-1 truncate">{opt.label}</span>
                {isSelected ? <Check className="shrink-0 size-3.5 text-brand" /> : null}
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}
