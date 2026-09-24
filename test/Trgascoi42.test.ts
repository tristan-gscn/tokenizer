import { expect } from "chai";
import { ethers } from "hardhat";
import { Trgascoi42 } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Trgascoi42 Token", () => {
    let token: Trgascoi42;
    let owner: HardhatEthersSigner;
    let alice: HardhatEthersSigner;
    let bob: HardhatEthersSigner;

    const INITIAL_SUPPLY = 42000n;
    const DECIMALS = 18n;
    const TOTAL_INITIAL_UNITS = INITIAL_SUPPLY * (10n ** DECIMALS);

    beforeEach(async function () {
        [owner, alice, bob] = await ethers.getSigners();

        const TokenFactory = await ethers.getContractFactory("Trgascoi42");
        token = (await TokenFactory.deploy(INITIAL_SUPPLY)) as Trgascoi42;
        await token.waitForDeployment();
    });

    describe("Deployment & Metadata", () => {
        it("Should have the correct token name", async () => {
            expect(await token.name()).to.equal("Trgascoi42");
        });

        it("Should have the correct token symbol", async () => {
            expect(await token.symbol()).to.equal("TRG42");
        });

        it("Should have 18 decimals", async () => {
            expect(await token.decimals()).to.equal(18);
        });

        it("Should set the deployer as the owner", async () => {
            expect(await token.owner()).to.equal(owner.address);
        });

        it("Should assign the entire initial supply to the owner", async () => {
            expect(await token.totalSupply()).to.equal(TOTAL_INITIAL_UNITS);
            expect(await token.balanceOf(owner.address)).to.equal(TOTAL_INITIAL_UNITS);
        });
    });

    describe("transfer", () => {
        it("Should transfer tokens between accounts and emit Transfer event", async () => {
            const amount = 100n * (10n ** DECIMALS);

            await expect(token.transfer(alice.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, alice.address, amount);

            expect(await token.balanceOf(alice.address)).to.equal(amount);
            expect(await token.balanceOf(owner.address)).to.equal(TOTAL_INITIAL_UNITS - amount);
        });

        it("Should revert when sender has insufficient balance", async () => {
            const excessiveAmount = 10n * (10n ** DECIMALS);

            await expect(
                token.connect(alice).transfer(bob.address, excessiveAmount)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should revert when transferring to zero address", async () => {
            const amount = 10n * (10n ** DECIMALS);

            await expect(
                token.transfer(ethers.ZeroAddress, amount)
            ).to.be.revertedWith("Transfer to zero address");
        });
    });

    describe("approve & allowance", () => {
        it("Should approve spender and emit Approval event", async () => {
            const amount = 500n * (10n ** DECIMALS);

            await expect(token.approve(alice.address, amount))
                .to.emit(token, "Approval")
                .withArgs(owner.address, alice.address, amount);

            expect(await token.allowance(owner.address, alice.address)).to.equal(amount);
        });

        it("Should revert when approving zero address", async () => {
            const amount = 500n * (10n ** DECIMALS);

            await expect(
                token.approve(ethers.ZeroAddress, amount)
            ).to.be.revertedWith("Approve to zero address");
        });
    });

    describe("transferFrom", () => {
        const approveAmount = 500n * (10n ** DECIMALS);
        const transferAmount = 200n * (10n ** DECIMALS);

        beforeEach(async () => {
            await token.approve(alice.address, approveAmount);
        });

        it("Should execute transferFrom within allowance and update balances and allowance", async () => {
            await expect(
                token.connect(alice).transferFrom(owner.address, bob.address, transferAmount)
            )
                .to.emit(token, "Transfer")
                .withArgs(owner.address, bob.address, transferAmount);

            expect(await token.balanceOf(owner.address)).to.equal(TOTAL_INITIAL_UNITS - transferAmount);
            expect(await token.balanceOf(bob.address)).to.equal(transferAmount);

            expect(await token.allowance(owner.address, alice.address)).to.equal(approveAmount - transferAmount);
        });

        it("Should revert if spender exceeds allowance", async () => {
            const excessiveAmount = approveAmount + 1n;

            await expect(
                token.connect(alice).transferFrom(owner.address, bob.address, excessiveAmount)
            ).to.be.revertedWith("Insufficient allowance");
        });

        it("Should revert if sender balance is insufficient even if allowance is enough", async () => {
            await token.connect(bob).approve(alice.address, approveAmount);

            await expect(
                token.connect(alice).transferFrom(bob.address, owner.address, transferAmount)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should revert when sender is zero address", async () => {
            await expect(
                token.connect(alice).transferFrom(ethers.ZeroAddress, bob.address, transferAmount)
            ).to.be.revertedWith("Transfer from zero address");
        });

        it("Should revert when recipient is zero address", async () => {
            await expect(
                token.connect(alice).transferFrom(owner.address, ethers.ZeroAddress, transferAmount)
            ).to.be.revertedWith("Transfer to zero address");
        });
    });

    describe("mint", () => {
        const mintAmount = 1000n * (10n ** DECIMALS);

        it("Should allow the owner to mint new tokens and emit Transfer from zero address", async () => {
            await expect(token.mint(alice.address, mintAmount))
                .to.emit(token, "Transfer")
                .withArgs(ethers.ZeroAddress, alice.address, mintAmount);

            expect(await token.balanceOf(alice.address)).to.equal(mintAmount);
            expect(await token.totalSupply()).to.equal(TOTAL_INITIAL_UNITS + mintAmount);
        });

        it("Should revert if a non-owner tries to mint", async () => {
            await expect(
                token.connect(alice).mint(alice.address, mintAmount)
            ).to.be.revertedWith("Only owner can mint");
        });

        it("Should revert when minting to zero address", async () => {
            await expect(
                token.mint(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWith("Mint to zero address");
        });
    });
});
