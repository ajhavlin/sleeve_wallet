document.getElementById('generateSeed').addEventListener('click', async () => {
  const passphraseInput = document.getElementById('passphraseGenInput').value.trim();
  const passphrase = passphraseInput ? passphraseInput : '';

  try {
    const result = await window.electron.generateSeed(passphrase);
    document.getElementById('seedOutput').innerHTML = `<br>Mnemonic: ${result.mnemonic}
                                                      <br>Public Seed: ${result.publicSeed}
                                                      <br>Public Key: ${result.publicKey}
                                                      <br>Eth Wallet Mnemonic: ${result.ethWalletMnemonic}
                                                      <br>Eth Wallet Public Key: ${result.ethWalletPublicKey}
                                                      <br>Eth Wallet Private Key: ${result.ethWalletPrivateKey}
                                                      <br>Eth Wallet Address: ${result.ethWalletAddress}`;
  } catch (error) {
    document.getElementById('seedOutput').innerHTML = 'Error: ' + error.message;
  }
});

document.getElementById('verifyMessage').addEventListener('click', async () => {
  const message = document.getElementById('messageInput').value.trim();
  const sleeveSignature = document.getElementById('sleeveSignatureInput').value.trim();
  
  try {
    const result = await window.electron.verifyMessage(message, sleeveSignature);
    document.getElementById('signatureOutput').innerHTML = `<br>Signature: <br>${result.signature}
                                                            <br>Verified: <br>${result.valid}`;
  } catch (error) {
    document.getElementById('signatureOutput').innerHTML = 'Error: ' + error.message;
  }
});

document.getElementById('runMain').addEventListener('click', async () => {
  const destinationAddress = document.getElementById('destinationAddress').value.trim();
  const transferAmount = document.getElementById('transferAmount').value.trim();
  const mnemonic = document.getElementById('mnemonicInput').value.trim();
  const passphrase = document.getElementById('passphraseInput').value.trim();

  if (!destinationAddress || !transferAmount) {
    document.getElementById('output').innerHTML = 'Error: Please provide both destination address and transfer amount.';
    return;
  }

  try {
    const result = await window.electron.runMain(destinationAddress, transferAmount, mnemonic, passphrase);
    document.getElementById('output').innerHTML = `Result: ${result.tx}
                                                  <br> Sleeve Signature: ${result.signature}`;
  } catch (error) {
    document.getElementById('output').innerHTML = 'Error: ' + error.message;
  }
});




// ---------------------------------------------------
// --------------------- Old Code --------------------
// ---------------------------------------------------



// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const crypto = require('crypto');
// const { ethers } = require('ethers');
// const ecc = require('tiny-secp256k1')
// const bip39 = require('bip39');
// const { BIP32Factory } = require('bip32');
// const bip32 = BIP32Factory(ecc);
// const { Alchemy, Network, Wallet, Utils } = require("alchemy-sdk");

// // const account = web3.eth.accounts.create();
// // const address = account.address;
// // const pk = account.privateKey;

// // const url = `https://eth-sepolia.g.alchemy.com/v2/riRSQT2TXj25xcamjQ2Fu8vttYM4Z5sh`;
// // const web3 = new Web3(new Web3.providers.HttpProvider(url));

// // const payload = {
// //     jsonrpc: '2.0',
// //     id: 1,
// //     method: 'eth_blockNumber',
// //     params: []
// // };

// // const transaction = {
// //     from: '0xD28Bb53e33C9c257595dc43d36A7163187344934',
// //     to: '0x685CfE7d5f9F48AEFa33e8e20e2D5CC3E2bAEfca',         // The address of the recipient
// //     value: web3.utils.toWei('1', 'ether'),  // Convert 1 Ether to wei
// //     gas: 21000,                       // The gas limit for the transaction
// //     gasPrice: web3.utils.toWei('20', 'gwei'), // Convert gas price to wei
// //     nonce: web3.eth.getTransactionCount('0xD28Bb53e33C9c257595dc43d36A7163187344934'),
// //     chainId: 11155111                 // Sepolia chain ID
// // };


// const settings = {
//     apiKey: 'riRSQT2TXj25xcamjQ2Fu8vttYM4Z5sh',
//     network: Network.ETH_SEPOLIA,
// };
// const alchemy = new Alchemy(settings);

// let wallet = new Wallet('0xc7c1a223f1a95f05306b07ba40a66e853b359d5e72030e8d93a7047bf1dd14cb');


// // -------------------------------------
// // ----------- Gen ---------------------
// // -------------------------------------

// // const definitions 
// const m = 256; // length of messages to be signed
// const w = 4; // winterniz parameter
// const l1 = Math.ceil(m / Math.log(w));
// const l2 = Math.floor(Math.log(l1 * (w - 1)) / Math.log(w)) + 1;
// const l = l1 + l2; // there are l hash chains each which make w - 1 calls to a tweakable hash function
// const n = l + w - 1;
// const path = `m/44'/60'/0'/0/0`;
// // const i ∈ [0, l - 1]
// // const j ∈ [0, w - 2]

