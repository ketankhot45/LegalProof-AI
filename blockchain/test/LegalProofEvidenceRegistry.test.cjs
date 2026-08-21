const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LegalProofEvidenceRegistry", function () {
  let registry;
  let owner;
  let addr1;
  let addr2;

  // Generate a mock SHA-256 hash (32 bytes)
  const mockHash1 = ethers.keccak256(ethers.toUtf8Bytes("evidence1"));
  const mockHash2 = ethers.keccak256(ethers.toUtf8Bytes("evidence2"));
  const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const EvidenceRegistry = await ethers.getContractFactory("LegalProofEvidenceRegistry");
    registry = await EvidenceRegistry.deploy();
    await registry.waitForDeployment();
  });

  it("Should successfully register a new evidence hash and emit an event", async function () {
    const tx = await registry.connect(addr1).anchorEvidence(mockHash1);
    const receipt = await tx.wait();

    // Verify event
    await expect(tx)
      .to.emit(registry, "EvidenceAnchored")
      .withArgs(mockHash1, (await ethers.provider.getBlock(receipt.blockNumber)).timestamp, addr1.address);
  });

  it("Should store the correct timestamp and submitter address", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);

    const details = await registry.getEvidenceDetails(mockHash1);
    expect(details.exists).to.be.true;
    expect(details.submitter).to.equal(addr1.address);
    expect(details.timestamp).to.be.greaterThan(0);
  });

  it("Should reject registering the exact same hash twice", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);

    await expect(
      registry.connect(addr2).anchorEvidence(mockHash1)
    ).to.be.revertedWith("Evidence already registered");
  });

  it("Should lookup an existing hash and return true", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);

    const isReg = await registry.isRegistered(mockHash1);
    expect(isReg).to.be.true;
  });

  it("Should lookup a non-existent hash and return false", async function () {
    const isReg = await registry.isRegistered(mockHash2);
    expect(isReg).to.be.false;

    const details = await registry.getEvidenceDetails(mockHash2);
    expect(details.exists).to.be.false;
    expect(details.timestamp).to.equal(0);
    expect(details.submitter).to.equal(ethers.ZeroAddress);
  });

  it("Should reject an empty (zero) hash", async function () {
    await expect(
      registry.connect(addr1).anchorEvidence(zeroHash)
    ).to.be.revertedWith("Invalid hash");
  });
});
