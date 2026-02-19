import { ActorId } from "sails-js";

export interface UnstakeRequest {
    amount: number;
    sessionForAccount: ActorId | null
}