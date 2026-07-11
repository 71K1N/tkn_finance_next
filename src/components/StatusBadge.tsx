import { Badge, type BadgeProps } from "@chakra-ui/react";

export type BadgeStatus = "success" | "danger" | "warning" | "info" | "primary" | "neutral";

type StatusBadgeProps = Omit<BadgeProps, "colorPalette"> & { status?: BadgeStatus };

/**
 * tikin-ds's theme replaces Chakra's default Badge recipe with its own, whose only
 * variant groups are `variant`/`size`/`status` (success/danger/warning/info/primary/
 * neutral, tied to the design system's semantic color tokens) — `colorPalette` isn't
 * part of it and is silently ignored. Chakra's shipped BadgeProps type doesn't know
 * about this project-specific recipe, so the cast is isolated here instead of at
 * every call site.
 */
export default function StatusBadge({ status, ...rest }: StatusBadgeProps) {
    return <Badge {...(rest as BadgeProps)} {...({ status } as Record<string, unknown>)} />;
}
