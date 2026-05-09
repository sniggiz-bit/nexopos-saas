export declare enum SyncTypeDto {
    PRODUCTS = "PRODUCTS",
    INVENTORY = "INVENTORY",
    ORDERS = "ORDERS",
    FULL = "FULL"
}
export declare class TriggerSyncDto {
    type?: SyncTypeDto;
}
