import { decodeAddress, GearApi, GearKeyring, HexString } from "@gear-js/api";
import {Account, AlertContainerFactory} from "@gear-js/react-hooks";
import {web3FromSource} from "@polkadot/extension-dapp";
import {ISubmittableResult} from "@polkadot/types/types";
import React from "react";
import { SailsProgram } from "./clients/liquidity/lib";
// import { Sa } from "./clients/token/lib";
import { SailsProgram as TokenProgram} from "./clients/token/lib";
import { StakeRequest } from "./models/StateRequest";
import { UnstakeRequest } from "./models/UnstakeRequest";
import { WithdrawRequest } from "./models/WithdrawRequest";
import { KeyringPair } from '@polkadot/keyring/types';

type address = `0x${string}`

export class SmartContract {
    // public readonly PLANK: number = (10 ** Number(import.meta.env.VITE_FT_DECIMALS)); //1_000_000_000_000;
    public readonly PLANK: number = 1_000_000_000_000;

    private api: GearApi;
    public alert: AlertContainerFactory;

    private account: Account | null;
    private accounts: any;

    private readonly stash: address;
    private readonly contractAddress: address;

    private readonly liquidityClient: SailsProgram;
    private readonly tokenClient: TokenProgram;

    private readonly BASE_URL: string;

    public getAlertStyle(): React.CSSProperties{
        const isMobile = window.innerWidth < 720;
        return {
            width: isMobile ? "70%" : "30%",
            backgroundColor: "black",
            color: "white",
            border: "2px solid rgba(187, 128, 0, 0.95)"
        }
    };

    public readonly alertStyle = this.getAlertStyle();

    constructor(
        api: GearApi,
        account: Account,
        accounts: any,
        alert: AlertContainerFactory
    ) {
        this.api = api;
        this.account = account;
        this.accounts = accounts;
        this.alert = alert;
        
        this.stash = import.meta.env.VITE_STASH_ADDRESS as address;
        this.liquidityClient = new SailsProgram(api, import.meta.env.VITE_CONTRACT_ADDRESS as address);
        this.tokenClient = new TokenProgram(api, import.meta.env.VITE_FT_CONTRACT_ADDRESS as address)

        this.BASE_URL = import.meta.env.VITE_BASE_URL as string;
        this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS as address;
    }

    public toFixed4 = (value: number): number => parseFloat(value.toFixed(4));
    public toPlank = (value: number): number => Math.round(value * this.PLANK);
    public currentUser = () => this.account;
    
    private setupBeforeUnloadListener() {
        window.addEventListener('beforeunload', this.handleBeforeUnload);
    }

    private removeBeforeUnloadListener() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    private handleBeforeUnload(event: BeforeUnloadEvent) {
        event.preventDefault();
    }

    public loadingAlert = (message: any) => {
        // return this.alert.loading(message, { style: this.alertStyle });
        return this.alert.loading(message, { style: this.alertStyle });
    };

    public errorAlert = (message: string) => {
        return this.alert.error(message, { style: this.alertStyle, timeout: 1500 });
    }

    public closeAlert = (id: string) => {
        this.alert.remove(id);
    }

    public async transferTokensToSessionFromUserTokens(sessionAccount: KeyringPair, userAddress: string) {
        return new Promise<void>(async resolve => {
            const transfetTx = this.api.tx.balances.transferKeepAlive(sessionAccount.address, 1_000_000_000_000);
            const proxyTx = this.api.tx.proxy.proxy(userAddress, null, transfetTx);

            await proxyTx.signAndSend(sessionAccount, (result) => {
                this.statusCallBack(
                    result,
                    () => {
                        resolve();
                    },
                    false
                );
            })
        });
    }


    public async checkSession(sessionSigner: KeyringPair, userAddress: HexString) {
        const sessions = await this.liquidityClient.session.sessionForTheAccount(userAddress);
        // const sessions = await this.liquidityClient.session.sessionForTheAccount(userAddress, userAddress);

        if (!sessions) {
            await this.createSession(sessionSigner, userAddress);
        }
    }

