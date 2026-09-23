# Tokenizer

> 42 × BNB Chain — Build your own token.

<!-- TODO: fill in once the token is deployed. -->

| | |
|---|---|
| **Token name** | _TODO (must contain "42")_ |
| **Ticker** | _TODO_ |
| **Decimals** | _TODO_ |
| **Standard** | BEP-20 |
| **Network** | BNB Smart Chain Testnet (chainId `97`) |
| **Contract address** | _TODO_ |
| **Explorer** | _TODO — https://testnet.bscscan.com/address/..._ |

---

## Repository layout

```
.
├── code/              # Smart contracts
├── deployment/        # Deployment scripts and network tooling
├── documentation/     # Whitepaper and technical documentation
├── test/              # Unit tests (TypeScript)
├── hardhat.config.ts
├── tsconfig.json
├── .env.example
└── README.md
```

---

## Technical choices

<!--
The subject requires this section: explain the choices you made and why.
Suggested points to cover:
  - Why BNB Smart Chain / testnet?
  - Why BEP-20, and how it relates to ERC-20?
  - Why Hardhat + TypeScript over Truffle / Remix?
  - Which base implementation (e.g. OpenZeppelin) and why?
  - Ownership and privilege model: who can do what, and what they cannot do.
  - Supply model: fixed, capped, mintable, burnable?
-->

_TODO_

---

## Setup

### Requirements

- Node.js ≥ 20
- npm

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Private key of the deployer account. Use a throwaway development wallet. |
| `BSC_TESTNET_RPC` | BSC Testnet JSON-RPC endpoint (a public default is provided). |
| `BSCSCAN_API_KEY` | API key used to verify the source on BscScan. |

Get test BNB from the [BNB Chain faucet](https://www.bnbchain.org/en/testnet-faucet).

---

## Commands

| Command | Description |
|---|---|
| `npm run compile` | Compile the contracts in `code/`. |
| `npm test` | Run the test suite in `test/`. |
| `npm run test:gas` | Same, with a gas report. |
| `npm run coverage` | Solidity coverage report. |
| `npm run node` | Local JSON-RPC node on `http://127.0.0.1:8545`. |
| `npm run deploy:local` | Run `deployment/deploy.ts` on the in-process network. |
| `npm run deploy:testnet` | Run `deployment/deploy.ts` on BSC Testnet. |
| `npm run clean` | Remove `cache/` and `artifacts/`. |

> The `deploy:*` scripts expect a `deployment/deploy.ts` file — rename the
> scripts in `package.json` if you choose a different entry point.

### Verify on BscScan

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> [constructor args...]
```

---

## Notes

- `en.subject.pdf` is git-ignored, as required.
- All code and comments are written in English.
