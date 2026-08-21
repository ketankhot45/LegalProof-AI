const hre = require("hardhat");

async function main() {
  console.log("Starting deployment of LegalProofEvidenceRegistry...");

  const EvidenceRegistry = await hre.ethers.getContractFactory("LegalProofEvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`LegalProofEvidenceRegistry deployed to: ${address}`);
  console.log("Save this address in your environment as BLOCKCHAIN_CONTRACT_ADDRESS.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
