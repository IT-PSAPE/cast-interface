// utils/createVariants.ts

import { cn } from "./cn";

/**
 * A map of variant-names to a map of variant-values → arrays of class strings
 * e.g. { size: { small: ['px-2'], large: ['px-6'] } }
 */
type VariantDefinitions = {
    [key: string]: Record<string, string[]>;
};

/** Props your consumer will pass: one key per variant, plus optional className */
type VariantProps<V extends VariantDefinitions> = {
    [K in keyof V]?: keyof V[K] extends string ? keyof V[K] : never;
} & {
    className?: string;
};

/** The config you pass once, to build your "styler" */
type VariantConfig<V extends VariantDefinitions> = {
    base?: string | string[];
    /** Your variants map */
    variants?: V;
    /** Which variants to pick when consumer leaves one undefined */
    defaultVariants?: { [K in keyof V]?: keyof V[K] };
};

/**
 * Returns a function which, given a subset of variant props,
 * spits back a single clsx-ready string.
 */
export function cv<V extends VariantDefinitions>(
    config: VariantConfig<V>,
) {
    return (props: VariantProps<V> = {}): string => {
        const { className, ...selected } = props as VariantProps<V> & {
            [key: string]: unknown;
        };
        const classes: string[] = [];

        // 1) base
        if (config.base) {
            classes.push(
                ...(Array.isArray(config.base) ? config.base : [config.base]),
            );
        }

        // 2) variants
        const variants = config.variants ?? ({} as V);
        const defaultVariants =
            config.defaultVariants ?? ({} as Partial<Record<keyof V, string[]>>);

        for (const variantName in variants) {
            if (Object.prototype.hasOwnProperty.call(variants, variantName)) {
                const typedVariantName = variantName as keyof V;
                const selectedValue = (selected as Record<keyof V, string | undefined>)[
                    typedVariantName
                ];
                const variantValue = selectedValue ?? defaultVariants[typedVariantName];
                const variantClasses = variantValue
                    ? variants[typedVariantName]?.[variantValue as string]
                    : undefined;

                if (variantClasses) {
                    classes.push(...variantClasses);
                }
            }
        }

        // 3) extra override
        if (className) {
            classes.push(className);
        }

        return cn(...classes);
    };
}