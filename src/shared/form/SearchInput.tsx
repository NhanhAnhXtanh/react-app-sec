import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  ariaLabel?: string;
};

export function SearchInput({
  value,
  onValueChange,
  placeholder,
  className,
  debounceMs = 250,
  ariaLabel,
}: Props) {
  const [text, setText] = useState(value);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    setText(value);
    lastEmittedRef.current = value;
  }, [value]);

  useEffect(() => {
    if (text === lastEmittedRef.current) return;
    const timer = setTimeout(() => {
      lastEmittedRef.current = text;
      onValueChange(text);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [text, onValueChange, debounceMs]);

  return (
    <InputGroup
      className={cn(
        'w-full max-w-xs shadow-none sm:max-w-none sm:w-64',
        className,
      )}
    >
      <InputGroupAddon align="inline-start" aria-hidden>
        <Search className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </InputGroup>
  );
}
