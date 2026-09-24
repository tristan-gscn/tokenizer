import { ethers } from "hardhat";

async function main() {
    const initialSupply = 42000n;

    console.log("Deploying Trgascoi42...");

    const TokenFactory = await ethers.getContractFactory("Trgascoi42");
    const token = await TokenFactory.deploy(initialSupply);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    console.log(`Token deployed successfully to: ${tokenAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
