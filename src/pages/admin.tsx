import React, { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import FactoryOwnerControls_v1 from '@components/features/admin/FactoryOwnerControls_v1';
import FactoryOwnerControls_v2 from '@components/features/admin/FactoryOwnerControls_v2';
import FactoryOwnerControls_v3 from '@components/features/admin/FactoryOwnerControls_v3';
import { getNetworkContractAddress } from '@config/contracts';
import { useNetwork } from '@contexts/NetworkContext';
import { BrowserProvider } from 'ethers';
import { ToastProvider } from '@/components/ui/toast/use-toast';
import { NetworkIndicator } from '@components/common/NetworkIndicator';
import Head from 'next/head';
import { Footer } from '@/components/layouts/Footer';

export default function AdminPage() {
  const { isConnected } = useAccount();
  const { chainId } = useNetwork();
  const publicClient = usePublicClient();
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    if (publicClient) {
      setProvider(new BrowserProvider(publicClient as any));
    }
  }, [publicClient]);

  const factoryV1Address = chainId ? getNetworkContractAddress(chainId, 'factoryAddress') : undefined;
  const factoryV2Address = chainId ? getNetworkContractAddress(chainId, 'factoryAddressV2') : undefined;
  const factoryV3Address = chainId ? getNetworkContractAddress(chainId, 'factoryAddressV3') : undefined;

  console.log('Admin Page - Network State:', {
    chainId,
    isConnected,
    hasProvider: !!provider,
    factoryAddresses: {
      v1: factoryV1Address,
      v2: factoryV2Address,
      v3: factoryV3Address
    }
  });

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>TokenHub.dev - Admin</title>
        <meta name="description" content="Admin dashboard for TokenHub.dev" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-2">
        <ToastProvider>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-text-primary">Factory Admin Controls</h1>
                <p className="text-text-secondary mt-2">
                  Manage deployment fees and other settings for the token factories.
                </p>
              </div>
              <NetworkIndicator />
            </div>

            <div className="space-y-6">
              {factoryV3Address && (
                <FactoryOwnerControls_v3
                  isConnected={isConnected}
                  address={factoryV3Address}
                  provider={provider}
                />
              )}

              {factoryV2Address && (
                <FactoryOwnerControls_v2
                  isConnected={isConnected}
                  address={factoryV2Address}
                  provider={provider}
                />
              )}

              {factoryV1Address && (
                <FactoryOwnerControls_v1
                  isConnected={isConnected}
                  address={factoryV1Address}
                  provider={provider}
                />
              )}

              {!factoryV1Address && !factoryV2Address && !factoryV3Address && (
                <div className="form-card">
                  <p className="text-text-secondary">
                    No factory contracts are deployed on this network.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ToastProvider>
      </main>
      <Footer />
    </div>
  );
} 