# Technical documentation — `Trgascoi42`

How the token works, and what is needed to use it.

| | |
|---|---|
| Contract | [`0x209e9B49e2E954940e226b63470A27B831D45e9b`](https://testnet.bscscan.com/address/0x209e9B49e2E954940e226b63470A27B831D45e9b) |
| Network | BNB Smart Chain Testnet (chainId `97`) |
| Verified source | [BscScan → Contract](https://testnet.bscscan.com/address/0x209e9B49e2E954940e226b63470A27B831D45e9b#code) |
| Source file | [`code/Trgascoi42.sol`](../code/Trgascoi42.sol) |

---

## 1. Using the token

### Seeing your balance in MetaMask

A blockchain holds no list of "tokens owned by an address". A TRG42 balance
lives inside the contract's `balanceOf` mapping, among thousands of other
contracts — so a wallet cannot discover it on its own and must be told which
contract to query. That is all "importing a token" does.

1. **Enable test networks** — MetaMask hides them by default:
   Settings → Advanced → *Show test networks*.
2. **Add BSC Testnet** if it is not already listed:

   | Field | Value |
   |---|---|
   | Network name | BNB Smart Chain Testnet |
   | RPC URL | `https://data-seed-prebsc-1-s1.bnbchain.org:8545` |
   | Chain ID | `97` |
   | Symbol | `tBNB` |
   | Explorer | `https://testnet.bscscan.com` |

3. **Import the token** — *Tokens* → *Import tokens* → paste
   `0x209e9B49e2E954940e226b63470A27B831D45e9b`. The ticker and decimals are
   read from the contract automatically.

If the balance shows `0`, you are on the wrong account: the initial supply sits
on the deployer, `0x3eac3d72Bbc6a1599A1eDC98f11cCb293F90e96f`.

You can also check holders without any wallet, on
[the token page](https://testnet.bscscan.com/token/0x209e9B49e2E954940e226b63470A27B831D45e9b).

### Calling functions from the browser

Because the source is verified, BscScan exposes the contract directly:

- **Read Contract** — call any `view` function with no wallet and no gas.
- **Write Contract** — connect a wallet and send transactions (`transfer`,
  `approve`, `mint`…).

This is enough to demonstrate the token end to end without writing any code.

### Amounts and decimals

The token has 18 decimals, so **every on-chain amount is in the smallest unit**.
`1 TRG42` is `1000000000000000000`.

Passing `1` where `10**18` was meant transfers one billionth of a billionth of a
token. It succeeds silently — this is the most common mistake when calling the
contract from the BscScan interface. In scripts:

```ts
ethers.parseEther("1")        // 1 TRG42  -> 1000000000000000000n
ethers.formatEther(balance)   // 1000000000000000000n -> "1.0"
```

---

## 2. Public interface

### Standard BEP-20

| Function | Mutability | Description |
|---|---|---|
| `name()` | view | `"Trgascoi42"` |
| `symbol()` | view | `"TRG42"` |
| `decimals()` | view | `18` |
| `totalSupply()` | view | Units currently in circulation. |
| `balanceOf(address)` | view | Balance of an account. |
| `allowance(address owner, address spender)` | view | Remaining amount `spender` may pull. |
| `transfer(address recipient, uint256 amount)` | write | Sends from the caller. Returns `bool`. |
| `approve(address spender, uint256 amount)` | write | Sets an allowance. Returns `bool`. |
| `transferFrom(address sender, address recipient, uint256 amount)` | write | Pulls using the caller's allowance. Returns `bool`. |

Events: `Transfer(address indexed from, address indexed to, uint256 value)` and
`Approval(address indexed owner, address indexed spender, uint256 value)`.

### Supply and ownership

| Function | Access | Description |
|---|---|---|
| `MAX_SUPPLY()` | view | The immutable hard cap, `1 000 000 * 10**18`. |
| `remainingSupply()` | view | `MAX_SUPPLY - totalSupply`. |
| `owner()` | view | Current privileged account, or the zero address once renounced. |
| `mint(address to, uint256 amount)` | owner | Creates tokens, capped. Returns `bool`. |
| `transferOwnership(address newOwner)` | owner | Hands privileges over. |
| `renounceOwnership()` | owner | Gives them up permanently. |

Event: `OwnershipTransferred(address indexed previousOwner, address indexed newOwner)`,
emitted at deployment (`previousOwner` = zero) and on renunciation
(`newOwner` = zero), so the full ownership history is auditable from the logs.

### Revert messages

| Message | Raised when |
|---|---|
| `Transfer to zero address` | `transfer` or `transferFrom` targets `address(0)`. |
| `Transfer from zero address` | `transferFrom` is given `address(0)` as sender. |
| `Insufficient balance` | The sender does not hold enough. |
| `Approve to zero address` | `approve` targets `address(0)`. |
| `Insufficient allowance` | `transferFrom` exceeds the allowance. |
| `Mint to zero address` | `mint` targets `address(0)`. |
| `Cap exceeded` | A mint would push `totalSupply` past `MAX_SUPPLY`. |
| `Initial supply exceeds cap` | Deployment requested more than the cap. |
| `Caller is not the owner` | A non-owner called an owner-only function. |
| `New owner is zero address` | `transferOwnership(address(0))` — use `renounceOwnership`. |

---

## 3. How it works

### Storage

Balances live in `mapping(address => uint256) public balanceOf`, allowances in
`mapping(address => mapping(address => uint256)) public allowance`. Declaring
both `public` generates the `balanceOf(address)` and
`allowance(address,address)` getters required by the standard — no hand-written
accessor needed.

### Three ordering decisions

These are the details that make a hand-written ERC-20 correct, and they are
deliberate:

1. **`transfer` debits before crediting.** A self-transfer (`recipient` equal to
   the caller) is therefore balance-neutral. An implementation that caches the
   balance and writes it back would destroy or duplicate tokens in that case.
2. **`transferFrom` checks the balance before the allowance.** A spender holding
   a sufficient allowance on an empty account gets `Insufficient balance`, which
   names the real problem.
3. **`transferFrom` consumes the allowance before moving balances**, so it can
   never be replayed.

### Minting convention

Token creation is emitted as `Transfer(address(0), to, amount)` — in the
constructor for the initial supply, and in `mint` afterwards. This is how
explorers and wallets attribute supply; a mint that does not emit it leaves the
token displaying incorrect balances.

### Arithmetic

Solidity `0.8.x` reverts on overflow and underflow, so no SafeMath is needed.
The `require` statements exist to return explicit error messages, not to prevent
wrapping.

---

## 4. Building and deploying

Requires Node.js ≥ 20. See the [README](../README.md) for the environment
variables.

```bash
npm install
npm run compile
npm test                    # 32 tests
npm run coverage            # 100% statements, branches, functions, lines
npm run deploy:testnet
```

The deployment script prints the network, chain id, deployer address and balance
**before** deploying, and refuses to run if the key is missing or the account is
unfunded. It then prints the deployed address and the exact verification
command:

```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> 42000
```

The trailing `42000` is the constructor argument, in whole tokens. It must match
the deployed value exactly, or the recompiled bytecode will not match the
on-chain one and verification is rejected.

### Configuration notes

- **`paths.sources` is remapped to `./code`** to match the layout the subject
  imposes; Hardhat's default `contracts/` is unused.
- **`evmVersion: "paris"`** keeps the `PUSH0` opcode out of the bytecode, since
  BSC trails Ethereum on hard forks.
- **The BscScan API key must be a plain string** in `etherscan.apiKey`. The
  object form keyed by network selects the per-explorer v1 API, shut down in
  2025; a string selects the unified Etherscan v2 API.

---

## 5. Tests

`test/Trgascoi42.test.ts` — 32 tests, `npm test`. Coverage is 100% on
statements, branches, functions and lines.

| Group | Covers |
|---|---|
| Deployment & metadata | Name, symbol, decimals, owner, initial supply. |
| `transfer` | Balances move, event emitted, insufficient balance and zero address revert. |
| `approve` / `allowance` | Allowance recorded, event emitted, zero address rejected. |
| `transferFrom` | Allowance consumed, ordering of the checks, both zero-address branches. |
| `mint` | Owner-only, event from the zero address, zero address rejected. |
| Supply cap | Cap and headroom exposed, minting *exactly* to the cap, one unit past it, deploying above it. |
| Ownership | Transfer moves the privilege, renunciation is irreversible, transfers keep working after it. |

Reverts are asserted with `revertedWith` and the exact message, so a test fails
if the contract reverts for the *wrong* reason — not merely if it reverts.

> Coverage at 100% does not mean the contract is proven correct. Two cases worth
> knowing are exercised by the same lines as ordinary transfers, so coverage
> cannot flag them: the self-transfer path, and the `bool` return values, which
> require `staticCall` to assert from ethers.
