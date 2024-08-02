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