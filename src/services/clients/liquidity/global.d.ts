import { ActorId } from 'sails-js';

declare global {
  export interface Config {
    gas_to_delete_session: number | string | bigint;
    minimum_session_duration_ms: number | string | bigint;
    ms_per_block: number | string | bigint;
  }

  export interface FixedStakingTime {
    last_era_registered: number | string | bigint;
    era_started_at_block: number | string | bigint;
    era_duration_in_blocks: number | string | bigint;
  }

  export type LiquidityEvent = 
    | { Staked: number | string | bigint }
    | { Unstaked: number | string | bigint }
    | { Withdrawn: number | string | bigint }
    | { NewTokenValue: number | string | bigint }
    | { NominationsAdded: null }
    | { RewardsCollected: null }
    | { RewardsAccountChanged: null }
    | { AdminAdded: null }
    | { AdminRemoved: null };

  export type LiquidError = 
    | { NotEnoughBalance: null }
    | { UnstakeNotFound: null }
    | { WithdrawNotFound: null }
    | { WithdrawIsNotReady: null }
    | { ZeroAmount: null }
    | { ZeroEra: null }
    | { ZeroId: null }
    | { ZeroAddress: null }
    | { NotAdmin: null }
    | { AdminAlreadyExists: null }
    | { FTContractError: null }
    | { StoreError: null }
    | { CantRemoveSelf: null }
    | { AdminNotFound: null }
    | { LastAdmin: null }
    | { StakingError: StakingError };

  export type StakingError = 
    | { ContractEraIsNotSynchronized: null }
    | { ActionOnlyForAdmins: null }
    | { ValueIsZero: null }
    | { ValueLessThanOne: null }
    | { ErrorInFirstStageMessage: string }
    | { ErrorInUpstreamProgram: null }
    | { ReplyError: { payload: string; reason: string } }
    | { TokensReadyToWithdraw: null }
    | { TokensAlreadyWithdrawn: null }
    | { TokensAlreadyRebonded: null }
    | { UnbondIdDoesNotExists: null }
    | { BondIdOverflow: null }
    | { UnbondIdAlreadyWithdrawn: number | string | bigint }
    | { UnbondIdWasRebonded: number | string | bigint }
    | { UnbondIdOverflow: null }
    | { UnbondIdCanNotBeWithdraw: { can_withdraw_at_block: number | string | bigint; current_block: number | string | bigint } }
    | { RebondIdOverflow: null }
    | { UserBondOverflow: null }
    | { UserBondUnderflow: null }
    | { UserUnbondOverflow: null }
    | { UserUnbondUnderflow: null }
    | { UserInsufficientBond: null }
    | { UserHasNoBonds: null }
    | { UserHasNoUnbonds: null }
    | { NominateAtLeastOneAddress: null }
    | { NominationsAmountError: { max: number; received: number } };

  export interface BondDataIo {
    data: BondData;
    id: number | string | bigint;
  }

  export interface BondData {
    amount: number | string | bigint;
    bonded_at_timestamp: number | string | bigint;
    bonded_at_block: number;
    bonded_at_era: number | string | bigint;
  }

  export type StakingHistory = 
    | { Bond: { amount: number | string | bigint; bond_at_block: number | string | bigint; bond_at_timestamp: number | string | bigint } }
    | { Unbond: { amount: number | string | bigint; unbond_at_block: number | string | bigint; unbond_at_timestamp: number | string | bigint } }
    | { Rebond: { amount: number | string | bigint; rebond_at_block: number | string | bigint; rebond_at_timestamp: number | string | bigint } }
    | { Withdraw: { amount: number | string | bigint; withdraw_at_block: number | string | bigint; withdraw_at_timestamp: number | string | bigint } };

  export interface Transaction {
    id: number | string | bigint;
    t_type: string;
    amount: number | string | bigint;
    date: string;
  }

  export interface UnbondDataIo {
    data: UnbondData;
    id: number | string | bigint;
  }

  export interface UnbondData {
    amount: number | string | bigint;
    unbond_at_timestamp: number | string | bigint;
    unbond_at_block: number | string | bigint;
    unbond_at_era: number | string | bigint;
    can_withdraw_at_block: number | string | bigint;
    can_withdraw_at_era: number | string | bigint;
    withdrawn: boolean;
    rebonded: boolean;
  }

  export interface Unstake {
    id: number | string | bigint;
    amount: number | string | bigint;
    reward: number | string | bigint;
    liberation_era: number | string | bigint;
    token_value_at: number | string | bigint;
  }

  export interface SignatureData {
    key: ActorId;
    duration: number | string | bigint;
    allowed_actions: Array<ActionsForSession>;
  }

  export type ActionsForSession = "Stake" | "Unstake" | "Withdraw";

  export interface SessionData {
    key: ActorId;
    expires: number | string | bigint;
    allowed_actions: Array<ActionsForSession>;
    expires_at_block: number;
  }
};