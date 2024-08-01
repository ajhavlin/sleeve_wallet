const { ipcMain } = require('electron');
const crypto = require('crypto');
const { ethers } = require('ethers');
const ecc = require('tiny-secp256k1');
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const bip32 = BIP32Factory(ecc);
const { Alchemy, Network, Wallet, Utils } = require("alchemy-sdk");
const { readData, writeData, getField } = require('./storage');
const {
    m,
    w,
    l1,
    l2,
    l,
    n,
    path,
    convertToBaseW,
    computeChecksum,
    chainingFunction,
    hasEvenParity
} = require('./utils');

const settings = {
  apiKey: 'riRSQT2TXj25xcamjQ2Fu8vttYM4Z5sh',
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(settings);

let wallet = new Wallet('0xc7c1a223f1a95f05306b07ba40a66e853b359d5e72030e8d93a7047bf1dd14cb');

/**
 * Generates an HMAC-SHA256 hash.
 * @param {string} key - The key for the HMAC.
 * @param {string} data - The data to hash.
 * @returns {string} - The resulting HMAC as a hexadecimal string.
 */
function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Generates a BIP39 mnemonic phrase.
 * @param {Buffer|null} entropy - The entropy to use for generating the mnemonic. If null, generates random entropy.
 * @returns {string} - The generated BIP39 mnemonic phrase.
 */
function generateBIP39Mnemonic(entropy = null) {
  if (entropy === null) {
    entropy = crypto.randomBytes(32);
  }
  return bip39.entropyToMnemonic(entropy);
}

/**
 * Derives a hierarchical deterministic (HD) wallet from a BIP39 mnemonic and passphrase.
 * @param {string} mnemonic - The BIP39 mnemonic phrase.
 * @param {string} passphrase - The passphrase for the mnemonic.
 * @param {string} path - The BIP32 derivation path.
 * @returns {object} - An object containing the secret seed and public seed.
 */
function deriveHDFromPath(mnemonic, passphrase, path) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath(path);
  return {
    secretSeed: child.privateKey.toString('hex'),
    publicSeed: child.chainCode.toString('hex')
  };
}

/**
 * Generates an array of tweak values (rjs) from a public seed.
 * @param {string} publicSeed - The public seed.
 * @returns {string[]} - An array of HMAC-SHA256 hashes.
 */
function rjsGeneration(publicSeed) {
  let rjs = [];
  for (let j = 0; j < w - 1; j++) {
    rjs.push(hmacSha256(publicSeed, j.toString()));
  }
  return rjs;
}

/**
 * Generates an array of secret key values (skis) from a secret seed.
 * @param {string} secretSeed - The secret seed.
 * @returns {string[]} - An array of HMAC-SHA256 hashes.
 */
function skisGeneration(secretSeed) {
  let skis = [];
  for (let i = 0; i < l; i++) {
    skis.push(hmacSha256(secretSeed, i.toString()));
  }
  return skis;
}

/**
 * Generates an array of public key values (pks) using a chaining function.
 * @param {number} k - The iteration counter.
 * @param {string[]} seeds - The array of seed values.
 * @param {string[]} tweaks - The array of tweak values.
 * @returns {string[]} - An array of public key values.
 */
function pksGeneration(k, seeds, tweaks) {
  let pks = [];
  for (let i = 0; i < l; i++) {
    pks.push(chainingFunction(i, k, seeds, tweaks));
  }
  return pks;
}

/**
 * Computes the T value from an array of public key values (pks).
 * @param {string[]} pks - The array of public key values.
 * @returns {string} - The resulting T value as a hexadecimal string.
 */
function getT(pks) {
  const evenParity = pks.filter(hasEvenParity);
  const hash = crypto.createHash('sha256');
  hash.update(evenParity.join(''));
  return hash.digest('hex');
}

/**
 * Computes the public key from a public seed, T value, and array of public key values (pks).
 * @param {string} publicSeed - The public seed.
 * @param {string} T - The T value.
 * @param {string[]} pks - The array of public key values.
 * @returns {string} - The resulting public key as a hexadecimal string.
 */
function getPublicKey(publicSeed, T, pks) {
  const hash = crypto.createHash('sha256');
  hash.update(publicSeed);
  hash.update(T);
  hash.update(pks.join(''));
  return hash.digest('hex');
}

/**
 * Computes the sleeve secret key from a secret seed.
 * @param {string} secretSeed - The secret seed.
 * @returns {string} - The resulting sleeve secret key as a hexadecimal string.
 */
function getSleeveSecretKey(secretSeed) {
  const hash = crypto.createHash('sha256');
  hash.update(secretSeed);
  return hash.digest('hex');
}

/**
 * Computes the entropy for an Ethereum wallet mnemonic from a sleeve secret key and public key.
 * @param {string} sleeveSecretKey - The sleeve secret key.
 * @param {string} publicKey - The public key.
 * @returns {string} - The resulting entropy as a hexadecimal string.
 */
function getEthWalletMnemonicEntropy(sleeveSecretKey, publicKey) {
  const hash = crypto.createHash('sha256');
  hash.update(sleeveSecretKey);
  hash.update(publicKey);
  return hash.digest('hex');
}

/**
 * Signs a message using a mnemonic and passphrase, generating a sleeve signature.
 * @param {string} message - The message to sign.
 * @param {string} mnemonic - The BIP39 mnemonic phrase.
 * @param {string} passphrase - The passphrase for the mnemonic.
 * @returns {string[]} - The resulting sleeve signature.
 */
