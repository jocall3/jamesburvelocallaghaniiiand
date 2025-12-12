import React, { useState } from 'react';

// Unified Brand Namespace
namespace Citibankdemobusinessinc {

  // Shared Kernel - Utilities
  namespace Kernel {
    export const generateId = (): string => Math.random().toString(36).substring(2, 15);
    export const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
    export const randomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
    export const generateName = (): string => `Item ${generateId().substring(0, 6)}`;
    export const generateDescription = (): string => `Description for ${generateName()}. This is a generated description.`;
    export const generateImageUrl = (): string => `https://placekitten.com/200/200?id=${generateId().substring(0, 5)}`;
    export const generateTokenId = (): string => randomNumber(1000, 9999).toString();
    export const generateContractAddress = (): string => `0x${generateId().substring(0, 40)}`;
    export const generateAttribute = (): NFTAttribute => ({
      trait_type: `Trait ${generateId().substring(0, 3)}`,
      value: randomNumber(1, 100)
    });
    export const generateAttributes = (count: number): NFTAttribute[] => Array.from({ length: count }, () => generateAttribute());
    export const generateCollectionName = (): string => `Collection ${generateId().substring(0, 8)}`;
    export const generateOwner = (): string => `0x${generateId().substring(0, 40)}`;

    // Data Simulation
    export const simulateNFTData = (): NFTData => ({
      id: generateId(),
      name: generateName(),
      description: generateDescription(),
      imageUrl: generateImageUrl(),
      collectionName: generateCollectionName(),
      tokenId: generateTokenId(),
      contractAddress: generateContractAddress(),
      attributes: generateAttributes(randomNumber(1, 5)),
      owner: generateOwner()
    });

    export const simulateNFTDataset = (count: number): NFTData[] => Array.from({ length: count }, () => simulateNFTData());

    // UI Helpers
    export const truncateAddress = (address: string, startLength: number = 4, endLength: number = 4): string => {
      return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
    };
  }

  // Types for NFT Data Structure
  export interface NFTAttribute {
    trait_type: string;
    value: string | number;
  }

  export interface NFTData {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    collectionName: string;
    tokenId: string;
    contractAddress: string;
    attributes?: NFTAttribute[];
    owner?: string;
  }

  // Branch 1: Digital Collectibles Marketplace
  export namespace Collectibles {
    export namespace Marketplace {
      // Mission: To create a decentralized platform for trading unique digital assets.
      // Monetization: Transaction fees, premium listings, featured collections.
      // IP Moat: Proprietary smart contract architecture, curated collections.

      export const runMarketplace = (): void => {
        console.log("Running Digital Collectibles Marketplace...");
        // Simulate user interactions, transactions, etc.
      };
    }
  }

  // Branch 2: NFT-Backed Loans
  export namespace Finance {
    export namespace NFTLoans {
      // Mission: To provide liquidity to NFT holders through collateralized loans.
      // Monetization: Interest on loans, liquidation fees.
      // IP Moat: Risk assessment algorithms, smart contract-based loan agreements.

      export const runNFTLoans = (): void => {
        console.log("Running NFT-Backed Loans...");
        // Simulate loan origination, repayment, liquidation.
      };
    }
  }

  // Branch 3: Fractionalized NFT Ownership
  export namespace Ownership {
    export namespace Fractionalization {
      // Mission: To democratize access to high-value NFTs through fractional ownership.
      // Monetization: Service fees, trading commissions.
      // IP Moat: Tokenization protocol, governance mechanisms.

      export const runFractionalization = (): void => {
        console.log("Running Fractionalized NFT Ownership...");
        // Simulate token creation, trading, governance.
      };
    }
  }

  // Branch 4: NFT Gaming Integration
  export namespace Gaming {
    export namespace NFTIntegration {
      // Mission: To enhance gaming experiences through NFT-based assets and rewards.
      // Monetization: In-game purchases, NFT sales.
      // IP Moat: Game-specific NFT standards, interoperability protocols.

      export const runNFTIntegration = (): void => {
        console.log("Running NFT Gaming Integration...");
        // Simulate in-game NFT usage, rewards, trading.
      };
    }
  }

  // Branch 5: NFT Authentication and Verification
  export namespace Security {
    export namespace NFTAuthentication {
      // Mission: To provide secure authentication and verification of NFT ownership.
      // Monetization: Verification fees, API access.
      // IP Moat: Authentication protocols, decentralized identity solutions.

      export const runNFTAuthentication = (): void => {
        console.log("Running NFT Authentication and Verification...");
        // Simulate NFT verification, ownership validation.
      };
    }
  }

  // Branch 6: NFT Art Curation and Galleries
  export namespace Art {
    export namespace NFTGalleries {
      // Mission: To showcase and promote digital art through curated NFT galleries.
      // Monetization: Commission on sales, gallery subscriptions.
      // IP Moat: Curation algorithms, exclusive artist partnerships.

