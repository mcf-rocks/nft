import { Button, Card,Col, Input,Row,Switch } from "antd";
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
import { metaUpdData, metaUpdURI, metaUpdTitle, findProgramAddress, createAndInitializeMintWithMeta, createWithSeed } from "../../utils/token_funcs";
import { META_WRITER_PROGRAM_ID, TOKEN_PROGRAM_ID, ATACC_PROGRAM_ID } from "../../utils/program_addresses";
import { PublicKey, Account } from "@solana/web3.js";
import microchip from "../../utils/microchip.svg";

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

  function uintToString(uintArray:any) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
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
    console.log("MetaTitleAccount is: "+titlePubkey.toString());

    let title = "";

	let titleInput:any = document.getElementById("nft_meta_title");

	if(titleInput && titleInput.value.length > 0) {
        title = titleInput.value;
    } else {
        console.log("No title - account will not be updated");
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
    } else {
        console.log("No uri - account will not be updated");
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
		dataInput.value = dataInput.value.replaceAll("xxTITLExx",title).replaceAll("xxMINTxx",mint.publicKey.toBase58());
        data = dataInput.value;
        console.log(data);
    } else {
        console.log("No data - account will not be updated");
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

    let tStatus = await connection.confirmTransaction(txid)

    if (tStatus.value.err) {
      playVideo(false)
      console.log("FAILED - by node (node ran program but program failed)")
      console.log(tStatus.value.err)
      document.getElementById('status')!.innerHTML = "Transaction "+txid+" failed: "+tStatus.value.err
      return
    }

    // set title transaction

    if ( title ) {
        try {
          txid = await metaUpdTitle({
            wallet,
            connection,
            mint,
            meta,
          })
        } catch (error) {
          playVideo(false)
          console.log("REJECTED - was not submitted (probably because transaction simulation failed; funds? recentblockhash?)")
          console.log(error)
          document.getElementById('status')!.innerHTML = "Title update transaction rejected: "+error.toString()
          return
        } 

        console.log("Title set tx:"+txid)

        // wait for transaction to be mined

        tStatus = await connection.confirmTransaction(txid)

        if (tStatus.value.err) {
          playVideo(false)
          console.log("FAILED - by node (node ran program but program failed)")
          console.log(tStatus.value.err)
          document.getElementById('status')!.innerHTML = "Title update transaction "+txid+" failed: "+tStatus.value.err
          return
        }

        console.log("Title set done")
    }

    // set uri transaction

    if ( uri ) {
        try {
          txid = await metaUpdURI({
            wallet,
            connection,
            mint,
            meta,
          })
        } catch (error) {
          playVideo(false)
          console.log("REJECTED - was not submitted (probably because transaction simulation failed; funds? recentblockhash?)")
          console.log(error)
          document.getElementById('status')!.innerHTML = "URI update transaction rejected: "+error.toString()
          return
        } 

        console.log("URI set tx:"+txid)

        // wait for transaction to be mined

        tStatus = await connection.confirmTransaction(txid)

        if (tStatus.value.err) {
          playVideo(false)
          console.log("FAILED - by node (node ran program but program failed)")
          console.log(tStatus.value.err)
          document.getElementById('status')!.innerHTML = "URI update transaction "+txid+" failed: "+tStatus.value.err
          return
        }

        console.log("URI set done")
    }

    // set data transaction

    if ( data ) {

        const chunkSize = 957  // because max transaction 1232 bytes 

        const numChunks = Math.ceil(data.length / chunkSize)

        for(let chunk=0; chunk<numChunks; chunk++) {

            console.log("Write chunk "+ (chunk+1) +" of "+numChunks)

            let processed = false;

            while( !processed ) {

                try {
                  txid = await metaUpdData({
                    wallet,
                    connection,
                    mint,
                    meta,
                    chunkSize,
                    chunk
                  })
                } catch (error) {
                  playVideo(false)
                  console.log("REJECTED - was not submitted (probably because transaction simulation failed; funds? recentblockhash?)")
                  console.log(error)
                  document.getElementById('status')!.innerHTML = "Data update "+ (chunk+1) +" of "+numChunks+" transaction rejected: "+error.toString()
                  return
                } 

                console.log("Data set tx:"+txid)

                // wait for transaction to be mined

                try {
                  tStatus = await connection.confirmTransaction(txid)
                } catch(error) {

                    // wasn't found after 30 seconds, probably got dropped
                    // need to make new transaction and submit it
                    // does not happen often....
   
                    console.log("Transaction not found in ledger after 30 seconds, try with new transaction")
                    continue
                }
 
                processed = true
 
                if (tStatus.value.err) {
                    playVideo(false)
                    console.log("FAILED - by node (node ran program but program failed)")
                    console.log(tStatus.value.err)
                    document.getElementById('status')!.innerHTML = "Data update transaction "+txid+" failed: "+tStatus.value.err
                    return
                }
            }

            console.log("Data set done "+ (chunk+1) +" of "+numChunks);
        }
    }

    // seal transaction 

    // TODO: call seal instruction on sc
    //       instruction is done in sc


    // end of transactions

	//showSVG(mint.publicKey.toBase58(),amount);

    // Read the account from chain, display it in the right pane
    // obviously I'm assuming it's an SVG... if there were different types, I guess the URI field could distinguish

    const metaDataAccount = await connection.getAccountInfo(new PublicKey(dataPubkey.toString()))

    if ( metaDataAccount ) {

      const svgText = uintToString(metaDataAccount.data)

      let svgDiv:any = document.getElementById("svgDiv")

      if(svgDiv){
        svgDiv.innerHTML = svgText
      }

    } else {
        console.log("No idea, it should exist, as we just made it")
    }


	setTimeout(()=>{playVideo(false);},2500);

    // just for debug
 
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

 function getSVGText(checked:boolean){
	let title = "xxTITLExx";
	let amount = 1;
	let mint = "xxMINTxx";
	let nft_title:any = document.getElementById("mint_meta_title'");
	let nft_text_area:any = document.getElementById("nft_meta_data");	
	if(nft_title){title = nft_title.value};	    
	let svg_text = generateSVG(mint,title,amount);
	if(checked){
		nft_text_area.value = svg_text;
	}
	else{
		nft_text_area.value = "";
	}
 }

  function showSVG(mint:string,title:string,amount:number){
      let svgText = generateSVG(mint,title,amount);
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
    display: 'flex',
    backgroundColor: "black",
    width: "100%",
    textAlign: 'center',
    marginTop: "10px",
    marginBottom: "10px",
    overflowX:"hidden",
  } as React.CSSProperties;

  const leftPane = {
    backgroundColor: "black",
    height: "100%",
    width: "50%",
    textAlign: "left",
    marginRight: "5px",
  } as React.CSSProperties;

  const leftPaneTop = {
    display: 'flex',
    backgroundColor: "black",
    height: "500px",
    width: "100%",
    textAlign: "left",
  } as React.CSSProperties;

  const leftPaneBottom = {
    backgroundColor: "#1a2029",
    width: "100%",
    textAlign: "left",
  } as React.CSSProperties;

  const rightPane = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#1a2029",
    height: "100%",
    width: "50%",
    textAlign: "center",
    marginLeft: "5px",
    overflow:"hidden",
  } as React.CSSProperties;

  const row = {
    display: 'flex',
    marginTop: "5px",
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  } as React.CSSProperties;

  const col = {
    flexDirection: "column",
    flexBasis: "100%",
    flex: 1,
  } as React.CSSProperties;

  const leftCol = {
    paddingTop: "5px",
    height: "100%",
  } as React.CSSProperties;

  const rightCol = {
    textAlign: "left",
    height: "100%",
  } as React.CSSProperties;

  const vanityInput = {
	borderColor:"white",	  
	color:"white",
	fontSize:"large",
    width:"400px",
  }

  const submitButton ={
	backgroundColor:"#2abdd2",
	color:"black",
	width:"100%",
  } as React.CSSProperties;
  
  const svgImage ={
	  position:"absolute",
	  top:"17vh",
	  right:"17vw",
  } as React.CSSProperties;
  
  const titleInput = {
	borderColor:"white",	  
	color:"white",
	fontSize:"large",
    width:"400px",
  }

  const uriInput = {
	borderColor:"white",	  
	color:"white",
	fontSize:"large",
    width:"400px",
  }

  const dataInput = {
	color:"black",
	fontSize:"large",
    marginTop: '5px',
    width:"400px",
  }

  const inputDescr = {
    padding: '10px',
    paddingTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'left',
  } as React.CSSProperties;

  const inputBoxDiv = {
    padding: '10px',
  } as React.CSSProperties;

  const shim = {
    height: "20px",
  }

  const textOutput = {
	fontSize:"small",
  }

  const style = {
	mainDiv,  
	leftPane, 
	leftPaneTop, 
	leftPaneBottom, 
    row,
    col, 
    leftCol, 
    rightCol, 
	rightPane,  
	vanityInput,
	titleInput,
	uriInput,
	dataInput,
	inputDescr,
	inputBoxDiv,
    shim,
    submitButton,
    svgImage,
    textOutput,
  }


  return (
        <div style={style.mainDiv}>
        <div style={style.leftPane}>
         <Card 
			 cover={<img src="./microchip.svg" alt="microchip Icons made by freepik.com flaticon.com" className="hue" />}
			 style={{ 
				 height:"95%",
				 width: "80%",
				 background:"black",
				 border:"0.02em solid white",
				 display:"block",
				 margin:"auto",
				 top:"2vh",
				 overflowX:"hidden",
			  }}>
			<div style={style.leftPaneTop}>
				<div style={style.row}>
				  <div style={style.col}>
					<div style={style.leftCol}>
					  <div style={style.inputDescr}><p>MINT VANITY PREFIX:</p></div>
					  <div style={style.inputDescr}><p>NFT TITLE:</p></div>
					  <div style={style.inputDescr}><p>NFT URI:</p></div>
					  <div style={style.inputDescr}> USE DEFAULT DATA</div>					  
					  <div style={style.shim}></div>
					  <div style={style.inputDescr}><p>NFT DATA:</p></div>
					  <div style={style.inputBoxDiv}><Button onClick={newnft}>ESTIMATE COST NFT</Button></div>
					</div>
				  </div>
				  <div style={style.col}>
					<div style={style.rightCol}>
					  <div style={style.inputBoxDiv}><Input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/></div>
					  <div style={style.inputBoxDiv}><Input id="nft_meta_title" style={style.titleInput} type={"text"} maxLength={100}/></div>
					  <div style={style.inputBoxDiv}><Input id="nft_meta_uri" style={style.uriInput} type={"text"} maxLength={255}/></div>
					  <div style={style.inputBoxDiv}><Switch onChange={getSVGText} /></div>
					  <div style={style.inputBoxDiv}>
						<textarea id="nft_meta_data" style={style.dataInput} rows={10}  maxLength={10000}/>
						<Button style={style.submitButton} onClick={newnft}>GENERATE NEW NFT</Button>
					  </div>
					</div>
				  </div>
				</div>
			  </div>
			  <div style={style.leftPaneBottom}>
				  <div style={style.textOutput}><p id="status"></p></div>
				  <div style={style.textOutput}><p id="mint"></p></div>
				  <div style={style.textOutput}><p id="tacc"></p></div>
				  <div style={style.textOutput}><p id="mint_meta_author"></p></div>
				  <div style={style.textOutput}><p id="mint_meta_title"></p></div>
				  <div style={style.textOutput}><p id="mint_meta_uri"></p></div>
				  <div style={style.textOutput}><p id="mint_meta_data"></p></div>
			  </div>
          </Card>
        </div>

        <div style={style.rightPane}>
            <video autoPlay={false} muted={true} loop={true} id="video1">
			  <source src="./creationEffect.mp4" type="video/mp4"/>
			</video>
			Video by Luis Quintero from Pexels
			<div id='svgDiv' style={style.svgImage}></div>
        </div>
        </div>
  );

/*
  return (
        <div style={style.mainDiv}>
        <div style={style.leftPane}>
          <div id="svgDiv"></div>
            <div style={inputParent}>
              <div style={inputDescr}><p>MINT VANITY PREFIX:</p></div>
              <div style={inputBoxDiv}><input id="vanity" style={style.vanityInput} type={"text"} maxLength={2}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT TITLE:</p></div>
              <div style={inputBoxDiv}><input id="nft_meta_title" style={style.textInput} type={"text"} maxLength={100}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT URI:</p></div>
              <div style={inputBoxDiv}><input id="nft_meta_uri" style={style.textInput} type={"text"} maxLength={255}/></div>
            </div> 
            <div style={inputParent}>
              <div style={inputDescr}><p>NFT DATA:</p></div>
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
        </div>
  );
*/
};
