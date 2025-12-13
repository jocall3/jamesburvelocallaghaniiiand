import { NextRequest, NextResponse } from 'next/server';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { ethers } from 'ethers';

// Assuming you have environment variables set up for:
// - PRIVATE_KEY: The private key of the wallet that owns the NFT
// - RPC_URL: The RPC URL of the blockchain you're using
// - NFT_CONTRACT_ADDRESS: The address of the NFT contract
const privateKey = process.env.PRIVATE_KEY;
const rpcUrl = process.env.RPC_URL;
const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;

if (!privateKey || !rpcUrl || !nftContractAddress) {
  console.error("Missing environment variables. Ensure PRIVATE_KEY, RPC_URL, and NFT_CONTRACT_ADDRESS are set.");
}

export async function POST(req: NextRequest) {
  try {
    if (!privateKey || !rpcUrl || !nftContractAddress) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const body = await req.json();
    const { tokenId, recipientAddress } = body;

    if (!tokenId || !recipientAddress) {
      return NextResponse.json({ error: "Missing tokenId or recipientAddress in request body" }, { status: 400 });
    }

    // Initialize Thirdweb SDK
    const sdk = new ThirdwebSDK(
      new ethers.Wallet(
        privateKey,
        new ethers.providers.JsonRpcProvider(rpcUrl)
      )
    );

    // Get the NFT contract
    const contract = await sdk.getContract(nftContractAddress, "nft-collection");

    // Transfer the NFT
    const tx = await contract.transfer(recipientAddress, tokenId);

    // Return the transaction receipt
    return NextResponse.json({
      success: true,
      transactionHash: tx.receipt.transactionHash,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error transferring NFT:", error);
    return NextResponse.json({ error: error.message || "Failed to transfer NFT" }, { status: 500 });
  }
}