      export const runNFTGalleries = (): void => {
        console.log("Running NFT Art Curation and Galleries...");
        // Simulate gallery exhibitions, art sales, artist onboarding.
      };
    }
  }

  // Branch 7: NFT Music and Royalties
  export namespace Music {
    export namespace NFTRoyalties {
      // Mission: To revolutionize music ownership and royalties through NFTs.
      // Monetization: Royalty distribution fees, NFT sales.
      // IP Moat: Royalty tracking system, smart contract-based agreements.

      export const runNFTRoyalties = (): void => {
        console.log("Running NFT Music and Royalties...");
        // Simulate royalty distribution, music NFT sales, artist onboarding.
      };
    }
  }

  // Branch 8: NFT Real Estate
  export namespace RealEstate {
    export namespace NFTRealEstate {
      // Mission: To tokenize real estate assets and facilitate fractional ownership.
      // Monetization: Transaction fees, property management fees.
      // IP Moat: Legal framework, smart contract-based ownership.

      export const runNFTRealEstate = (): void => {
        console.log("Running NFT Real Estate...");
        // Simulate property tokenization, fractional ownership, rental management.
      };
    }
  }

  // Branch 9: NFT Supply Chain Management
  export namespace SupplyChain {
    export namespace NFTTracking {
      // Mission: To enhance supply chain transparency and traceability through NFTs.
      // Monetization: Tracking fees, data analytics.
      // IP Moat: Tracking protocols, data analytics platform.

      export const runNFTTracking = (): void => {
        console.log("Running NFT Supply Chain Management...");
        // Simulate product tracking, supply chain monitoring, data analytics.
      };
    }
  }

  // Branch 10: NFT Identity and Credentials
  export namespace Identity {
    export namespace NFTCredentials {
      // Mission: To provide secure and verifiable digital identities through NFTs.
      // Monetization: Verification fees, identity management services.
      // IP Moat: Identity protocols, decentralized identity solutions.

      export const runNFTCredentials = (): void => {
        console.log("Running NFT Identity and Credentials...");
        // Simulate identity verification, credential management, secure access.
      };
    }
  }

  // Master Orchestration Layer
  export const orchestrate = (): void => {
    console.log("Orchestrating Citibankdemobusinessinc ecosystem...");
    Collectibles.Marketplace.runMarketplace();
    Finance.NFTLoans.runNFTLoans();
    Ownership.Fractionalization.runFractionalization();
    Gaming.NFTIntegration.runNFTIntegration();
    Security.NFTAuthentication.runNFTAuthentication();
    Art.NFTGalleries.runNFTGalleries();
    Music.NFTRoyalties.runNFTRoyalties();
    RealEstate.NFTRealEstate.runNFTRealEstate();
    SupplyChain.NFTTracking.runNFTTracking();
    Identity.NFTCredentials.runNFTCredentials();
    console.log("Citibankdemobusinessinc ecosystem running.");
  };

  interface NFTGalleryProps {
    nfts: NFTData[];
    isLoading?: boolean;
    title?: string;
    onNftSelect?: (nft: NFTData) => void;
    className?: string;
  }

  /**
   * NFTCard Component
   * Displays a single NFT with its image and basic metadata.
   */
  const NFTCard: React.FC<{ nft: NFTData; onClick?: (nft: NFTData) => void }> = ({ nft, onClick }) => {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick && onClick(nft)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick && onClick(nft);
          }
        }}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {!imageError ? (
            <img
              src={nft.imageUrl}
              alt={nft.name}
              className={`h-full w-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-gray-400">
              <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Image Unavailable</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {nft.collectionName}
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 line-clamp-1 dark:text-white" title={nft.name}>
            {nft.name}
          </h3>

          <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono dark:bg-gray-700">
              #{Kernel.truncateAddress(nft.tokenId)}
            </span>
            {nft.attributes && (
              <span className="text-xs">
                {nft.attributes.length} Traits
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * NFTGallery Component
   * Renders a grid of NFT cards with loading and empty states.
   */
  export const NFTGallery: React.FC<NFTGalleryProps> = ({
    nfts,
    isLoading = false,
    title = "My Collection",
    onNftSelect,
    className = ""
  }) => {
    // Loading State Skeleton
    if (isLoading) {
      return (
        <div className={`w-full ${className}`}>
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="aspect-[3/4] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="aspect-square w-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-4 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex justify-between">
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Empty State
    if (!nfts || nfts.length === 0) {
      return (
        <div className={`flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50 ${className}`}>
          <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Items Found</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            We couldn't find any NFTs in this collection.
          </p>
        </div>
      );
    }

    // Active Grid State
    return (
      <div className={`w-full ${className}`}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing {nfts.length} item{nfts.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {nfts.map((nft) => (
            <NFTCard
              key={`${nft.contractAddress}-${nft.tokenId}`}
              nft={nft}
              onClick={onNftSelect}
            />
          ))}
        </div>
      </div>
    );
  };
}

export default Citibankdemobusinessinc.NFTGallery;