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

    // meta data - title - max 100 char UTF-8 plain text describing item

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

    // meta data - uri - max 255 char UTF-8 internet url
    // 
    // this internet url understands the data (see next)
    // and can interpret it (eg. render it, use it in some way)
    // suggest standard is to HTTP POST the data if url 

    const uriPubkey = await createWithSeed(mint, 'nft_meta_uri', META_WRITER_PROGRAM_ID)
    console.log("MetaURIAccount will be: "+uriPubkey.toString());

    let uri = "";

	let uriInput:any = document.getElementById("nft_meta_uri");

	if(uriInput && uriInput.value.length > 0) {
        uri = uriInput.value;
    }

    const uriBytes = toBytes(uri)

    console.log("uri: "+uri)
    console.log("uriBytes: "+uriBytes)
    console.log("uriByteCount: "+uriBytes.length)

    if (uriBytes.length > 255) {
      playVideo(false)
      console.log("URI is too long: "+uriBytes.length)
      return
    }

    // meta data - the data itself

    const dataPubkey = await createWithSeed(mint, 'nft_meta_data', META_WRITER_PROGRAM_ID)
    console.log("MetaDataAccount will be: "+dataPubkey.toString());

    let data = "";

	let dataInput:any = document.getElementById("nft_meta_data");

	if(dataInput && dataInput.value.length > 0) {
        data = dataInput.value;
    }

    const dataBytes = toBytes(data)

    console.log("data: "+data)
    console.log("dataBytes: "+dataBytes)
    console.log("dataByteCount: "+dataBytes.length)

    if (dataBytes.length > 10000) {
      playVideo(false)
      console.log("URI is too long (max 10000): "+dataBytes.length)
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
 
    meta.uriPubkey = uriPubkey
    meta.uriBytes = uriBytes
 
    meta.dataPubkey = dataPubkey
    meta.dataBytes = dataBytes
 
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

    playVideo(false)
 
    document.getElementById('status')!.innerHTML = "Transaction: "+txid+" processed in slot "+tStatus.context.slot
    document.getElementById('mint')!.innerHTML = "The Mint: "+mint.publicKey.toString()
    document.getElementById('tacc')!.innerHTML =  "The Token Account: "+ taccPK.toString() 
    document.getElementById('mint_meta_author')!.innerHTML = "The Metadata Author Account (mint+'nft_meta_author): "+meta.authorPubkey.toString()
    document.getElementById('mint_meta_title')!.innerHTML = "The Metadata Title Account (mint+'nft_meta_title): "+meta.titlePubkey.toString()
    document.getElementById('mint_meta_uri')!.innerHTML = "The Metadata URI Account (mint+'nft_meta_uri): "+meta.uriPubkey.toString()
    document.getElementById('mint_meta_data')!.innerHTML = "The Metadata Generic Data Account (mint+'nft_meta_data): "+meta.dataPubkey.toString()
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
          <p>SOL: {SOL.balance}</p>
            <div style={inputParent}>
              <div style={inputDescr}><p>VANITY PREFIX:</p></div>
              <div style={inputBoxDiv}><input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT META TITLE</p></div>
              <div style={inputBoxDiv}><input id="nft_meta_title" style={style.textInput} type={"text"} maxLength={100}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT META URI</p></div>
              <div style={inputBoxDiv}><input id="nft_meta_uri" style={style.textInput} type={"text"} maxLength={255}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT META DATA</p></div>
              <div style={inputBoxDiv}><textarea id="nft_meta_data" style={style.textInput} rows={10}  maxLength={10000}/></div>
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
            <p id="mint_meta_uri"></p>
            <p id="mint_meta_data"></p>
            <video autoPlay={false} muted={true} loop={true} id="video1">
			  <source src="./creationEffect.mp4" type="video/mp4"/>
			</video>
			Video by Luis Quintero from Pexels
        </div>
  );
};