function sign(message, mnemonic, passphrase) {
  const { secretSeed, publicSeed } = deriveHDFromPath(mnemonic, passphrase, path);
  const seeds = skisGeneration(secretSeed);
  const tweaks = rjsGeneration(publicSeed);

  const m_base_w = convertToBaseW(message, l1);
  const C = computeChecksum(m_base_w);
  const C_base_w = convertToBaseW(C, l2);
  const B = m_base_w.concat(C_base_w);
  
  let sigma = [];
  for (let i = 0; i < l; i++) {
    sigma.push(chainingFunction(i, B[i], seeds, tweaks));
  }
  
  return sigma;
}

/**
 * Verifies a sleeve signature against a message and public key.
 * @param {string} message - The message to verify.
 * @param {string[]} sigma - The sleeve signature.
 * @param {string} publicKey - The public key.
 * @param {string} publicSeed - The public seed.
 * @returns {object} - An object containing the signature and its validity.
 */
function verify(message, sigma, publicKey, publicSeed) {
  const m_base_w = convertToBaseW(message, l1);
  const C = computeChecksum(m_base_w);
  const C_base_w = convertToBaseW(C, l2);
  const B = m_base_w.concat(C_base_w);
  
  const tweaks = rjsGeneration(publicSeed).reverse(); // reverse because we are finishing the chain

  const pks = [];
  for (let i = 0; i < l; i++) {
    pks.push(chainingFunction(i, w - 1 - B[i], sigma, tweaks));
  }

  const T = getT(pks);
  const msgPublicKey = getPublicKey(publicSeed, T, pks);
  const valid = msgPublicKey === publicKey;

  return {
    signature: sigma.join(','),
    valid
  };
}

/**
 * IPC handler to generate a new seed and associated keys and wallet.
 * @param {object} event - The IPC event.
 * @param {string} [passphrase=''] - The passphrase for the mnemonic (optional).
 * @returns {object} - An object containing the generated seed, keys, and wallet details.
 */
ipcMain.handle('generate-seed', (event, passphrase = '') => {
  const mnemonic = generateBIP39Mnemonic();
  const { secretSeed, publicSeed } = deriveHDFromPath(mnemonic, passphrase, path);
  const seeds = skisGeneration(secretSeed);
  const tweaks = rjsGeneration(publicSeed); 

  const pks = pksGeneration(w - 1, seeds, tweaks);
  const T = getT(pks);
  const publicKey = getPublicKey(publicSeed, T, pks);
  const sleeveSecretKey = getSleeveSecretKey(secretSeed);
  const ethWalletMnemonic = generateBIP39Mnemonic(getEthWalletMnemonicEntropy(sleeveSecretKey, publicKey));
  const ethWallet = Wallet.fromMnemonic(ethWalletMnemonic);

  const data = readData();

  data.userSettings = {
    publicSeed,
    publicKey
  };

  writeData(data);

 return {
    mnemonic, // maybe hide this
    publicSeed,
    publicKey,
    ethWalletMnemonic, // maybe hide this
    ethWalletPublicKey: ethWallet.publicKey,
    ethWalletPrivateKey: ethWallet.privateKey,  // maybe hide this
    ethWalletAddress: ethWallet.address
 };
});

/**
 * IPC handler to verify a message using a given sleeve signature.
 * @param {object} event - The IPC event.
 * @param {string} message - The message to verify.
 * @param {string} sigma - The sleeve signature.
 * @returns {object} - An object containing the signature and its validity.
 */
ipcMain.handle('verify-message', (event, message, sigma) => {
  const sigmaArr = sigma.split(',');
  const storedPublicSeed = getField('userSettings.publicSeed');
  const storedPublicKey = getField('userSettings.publicKey');
  const result = verify(message, sigmaArr, storedPublicKey, storedPublicSeed);

  return {
    signature: result.signature,
    valid: result.valid
  };
});

/**
 * IPC handler to execute the main function: sending a transaction.
 * @param {object} event - The IPC event.
 * @param {string} destinationAddress - The destination address for the transaction.
 * @param {string} transferAmount - The amount to transfer (in ETH).
 * @param {string} mnemonic - The BIP39 mnemonic phrase.
 * @param {string} passphrase - The passphrase for the mnemonic.
 * @returns {object} - An object containing the transaction details and sleeve signature (if applicable).
 */
ipcMain.handle('run-main', async (event, destinationAddress, transferAmount, mnemonic, passphrase) => {
  let nonce = await alchemy.core.getTransactionCount(wallet.address, 'latest');
 
  let transaction = {
    to: destinationAddress,
    value: Utils.parseEther(transferAmount),
    gasLimit: "21000",
    maxPriorityFeePerGas: Utils.parseUnits("10", "gwei"),
    maxFeePerGas: Utils.parseUnits("25", "gwei"),
    nonce: nonce,
    type: 2,
    chainId: 11155111,
  };

  let rawTransaction = await wallet.signTransaction(transaction);

  let tx = await alchemy.core.sendTransaction(rawTransaction);

  let txHash = tx.hash;

  let sleeveSignature = null;
  if (Utils.parseEther("0.00005").lt(Utils.parseEther(transferAmount))) {
    sleeveSignature = sign(txHash, mnemonic, passphrase);
  }
  
  return {
    tx: JSON.stringify(tx),
    signature: sleeveSignature.join(',')
  };
});
