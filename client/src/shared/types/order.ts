export type TOrderItem = {
    name: string;
    id: string;
    count: number;
    comment: string;
}
export type TOrder = {
    customerName: string;
    customerPhone: number;
    productsCount: number;
    itemsCount: number;
    shippingMethod: string;
    status: string;
    totalPrice: number;
    shippingAddress: string;
    prodcutsList : [];
};