export type WishItemStatus = "active" | "completed" | "abandoned" | "on_hold";
export type WishItemPriority = "low" | "medium" | "high";

export type WishItem = {
    id: string;
    userId: number;
    name: string;
    estimatedCost: number;
    targetDate: string;
    status: WishItemStatus;
    priority: WishItemPriority;
    linkedGoalId: string | null;
};

export type WishItemInput = {
    name: string;
    estimatedCost: number;
    targetDate: string;
    priority?: WishItemPriority;
    linkedGoalId?: string;
};
