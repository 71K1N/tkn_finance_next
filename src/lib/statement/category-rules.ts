import { normalizeText } from "./text";

/** "When the counterpart contains `contains`, suggest `subcategoryId`." */
export type CategoryRule = {
    contains: string;
    subcategoryId: string;
};

const STORAGE_KEY = "statement-category-rules";

// Subcategory ids are the user's own, so no rule can ship preloaded: the list starts empty
// and grows from the corrections made on the review screen.
export function loadCategoryRules(): CategoryRule[] {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(stored)) return [];
        return stored.filter(
            (rule): rule is CategoryRule =>
                typeof rule?.contains === "string" && typeof rule?.subcategoryId === "string",
        );
    } catch {
        return [];
    }
}

export function saveCategoryRules(rules: CategoryRule[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch {
        // storage unavailable (private window, blocked site data): rules just won't persist
    }
}

/** Adds the rule, replacing an existing one for the same text. */
export function withCategoryRule(rules: CategoryRule[], contains: string, subcategoryId: string): CategoryRule[] {
    const term = normalizeText(contains);
    if (!term) return rules;
    return [...rules.filter((rule) => normalizeText(rule.contains) !== term), { contains: term, subcategoryId }];
}

/** The subcategory of the most specific (longest) rule matching `counterpart`, if any. */
export function matchCategoryRule(rules: CategoryRule[], counterpart: string): string | null {
    const name = normalizeText(counterpart);
    const matches = rules
        .filter((rule) => rule.contains && name.includes(normalizeText(rule.contains)))
        .sort((a, b) => b.contains.length - a.contains.length);
    return matches[0]?.subcategoryId ?? null;
}
