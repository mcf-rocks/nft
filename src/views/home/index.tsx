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
import { generateSVG } from "../../utils/utils";
import { useConnection } from "../../contexts/connection";
import { useWallet } from "../../contexts/wallet";
import { notify } from "../../utils/notifications";
import { findProgramAddress, createAndInitializeMintWithMeta, createWithSeed } from "../../utils/token_funcs";
import { META_WRITER_PROGRAM_ID, TOKEN_PROGRAM_ID, ATACC_PROGRAM_ID } from "../../utils/program_addresses";
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


  function toBytes(str:string) {
    const utf8 = unescape(encodeURIComponent(str));
    let arr = [];
    for (var i = 0; i < utf8.length; i++) {
      arr.push(utf8.charCodeAt(i));
    }
    return arr
  }

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

    // hold author pubkey in mint->withSeed account 
    // only the author will be able to set the metadata
    // once all the metadata is set, this account will be 
    // disabled, preventing further changes

    const authorPubkey = await createWithSeed(mint, 'nft_meta_author', META_WRITER_PROGRAM_ID)
    console.log("MetaAuthorAccount will be: "+authorPubkey.toString());

    // meta data - title

    const titlePubkey = await createWithSeed(mint, 'nft_meta_title', META_WRITER_PROGRAM_ID)
    console.log("MetaTitleAccount will be: "+authorPubkey.toString());

    let title = "without title";

	let titleInput:any = document.getElementById("nft_meta_title");

	if(titleInput && titleInput.value.length > 0) {
        title = titleInput.value;
    }

    const titleBytes = toBytes(title)

    console.log("title: "+title)
    console.log("titleBytes: "+titleBytes)
    console.log("titleByteCount: "+titleBytes.length)

    if (titleBytes.length > 100) {
      playVideo(false)
      console.log("Title is too long: "+titleBytes.length)
      return
    }

    // the token account address must be mapped so wallets can 'find' the token, this is the mapping...

    const tpa = await findProgramAddress( [ publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer() ], ATACC_PROGRAM_ID)
    const taccPK = tpa.PK; 
    const taccSeeds = tpa.seeds; 

    console.log("TokenAccount will be: "+taccPK.toString());

    // submit the transaction

    let meta:any = {}

    meta.authorPubkey = authorPubkey

    meta.titlePubkey = titlePubkey
    meta.titleBytes = titleBytes
 
    let txid
    try {
      txid = await createAndInitializeMintWithMeta({
        wallet,
        connection,
        mint,
        amount,
        decimals,
        meta,
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

	showSVG(mint.publicKey.toBase58(),amount);
	setTimeout(()=>{playVideo(false);},2500);
 
    document.getElementById('status')!.innerHTML = "Transaction: "+txid+" processed in slot "+tStatus.context.slot
    document.getElementById('mint')!.innerHTML = "The Mint: "+mint.publicKey.toString()
    document.getElementById('tacc')!.innerHTML =  "The Token Account: "+ taccPK.toString() 
    document.getElementById('mint_meta_author')!.innerHTML = "The Metadata Author Account (mint+'nft_meta_author): "+meta.authorPubkey.toString()
    document.getElementById('mint_meta_title')!.innerHTML = "The Metadata Title Account (mint+'nft_meta_title): "+meta.titlePubkey.toString()
  }
  
  function playVideo(play=false){
	  let video:any = document.getElementById("video1");
	  if(video && play){ video.play();}
	  else{video.pause();}
  }

  function showSVG(mint:string,amount:number){
      let svgText = generateSVG(mint,amount);
      let svgDiv:any = document.getElementById("svgDiv");
      if(svgDiv){
		svgDiv.innerHTML = svgText;
		let svgStyle = "width:0vw;transition:1s linear;overflow:hidden;display:block;margin:auto;position:absolute;top:30vh;left:30vw;"
		svgDiv.setAttribute("style",svgStyle);
		setTimeout(()=>{
			svgDiv.setAttribute("style",svgStyle.replace("0vw","33vw"));
		},1000)
	  }
  }
  
  const mainDiv = {
    width: "100%",
    textAlign: 'center',
    marginTop: "30px",
    overflowX:"hidden",
  } as React.CSSProperties;

  const textInput = {
	color:"black",
	fontSize:"large",
    width:"300px",
  }

  const vanityInput = {
	color:"black",
	fontSize:"large",
    width:"60px",
  }

  const style = {
	mainDiv,  
	textInput,
	vanityInput,
  }

  const inputParent = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '55px',
  } as React.CSSProperties;

  const inputBoxDiv = {
    padding: '10px',
  } as React.CSSProperties;

  const inputDescr = {
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
          <div id="svgDiv"></div>
          <p>SOL: {SOL.balance}</p>
            <div style={inputParent}>
              <div style={inputDescr}><p>VANITY PREFIX:</p></div>
              <div style={inputBoxDiv}><input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT_META_TITLE</p></div>
              <div style={inputBoxDiv}><input id="nft_meta_title" style={style.textInput} type={"text"} maxLength={100}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputBoxDiv}><Button onClick={newnft}>ESTIMATE COST NFT</Button></div>
              <div style={inputBoxDiv}><Button onClick={newnft}>GENERATE NEW NFT</Button></div>
            </div> 
            <div style={shim}></div>
            <p id="status"></p>
            <p id="mint"></p>
            <p id="tacc"></p>
            <p id="mint_meta_author"></p>
            <p id="mint_meta_title"></p>
            <video autoPlay={false} muted={true} loop={true} id="video1">
			  <source src="./creationEffect.mp4" type="video/mp4"/>
			</video>
			Video by Luis Quintero from Pexels
        </div>
  );
};
