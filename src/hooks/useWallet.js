import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { connectWallet, getWalletAddress, formatAddress, isMetaMaskInstalled } from '../utils/wallet';

export const useWallet = () => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
  }, []);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      const savedAddress = localStorage.getItem('walletAddress');
      const savedConnected = localStorage.getItem('walletConnected');
      if (!savedAddress || savedConnected !== 'true') return;

      const currentAddress = await getWalletAddress();
      if (currentAddress && currentAddress.toLowerCase() === savedAddress.toLowerCase()) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();

          setAddress(currentAddress);
          setProvider(provider);
          setSigner(signer);
          setChainId(Number(network.chainId));
          setIsConnected(true);
        } catch (err) {
          // If silent reconnection fails, clear saved state and require manual connect
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletConnected');
        }
      } else {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletConnected');
      }
    };
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnect();
        } else {
          // Account changed
          const newAddress = accounts[0];
          setAddress(newAddress);
          localStorage.setItem('walletAddress', newAddress);
          try {
            const walletData = await connectWallet();
            setProvider(walletData.provider);
            setSigner(walletData.signer);
            setChainId(walletData.chainId);
          } catch (err) {
            console.error('Error reconnecting wallet:', err);
          }
        }
      };

      const handleChainChanged = async () => {
        // Reload page on chain change
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [disconnect]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      const walletData = await connectWallet();
      setAddress(walletData.address);
      setProvider(walletData.provider);
      setSigner(walletData.signer);
      setChainId(walletData.chainId);
      setIsConnected(true);
      localStorage.setItem('walletAddress', walletData.address);
      localStorage.setItem('walletConnected', 'true');
      
      return walletData;
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    address,
    formattedAddress: formatAddress(address),
    isConnected,
    isConnecting,
    error,
    provider,
    signer,
    chainId,
    connect,
    disconnect,
    isMetaMaskInstalled: isMetaMaskInstalled()
  };
};