// function generateBIP39Mnemonic(entropy = null) {
//     if (entropy === null) {
//         entropy = crypto.randomBytes(32);
//     }
//     const mnemonic = bip39.entropyToMnemonic(entropy);
//     return mnemonic;
// }

// // BIP32 HD derivation using BIP44 path
// function deriveHDFromPath(mnemonic, passphrase, path) {
//     const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
//     const root = bip32.fromSeed(seed);
//     const child = root.derivePath(path);
//     const childPrivateKey = child.privateKey.toString('hex');
//     const childChainCode = child.chainCode.toString('hex');
    
//     return {
//         secretSeed: childPrivateKey,
//         publicSeed: childChainCode
//     };
// }

// function rjsGeneration(publicSeed) {
//     let rjs = [];
//     for (let j=0; j<w-1; j++) {
//         const hash = crypto.createHash('sha256');
//         hash.update(publicSeed);
//         hash.update(j.toString());
//         rjs.push(hash.digest('hex'));
//     }
//     return rjs;
// }

// function skisGeneration(secretSeed) {
//     let skis = [];
//     for (let i=0; i<l; i++) {
//         const hash = crypto.createHash('sha256');
//         hash.update(secretSeed);
//         hash.update(i.toString());
//         skis.push(hash.digest('hex'));
//     }
//     return skis;
// }

// function pksGeneration(k, seeds) {
//     let pks = [];
//     for (let i=0; i<l; i++) {
//         pks.push(chainingFunction(i, k, seeds));
//     }
//     return pks;
// }

// function hasEvenParity(value) {
//     const binaryRepresentation = value.toString(2); 
//     const numberOfOnes = binaryRepresentation.split('1').length - 1; 
//     return numberOfOnes % 2 === 0; 
// }

// function getT(pks) {
//     const evenParity = pks.filter(hasEvenParity);

//     const hash = crypto.createHash('sha256');
//     hash.update(evenParity.join(''));

//     return hash.digest('hex');
// }

// function getPublicKey(publicSeed, T, pks) {
//     const hash = crypto.createHash('sha256');
//     hash.update(publicSeed);
//     hash.update(T);
//     hash.update(pks.join(''));

//     return hash.digest('hex');
// }

// function getSleeveSecretKey(secretSeed) {
//     const hash = crypto.createHash('sha256');
//     hash.update(secretSeed);
//     hash.update("Ethereum Sleeve to protect Kim K");

//     return hash.digest('hex');
// }

// function getEthWalletMnemonicEntropy(sleeveSecretKey, publicKey) {
//     const hash = crypto.createHash('sha256');
//     hash.update(sleeveSecretKey);
//     hash.update(publicKey);

//     return hash.digest('hex');
// }


// // chaining function as defined in Hulsing and Kudinov (2022)
// function chainingFunctionRecursive(i, j, seeds) {
//     if (j <= 0) {
//         return seeds[i];
//     }

//     const previousValue = chainingFunctionRecursive(i, j - 1, seeds);
//     const hash = crypto.createHash('sha256');
//     hash.update(previousValue);
//     return hash.digest('hex');
// }

// // main chaining function
// function chainingFunction(i, k, seeds) {
//     const result = chainingFunctionRecursive(i, k, seeds);
//     return result; 
// }

// const mnemonic = generateBIP39Mnemonic();
// const passphrase = "3j^n*jd$$#gdjHF892dE&hss";
// const {secretSeed, publicSeed} = deriveHDFromPath(mnemonic, passphrase, path);
// const skis = skisGeneration(secretSeed);
// const rjs = rjsGeneration(publicSeed);
// const seeds = skis.concat(rjs);
// const pks = pksGeneration(w - 1, seeds);
// const T = getT(pks);
// const publicKey = getPublicKey(publicSeed, T, pks);
// const sleeveSecretKey = getSleeveSecretKey(secretSeed);
// const ethWalletMnemonic = generateBIP39Mnemonic(getEthWalletMnemonicEntropy(sleeveSecretKey, publicKey));
// const ethWallet = Wallet.fromMnemonic(ethWalletMnemonic);

// // const seed = deriveSeedFromMnemonic(mnemonic, passphrase);
// // const seeds = generateRandomSeeds();
// // const secretKey = getSecretKey(seeds);
// // const publicSeed = getPublicSeed(seeds);
// // const verificationKey = getVerificationKey(publicSeed, w - 1, seeds);
// // const bip32sk = deriveHDWalletFromPath(mnemonic, passphrase, path);



