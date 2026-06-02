import React, { createContext, useContext } from 'react';

type ComboboxContextValue = {
  value: string[];
  onValueChange?: (value: string[]) => void;
};

type LooseProps = {
  children?: React.ReactNode | ((value: string[]) => React.ReactNode);
  className?: string;
  value?: unknown;
  onValueChange?: (value: unknown) => void;
  items?: unknown;
  multiple?: boolean;
  autoHighlight?: boolean;
  placeholder?: string;
};

const ComboboxContext = createContext<ComboboxContextValue>({ value: [] });

function normalizeValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

function Root({ children, value, onValueChange, items, multiple, autoHighlight }: LooseProps) {
  void items;
  void multiple;
  void autoHighlight;

  return (
    <ComboboxContext.Provider value={{ value: normalizeValue(value), onValueChange }}>
      <div>{children as React.ReactNode}</div>
    </ComboboxContext.Provider>
  );
}

function Passthrough({ children, className }: LooseProps) {
  return <div className={className}>{children as React.ReactNode}</div>;
}

function Portal({ children }: LooseProps) {
  return <>{children as React.ReactNode}</>;
}

function Value({ children }: LooseProps) {
  const context = useContext(ComboboxContext);
  return <>{typeof children === 'function' ? children(context.value) : children}</>;
}

function Input({ className, placeholder }: LooseProps) {
  return <input className={className} placeholder={placeholder} />;
}

function Item({ children, className, value }: LooseProps) {
  const context = useContext(ComboboxContext);
  const itemValue = value == null ? '' : String(value);

  const toggle = () => {
    if (!itemValue || !context.onValueChange) return;
    const next = context.value.includes(itemValue)
      ? context.value.filter((current) => current !== itemValue)
      : [...context.value, itemValue];
    context.onValueChange(next);
  };

  return (
    <div className={className} role="option" aria-selected={context.value.includes(itemValue)} onMouseDown={toggle}>
      {children as React.ReactNode}
    </div>
  );
}

function Chip({ children, className }: LooseProps) {
  return <span className={className}>{children as React.ReactNode}</span>;
}

function ChipRemove({ children, className }: LooseProps) {
  return (
    <button type="button" className={className} onMouseDown={(event) => event.stopPropagation()}>
      {children as React.ReactNode}
    </button>
  );
}

function Empty({ children, className }: LooseProps) {
  return <div className={className}>{children as React.ReactNode}</div>;
}

function ItemIndicator({ children }: LooseProps) {
  return <>{children as React.ReactNode}</>;
}

export const Combobox = {
  Root,
  Chips: Passthrough,
  Value,
  Chip,
  ChipRemove,
  Input,
  Portal,
  Positioner: Passthrough,
  Popup: Passthrough,
  Empty,
  List: Passthrough,
  Item,
  ItemIndicator,
};
