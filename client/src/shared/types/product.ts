export type TProduct = {
    id?: string;
    categoryId?: string;
    name?: string;
    img?: any;
    description?: string;
    price?: number;
};

export type TCategory = {
    id: string;
    name: string;
    img: string;
};