import { ethers } from 'ethers';

export const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const network = await provider.getNetwork();
        return {
          address,
          provider,
          signer,
          chainId: Number(network.chainId)
        };
      }
      throw new Error('No accounts found');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }
};

export const getWalletAddress = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      
      if (accounts.length > 0) {
        return accounts[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }
  return null;
};

export const disconnectWallet = () => {
  // Clear any stored wallet data
  localStorage.removeItem('walletAddress');
  localStorage.removeItem('walletConnected');
};

export const formatAddress = (address) => {
  if (!address) return 'Not Connected';
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

export const getNetworkName = (chainId) => {
  const networks = {
    1: 'Ethereum Mainnet',
    56: 'BNB Smart Chain',
    97: 'BNB Smart Chain Testnet',
    137: 'Polygon',
    42161: 'Arbitrum',
    43114: 'Avalanche',
  };
  return networks[chainId] || `Chain ${chainId}`;
};

