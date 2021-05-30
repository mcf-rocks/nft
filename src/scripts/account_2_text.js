import { 
  PublicKey, 
  Connection, 
} from '@solana/web3.js';

function stringToUint(string) {
    var string = btoa(unescape(encodeURIComponent(string))),
        charList = string.split(''),
        uintArray = [];
    for (var i = 0; i < charList.length; i++) {
        uintArray.push(charList[i].charCodeAt(0));
    }
    return new Uint8Array(uintArray);
}

function uintToString(uintArray) {
    var encodedString = String.fromCharCode.apply(null, uintArray),
        decodedString = decodeURIComponent(escape(encodedString));
    return decodedString;
}

async function main() {

  let network = process.argv[2];

  if (! network) {
    console.log("No network supplied")
    process.exit(1)
  }

  if (network=='mainnet') {
    network='https://api.mainnet-beta.solana.com' 
  }

  if (network=='testnet') {
    network='https://testnet.solana.com' 
  }

  const pubkey = process.argv[3];

  if (! pubkey) {
    console.log("No account pubkey supplied")
    process.exit(1)
  }

  const connection = new Connection(network, 'recent')

  const account = await connection.getAccountInfo(new PublicKey(pubkey))

  const string = uintToString(account.data)

  console.log(string)
}

main()
  .catch(err => {
    console.error(err)
  })
  .then(() => process.exit())
