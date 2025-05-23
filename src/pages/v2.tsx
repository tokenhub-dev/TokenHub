import { useEffect, useState } from 'react';
import { useNetwork } from '@contexts/NetworkContext';
import { NetworkIndicator } from '@components/common/NetworkIndicator';
import { TokenFormV2 } from '@components/features/token/TokenForm_V2';
import Head from 'next/head';
import type { MetaMaskInpageProvider } from '@metamask/providers';
import { Footer } from '@/components/layouts/Footer';

export default function V2Page() {
  const [isConnected, setIsConnected] = useState(false);
  const { chainId } = useNetwork();
  const [account, setAccount] = useState<string | null>(null);

  // Only check connection when explicitly requested
  const checkConnection = async () => {
    try {
      // Only check for existing connections
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      setIsConnected(accounts.length > 0);
      setAccount(accounts[0] || null);

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        setIsConnected(accounts.length > 0);
        setAccount(accounts[0] || null);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup listener on unmount
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setAccount(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>TokenHub.dev - Token Factory v2</title>
        <meta name="description" content="Create your own token with TokenHub.dev v2" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-2">
        <div className="max-w-6xl mx-auto">
          <div className="mb-1">
            <h1 className="text-3xl font-bold text-white mb-2">Token Factory v2</h1>
            <p className="text-white">Create your own token with advanced features like presale and vesting.</p>
          </div>

          <TokenFormV2 isConnected={isConnected} onConnect={checkConnection} />
        </div>
      </main>
      <Footer />
    </div>
  );
}