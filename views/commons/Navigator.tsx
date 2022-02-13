import { FunctionComponent } from "react";
import Link from "next/link";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import style from "../../styles/navigator.module.sass";

const Navigator: FunctionComponent = () => {
  const wallet = useWallet();
  return (
    <div className={style.sidebar}>
      <div className={style.routesBlock}>
        <Link href="/" passHref>
          <a href="https://ibb.co/yP2vCNL">
            <img
              src="https://i.ibb.co/g9Yq8rs/logo-v4-horizontal-transparent.png"
              alt="logo-v4-horizontal-transparent"
              className={style.dappioLogo}
            />
          </a>
        </Link>
        <Link href="/jupiter">
          <a className={style.route}>Jupiter</a>
        </Link>
        <Link href="/raydium">
          <a className={style.route}>Raydium</a>
        </Link>
      </div>
      <WalletModalProvider>
        {wallet.connected ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </WalletModalProvider>
    </div>
  );
};

export default Navigator;
