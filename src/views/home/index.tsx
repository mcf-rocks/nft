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
import { findProgramAddress, createAndInitializeMint } from "../../utils/token_funcs";
import { TOKEN_PROGRAM_ID, ATACC_PROGRAM_ID } from "../../utils/program_addresses";
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

  function grind(prefix:String):Account{
	let pk = "";
	let ground:Account = new Account();
	let video:any = document.getElementById("video1");
	while(pk.slice(0,prefix.length) !== prefix){
		ground = new Account();
		pk = ground.publicKey.toBase58(); 
		if(video.ended){video.play();}
	}
	return ground
  }

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
    
	playVideo(true);
    connection.getBalance(publicKey).then((balance) => {
      console.log('Balance: '+balance);
      if (balance<9999999) {
        notify({
          message: 'You are too poor to make NFTs',
          type: 'success',
        });
        playVideo(false);
        return;
      } 
    });

	let userVanity = new Account();
	let vanityPrefix:any = document.getElementById("vanity");
	if(vanityPrefix && vanityPrefix.value.length > 0){
		if(window.confirm("This may take a while, do you wish to continue?")){
			userVanity = grind(vanityPrefix.value);
		}
	}
    const mint = userVanity;
    console.log("Mint: "+mint.publicKey);

    const amount = 1;
    const decimals = 0;

    const pa = await findProgramAddress( [ publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer() ], ATACC_PROGRAM_ID)
    const taccPK = pa.PK; 
    const taccSeeds = pa.seeds; 
    console.log("TokenAccount: "+taccPK.toString());
 
    createAndInitializeMint({
      wallet,
      connection,
      mint,
      amount,
      decimals,
    })
    .finally(playVideo);
 
  }
  
  function playVideo(play=false){
	  let video:any = document.getElementById("video1");
	  if(video && play){ video.play();}
	  else{video.pause();}
  }

  const mainDiv = {
    width: "100%",
    textAlign: 'center',
    marginTop: "30px",
  } as React.CSSProperties;

  const vanityInput ={
	color:"black",
	fontSize:"large"
  }

  const style = {
	mainDiv,  
	vanityInput,
  }

  return (
        <div style={style.mainDiv}>
          <h2>SOL: {SOL.balance}</h2>
            VANITY PREFIX:<input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/> <Button onClick={newnft}>GENERATE NEW NFT</Button>
            <video autoPlay={false} muted={true} loop={true} id="video1">
			  <source src="./creationEffect.mp4" type="video/mp4"/>
			</video>
			Video by Luis Quintero from Pexels
        </div>
  );
};
