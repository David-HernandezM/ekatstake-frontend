

import { decodeAddress, GearKeyring, HexString } from '@gear-js/api';
import { KeyringPair, KeyringPair$Json } from '@polkadot/keyring/types';
import { useAccount, useApi } from '@gear-js/react-hooks';
import { useState, useMemo, useEffect } from 'react';
import {
      useVouchers,
      getTypedEntries,
      useBalance
} from '@gear-js/react-hooks';
import { Session } from './types';
import { getStorage, getUnlockedPair } from '../utils';
import { SIGNLESS_STORAGE_KEY } from '../consts';
import { useVoucherUtils } from './useVoucherUtils';
import { web3FromSource } from '@polkadot/extension-dapp';
import { addProxy } from '../utils';
import { SmartContract } from '@/services/SmartContract';
import axios from "axios";

function useLatestVoucher(programId: HexString, address: string | undefined) {
  const decodedAddress = address ? decodeAddress(address) : '';
  const { vouchers } = useVouchers(decodedAddress, programId);

  const typedEntries = getTypedEntries(vouchers || {});

  const latestVoucher = useMemo(() => {
    if (!vouchers || !typedEntries?.length) return undefined;

    const [[id, voucher]] = typedEntries.sort(([, voucher], [, nextVoucher]) => nextVoucher.expiry - voucher.expiry);

    return { ...voucher, id };
  }, [vouchers]);

  return latestVoucher;
}

/**
 * Custom hook for managing subaccounts to add Signless to the dapp
 * @returns Functions to handle signless accounts
 * @example
 * // Import functions
 * const {
 *     createNewPairAddress,
 *     lockPair,
 *     unlockPair
 * } = useSignlessUtils();
 * 
 * // Create new KeyringPair for signless session
 * let signlessAccountPair = createNewPairAddress();
 * 
 * // Lock KeyringPair with password
 * const signlessAccountLocked = lockPair(signlessAccountPair, "password");
 * 
 * // Unlock KeyringPair with password that locks the signless account
 * signlessAccountPair = unlockPair(signlessAccountLocked, "password");
 */
export const useSignlessUtils = (contract: SmartContract, session?: Session | null) => {
    const sponsorName = import.meta.env.VITE_SPONSOR_NAME;
    const sponsorMnemonic = import.meta.env.VITE_SPONSOR_MNEMONIC;
    const programId = contract.getContractAddress;
    const { account } = useAccount();
    const { api, isApiReady } = useApi();
    const [pair, setPair] = useState<KeyringPair>();
    const voucher = useLatestVoucher(programId, pair?.address);
    const { balance } = useBalance(voucher?.id);
    const voucherBalance = balance ? balance.toNumber() : 0;

    const {
        generateNewVoucher,
        vouchersInContract,
        checkVoucherForUpdates
    } = useVoucherUtils(
        import.meta.env.VITE_SPONSOR_NAME,
        import.meta.env.VITE_SPONSOR_MNEMONIC,
    );

    const [storagePair, setStoragePair] = useState(account ? getStorage()[account.address] : undefined);
    const storageVoucher = useLatestVoucher(programId, storagePair?.address);
    const { balance: _storageVoucherBalance } = useBalance(storageVoucher?.id);
    const storageVoucherBalance = _storageVoucherBalance ? _storageVoucherBalance.toNumber() : 0;

    const [isLoading, setIsLoading] = useState(false);
    const isActive = Boolean(pair);

    const checkProxyBalance = (sessionSigner: KeyringPair, userAddress: HexString) => {
        return new Promise<void>(async (resolve, reject) => {
            if (!isApiReady) {
                return;
            }
            const {data} = await api.query.system.account(sessionSigner.address);
            const sessionAddressBalance = Number(data.free.toHuman().split(",").join(""));
            const minBalance = 2_000_000_000_000;

            if (sessionAddressBalance > minBalance) {
                resolve();
                return;
            }

            await contract.transferTokensToSessionFromUserTokens(
                sessionSigner,
                userAddress
            );

            resolve();
        });
    }
    
    const createNewSession = async (userAddress: HexString, setSubtitleName: any, setProgress: any): Promise<[KeyringPair, `0x${string}`]> => {
        return new Promise(async (resolve, reject) => {
            if (!isApiReady) {
                reject("Api is not ready");
                return;
            }

            if (!account) {
                reject("account is not ready");
                return;
            }

            let { signer } = await web3FromSource(account?.meta.source!);

            setSubtitleName("Creating new voucher ...");
            setProgress(15);
            
            const newPair = await createNewPair();

            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}vouchers/create-voucher`, {
                userAddress: decodeAddress(newPair.address),
                contractsAddress: [programId] 
            });

            const voucherId = response.data.voucherId;

            setSubtitleName("Setting proxy account ...");
            setProgress(30);

            await addProxy(
                api,
                signer,
                account.decodedAddress,
                newPair.address,
                "Any",
            );

            setSubtitleName("Creating new session ...");
            setProgress(45);

            await contract.createSession(newPair, userAddress);

            savePair(newPair, userAddress);
            resolve([newPair, voucherId]);
        });
    }

    const createNewPair = async (): Promise<KeyringPair> => {
        return new Promise(async (resolve, reject) => {
            try {
                const newPair = await GearKeyring.create('signlessPair');
                resolve(newPair.keyring);
            } catch (e) {
                console.log("Error creating new account pair!");
                reject(e);
            }
        });
    };
    
    const unlockPair = (password: string) => {
        let storagePairF = getStorage()[account?.address!];
        if (!storagePairF) throw new Error('Pair not found');

        const result = getUnlockedPair(storagePairF, password);

        setPair(result);

        if (!storagePair && storagePairF) {
            setStoragePair(storagePairF);
        }

        return result;
    };

    const setPairToStorage = (value: KeyringPair$Json | undefined) => {
        if (!account) throw new Error('No account address');

        const storage = { ...getStorage(), [account.address]: value };

        localStorage.setItem(SIGNLESS_STORAGE_KEY, JSON.stringify(storage));
        setStoragePair(value);
    };

    useEffect(() => {
        if (!account) return setStoragePair(undefined);

        setStoragePair(getStorage()[account.address]);

    }, [account]);

    const savePair = (value: KeyringPair, password: string) => {
        setPairToStorage(value.toJson(password));
        setPair(value);
    };

    const deletePair = () => {
        setPairToStorage(undefined);
        setPair(undefined);
    };

    useEffect(() => {
        if (session) return;

        setPair(undefined);
    }, [session]);

    useEffect(() => {
        setPair(undefined);
    }, [account]);

    return {
        pair,
        storagePair,
        savePair,
        deletePair,
        unlockPair,
        voucherBalance,
        voucher,
        isLoading,
        setIsLoading,
        isActive,
        storageVoucher,
        storageVoucherBalance,
        createNewPair,
        createNewSession,
        checkProxyBalance
    }
}