# Tokenizer — `Trgascoi42` (TRG42)

> 42 × BNB Chain — Build your own token.

A BEP-20 fungible token, written from scratch in Solidity and deployed on the
BNB Smart Chain Testnet.

| | |
|---|---|
| **Token name** | `Trgascoi42` |
| **Ticker** | `TRG42` |
| **Decimals** | `18` |
| **Standard** | BEP-20 (ERC-20 compatible) |
| **Network** | BNB Smart Chain **Testnet** (chainId `97`) |
| **Contract address** | [`0x209e9B49e2E954940e226b63470A27B831D45e9b`](https://testnet.bscscan.com/address/0x209e9B49e2E954940e226b63470A27B831D45e9b) |
| **Owner** | `0x3eac3d72Bbc6a1599A1eDC98f11cCb293F90e96f` |
| **Initial supply** | `42 000 TRG42` |
| **Max supply (hard cap)** | `1 000 000 TRG42` |
| **Verified source** | [testnet.bscscan.com → Contract](https://testnet.bscscan.com/address/0x209e9B49e2E954940e226b63470A27B831D45e9b#code) |

The source is verified on BscScan, so the **Read Contract** and **Write
Contract** tabs are live: every function can be called from a browser with a
connected wallet, without writing any code.

Usage instructions are in [`documentation/`](documentation/).

---

## Repository layout

```
.
├── code/              # The Solidity smart contract
├── deployment/        # Deployment script
├── documentation/     # Whitepaper and technical documentation
├── test/              # Unit tests (TypeScript, Mocha + Chai)
├── hardhat.config.ts  # Compiler, paths, network and verification config
├── .env.example
└── README.md
```

---

## Technical choices

### Why BNB Smart Chain, and why the testnet

The project is a partnership between 42 and BNB Chain, so BSC is the natural
target. Everything runs on the **testnet** (chainId `97`): the subject forbids
spending real money, and test BNB is free from a faucet.

BSC is EVM-compatible, so the whole Ethereum toolchain — Solidity, Hardhat,
ethers, BscScan — works unchanged.

### Why BEP-20

BEP-20 is a **superset of ERC-20**. The required function signatures
(`totalSupply`, `balanceOf`, `transfer`, `approve`, `transferFrom`, `allowance`)
and the `Transfer` / `Approval` events are identical, so a compliant ERC-20
implementation is a valid BEP-20 token on BSC.

### Why the standard is implemented from scratch

This is the main decision of the project, and it is deliberate.

The obvious alternative was to inherit from OpenZeppelin Contracts, the audited
reference implementation. For a token holding real value that would be the right
call: reusing audited code removes a whole class of bugs.

Here the goal is different. This is a school project defended in a **code
review**, so the value is in understanding every line rather than trusting a
library. Writing the standard by hand means owning its details:

- the `bool` return value on `transfer` / `approve` / `transferFrom`, which many
  hand-written tokens omit and which breaks composability with other contracts;
- the `Transfer` event emitted from the zero address on mint, which is how
  explorers and wallets attribute supply;
- the ordering inside `transferFrom` — balance checked before allowance, and
  allowance consumed before balances move;
- the self-transfer case, which corrupts balances in naive implementations that
  cache a balance instead of debiting before crediting.

The trade-off is explicit: **no audited base, therefore more responsibility**,
compensated by a test suite at 100% coverage and a contract short enough to be
read end to end. The project has no runtime dependencies — only dev tooling.

### Supply model and privileges

| Property | Value |
|---|---|
| Initial supply | `42 000 TRG42`, minted to the deployer |
| Hard cap | `1 000 000 TRG42`, a Solidity `constant` |
| Mintable | Yes, owner only, never beyond the cap |
| Burnable / Pausable / Upgradeable | No |

**The owner can** mint up to `MAX_SUPPLY`, transfer ownership, or renounce it.

**The owner cannot** move, freeze or seize anyone else's tokens, pause or censor
transfers, raise the cap, or upgrade the contract logic.

Three points make this auditable rather than a promise:

1. **The cap is enforced in the constructor too**, not only in `mint`, so a
   deployment cannot start out already above the ceiling.
2. **`remainingSupply()` is public** — anyone can read the exact dilution risk
   on-chain, without trusting this document.
3. **`renounceOwnership()` is a one-way exit.** It sets the owner to the zero
   address, which no caller can ever match, freezing the supply forever.

The only trust a holder must extend is *bounded dilution*: the owner may mint up
to the cap. That risk is public, quantified, and removable.

### Why Hardhat and TypeScript

Hardhat is one of the frameworks suggested by the subject: local EVM, Solidity
stack traces on failed transactions, and a `verify` task for BscScan.
TypeScript because TypeChain generates typed bindings from the compiled ABI, so
a typo in a method name becomes a compile error instead of a runtime revert.

### Compiler settings

- **Solidity `0.8.28`** — from `0.8.x` onwards, arithmetic overflow and
  underflow revert by default, so no SafeMath is needed. The `require`
  statements exist to return explicit error messages, not to prevent wrapping.
- **`evmVersion: "paris"`** — `0.8.28` would otherwise target a newer fork and
  emit the `PUSH0` opcode. BSC trails Ethereum on hard forks, so pinning Paris
  guarantees the bytecode is accepted on-chain.
- **Optimizer enabled, 200 runs** — must be decided *before* deploying: BscScan
  recompiles the source and compares it to the on-chain bytecode, so changing
  this afterwards would break verification.

---

## Build, test, deploy

Requires Node.js ≥ 20.

```bash
npm install
cp .env.example .env     # then fill in the values
```

| Variable | Needed for | Description |
|---|---|---|
| `PRIVATE_KEY` | deployment | Private key of the deployer, 64 hex characters. **Use a throwaway wallet.** |
| `BSC_TESTNET_RPC` | deployment | JSON-RPC endpoint. A public default is used when empty. |
| `BSCSCAN_API_KEY` | verification | Etherscan API key (the unified v2 API covers BscScan). |

`.env` is git-ignored. Compiling and testing work without it — only deployment
and verification need real values. Fund the deployer with test BNB from a
[BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet); deployment costs
well under `0.001` tBNB.

| Command | Description |
|---|---|
| `npm run compile` | Compile the contract and regenerate TypeChain bindings. |
| `npm test` | Run the 32 unit tests. |
| `npm run coverage` | Solidity coverage report. |
| `npm run deploy:testnet` | Deploy to BSC Testnet. |
| `npm run clean` | Remove build, coverage and cache output. |

The deployment script prints the network, chain id, deployer and balance
**before** deploying, and refuses to run with a clear message if the key is
missing or the account is unfunded. It then prints the deployed address and the
exact command to verify the source:

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> 42000
```

The trailing `42000` is the constructor argument. It must match the value used
at deployment exactly, or the recompiled bytecode will not match what is
on-chain and verification will be rejected.