    public async createSession(sessionSigner: KeyringPair, userAddress: HexString) {
        return new Promise<void>(async (resolve) => {
            const sessionAddress = decodeAddress(sessionSigner.address);

            const signatureData : SignatureData = {
                key: sessionAddress,
                duration: 604_800_000,
                allowed_actions: ["Stake", "Unstake", "Withdraw"]
            }

            let sessionTx = this.liquidityClient.session.createSession(
                signatureData,
                null
            );

            await sessionTx.calculateGas(true, 20);

            const tx = sessionTx.extrinsic;

            const proxySessionTx = this.api.tx.proxy.proxy(userAddress, null, tx);

            const batch = this.api.tx.utility.batch([proxySessionTx]);
            await batch.signAndSend(sessionSigner, (result) => {
                this.statusCallBack(
                    result, 
                    () => {
                        resolve();
                    }, 
                    false
                )}
            );
        });
    }

    public async aproveTokensProxy(sessionSigner: KeyringPair, userAddress: HexString, amount: number) {
        return new Promise<void>(async resolve => {
            const approve_tx = this.tokenClient.vft.approve(
                this.liquidityClient.programId!,
                amount
            );

            await approve_tx.calculateGas(true, 10);
            
            const proxy_tx = this.api.tx.proxy.proxy(userAddress, null, approve_tx.extrinsic);

            await proxy_tx.signAndSend(
                sessionSigner,
                (result) => {
                    this.statusCallBack(
                        result, 
                        () => {
                            resolve();
                        }, 
                        false
                    )
                }
            );
        });
    }


    public async stake(payload: StakeRequest, whenSuccess: () => void, sessionSigner?: KeyringPair, userAddress?: HexString, sponsorName?: string, sponsorMnemonic?: string) {     
        return new Promise<void>(async resolve => { 
            if (!this.validateAccount()) {
                throw new Error("Invalid account");
            }

            let signer;

            if (!sessionSigner) {
                const {signer: userSigner} = await web3FromSource(this.accounts[0]?.meta.source as string);
                signer = userSigner;
            }

            let stake_tx = this.liquidityClient.liquidity.stake(payload.sessionForAccount);
            stake_tx.withValue(BigInt(payload.amount));

            if (sessionSigner && userAddress) {
                stake_tx.withAccount(sessionSigner.address);
                const tx = stake_tx.extrinsic;

                const proxyStakeTx = this.api.tx.proxy.proxy(userAddress, null, tx);
                
                await proxyStakeTx.signAndSend(sessionSigner, (result) => {

                    this.statusCallBack(
                        result, 
                        () => {
                            whenSuccess();
                            resolve();
                        }, 
                        false
                    )
                });

                return;
            }

            stake_tx.withAccount(this.account?.address!, { signer });

            stake_tx = await stake_tx.calculateGas(true, 20);

            const result = await stake_tx.signAndSend();

            
            const response = await result.response();

            whenSuccess();
            resolve();
        });
    }

    public async unstake(payload: UnstakeRequest, whenSuccess: () => void, sessionSigner?: KeyringPair, voucherId?: HexString, userAddress?: HexString) {
        if (!this.validateAccount()) {
            throw new Error("Invalid account")
        }

        const {signer} = await web3FromSource(this.accounts[0]?.meta.source as string);


        // if (!sessionSigner) {
        //     const approve_tx = this.tokenClient.vft.approve(
        //         this.liquidityClient.programId!, 
        //         payload.amount
        //     );
            
        //     if (!sessionSigner) {
        //         approve_tx.withAccount(this.account?.address!, {signer});
        //     } else {
        //         approve_tx.withAccount(sessionSigner);
        //     }
    
        //     await approve_tx.calculateGas(false, 10);
    
        //     const result_vft = await approve_tx.signAndSend();
    
        //     const vft_response = await result_vft.response();
    
        // } else {
        //     await this.aproveTokensProxy(sessionSigner, userAddress!, payload.amount);
        // }

        const unstake_tx = this.liquidityClient.liquidity.unstake(
            payload.amount,
            // payload.sessionForAccount
            null
        );

        unstake_tx.withAccount(this.account?.address!, {signer});


        // if (!sessionSigner) {
        //     unstake_tx.withAccount(this.account?.address!, {signer});
        // } else {
        //     unstake_tx.withAccount(sessionSigner);
        //     unstake_tx.withVoucher(voucherId!);
        // }

        await unstake_tx.calculateGas(false, 20);

        const result_staking = await unstake_tx.signAndSend();

        const staking_response = await result_staking.response();

        whenSuccess();
    }

