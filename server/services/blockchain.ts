import { ethers } from 'ethers';
import prisma from '../utils/db.js';

export const POLYGON_AMOY_CHAIN_ID = 80002n;
export const POLYGON_AMOY_NETWORK_NAME = 'Polygon Amoy';

export const CONTRACT_ABI = [
  "function anchorEvidence(bytes32 _evidenceHash) external",
  "function isRegistered(bytes32 _evidenceHash) external view returns (bool)",
  "function getEvidenceDetails(bytes32 _evidenceHash) external view returns (bool exists, uint256 timestamp, address submitter)",
  "event EvidenceAnchored(bytes32 indexed evidenceHash, uint256 timestamp, address indexed submitter)"
];

/**
 * Validates whether the given string is a valid 64-character hexadecimal SHA-256 hash.
 */
export function normalizeAndValidateSHA256(rawHash: string): string {
  if (!rawHash || typeof rawHash !== 'string') {
    throw new Error('Hash must be a non-empty string');
  }
  const clean = rawHash.trim().toLowerCase();
  const hexOnly = clean.startsWith('0x') ? clean.slice(2) : clean;

  if (!/^[a-f0-9]{64}$/i.test(hexOnly)) {
    throw new Error('Invalid SHA-256 hash format. Expected 64 hexadecimal characters.');
  }

  return hexOnly;
}

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
 * Validates configured blockchain environment variables and parameters.
 */