// document.getElementById('generateSeed').addEventListener('click', function() {
//     document.getElementById('seedOutput').innerHTML = '<br>Mnemonic: ' + mnemonic +
//                                                       '<br>Public Seed: ' + publicSeed +
//                                                       '<br>Public Key: ' + publicKey +
//                                                       '<br>Eth Wallet Mnemonic: ' + ethWalletMnemonic +
//                                                       '<br>Eth Wallet Public Key: ' + ethWallet.publicKey +
//                                                       '<br>Eth Wallet Private Key: ' + ethWallet.privateKey +
//                                                       '<br>Eth Wallet Address: ' + ethWallet.address;
//                                                     //  '<br>pks: <br>' + pks.join('<br>');
//                                                     //  '<br>sk_i: ' + skis.join('<br>');
//                                                     //   'RNG Seeds: ' + seeds.join('<br>') +
//                                                     //   '<br>Mnemonic: ' + mnemonic +
//                                                     //   '<br>BIP 32 Wallet Secret Key: ' + bip32sk +
//                                                     //   '<br>W-OTS+ Public Seed: ' + publicSeed +
//                                                     //   '<br>Secret Keys: <br>' + secretKey.join('<br>') +
//                                                     //   '<br>Verification Keys: <br>' + verificationKey.join('<br>');
// });


// // -------------------------------------
// // --------- Sign and Verif ------------
// // -------------------------------------


// function sign(message, seeds, secretSeed) {
//     const m_base_w = convertToBaseW(message, l1);
//     const C = computeChecksum(m_base_w);
//     const C_base_w = convertToBaseW(C, l2);
//     const B = m_base_w.concat(C_base_w);
    
//     let sigma = [];
//     for (let i = 0; i < l; i++) {
//         sigma.push(chainingFunction(i, B[i], seeds));
//     }
    
//     return sigma;
// }

// function convertToBaseW(x, length) {
//     number = parseInt(x, 16);
//     const baseW = [];
//     for (let i = 0; i < length; i++) {
//         baseW.push(number % w);
//         number = Math.floor(number / w);
//     }

//     return baseW.reverse();
// }

// function computeChecksum(msg){
//     let checksum = 0;
//     for (let i = 0; i < l1; i++) {
//         checksum += (w - 1 - msg[i]);
//     }
//     return checksum.toString(16);
// }

// function verify(publicSeed, message, publicKey, sigma){
//     const m_base_w = convertToBaseW(message, l1);
//     const C = computeChecksum(m_base_w);
//     const C_base_w = convertToBaseW(C, l2);
//     const B = m_base_w.concat(C_base_w);
    
//     let pks = [];
//     for (let i=0; i<l; i++) {
//         pks.push(chainingFunction(i, w - 1 - B[i], sigma));
//     }

//     const T = getT(pks);
//     verifPublicKey = getPublicKey(publicSeed, T, pks);

//     if (verifPublicKey === publicKey){
//         return true;
//     }
//     return false;
// }


// document.getElementById('signMessage').addEventListener('click', function () {
//     const message = document.getElementById('messageInput').value;
//     const signature = sign(message, seeds);
//     const valid = verify(publicSeed, message, publicKey, signature);

//     document.getElementById('signatureOutput').innerHTML =  '<br>Signature: <br>' + signature.join('') +
//                                                             '<br>Verified: <br>' + valid;
// });



// // -------------------------------------
// // --------- Sign Eth Tx ---------------
// // -------------------------------------

// async function main() {
//     let nonce = await alchemy.core.getTransactionCount(wallet.address, 'latest');

//     let transaction = { 
//       to: "0x685CfE7d5f9F48AEFa33e8e20e2D5CC3E2bAEfca",
//       value: Utils.parseEther("0.00001"),
//       gasLimit: "21000",
//       maxPriorityFeePerGas: Utils.parseUnits("1", "gwei"),
//       maxFeePerGas: Utils.parseUnits("2", "gwei"),
//       nonce: nonce,
//       type: 2,
//       chainId: 11155111,
//     };
  
//     let rawTransaction = await wallet.signTransaction(transaction);
    
//     // //let serializedTransaction = ethers.utils.serializeTransaction(rawTransaction);
//     // //let sleeveSignature = sign(serializedTransaction);

//     let tx = await alchemy.core.sendTransaction(rawTransaction);

//     return {
//         transaction: tx,
//         sig: nonce
//     };
// }

// // async function checkBalance() {
// //     const balance = await alchemy.core.getBalance(wallet.address);
// //     return Utils.formatEther(balance);
// // }
  
// document.getElementById('runMain').addEventListener('click', async () => {
//     try {
//         const receipt = await main();
//         document.getElementById('output').innerHTML = 'Result: ' + JSON.stringify(receipt.transaction) +
//                                                       '<br> Sleeve Signature: ' + receipt.sig.toString();
//     } catch (error) {
//         document.getElementById('output').innerHTML = 'Error: ' + error.message;
//     }
// });