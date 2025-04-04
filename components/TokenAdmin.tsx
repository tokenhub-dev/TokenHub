import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';
import TokenFactory_v1 from '../contracts/abi/TokenFactory_v1.json';
import TokenTemplate_v1 from '../contracts/abi/TokenTemplate_v1.json';
import { getContractAddress } from '../config/networks';
import { getExplorerUrl } from '../config/networks';
import { useNetwork } from '../contexts/NetworkContext';
import { Toast } from './ui/Toast';
import { Spinner } from './ui/Spinner';

const TOKEN_DECIMALS = 18; // Standard ERC20 decimals

interface TokenAdminProps {
  isConnected: boolean;
  address?: string;
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  totalSupply: string;
  blacklistEnabled: boolean;
  timeLockEnabled: boolean;
}

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

interface LockInfo {
  address: string;
  duration: number;
  lockUntil?: number;
}

export default function TokenAdmin({ isConnected, address }: TokenAdminProps) {
  const { chainId } = useNetwork();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [lockInfo, setLockInfo] = useState<LockInfo>({ address: '', duration: 30 });
  const [currentWallet, setCurrentWallet] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const loadTokens = async () => {
    if (!isConnected || !window.ethereum || !chainId) return;

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const factoryAddress = getContractAddress(chainId, 'TokenFactory_v1');
      
      if (!factoryAddress) {
        showToast('error', 'Contract not deployed on this network');
        return;
      }

      // Create contract instance with the full ABI
      const factory = new Contract(
        factoryAddress,
        [
          "function getDeployedTokens() external view returns (address[])",
          "event TokenCreated(address indexed tokenAddress, string name, string symbol, address indexed owner, uint256 initialSupply, uint256 maxSupply, bool blacklistEnabled, bool timeLockEnabled)"
        ],
        signer
      );

      const deployedTokens = await factory.getDeployedTokens();
      
      const tokenInfoPromises = deployedTokens.map(async (tokenAddress: string) => {
        const token = new Contract(tokenAddress, TokenTemplate_v1.abi, signer);
        const [name, symbol, totalSupply, blacklistEnabled, timeLockEnabled, owner] = await Promise.all([
          token.name(),
          token.symbol(),
          token.totalSupply(),
          token.blacklistEnabled(),
          token.timeLockEnabled(),
          token.owner()
        ]);

        // Only include tokens owned by the current user
        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          return {
            address: tokenAddress,
            name,
            symbol,
            totalSupply: formatUnits(totalSupply, TOKEN_DECIMALS),
            blacklistEnabled,
            timeLockEnabled
          };
        }
        return null;
      });

      const tokenInfos = await Promise.all(tokenInfoPromises);
      setTokens(tokenInfos.filter(Boolean));
    } catch (error: any) {
      console.error('Error loading tokens:', error);
      showToast('error', error.message || 'Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlacklist = async (tokenAddress: string, addressToBlacklist: string, blacklist: boolean) => {
    if (!isConnected || !window.ethereum) return;

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new Contract(tokenAddress, TokenTemplate_v1.abi, signer);

      const tx = await token[blacklist ? 'blacklist' : 'unblacklist'](addressToBlacklist);
      showToast('success', 'Transaction submitted...');
      
      await tx.wait();
      showToast('success', `Address ${blacklist ? 'blacklisted' : 'unblacklisted'} successfully`);
      setBlacklistAddress('');
    } catch (error: any) {
      console.error('Error managing blacklist:', error);
      showToast('error', error.message || 'Failed to manage blacklist');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLockTime = async (tokenAddress: string, addressToCheck: string) => {
    if (!isConnected || !window.ethereum) return;

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new Contract(tokenAddress, TokenTemplate_v1.abi, signer);

      const lockTime = await token.getLockTime(addressToCheck);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (lockTime > currentTime) {
        const daysLeft = Math.ceil((lockTime - currentTime) / (24 * 60 * 60));
        showToast('success', `Address is locked for ${daysLeft} more days (until ${new Date(lockTime * 1000).toLocaleString()})`);
      } else {
        showToast('success', 'Address is not locked');
      }
    } catch (error: any) {
      console.error('Error checking lock time:', error);
      showToast('error', error.message || 'Failed to check lock time');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetLockTime = async (tokenAddress: string, addressToLock: string, durationDays: number) => {
    if (!isConnected || !window.ethereum) return;

    if (addressToLock.toLowerCase() === currentWallet.toLowerCase()) {
      if (!window.confirm('Warning: You are about to lock your own address. This will prevent you from transferring tokens. Are you sure?')) {
        return;
      }
    }

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const token = new Contract(tokenAddress, TokenTemplate_v1.abi, signer);

      const lockUntil = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60);
      
      const tx = await token.setLockTime(addressToLock, lockUntil);
      showToast('success', 'Transaction submitted...');
      
      await tx.wait();
      showToast('success', `Address locked until ${new Date(lockUntil * 1000).toLocaleString()}`);
      setLockInfo({ address: '', duration: 30 });
    } catch (error: any) {
      console.error('Error setting lock time:', error);
      showToast('error', error.message || 'Failed to set lock time');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && chainId) {
      loadTokens();
    }
  }, [isConnected, chainId, address]);

  useEffect(() => {
    if (isConnected && window.ethereum) {
      const provider = new BrowserProvider(window.ethereum);
      provider.getSigner().then(signer => signer.getAddress()).then(setCurrentWallet);
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="p-6 bg-background-accent rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-6 text-text-primary">Token Management</h2>
        <p className="text-text-secondary">Please connect your wallet to manage tokens.</p>
      </div>
    );
  }

  return (
    <div className="p-6 relative bg-background-accent rounded-lg shadow-lg">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-bold text-text-primary">Token Management</h2>
        <button className="text-text-accent hover:text-blue-400">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {toast && <Toast type={toast.type} message={toast.message} />}
      
      {isExpanded && (
        isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="w-8 h-8 text-text-primary" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="mt-4">
            <p className="text-text-secondary">No tokens found. Deploy a new token to get started.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {tokens.map(token => (
              <div key={token.address} className="border border-border rounded-lg p-4 space-y-4 bg-background-secondary">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-text-primary">{token.name} ({token.symbol})</h3>
                    <p className="text-sm text-text-secondary">Address: {token.address}</p>
                    <p className="text-sm text-text-secondary">Total Supply: {Number(token.totalSupply).toLocaleString()} {token.symbol}</p>
                  </div>
                  <button
                    onClick={() => setSelectedToken(selectedToken === token.address ? null : token.address)}
                    className="text-text-accent hover:text-blue-400"
                  >
                    {selectedToken === token.address ? 'Hide' : 'Manage'}
                  </button>
                </div>

                {selectedToken === token.address && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex gap-2 mb-4">
                      <a
                        href={getExplorerUrl(chainId || 0, token.address, 'token')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-accent hover:text-blue-400"
                      >
                        View on Explorer ↗
                      </a>
                    </div>

                    {!token.blacklistEnabled && !token.timeLockEnabled ? (
                      <p className="text-text-secondary italic">This token was created without blacklist or timelock features.</p>
                    ) : (
                      <>
                        {token.blacklistEnabled && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-text-primary">Blacklist Management</h4>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={blacklistAddress}
                                onChange={(e) => setBlacklistAddress(e.target.value)}
                                placeholder="Address to blacklist/unblacklist"
                                className="flex-1 p-2 rounded bg-background-primary border border-border hover:border-border-light focus:border-text-accent text-text-primary placeholder-text-secondary"
                              />
                              <button
                                onClick={() => handleBlacklist(token.address, blacklistAddress, true)}
                                className="px-3 py-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500/30"
                              >
                                Blacklist
                              </button>
                              <button
                                onClick={() => handleBlacklist(token.address, blacklistAddress, false)}
                                className="px-3 py-1 rounded bg-green-500/20 text-green-500 hover:bg-green-500/30"
                              >
                                Unblacklist
                              </button>
                            </div>
                          </div>
                        )}

                        {token.timeLockEnabled && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-text-primary">Time Lock Management</h4>
                            <p className="text-sm text-text-secondary mb-2">Lock token transfers for a specific address for a set duration.</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={lockInfo.address}
                                onChange={(e) => setLockInfo({ ...lockInfo, address: e.target.value })}
                                placeholder="Address to lock/check"
                                className="flex-1 p-2 rounded bg-background-primary border border-border hover:border-border-light focus:border-text-accent text-text-primary placeholder-text-secondary"
                              />
                              <input
                                type="number"
                                value={lockInfo.duration}
                                onChange={(e) => setLockInfo({ ...lockInfo, duration: parseInt(e.target.value) || 0 })}
                                min="1"
                                max="365"
                                placeholder="Days"
                                className="w-24 p-2 rounded bg-background-primary border border-border hover:border-border-light focus:border-text-accent text-text-primary"
                              />
                              <button
                                onClick={() => handleSetLockTime(token.address, lockInfo.address, lockInfo.duration)}
                                className="px-3 py-1 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                              >
                                Lock
                              </button>
                              <button
                                onClick={() => checkLockTime(token.address, lockInfo.address)}
                                className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                              >
                                Check
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
} 