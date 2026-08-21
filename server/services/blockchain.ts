import { ethers } from 'ethers';
import prisma from '../utils/db.js';

export const CONTRACT_ABI = [
  "function anchorEvidence(bytes32 _evidenceHash) external",
  "function isRegistered(bytes32 _evidenceHash) external view returns (bool)",
  "function getEvidenceDetails(bytes32 _evidenceHash) external view returns (bool exists, uint256 timestamp, address submitter)",
  "event EvidenceAnchored(bytes32 indexed evidenceHash, uint256 timestamp, address indexed submitter)"
];

export function isBlockchainConfigured(): boolean {
  return !!(
    process.env.BLOCKCHAIN_RPC_URL &&
    process.env.BLOCKCHAIN_PRIVATE_KEY &&
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS
  );
}

export function getMissingBlockchainEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.BLOCKCHAIN_RPC_URL) missing.push('BLOCKCHAIN_RPC_URL');
  if (!process.env.BLOCKCHAIN_PRIVATE_KEY) missing.push('BLOCKCHAIN_PRIVATE_KEY');
  if (!process.env.BLOCKCHAIN_CONTRACT_ADDRESS) missing.push('BLOCKCHAIN_CONTRACT_ADDRESS');
  return missing;
}

/**
 * Anchor an evidence SHA-256 hash onto the blockchain.
 */
export async function anchorEvidenceOnBlockchain(
  evidenceId: string,
  userId: string,
  reqIp?: string
) {
  // 1. Retrieve evidence
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: { case: true }
  });

  if (!evidence) {
    throw new Error('Evidence record not found');
  }

  if (evidence.status !== 'VERIFIED') {
    throw new Error('Only evidence with VERIFIED integrity status can be anchored to the blockchain');
  }

  if (!evidence.sha256Hash) {
    throw new Error('Evidence record is missing server SHA-256 hash');
  }

  if (evidence.blockchainStatus === 'ANCHORED') {
    throw new Error('Evidence is already anchored to the blockchain');
  }

  if (evidence.blockchainStatus === 'ANCHORING') {
    throw new Error('Evidence anchoring is currently in progress');
  }

  // Check env vars
  if (!isBlockchainConfigured()) {
    const missing = getMissingBlockchainEnvVars();
    throw new Error(
      `Blockchain configuration incomplete. Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const cleanHash = evidence.sha256Hash.trim().toLowerCase();
  const bytes32Hash = '0x' + cleanHash;

  if (bytes32Hash.length !== 66) {
    throw new Error('Invalid SHA-256 hash length');
  }

  // 2. Set status to ANCHORING
  await prisma.evidence.update({
    where: { id: evidenceId },
    data: { blockchainStatus: 'ANCHORING' }
  });

  try {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL!;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY!;
    const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS!;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    // 3. Check if already registered on-chain
    const alreadyOnChain = await contract.isRegistered(bytes32Hash);
    let txHash: string;
    let blockNumber: number;
    let blockTimestamp: Date;

    if (alreadyOnChain) {
      const details = await contract.getEvidenceDetails(bytes32Hash);
      txHash = evidence.blockchainTxHash || 'ALREADY_ANCHORED_ON_CHAIN';
      blockNumber = evidence.blockchainBlockNumber || 0;
      blockTimestamp = details.timestamp ? new Date(Number(details.timestamp) * 1000) : new Date();
    } else {
      // 4. Submit transaction to contract
      const tx = await contract.anchorEvidence(bytes32Hash);
      const receipt = await tx.wait(1);

      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;

      const block = await provider.getBlock(receipt.blockNumber);
      blockTimestamp = block ? new Date(Number(block.timestamp) * 1000) : new Date();
    }

    // 5. Update DB record to ANCHORED
    const updatedEvidence = await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        blockchainStatus: 'ANCHORED',
        blockchainNetwork: 'Polygon Amoy',
        blockchainTxHash: txHash,
        blockchainBlockNumber: blockNumber,
        blockchainTimestamp: blockTimestamp,
        blockchainContractAddress: contractAddress,
        anchoredAt: new Date()
      }
    });

    // 6. Audit & Custody Logs
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EVIDENCE_ANCHORED_ON_BLOCKCHAIN',
        resource: `Evidence:${evidenceId}`,
        details: `Anchored to Polygon Amoy. TxHash: ${txHash}`,
        ipAddress: reqIp
      }
    });

    await prisma.chainOfCustodyLog.create({
      data: {
        evidenceId,
        actorId: userId,
        action: 'ANCHORED_TO_BLOCKCHAIN',
        ipAddress: reqIp
      }
    });

    return updatedEvidence;
  } catch (error: any) {
    // Failure handling
    await prisma.evidence.update({
      where: { id: evidenceId },
      data: { blockchainStatus: 'ANCHOR_FAILED' }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EVIDENCE_ANCHORING_FAILED',
        resource: `Evidence:${evidenceId}`,
        details: `Anchoring failed: ${error?.message || error}`,
        ipAddress: reqIp
      }
    });

    throw new Error(`Blockchain anchoring failed: ${error?.message || error}`);
  }
}

/**
 * Public read-only blockchain lookup service.
 */
export async function verifyHashOnBlockchain(hash: string) {
  const cleanHash = hash.trim().toLowerCase();
  const bytes32Hash = '0x' + cleanHash;

  if (!/^[a-f0-9]{64}$/i.test(cleanHash)) {
    return {
      verified: false,
      hash: cleanHash,
      message: 'Invalid SHA-256 hash format'
    };
  }

  // Check database first
  const dbEvidence = await prisma.evidence.findFirst({
    where: {
      sha256Hash: cleanHash,
      blockchainStatus: 'ANCHORED'
    }
  });

  // Query smart contract if RPC & Contract Address are configured
  if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_CONTRACT_ADDRESS) {
    try {
      const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
      const contract = new ethers.Contract(
        process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const details = await contract.getEvidenceDetails(bytes32Hash);
      if (details.exists) {
        return {
          verified: true,
          onChain: true,
          hash: cleanHash,
          network: 'Polygon Amoy',
          blockchainTimestamp: new Date(Number(details.timestamp) * 1000).toISOString(),
          submitter: details.submitter,
          contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
          txHash: dbEvidence?.blockchainTxHash || null,
          blockNumber: dbEvidence?.blockchainBlockNumber || null,
          evidenceId: dbEvidence?.id || null,
          anchoredAt: dbEvidence?.anchoredAt || new Date(Number(details.timestamp) * 1000).toISOString()
        };
      }
    } catch (e) {
      console.error('Error querying blockchain contract:', e);
    }
  }

  // Fallback to database record if anchored
  if (dbEvidence && dbEvidence.blockchainStatus === 'ANCHORED') {
    return {
      verified: true,
      onChain: true,
      hash: cleanHash,
      network: dbEvidence.blockchainNetwork || 'Polygon Amoy',
      blockchainTimestamp: dbEvidence.blockchainTimestamp?.toISOString() || dbEvidence.anchoredAt?.toISOString() || null,
      submitter: null,
      contractAddress: dbEvidence.blockchainContractAddress,
      txHash: dbEvidence.blockchainTxHash,
      blockNumber: dbEvidence.blockchainBlockNumber,
      evidenceId: dbEvidence.id,
      anchoredAt: dbEvidence.anchoredAt?.toISOString() || null
    };
  }

  return {
    verified: false,
    hash: cleanHash,
    message: 'No blockchain anchor found for this hash.'
  };
}
