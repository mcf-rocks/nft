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
    console.log('Calling newnft()');

    if (!publicKey) {
      console.log('wallet is not connected');

      // TODO: this should be an info message not a success message

      notify({
        message: 'Connect Wallet First',
        type: 'success',
      });
      return;
    }
    
    connection.getBalance(publicKey).then((balance) => {
      console.log('Balance: '+balance);

      // TODO: this should be an error message not a success message

      if (balance<9999999) {
        notify({
          message: 'You are too poor to make NFTs',
          type: 'success',
        });
        playVideo(false);
        return;
      } 
    });

	let vanityPrefix:any = document.getElementById("vanity");

	if(vanityPrefix && vanityPrefix.value.length > 0){
      if(window.confirm("This vanity search may take a while, do you wish to continue?")){
        console.log("Yes to vality search")
      } else {
        return
      }
    }

	playVideo(true);

	let userVanity = new Account();
	if(vanityPrefix && vanityPrefix.value.length > 0){
	  userVanity = grind(vanityPrefix.value);
	}

    const mint = userVanity;

    console.log("Mint will be: "+mint.publicKey);

    const amount = 1;
    const decimals = 0;

    const pa = await findProgramAddress( [ publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer() ], ATACC_PROGRAM_ID)
    const taccPK = pa.PK; 
    const taccSeeds = pa.seeds; 

    console.log("TokenAccount will be: "+taccPK.toString());

    // submit the transaction
 
    let txid
    try {
      txid = await createAndInitializeMint({
        wallet,
        connection,
        mint,
        amount,
        decimals,
      })
    } catch (error) {
      playVideo(false)
      console.log("REJECTED - was not submitted (probably because transaction simulation failed; funds? recentblockhash?)")
      console.log(error)
      document.getElementById('status')!.innerHTML = "Transaction rejected: "+error.toString()
      return
    } 

    // wait for transaction to be mined

    const tStatus = await connection.confirmTransaction(txid)

    if (tStatus.value.err) {
      playVideo(false)
      console.log("FAILED - by node (node ran program but program failed)")
      console.log(tStatus.value.err)
      document.getElementById('status')!.innerHTML = "Transaction "+txid+" failed: "+tStatus.value.err
      return
    }

    playVideo(false)
 
    document.getElementById('status')!.innerHTML = "Transaction: "+txid+" processed in slot "+tStatus.context.slot;
    document.getElementById('mint')!.innerHTML = "The Mint: "+mint.publicKey.toString(); 
    document.getElementById('mint_meta')!.innerHTML = "The Metadata: "+"0"
    document.getElementById('tacc')!.innerHTML =  "The Token Account: "+ taccPK.toString(); 
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

  const vanityInput = {
	color:"black",
	fontSize:"large"
  }

  const style = {
	mainDiv,  
	vanityInput,
  }

  const inputParent = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '55px',
  } as React.CSSProperties;

  const inputChild = {
    padding: '10px',
  } as React.CSSProperties;

  const inputChildL = {
    padding: '10px',
    paddingTop: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties;

  const shim = {
    paddingTop: '10px',
  } as React.CSSProperties;

  return (
        <div style={style.mainDiv}>
          <p>SOL: {SOL.balance}</p>
            <div style={inputParent}>
              <div style={inputChildL}><p>VANITY PREFIX:</p></div>
              <div style={inputChild}><input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/></div>
              <div style={inputChild}><Button onClick={newnft}>GENERATE NEW NFT</Button></div>
            </div> 
            <div style={shim}></div>
            <p id="status"></p>
            <p id="mint"></p>
            <p id="mint_meta"></p>
            <p id="tacc"></p>
            <video autoPlay={false} muted={true} loop={true} id="video1">
			  <source src="./creationEffect.mp4" type="video/mp4"/>
			</video>
			Video by Luis Quintero from Pexels
        </div>
  );
};
