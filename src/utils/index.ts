import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { LOCAL_STORAGE } from "../consts";
import BigNumber from 'bignumber.js';

const isLoggedIn = ({ address }: InjectedAccountWithMeta) => localStorage[LOCAL_STORAGE.ACCOUNT] === address;

function formatNumber(rawNumber: string, decimals: number, displayDecimals: number) {
    const bigNum = new BigNumber(rawNumber);
    const divisor = (new BigNumber(10)).pow(new BigNumber(decimals)) // BigInt(10) ** BigInt(decimals);
    const integerPart = bigNum.dividedBy(divisor).integerValue(BigNumber.ROUND_FLOOR); // bigNum / divisor;
    const fractionalPart = bigNum.mod(divisor); // bigNum % divisor;

    let fractionalStr = fractionalPart.toString().padStart(decimals, "0");
    fractionalStr = fractionalStr.slice(0, displayDecimals);

    if (displayDecimals === 0) {
        return integerPart.toString();
    }

    return `${integerPart.toString()}.${fractionalStr}`;
}


export { isLoggedIn, formatNumber };
