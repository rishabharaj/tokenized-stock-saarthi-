// api.js

document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectBtn');
    const statusDiv = document.getElementById('status');
  
    connectBtn.addEventListener('click', async () => {
      if (typeof window.ethereum !== 'undefined') {
        // MetaMask is installed
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Set UI status
          statusDiv.innerText = `Connected account: ${accounts[0]}`;
          console.log('Connected to MetaMask:', accounts);
        } catch (error) {
          console.error(error);
          statusDiv.innerText = 'Error connecting to MetaMask.';
        }
      } else {
        // MetaMask not found
        statusDiv.innerText = 'MetaMask is not installed. Please install MetaMask extension.';
      }
    });
  });
  