export function validateBlockchainConfig() {
  if (!isBlockchainConfigured()) {
    const missing = getMissingBlockchainEnvVars();
    throw new Error(
      `Blockchain configuration incomplete. Missing required environment variables: ${missing.join(', ')}`
    );
  }

  const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS!.trim();
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid BLOCKCHAIN_CONTRACT_ADDRESS format: "${contractAddress}" is not a valid EVM address.`);
  }

  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY!.trim();
  const cleanPk = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  if (!/^[a-f0-9]{64}$/i.test(cleanPk)) {
    throw new Error('Invalid BLOCKCHAIN_PRIVATE_KEY format: Expected 32-byte hexadecimal string.');
  }

  return {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL!.trim(),
    privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
    contractAddress
  };
}

/**
 * Anchor an evidence SHA-256 hash onto the Polygon Amoy blockchain.
 * Ensures atomic state progression, concurrency protection, network verification, and error recovery.
 */
export async function anchorEvidenceOnBlockchain(
  evidenceId: string,
  userId: string,
  reqIp?: string
) {
  // 1. Retrieve evidence record
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

  const cleanHash = normalizeAndValidateSHA256(evidence.sha256Hash);
  const bytes32Hash = '0x' + cleanHash;

  // 2. Validate configuration before state transition
  const config = validateBlockchainConfig();

  // 3. Atomic CAS: Transition status from NOT_ANCHORED or ANCHOR_FAILED to ANCHORING
  // This prevents concurrent requests from attempting to anchor the same evidence in parallel
  const casResult = await prisma.evidence.updateMany({
    where: {
      id: evidenceId,
      status: 'VERIFIED',
      blockchainStatus: { in: ['NOT_ANCHORED', 'ANCHOR_FAILED'] }
    },
    data: {
      blockchainStatus: 'ANCHORING'
    }
  });

  if (casResult.count === 0) {
    const current = await prisma.evidence.findUnique({ where: { id: evidenceId } });
    if (!current) throw new Error('Evidence record not found');
    if (current.blockchainStatus === 'ANCHORED') {
      throw new Error('Evidence is already anchored to the blockchain');
    }
    if (current.blockchainStatus === 'ANCHORING') {
      throw new Error('Evidence anchoring is currently in progress by another request');
    }
    throw new Error(`Evidence cannot be anchored from current status: ${current.blockchainStatus}`);
  }

  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Verify chain ID to ensure we are targeting Polygon Amoy
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== POLYGON_AMOY_CHAIN_ID && process.env.NODE_ENV === 'production') {
        throw new Error(
          `Network mismatch: Connected chain ID (${network.chainId.toString()}) does not match Polygon Amoy (${POLYGON_AMOY_CHAIN_ID.toString()}).`
        );
      }
    } catch (netErr: any) {
      // If network inspection threw our explicit mismatch error, propagate it
      if (netErr.message?.includes('Network mismatch')) {
        throw netErr;
      }
      // If RPC connectivity failed during getNetwork, it will fail on next call with descriptive message
    }

    // Verify contract bytecode exists at target address
    const code = await provider.getCode(config.contractAddress);
    if (code === '0x' || code === '0x0') {
      throw new Error(`No smart contract bytecode deployed at configured address ${config.contractAddress}`);
    }

    const wallet = new ethers.Wallet(config.privateKey, provider);
    const contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, wallet);

    // 4. Check if already registered on-chain (e.g. from an earlier mined attempt before DB sync)
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
      // 5. Submit transaction to smart contract
      const tx = await contract.anchorEvidence(bytes32Hash);
      const receipt = await tx.wait(1);

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction reverted or failed on Polygon blockchain');
      }

      txHash = receipt.hash;
      blockNumber = receipt.blockNumber;

      const block = await provider.getBlock(receipt.blockNumber);
      blockTimestamp = block ? new Date(Number(block.timestamp) * 1000) : new Date();
    }

    // 6. Update DB record to ANCHORED with verified metadata
    const updatedEvidence = await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        blockchainStatus: 'ANCHORED',
        blockchainNetwork: POLYGON_AMOY_NETWORK_NAME,
        blockchainTxHash: txHash,
        blockchainBlockNumber: blockNumber,
        blockchainTimestamp: blockTimestamp,
        blockchainContractAddress: config.contractAddress,
        anchoredAt: new Date()
      }
    });

    // 7. Record immutable Audit and Chain of Custody logs
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EVIDENCE_ANCHORED_ON_BLOCKCHAIN',
        resource: `Evidence:${evidenceId}`,
        details: `Anchored to Polygon Amoy. TxHash: ${txHash}, Block: ${blockNumber}`,
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
    // Revert state to ANCHOR_FAILED on failure so it can be retried safely
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

export interface BlockchainVerificationResponse {
  status: 'ON_CHAIN_CONFIRMED' | 'NOT_ON_CHAIN' | 'DB_RECORD_FOUND_RPC_UNAVAILABLE' | 'RPC_UNAVAILABLE' | 'INVALID_HASH';
  verified: boolean;
  onChain: boolean | null;
  hash: string;
  network?: string;
  chainId?: number;
  contractAddress?: string | null;
  blockchainTimestamp?: string | null;
  submitter?: string | null;
  txHash?: string | null;
  blockNumber?: number | null;
  inDatabase?: boolean;
  dbBlockchainStatus?: string | null;
  evidenceId?: string | null;
  anchoredAt?: string | null;
  message: string;
}

/**
 * Public read-only blockchain lookup service.
 * Strictly separates confirmed on-chain records from unverified/offline database fallback.
 * Prevents sensitive case or user data leakage.
 */
export async function verifyHashOnBlockchain(hash: string): Promise<BlockchainVerificationResponse> {
  let cleanHash: string;
  try {
    cleanHash = normalizeAndValidateSHA256(hash);
  } catch {
    return {
      status: 'INVALID_HASH',
      verified: false,
      onChain: false,
      hash: typeof hash === 'string' ? hash.trim().slice(0, 66) : '',
      message: 'Invalid SHA-256 hash format. Expected a 64-character hexadecimal digest.'
    };
  }

  const bytes32Hash = '0x' + cleanHash;

  // 1. Query internal database for matching evidence record (safe read-only projection)
  const dbEvidence = await prisma.evidence.findFirst({
    where: {
      sha256Hash: cleanHash
    },
    select: {
      id: true,
      blockchainStatus: true,
      blockchainNetwork: true,
      blockchainTxHash: true,
      blockchainBlockNumber: true,
      blockchainTimestamp: true,
      blockchainContractAddress: true,
      anchoredAt: true
    }
  });

  // 2. Query smart contract if RPC and Contract Address are configured
  if (process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_CONTRACT_ADDRESS) {
    try {
      const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS.trim();
      const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL.trim());
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

      const details = await contract.getEvidenceDetails(bytes32Hash);

      if (details.exists) {
        return {
          status: 'ON_CHAIN_CONFIRMED',
          verified: true,
          onChain: true,
          hash: cleanHash,
          network: POLYGON_AMOY_NETWORK_NAME,
          chainId: Number(POLYGON_AMOY_CHAIN_ID),
          contractAddress,
          blockchainTimestamp: new Date(Number(details.timestamp) * 1000).toISOString(),
          submitter: details.submitter,
          txHash: dbEvidence?.blockchainTxHash || null,
          blockNumber: dbEvidence?.blockchainBlockNumber || null,
          inDatabase: !!dbEvidence,
          evidenceId: dbEvidence?.id || null,
          anchoredAt: dbEvidence?.anchoredAt?.toISOString() || new Date(Number(details.timestamp) * 1000).toISOString(),
          message: 'Evidence hash is independently confirmed on the Polygon Amoy blockchain.'
        };
      } else {
        return {
          status: 'NOT_ON_CHAIN',
          verified: false,
          onChain: false,
          hash: cleanHash,
          network: POLYGON_AMOY_NETWORK_NAME,
          contractAddress,
          inDatabase: !!dbEvidence,
          dbBlockchainStatus: dbEvidence?.blockchainStatus || null,
          message: 'No on-chain record found on Polygon Amoy for this SHA-256 hash.'
        };
      }
    } catch (rpcError: any) {
      console.warn('Blockchain RPC query failed during public verification:', rpcError?.message || rpcError);
      
      // Fall through to RPC unavailable handling below
    }
  }

  // 3. Handle RPC Unavailable scenarios without falsely claiming on-chain verification
  if (dbEvidence && dbEvidence.blockchainStatus === 'ANCHORED') {
    return {
      status: 'DB_RECORD_FOUND_RPC_UNAVAILABLE',
      verified: false, // Cannot claim on-chain verified when RPC is unreachable
      onChain: null,
      hash: cleanHash,
      network: dbEvidence.blockchainNetwork || POLYGON_AMOY_NETWORK_NAME,
      contractAddress: dbEvidence.blockchainContractAddress,
      txHash: dbEvidence.blockchainTxHash,
      blockNumber: dbEvidence.blockchainBlockNumber,
      inDatabase: true,
      dbBlockchainStatus: dbEvidence.blockchainStatus,
      evidenceId: dbEvidence.id,
      anchoredAt: dbEvidence.anchoredAt?.toISOString() || null,
      message: 'Hash is registered as anchored in LegalProof database records, but the Polygon blockchain RPC is currently unreachable for live independent verification.'
    };
  }

  return {
    status: 'RPC_UNAVAILABLE',
    verified: false,
    onChain: null,
    hash: cleanHash,
    inDatabase: !!dbEvidence,
    dbBlockchainStatus: dbEvidence?.blockchainStatus || null,
    message: 'Blockchain verification service is currently unreachable and no confirmed local record exists.'
  };
}
