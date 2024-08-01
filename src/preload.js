const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  generateSeed: (passphrase) => ipcRenderer.invoke('generate-seed', passphrase),
  verifyMessage: (message, sigma) => ipcRenderer.invoke('verify-message', message, sigma),
  runMain: (destinationAddress, transferAmount, mnemonic, passphrase) => ipcRenderer.invoke('run-main', destinationAddress, transferAmount, mnemonic, passphrase)
});
