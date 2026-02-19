export interface WithdrawRequest {
    user: `0x${string}`;
    id: number;
    liberationEra: number;
    amount: number;
}