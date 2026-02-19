import {
    useAccountDeriveBalancesAll,
    useApi,
    useBalanceFormat
} from '@gear-js/react-hooks';
import styles from "./Wallet.module.scss";

export const Balance = ({balanceChanged}: any) => {
  const { isApiReady } = useApi();
  const balances = useAccountDeriveBalancesAll();
  const { getFormattedBalance } = useBalanceFormat();

  const formattedBalance = isApiReady && balances ? getFormattedBalance(balances.freeBalance) : undefined;

  return formattedBalance ? (
        <div className={`py-1 bg-gray-700 rounded-xl`}>
            <p className={`${styles.balance} gap-2`}>
                {formattedBalance.value}
                <span className={`text-green-400`}>{formattedBalance.unit}</span>
            </p>
        </div>
  ) : null;
};