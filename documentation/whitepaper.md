# Trgascoi42 (TRG42) — Whitepaper

**Version 1.0 — BNB Smart Chain Testnet**

---

## 1. What TRG42 is

`Trgascoi42` (ticker **TRG42**) is a capped, mintable BEP-20 fungible token
deployed on the BNB Smart Chain Testnet, built for the 42 × BNB Chain
*Tokenizer* project.

TRG42 is an **educational asset**. It has no monetary value, is not an
investment, is not redeemable for anything, and lives on a test network. Its
purpose is to demonstrate a correct, minimal and defensible token design.

| | |
|---|---|
| Contract | `0x209e9B49e2E954940e226b63470A27B831D45e9b` |
| Network | BNB Smart Chain Testnet (chainId `97`) |
| Name / Ticker | `Trgascoi42` / `TRG42` |
| Decimals | `18` |
| Initial supply | `42 000 TRG42` |
| Maximum supply | `1 000 000 TRG42` |

---

## 2. Design philosophy

Most token contracts fail for one of two reasons: they reimplement the standard
and get a detail wrong, or they accumulate privileged functions that let the
owner seize or freeze user funds.

TRG42 answers both, but not in the usual way.

**On correctness**, the standard is implemented from scratch rather than
inherited from OpenZeppelin. For a token holding real value that would be the
wrong trade — audited code removes a whole class of bugs. Here the token is
defended in a code review, so the value lies in owning every detail rather than
trusting a library. The compensation is a test suite at 100% branch coverage and
a contract short enough to be read end to end.

**On privilege**, the owner has exactly one power — minting — and it is bounded
by an immutable cap that the owner cannot raise, and that the owner can give up
forever.

---

## 3. Tokenomics

### Supply

- **Hard cap: 1 000 000 TRG42.** Declared as a Solidity `constant`, so it is
  part of the deployed bytecode and cannot be modified by anyone, ever.
- **Initial mint: 42 000 TRG42** (4.2% of the cap), credited to the deployer at
  construction. The `42` is a nod to the school.
- **Remaining 958 000 TRG42** can be minted later by the owner, one transaction
  at a time, as distribution needs arise.

### Supply dynamics

Supply is **inflationary up to the cap, and never beyond**. The cap applies to
`totalSupply()` at all times, and is enforced in two places:

- in `mint`, rejecting any issuance that would cross the ceiling;
- in the **constructor**, so a deployment cannot start out already above it.

The second check matters more than it looks: without it the invariant that
`mint` relies on would be false from block one, and the cap would be a comment
rather than a guarantee.

There is no burn function. Supply can only go up, up to the ceiling.

### End state

Once distribution is complete, the owner is expected to call
`renounceOwnership()`. From that moment the supply is permanently frozen: no
address can ever mint another TRG42. This is the intended lifecycle, not an
emergency exit.

---

## 4. Governance and trust

There is a single privileged role, the **owner**, set to the deployer at
construction.

**What the owner can do**

- Mint new tokens to any address, bounded by `MAX_SUPPLY`.
- Transfer ownership to another address.
- Renounce ownership, permanently disabling minting.

**What the owner cannot do**

- Move, freeze or seize tokens held by another address.
- Pause or censor transfers.
- Raise the supply cap.
- Upgrade or replace the contract logic.

The only trust a holder must extend is **bounded dilution**: the owner may mint
the remaining headroom. Three properties make that trust auditable rather than a
promise:

1. The cap is a `constant`, inlined into the bytecode and publicly readable.
2. `remainingSupply()` returns the exact dilution risk on-chain at any time, so
   nobody has to take this document's word for it.
3. `renounceOwnership()` removes the risk entirely, irreversibly.

Ownership transfer deliberately rejects the zero address. Giving up ownership
must go through `renounceOwnership()`, so it cannot happen by mistyping an
address.

---

## 5. Use cases

Within the scope of this educational project, TRG42 demonstrates:

- issuing a fungible asset on a public blockchain;
- transferring value between accounts, and delegating spending via allowances;
- controlled issuance under a verifiable hard cap;
- the full lifecycle of on-chain privileges, up to their renunciation.

---

## 6. Risks and limitations

- **Testnet only.** BSC Testnet offers no value guarantees and may be reset.
- **No economic backing.** TRG42 is not redeemable for anything.
- **No audited base.** The standard is hand-written. This is a deliberate trade
  for a code-review project, not a recommendation for production.
- **Key management.** Losing the owner key makes minting permanently
  unavailable; theft of it lets an attacker mint the remaining headroom.
  Renouncing ownership removes both risks.
- **Standard-level caveats.** TRG42 inherits the known ERC-20 rough edges:
  tokens sent to a contract that does not handle them are stuck, and the
  `approve` race condition exists — lowering a non-zero allowance lets the
  spender front-run the change and spend both amounts. Setting the allowance to
  zero first avoids it.

---

## 7. Conclusion

TRG42 is a deliberately small token: a hand-written ERC-20 core, an immutable
supply cap enforced in two places, and a single privileged action that can be
switched off forever. Every design decision favours auditability over features.

Function-level details, deployment procedure and usage instructions are in
[`technical-documentation.md`](./technical-documentation.md).
