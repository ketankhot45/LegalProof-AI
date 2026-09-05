const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LegalProofEvidenceRegistry", function () {
  let registry;
  let owner;
  let addr1;
  let addr2;

  // Generate 32-byte hashes
  const mockHash1 = ethers.keccak256(ethers.toUtf8Bytes("evidence1"));
  const mockHash2 = ethers.keccak256(ethers.toUtf8Bytes("evidence2"));
  const mockHash3 = ethers.keccak256(ethers.toUtf8Bytes("evidence3"));
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

  it("Should reject registering the exact same hash twice from same caller", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);

    await expect(
      registry.connect(addr1).anchorEvidence(mockHash1)
    ).to.be.revertedWith("Evidence already registered");
  });

  it("Should reject registering the exact same hash twice from different caller", async function () {
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

  it("Should allow registering multiple independent hashes from different submitters", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);
    await registry.connect(addr2).anchorEvidence(mockHash2);
    await registry.connect(owner).anchorEvidence(mockHash3);

    const details1 = await registry.getEvidenceDetails(mockHash1);
    const details2 = await registry.getEvidenceDetails(mockHash2);
    const details3 = await registry.getEvidenceDetails(mockHash3);

    expect(details1.exists).to.be.true;
    expect(details1.submitter).to.equal(addr1.address);

    expect(details2.exists).to.be.true;
    expect(details2.submitter).to.equal(addr2.address);

    expect(details3.exists).to.be.true;
    expect(details3.submitter).to.equal(owner.address);
  });

  it("Should preserve immutable details of registered hashes even when new hashes are registered", async function () {
    await registry.connect(addr1).anchorEvidence(mockHash1);
    const details1Before = await registry.getEvidenceDetails(mockHash1);

    await registry.connect(addr2).anchorEvidence(mockHash2);

    const details1After = await registry.getEvidenceDetails(mockHash1);
    expect(details1After.exists).to.equal(details1Before.exists);
    expect(details1After.timestamp).to.equal(details1Before.timestamp);
    expect(details1After.submitter).to.equal(details1Before.submitter);
  });
});
