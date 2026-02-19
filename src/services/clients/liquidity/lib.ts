/* eslint-disable */

import { GearApi, BaseGearProgram, HexString } from '@gear-js/api';
import { TypeRegistry } from '@polkadot/types';
import { TransactionBuilder, ActorId, QueryBuilder, getServiceNamePrefix, getFnNamePrefix, ZERO_ADDRESS } from 'sails-js';

export class SailsProgram {
  public readonly registry: TypeRegistry;
  public readonly liquidity: Liquidity;
  public readonly session: Session;
  private _program?: BaseGearProgram;

  constructor(public api: GearApi, programId?: `0x${string}`) {
    const types: Record<string, any> = {
      Config: {"gas_to_delete_session":"u64","minimum_session_duration_ms":"u64","ms_per_block":"u64"},
      FixedStakingTime: {"last_era_registered":"u64","era_started_at_block":"u64","era_duration_in_blocks":"u64"},
      LiquidityEvent: {"_enum":{"Staked":"u128","Unstaked":"u128","Withdrawn":"u128","NewTokenValue":"u128","NominationsAdded":"Null","RewardsCollected":"Null","RewardsAccountChanged":"Null","AdminAdded":"Null","AdminRemoved":"Null"}},
      LiquidError: {"_enum":{"NotEnoughBalance":"Null","UnstakeNotFound":"Null","WithdrawNotFound":"Null","WithdrawIsNotReady":"Null","ZeroAmount":"Null","ZeroEra":"Null","ZeroId":"Null","ZeroAddress":"Null","NotAdmin":"Null","AdminAlreadyExists":"Null","FTContractError":"Null","StoreError":"Null","CantRemoveSelf":"Null","AdminNotFound":"Null","LastAdmin":"Null","StakingError":"StakingError"}},
      StakingError: {"_enum":{"ContractEraIsNotSynchronized":"Null","ActionOnlyForAdmins":"Null","ValueIsZero":"Null","ValueLessThanOne":"Null","ErrorInFirstStageMessage":"String","ErrorInUpstreamProgram":"Null","ReplyError":{"payload":"String","reason":"String"},"TokensReadyToWithdraw":"Null","TokensAlreadyWithdrawn":"Null","TokensAlreadyRebonded":"Null","UnbondIdDoesNotExists":"Null","BondIdOverflow":"Null","UnbondIdAlreadyWithdrawn":"u64","UnbondIdWasRebonded":"u64","UnbondIdOverflow":"Null","UnbondIdCanNotBeWithdraw":{"can_withdraw_at_block":"u64","current_block":"u64"},"RebondIdOverflow":"Null","UserBondOverflow":"Null","UserBondUnderflow":"Null","UserUnbondOverflow":"Null","UserUnbondUnderflow":"Null","UserInsufficientBond":"Null","UserHasNoBonds":"Null","UserHasNoUnbonds":"Null","NominateAtLeastOneAddress":"Null","NominationsAmountError":{"max":"u8","received":"u32"}}},
      BondDataIo: {"data":"BondData","id":"u64"},
      BondData: {"amount":"u128","bonded_at_timestamp":"u64","bonded_at_block":"u32","bonded_at_era":"u64"},
      StakingHistory: {"_enum":{"Bond":{"amount":"u128","bond_at_block":"u64","bond_at_timestamp":"u64"},"Unbond":{"amount":"u128","unbond_at_block":"u64","unbond_at_timestamp":"u64"},"Rebond":{"amount":"u128","rebond_at_block":"u64","rebond_at_timestamp":"u64"},"Withdraw":{"amount":"u128","withdraw_at_block":"u64","withdraw_at_timestamp":"u64"}}},
      Transaction: {"id":"u128","t_type":"String","amount":"U256","date":"String"},
      UnbondDataIo: {"data":"UnbondData","id":"u64"},
      UnbondData: {"amount":"u128","unbond_at_timestamp":"u64","unbond_at_block":"u64","unbond_at_era":"u64","can_withdraw_at_block":"u64","can_withdraw_at_era":"u64","withdrawn":"bool","rebonded":"bool"},
      Unstake: {"id":"u128","amount":"U256","reward":"U256","liberation_era":"u128","token_value_at":"U256"},
      SignatureData: {"key":"[u8;32]","duration":"u64","allowed_actions":"Vec<ActionsForSession>"},
      ActionsForSession: {"_enum":["Stake","Unstake","Withdraw"]},
      SessionData: {"key":"[u8;32]","expires":"u64","allowed_actions":"Vec<ActionsForSession>","expires_at_block":"u32"},
    }

    this.registry = new TypeRegistry();
    this.registry.setKnownTypes({ types });
    this.registry.register(types);
    if (programId) {
      this._program = new BaseGearProgram(programId, api);
    }

    this.liquidity = new Liquidity(this);
    this.session = new Session(this);
  }

