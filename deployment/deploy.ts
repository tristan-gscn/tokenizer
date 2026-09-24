import { ethers, network } from "hardhat";

/**
 * Deploys Trgascoi42 on the network selected with --network.
 *
 *   npx hardhat run deployment/deploy.ts --network bscTestnet
 *
 * The first account derived from PRIVATE_KEY becomes the contract owner and
 * receives the whole initial supply.
 */

/** Supply minted at deployment, in whole tokens. Scaled by 10**18 on-chain. */
const INITIAL_SUPPLY = 42000n;

async function main() {
    const signers = await ethers.getSigners();

    if (signers.length === 0) {
        throw new Error(
            `No signer available for network "${network.name}". ` +
            `Set PRIVATE_KEY in your .env file (see .env.example).`
        );
    }

    const deployer = signers[0];
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("Network  :", network.name, `(chainId ${chainId})`);
    console.log("Deployer :", deployer.address);
    console.log("Balance  :", ethers.formatEther(balance), "BNB");

    if (balance === 0n) {
        throw new Error(
            `Deployer has no funds on ${network.name}. ` +
            `Fund ${deployer.address} before deploying.`
        );
    }

    console.log("\nDeploying Trgascoi42...");

    const TokenFactory = await ethers.getContractFactory("Trgascoi42");
    const token = await TokenFactory.deploy(INITIAL_SUPPLY);
    await token.waitForDeployment();

    const tokenAddress = await token.getAddress();
    const deployTx = token.deploymentTransaction();

    console.log("\nDeployed successfully");
    console.log("Address      :", tokenAddress);
    console.log("Tx hash      :", deployTx?.hash);
    console.log("Name         :", await token.name());
    console.log("Symbol       :", await token.symbol());
    console.log("Decimals     :", (await token.decimals()).toString());
    console.log("Total supply :", ethers.formatEther(await token.totalSupply()));
    console.log("Max supply   :", ethers.formatEther(await token.MAX_SUPPLY()));
    console.log("Owner        :", await token.owner());

    console.log("\nVerify the source code with:");
    console.log(`  npx hardhat verify --network ${network.name} ${tokenAddress} ${INITIAL_SUPPLY}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
