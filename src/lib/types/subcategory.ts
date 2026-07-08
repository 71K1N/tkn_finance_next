export type Subcategory = {
    id: string;
    name: string;
    description: string;
    categoryId: string;
};

export type SubcategoryInput = {
    name: string;
    description: string;
    categoryId: string;
};
