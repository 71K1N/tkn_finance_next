import { Badge, type DsBadgeProps } from "tikin-uai";

export type BadgeStatus = "success" | "danger" | "warning" | "info" | "primary" | "neutral";

type StatusBadgeProps = Omit<DsBadgeProps, "colorPalette"> & { status?: BadgeStatus };

const STATUS_COLOR_PALETTE: Record<BadgeStatus, DsBadgeProps["colorPalette"]> = {
    success: "success",
    danger: "danger",
    warning: "warning",
    info: "info",
    primary: "primary",
    neutral: "secondary",
};

export default function StatusBadge({ status = "primary", ...rest }: StatusBadgeProps) {
    return <Badge {...rest} colorPalette={STATUS_COLOR_PALETTE[status]} />;
}