    public async withdraw(payload: WithdrawRequest, sessionSigner?: KeyringPair, voucherId?: HexString) {
        if (!this.validateAccount()) {
            throw new Error("Invalid account");
        }

        const {signer} = await web3FromSource(this.accounts[0]?.meta.source as string);

        const withdraw_tx = this.liquidityClient.liquidity.withdraw(
            payload.id,
            null
            // payload.user
        );

        if (sessionSigner) {
            withdraw_tx.withAccount(sessionSigner);
            withdraw_tx.withVoucher(voucherId!);
        } else {
            withdraw_tx.withAccount(this.account?.address!, { signer });
        }

        await withdraw_tx.calculateGas(true, 20);

        const result_withdraw = await withdraw_tx.signAndSend();
        const staking_response = await result_withdraw.response();

        return staking_response;
    }

    public async stakeGas(payload: any): Promise<BigInt> {
        const totalGas = await this.liquidityClient.liquidity.stake(
            null
        )
        .withAccount(this.account?.decodedAddress!)
        .withValue(payload.amount)
        .transactionFee();

        return totalGas;
    }

    public async unstakeGas(amount: any) {
        return await this.tokenClient.vft.approve(
            this.liquidityClient.programId!, 
            amount
        ).withAccount(this.account?.decodedAddress!).transactionFee();
    }

    public async withdrawGas(payload: any) {
        return await this.liquidityClient.liquidity.unstake(
            payload.amount, 
            payload.reward, 
        ).withAccount(this.account?.decodedAddress!).transactionFee();
    }

    public async getHistory() {
        return await this.liquidityClient.liquidity.transactionsOf(this.account?.decodedAddress!).call();
    }

    public async getUnstakeHistory() {
        return await this.liquidityClient.liquidity.unstakesOf(this.account?.decodedAddress!).call();
    }

    public async getCurrentEra(): Promise<number> {
        const option =  (await this.api?.query.staking.currentEra());
        return option.unwrap().toNumber();
    }

    public async balanceOf() {
        const balance = await this.tokenClient.vft.balanceOf(this.account?.decodedAddress!).call();
        return Number(balance);
    }

    public async tokenValue() { 
        return await this.liquidityClient.liquidity.tokenValue().call();
    }

    public async totalSupply() {
        const totalSupply = await this.tokenClient.vft.totalSupply().call();

        return Number(totalSupply);
    }

    private async sessionSigner(sessionSigner: KeyringPair, userAddress: HexString, extrinsic: any, continueWith: () => void) {
        const proxyTx = this.api.tx.proxy.proxy(userAddress, null, extrinsic);

        await proxyTx.signAndSend(
            sessionSigner,
            (result: ISubmittableResult) => this.statusCallBack(result, continueWith, false)
        );
    }

    private async signer(message: any, continueWith: () => void, isUnstake: boolean = false) {
        const injector = await web3FromSource(this.accounts[0]?.meta.source as string);

        await message.signAndSend(
            this.account?.address ?? this.alert.error("No account found", { style:  this.alertStyle }),
            { signer: injector.signer },
            (result: ISubmittableResult) => this.statusCallBack(result, continueWith, isUnstake)
        );
    }

    private statusCallBack({status, events}: ISubmittableResult, continueWith: () => void, isUnstake: boolean) {
        this.setupBeforeUnloadListener();
        if (status.isFinalized) {
            this.removeBeforeUnloadListener();
            continueWith();
        }else if (status.isDropped || status.isInvalid || status.isUsurped) {
            this.removeBeforeUnloadListener();
            this.errorAlert("Transaction failed");
        } else{

        }

        events.forEach(({ event }) => {
            const { section, method, data } = event;

            if (section === "balances" && method === "Withdraw") {
                const payer = data[0].toString();
                const amount = data[1].toHuman(); 

                console.log(`⚠️ Fee paid by: ${payer} with amount: ${amount}`);
            }
        });
    }

    private validateAccount(): boolean {
        const localAccount = this.account;
        return this.accounts.some(
            (visibleAccount: Account) => visibleAccount.address === localAccount?.address
        );
    }

    get getContractAddress(): `0x${string}` {
        return this.contractAddress
    }
}