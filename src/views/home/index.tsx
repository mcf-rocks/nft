import { Button, Col, Row } from "antd";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ConnectButton } from "../../components/ConnectButton";
import { TokenIcon } from "../../components/TokenIcon";
import { useConnectionConfig } from "../../contexts/connection";
import { useMarkets } from "../../contexts/market";
import { useUserBalance, useUserTotalBalance } from "../../hooks";
import { WRAPPED_SOL_MINT } from "../../utils/ids";
import { formatUSD } from "../../utils/utils";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { notify } from "../../utils/notifications";
import { createAndInitializeMint } from "../../utils/token_funcs";
import { Account } from "@solana/web3.js";

export const HomeView = () => {
  const connection = useConnection();
  const { wallet, publicKey } = useWallet();
  const { marketEmitter, midPriceInUSD } = useMarkets();
  const { tokenMap } = useConnectionConfig();
  const SRM_ADDRESS = 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt';
  const SRM = useUserBalance(SRM_ADDRESS);
  const SOL = useUserBalance(WRAPPED_SOL_MINT);
  const { balanceInUSD: totalBalanceInUSD } = useUserTotalBalance();

  useEffect(() => {
    const refreshTotal = () => {};

    const dispose = marketEmitter.onMarket(() => {
      refreshTotal();
    });

    refreshTotal();

    return () => {
      dispose();
    };
  }, [marketEmitter, midPriceInUSD, tokenMap]);

  async function newnft() {
    console.log('Make a new NFT...');

    if (!publicKey) {
      console.log('wallet is not connected');
      notify({
        message: 'Connect Wallet First',
        type: 'success',
      });
      return;
    }

    connection.getBalance(publicKey).then((balance) => {
      console.log('Balance: '+balance);
      if (balance<9999999) {
        notify({
          message: 'You are too poor to make NFTs',
          type: 'success',
        });
        return;
      } 
    });


    let mint = new Account();
    let owner = publicKey;
    let amount = 1;
    let decimals = 0;
    let initialAccount = new Account(); 

    console.log("Mint: "+mint.publicKey);
    console.log("TokenAccount: "+initialAccount.publicKey);
 
    createAndInitializeMint({
      wallet,
      connection,
      mint,
      amount,
      decimals,
      initialAccount,
    });
 
  }

  const style = {
    width: "100%",
    textAlign: 'center',
    marginTop: "30px",
  } as React.CSSProperties;

  return (
        <div style={style}>
          <h2>SOL: {SOL.balance}</h2>
            <Button onClick={newnft}>GENERATE NEW NFT</Button>
        </div>
  );
};
