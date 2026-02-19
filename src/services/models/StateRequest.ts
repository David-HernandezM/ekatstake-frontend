import { ActorId } from "sails-js";

export interface StakeRequest {
    amount: number;
    sessionForAccount: ActorId | null
}   
