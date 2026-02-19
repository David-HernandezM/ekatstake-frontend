import { Entries } from './types';
import polkadotSvg from '../assets/polkadot.svg';
import subwalletSvg from '../assets/subwallet.svg';
import talismanSvg from '../assets/talisman.svg';
import enkryptSvg from '../assets/enkrypt.svg';


const WALLET = {
  'polkadot-js': { name: 'Polkadot JS', image: polkadotSvg  },
  'subwallet-js': { name: 'SubWallet', image:  subwalletSvg }, 
  'talisman': { name: 'Talisman', image: talismanSvg },
  'enkrypt': { name: 'Enkrypt', image: enkryptSvg }, 
};

const WALLETS = Object.entries(WALLET) as Entries<typeof WALLET>;

export { WALLET, WALLETS };
