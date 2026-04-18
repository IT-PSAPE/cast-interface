import { cn } from "@renderer/utils/cn";
import { createContext, useCallback, useContext, useMemo, useState, type HTMLAttributes } from "react";

// ─── Accordion Context ──────────────────────────────────

type AccordionContextValue = {
    openItems: Set<string>;
    toggle: (value: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
    const context = useContext(AccordionContext);
    if (!context) throw new Error("Accordion components must be used within Accordion.Root");
    return context;
}

// ─── Item Context ───────────────────────────────────────

type AccordionItemContextValue = {
    value: string;
    isOpen: boolean;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
    const context = useContext(AccordionItemContext);
    if (!context) throw new Error("Accordion.Trigger/Content must be used within Accordion.Item");
    return context;
}

// ─── Root ───────────────────────────────────────────────

type AccordionRootProps = HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple";
    defaultValue?: string | string[];
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
};

function AccordionRoot({ type = "single", defaultValue, value, onValueChange, children, className, ...props }: AccordionRootProps) {
    const [uncontrolledOpenItems, setUncontrolledOpenItems] = useState<Set<string>>(() => {
        if (!defaultValue) return new Set();
        return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
    });

    const openItems = useMemo(() => {
        if (value === undefined) return uncontrolledOpenItems;
        if (Array.isArray(value)) return new Set(value);
        return new Set(value ? [value] : []);
    }, [uncontrolledOpenItems, value]);

    const toggle = useCallback(
        (value: string) => {
            const next = new Set(openItems);
            if (next.has(value)) {
                next.delete(value);
            } else {
                if (type === "single") next.clear();
                next.add(value);
            }

            if (onValueChange) {
                onValueChange(type === "single" ? [...next][0] ?? "" : [...next]);
                return;
            }

            setUncontrolledOpenItems(next);
        },
        [onValueChange, openItems, type],
    );

    const contextValue = useMemo(() => ({ openItems, toggle }), [openItems, toggle]);

    return (
        <AccordionContext.Provider value={contextValue}>
            <div className={cn(className)} {...props}>
                {children}
            </div>
        </AccordionContext.Provider>
    );
}

// ─── Item ───────────────────────────────────────────────

type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
    value: string;
};

function AccordionItem({ value, children, className, ...props }: AccordionItemProps) {
    const { openItems } = useAccordion();
    const isOpen = openItems.has(value);

    const contextValue = useMemo(() => ({ value, isOpen }), [value, isOpen]);

    return (
        <AccordionItemContext.Provider value={contextValue}>
            <div className={cn(className)} data-state={isOpen ? "open" : "closed"} {...props}>
                {children}
            </div>
        </AccordionItemContext.Provider>
    );
}

// ─── Trigger ────────────────────────────────────────────

type AccordionTriggerProps = HTMLAttributes<HTMLButtonElement>;

function AccordionTrigger({ children, className, onClick, ...props }: AccordionTriggerProps) {
    const { toggle } = useAccordion();
    const { value, isOpen } = useAccordionItem();

    return (
        <button
            type="button"
            className={cn("w-full cursor-pointer", className)}
            data-state={isOpen ? "open" : "closed"}
            onClick={(e) => {
                toggle(value);
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </button>
    );
}

// ─── Content ────────────────────────────────────────────

type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

function AccordionContent({ children, className, ...props }: AccordionContentProps) {
    const { isOpen } = useAccordionItem();

    return (
        <div
            className={cn("grid transition-[grid-template-rows] duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            <div className={cn("overflow-hidden", className)}>
                {children}
            </div>
        </div>
    );
}

// ─── Compound Export ────────────────────────────────────

export const Accordion = Object.assign(AccordionRoot, {
    Item: AccordionItem,
    Trigger: AccordionTrigger,
    Content: AccordionContent,
});

export { useAccordionItem };