  public get programId(): `0x${string}` {
    if (!this._program) throw new Error(`Program ID is not set`);
    return this._program.id;
  }

  newCtorFromCode(code: Uint8Array | Buffer | HexString, session_config: Config, guardian_reward_account: ActorId, gvara_program_id: ActorId, on_mainnet: boolean, fixed_time: FixedStakingTime | null): TransactionBuilder<null> {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'upload_program',
      null,
      'New',
      [session_config, guardian_reward_account, gvara_program_id, on_mainnet, fixed_time],
      '(Config, [u8;32], [u8;32], bool, Option<FixedStakingTime>)',
      'String',
      code,
      async (programId) =>  {
        this._program = await BaseGearProgram.new(programId, this.api);
      }
    );
    return builder;
  }

  newCtorFromCodeId(codeId: `0x${string}`, session_config: Config, guardian_reward_account: ActorId, gvara_program_id: ActorId, on_mainnet: boolean, fixed_time: FixedStakingTime | null) {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'create_program',
      null,
      'New',
      [session_config, guardian_reward_account, gvara_program_id, on_mainnet, fixed_time],
      '(Config, [u8;32], [u8;32], bool, Option<FixedStakingTime>)',
      'String',
      codeId,
      async (programId) =>  {
        this._program = await BaseGearProgram.new(programId, this.api);
      }
    );
    return builder;
  }
}

export class Liquidity {
  constructor(private _program: SailsProgram) {}

