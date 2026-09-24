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
    const MAX_SUPPLY = 1_000_000n * (10n ** DECIMALS);

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
            ).to.be.revertedWith("Caller is not the owner");
        });

        it("Should revert when minting to zero address", async () => {
            await expect(
                token.mint(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWith("Mint to zero address");
        });
    });

    describe("supply cap", () => {
        it("Should expose the hard cap and the remaining headroom", async () => {
            expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
            expect(await token.remainingSupply()).to.equal(MAX_SUPPLY - TOTAL_INITIAL_UNITS);
        });

        it("Should allow minting exactly up to the cap", async () => {
            const headroom = MAX_SUPPLY - TOTAL_INITIAL_UNITS;

            await token.mint(alice.address, headroom);

            expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
            expect(await token.remainingSupply()).to.equal(0n);
        });

        it("Should revert when a mint would exceed the cap by one unit", async () => {
            const headroom = MAX_SUPPLY - TOTAL_INITIAL_UNITS;

            await expect(
                token.mint(alice.address, headroom + 1n)
            ).to.be.revertedWith("Cap exceeded");
        });

        it("Should revert when minting once the cap is already reached", async () => {
            await token.mint(alice.address, MAX_SUPPLY - TOTAL_INITIAL_UNITS);

            await expect(token.mint(alice.address, 1n)).to.be.revertedWith("Cap exceeded");
        });

        it("Should revert when deploying above the cap", async () => {
            const TokenFactory = await ethers.getContractFactory("Trgascoi42");

            await expect(
                TokenFactory.deploy(1_000_001n)
            ).to.be.revertedWith("Initial supply exceeds cap");
        });
    });

    describe("ownership", () => {
        it("Should emit OwnershipTransferred from the zero address at deployment", async () => {
            const events = await token.queryFilter(token.filters.OwnershipTransferred());

            expect(events.length).to.equal(1);
            expect(events[0].args.previousOwner).to.equal(ethers.ZeroAddress);
            expect(events[0].args.newOwner).to.equal(owner.address);
        });

        it("Should transfer ownership and emit OwnershipTransferred", async () => {
            await expect(token.transferOwnership(alice.address))
                .to.emit(token, "OwnershipTransferred")
                .withArgs(owner.address, alice.address);

            expect(await token.owner()).to.equal(alice.address);
        });

        it("Should move the minting privilege to the new owner", async () => {
            await token.transferOwnership(alice.address);

            await token.connect(alice).mint(bob.address, 1n);
            expect(await token.balanceOf(bob.address)).to.equal(1n);

            await expect(token.mint(bob.address, 1n)).to.be.revertedWith("Caller is not the owner");
        });

        it("Should revert when transferring ownership to the zero address", async () => {
            await expect(
                token.transferOwnership(ethers.ZeroAddress)
            ).to.be.revertedWith("New owner is zero address");
        });

        it("Should revert if a non-owner tries to transfer ownership", async () => {
            await expect(
                token.connect(alice).transferOwnership(alice.address)
            ).to.be.revertedWith("Caller is not the owner");
        });

        it("Should renounce ownership and emit OwnershipTransferred to zero", async () => {
            await expect(token.renounceOwnership())
                .to.emit(token, "OwnershipTransferred")
                .withArgs(owner.address, ethers.ZeroAddress);

            expect(await token.owner()).to.equal(ethers.ZeroAddress);
        });

        it("Should permanently disable minting once ownership is renounced", async () => {
            await token.renounceOwnership();

            await expect(token.mint(owner.address, 1n)).to.be.revertedWith("Caller is not the owner");
            await expect(
                token.transferOwnership(owner.address)
            ).to.be.revertedWith("Caller is not the owner");
        });

        it("Should revert if a non-owner tries to renounce ownership", async () => {
            await expect(
                token.connect(alice).renounceOwnership()
            ).to.be.revertedWith("Caller is not the owner");
        });

        it("Should keep transfers working after ownership is renounced", async () => {
            await token.renounceOwnership();

            const amount = 10n * (10n ** DECIMALS);
            await token.transfer(alice.address, amount);

            expect(await token.balanceOf(alice.address)).to.equal(amount);
        });
    });
});
