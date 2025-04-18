'use client';

import { useAccount, usePublicClient } from 'wagmi';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from '@/components/layouts/Footer';
import { Web3ModalProvider } from '@/components/providers/Web3ModalProvider';
import { ToastProvider } from '@/components/ui/toast/use-toast';
import { useNetwork } from '@/contexts/NetworkContext';
import { getNetworkContractAddress } from '@/config/contracts';
import Head from 'next/head';
import { Suspense, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import TCAP_U_DEXLIST from '@/components/features/token/TCAP_U_DEXLIST';
import TokenAdminControls from '@/components/features/token/TokenAdminControls';
import TokenCreationForm from '@/components/features/token/TokenCreationForm';

// Dynamically import components with loading fallback
const TokenForm_v2DD_2Step = dynamic(
  () => import('@/components/features/token/TokenForm_v2DD_2Step'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center py-8"><Spinner /></div>
  }
);

const TCAP_v2DirectDEX = dynamic(
  () => import('@/components/features/token/TCAP_v2DirectDEX'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center py-8"><Spinner /></div>
  }
);

const TCAP_v2Make = dynamic(
  () => import('@/components/features/token/TCAP_v2Make'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center py-8"><Spinner /></div>
  }
);

const TokenListingProcess = dynamic(
  () => import('@/components/features/token/TokenListingProcess'),
  { 
    ssr: false,
    loading: () => <div className="flex justify-center py-8"><Spinner /></div>
  }
);

function V2DirectDEXContent() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { chainId } = useNetwork();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create');
  
  const factoryAddress = chainId ? getNetworkContractAddress(chainId, 'dexListingFactory') : null;
  
  const handleTokenCreated = (tokenAddress: string) => {
    // Switch to the list tab after token creation
    setActiveTab('list');
  };
  
  return (
    <div className="min-h-screen bg-background-primary">
      <Head>
        <title>TokenHub.dev - Token Factory v2 DirectDEX</title>
        <meta name="description" content="Create and instantly list your token on DEX with advanced trading controls." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-4xl font-black mb-2 text-white">DEX Listing Factory</h1>
            <p className="text-gray-400">Create and list your tokens on DEX with advanced features, fees, and admin controls.</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger 
                value="features"
                className="flex-1 data-[state=active]:bg-blue-600 bg-gray-800 data-[state=active]:text-white text-text-secondary rounded-md px-6"
              >
                Features
              </TabsTrigger>
              <TabsTrigger 
                value="create"
                className="flex-1 data-[state=active]:bg-blue-600 bg-gray-800 data-[state=active]:text-white text-text-secondary rounded-md px-6"
              >
                Create Token
              </TabsTrigger>
              <TabsTrigger 
                value="list"
                className="flex-1 data-[state=active]:bg-blue-600 bg-gray-800 data-[state=active]:text-white text-text-secondary rounded-md px-6"
              >
                List Token
              </TabsTrigger>
              <TabsTrigger 
                value="tokens"
                className="flex-1 data-[state=active]:bg-blue-600 bg-gray-800 data-[state=active]:text-white text-text-secondary rounded-md px-6"
              >
                Listed Tokens
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="flex-1 data-[state=active]:bg-blue-600 bg-gray-800 data-[state=active]:text-white text-text-secondary rounded-md px-6"
              >
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="features" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-background-secondary p-4 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Advanced Token Features</h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Dynamic fee system that adapts to market conditions
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Auto-liquidity generation for sustainable growth
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Marketing and development fee allocation
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Anti-bot protection measures
                    </li>
                  </ul>
                </div>
                <div className="bg-background-secondary p-4 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Trading Controls</h3>
                  <ul className="space-y-2 text-text-secondary">
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Customizable transaction limits
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Maximum wallet holdings
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Trading activation timer
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-400 mr-2">•</span>
                      Blacklist management
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-background-secondary p-4 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Token Creation & Listing Flow</h3>
                <ol className="space-y-2 text-text-secondary list-decimal list-inside">
                  <li>Load and select your token from one of our token factories</li>
                  <li>Submit your token for approval</li>
                  <li>Submit again to finally deploy your token to your chosen DEX for trading</li>
                  <li>Track your listed tokens and manage them in the "Listed Tokens" tab after deployment</li>
                  <li>Access advanced controls and settings in the "Admin" tab</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="create">
              <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="bg-background-secondary p-6 rounded-lg border border-border">
                      <TokenCreationForm onSuccess={handleTokenCreated} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-background-secondary rounded-lg border border-border">
                    <p className="text-text-secondary">Please connect your wallet to create a token.</p>
                  </div>
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="list">
              <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
                {isConnected ? (
                  <TokenListingProcess />
                ) : (
                  <div className="text-center py-8 bg-background-secondary rounded-lg border border-border">
                    <p className="text-text-secondary">Please connect your wallet to list your token.</p>
                  </div>
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="tokens">
              <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="bg-background-secondary p-6 rounded-lg border border-border">
                      <TCAP_U_DEXLIST />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-background-secondary rounded-lg border border-border">
                    <p className="text-text-secondary">Please connect your wallet to view your listed tokens.</p>
                  </div>
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="admin">
              <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="bg-background-secondary p-6 rounded-lg border border-border">
                      <TokenAdminControls />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-background-secondary rounded-lg border border-border">
                    <p className="text-text-secondary">Please connect your wallet to access admin controls.</p>
                  </div>
                )}
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function V2DirectDEXPage() {
  return (
    <Web3ModalProvider>
      <ToastProvider>
        <V2DirectDEXContent />
      </ToastProvider>
    </Web3ModalProvider>
  );
} 