  public addAdmin(admin: ActorId): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'AddAdmin',
      admin,
      '[u8;32]',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public collectRewards(): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'CollectRewards',
      null,
      null,
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public getRewardsFromStakingBi(): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'GetRewardsFromStakingBi',
      null,
      null,
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public nominate(targets: Array<ActorId>): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'Nominate',
      targets,
      'Vec<[u8;32]>',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public removeAdmin(admin: ActorId): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'RemoveAdmin',
      admin,
      '[u8;32]',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public setGuardianRewardAddress(address: ActorId): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'SetGuardianRewardAddress',
      address,
      '[u8;32]',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public setTokenValue(value: number | string | bigint): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'SetTokenValue',
      value,
      'U256',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public stake(session_for_account: ActorId | null): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'Stake',
      session_for_account,
      'Option<[u8;32]>',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public transferRewards(): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'TransferRewards',
      null,
      null,
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public unstake(amount: number | string | bigint, session_for_account: ActorId | null): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'Unstake',
      [amount, session_for_account],
      '(U256, Option<[u8;32]>)',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public withdraw(unstake_id: number | string | bigint, session_for_account: ActorId | null): TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<{ ok: LiquidityEvent } | { err: LiquidError }>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Liquidity',
      'Withdraw',
      [unstake_id, session_for_account],
      '(u128, Option<[u8;32]>)',
      'Result<LiquidityEvent, LiquidError>',
      this._program.programId,
    );
  }

  public activeEra(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'ActiveEra',
      null,
      null,
      'u64',
    );
  }

  public bondsOf(user: ActorId): QueryBuilder<Array<BondDataIo> | null> {
    return new QueryBuilder<Array<BondDataIo> | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'BondsOf',
      user,
      '[u8;32]',
      'Option<Vec<BondDataIo>>',
    );
  }

  public contractTotalBalance(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'ContractTotalBalance',
      null,
      null,
      'u128',
    );
  }

  public contractTotalStake(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'ContractTotalStake',
      null,
      null,
      'u128',
    );
  }

  public currentBlock(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'CurrentBlock',
      null,
      null,
      'u64',
    );
  }

  public extraTokensInContract(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'ExtraTokensInContract',
      null,
      null,
      'u128',
    );
  }

  public fixedTime(): QueryBuilder<FixedStakingTime | null> {
    return new QueryBuilder<FixedStakingTime | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'FixedTime',
      null,
      null,
      'Option<FixedStakingTime>',
    );
  }

  public nominations(): QueryBuilder<Array<ActorId>> {
    return new QueryBuilder<Array<ActorId>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'Nominations',
      null,
      null,
      'Vec<[u8;32]>',
    );
  }

  public stakingHistoryOf(user: ActorId): QueryBuilder<Array<StakingHistory> | null> {
    return new QueryBuilder<Array<StakingHistory> | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'StakingHistoryOf',
      user,
      '[u8;32]',
      'Option<Vec<StakingHistory>>',
    );
  }

  public tokenHoldersAddress(): QueryBuilder<Array<ActorId>> {
    return new QueryBuilder<Array<ActorId>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TokenHoldersAddress',
      null,
      null,
      'Vec<[u8;32]>',
    );
  }

  public tokenValue(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TokenValue',
      null,
      null,
      'u128',
    );
  }

  public totalBondOf(user: ActorId): QueryBuilder<number | string | bigint | null> {
    return new QueryBuilder<number | string | bigint | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TotalBondOf',
      user,
      '[u8;32]',
      'Option<u128>',
    );
  }

  public totalSupply(): QueryBuilder<bigint> {
    return new QueryBuilder<bigint>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TotalSupply',
      null,
      null,
      'u128',
    );
  }

  public totalUnbondOf(user: ActorId): QueryBuilder<number | string | bigint | null> {
    return new QueryBuilder<number | string | bigint | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TotalUnbondOf',
      user,
      '[u8;32]',
      'Option<u128>',
    );
  }

  public transactionsOf(user: ActorId): QueryBuilder<Array<Transaction>> {
    return new QueryBuilder<Array<Transaction>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'TransactionsOf',
      user,
      '[u8;32]',
      'Vec<Transaction>',
    );
  }

  public unbondsOf(user: ActorId): QueryBuilder<Array<UnbondDataIo> | null> {
    return new QueryBuilder<Array<UnbondDataIo> | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'UnbondsOf',
      user,
      '[u8;32]',
      'Option<Vec<UnbondDataIo>>',
    );
  }

  public unstakesOf(user: ActorId): QueryBuilder<Array<Unstake>> {
    return new QueryBuilder<Array<Unstake>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Liquidity',
      'UnstakesOf',
      user,
      '[u8;32]',
      'Vec<Unstake>',
    );
  }
}

export class Session {
  constructor(private _program: SailsProgram) {}

  public createSession(signature_data: SignatureData, signature: `0x${string}` | null): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Session',
      'CreateSession',
      [signature_data, signature],
      '(SignatureData, Option<Vec<u8>>)',
      'Null',
      this._program.programId,
    );
  }

  public deleteSessionFromAccount(): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Session',
      'DeleteSessionFromAccount',
      null,
      null,
      'Null',
      this._program.programId,
    );
  }

  public deleteSessionFromProgram(session_for_account: ActorId): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Session',
      'DeleteSessionFromProgram',
      session_for_account,
      '[u8;32]',
      'Null',
      this._program.programId,
    );
  }

  public sessionForTheAccount(account: ActorId): QueryBuilder<SessionData | null> {
    return new QueryBuilder<SessionData | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Session',
      'SessionForTheAccount',
      account,
      '[u8;32]',
      'Option<SessionData>',
    );
  }

  public sessions(): QueryBuilder<Array<[ActorId, SessionData]>> {
    return new QueryBuilder<Array<[ActorId, SessionData]>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Session',
      'Sessions',
      null,
      null,
      'Vec<([u8;32], SessionData)>',
    );
  }

  public subscribeToSessionCreatedEvent(callback: (data: null) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Session' && getFnNamePrefix(payload) === 'SessionCreated') {
        callback(null);
      }
    });
  }

  public subscribeToSessionDeletedEvent(callback: (data: null) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Session' && getFnNamePrefix(payload) === 'SessionDeleted') {
        callback(null);
      }
    });
  }
}