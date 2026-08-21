// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LegalProofEvidenceRegistry
 * @dev A cryptographic registry for storing SHA-256 hashes of digital evidence.
 * It ensures immutability, non-repudiation, and timestamping of digital files 
 * without exposing personal data or the file contents on-chain.
 */
contract LegalProofEvidenceRegistry {
    
    struct Evidence {
        bytes32 evidenceHash; // The SHA-256 hash of the evidence
        uint256 timestamp;    // The block timestamp when registered
        address submitter;    // The address that submitted the hash
    }

    // Mapping from evidence hash to its registration details
    mapping(bytes32 => Evidence) private registry;

    // Emitted when a new evidence hash is anchored on the blockchain
    event EvidenceAnchored(
        bytes32 indexed evidenceHash,
        uint256 timestamp,
        address indexed submitter
    );

    /**
     * @dev Registers a new evidence hash on the blockchain.
     * @param _evidenceHash The SHA-256 hash (as bytes32) of the evidence file.
     */
    function anchorEvidence(bytes32 _evidenceHash) external {
        require(_evidenceHash != bytes32(0), "Invalid hash");
        require(registry[_evidenceHash].timestamp == 0, "Evidence already registered");

        registry[_evidenceHash] = Evidence({
            evidenceHash: _evidenceHash,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit EvidenceAnchored(_evidenceHash, block.timestamp, msg.sender);
    }

    /**
     * @dev Checks whether a specific hash has been registered.
     * @param _evidenceHash The SHA-256 hash to check.
     * @return True if the hash is registered, false otherwise.
     */
    function isRegistered(bytes32 _evidenceHash) external view returns (bool) {
        return registry[_evidenceHash].timestamp != 0;
    }

    /**
     * @dev Retrieves the registration details of a specific hash.
     * @param _evidenceHash The SHA-256 hash to query.
     * @return exists True if registered.
     * @return timestamp The block timestamp of registration.
     * @return submitter The wallet address of the submitter.
     */
    function getEvidenceDetails(bytes32 _evidenceHash) 
        external 
        view 
        returns (
            bool exists, 
            uint256 timestamp, 
            address submitter
        ) 
    {
        Evidence memory evidence = registry[_evidenceHash];
        exists = evidence.timestamp != 0;
        timestamp = evidence.timestamp;
        submitter = evidence.submitter;
    }
}
