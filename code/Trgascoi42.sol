// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Trgascoi42
 * @notice A BEP-20 fungible token deployed on the BNB Smart Chain.
 * @dev BEP-20 is a superset of ERC-20: the required function signatures and
 *      events are identical, so a compliant ERC-20 implementation is a valid
 *      BEP-20 token on BSC. This contract implements the standard from scratch
 *      rather than inheriting from a library, so that every line can be
 *      explained during the code review.
 *
 *      Solidity 0.8 reverts on arithmetic overflow and underflow, so no
 *      SafeMath-style library is needed: the `require` statements below exist
 *      to return explicit error messages, not to prevent wrapping.
 */
contract Trgascoi42 {
    /** @notice Human-readable name of the token. */
    string public name = "Trgascoi42";

    /** @notice Short ticker used by wallets and explorers. */
    string public symbol = "TRG42";

    /**
     * @notice Number of decimal places used to display balances.
     * @dev All amounts handled on-chain are expressed in the smallest unit:
     *      1 TRG42 is 10**18 units. Wallets divide by 10**decimals to display.
     */
    uint8 public decimals = 18;

    /** @notice Total number of units currently in circulation. */
    uint256 public totalSupply;

    /** @notice Account allowed to mint new tokens. Set once at deployment. */
    address public owner;

    /**
     * @notice Balance of each account, in the smallest unit.
     * @dev Declaring the mapping `public` generates the `balanceOf(address)`
     *      getter required by the standard.
     */
    mapping(address => uint256) public balanceOf;

    /**
     * @notice Amount each spender is still allowed to pull from each owner.
     * @dev Generates the `allowance(address,address)` getter. The first key is
     *      the token holder, the second the approved spender.
     */
    mapping(address => mapping(address => uint256)) public allowance;

    /**
     * @notice Emitted on every balance movement, including mints.
     * @dev A mint is signalled by `from` being the zero address. Explorers and
     *      wallets rebuild balances from this event, so it must be emitted on
     *      every state change or the token will display incorrectly.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /** @notice Emitted whenever an allowance is set. */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @notice Deploys the token and credits the whole initial supply to the
     *         deployer, who also becomes the owner.
     * @dev The initial supply is emitted as a `Transfer` from the zero address,
     *      the standard way of representing token creation, so that explorers
     *      attribute the supply to the deployer.
     * @param initialSupply Supply expressed in whole tokens; it is scaled by
     *        `10**decimals` to obtain the amount in the smallest unit.
     */
    constructor(uint256 initialSupply) {
        owner = msg.sender;
        uint256 total = initialSupply * (10 ** uint256(decimals));
        totalSupply = total;
        balanceOf[msg.sender] = total;

        emit Transfer(address(0), msg.sender, total);
    }

    /**
     * @notice Sends `amount` units from the caller to `recipient`.
     * @dev Debiting before crediting keeps a self-transfer (recipient equal to
     *      the caller) balance-neutral. Caching the balance and writing it back
     *      instead would destroy or duplicate tokens in that case.
     * @param recipient Address credited with the tokens.
     * @param amount Amount to send, in the smallest unit.
     * @return True on success, as required by the standard.
     */
    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(recipient != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    /**
     * @notice Authorises `spender` to pull up to `amount` units from the caller.
     * @dev This overwrites any previous allowance rather than adding to it.
     *      Beware of the well-known ERC-20 approval race: lowering a non-zero
     *      allowance lets the spender front-run the change and spend both the
     *      old and the new amount. Setting the allowance to zero first avoids it.
     * @param spender Address allowed to spend on the caller's behalf.
     * @param amount Maximum amount `spender` may pull, in the smallest unit.
     * @return True on success, as required by the standard.
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "Approve to zero address");

        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Moves `amount` units from `sender` to `recipient` using the
     *         allowance previously granted to the caller.
     * @dev Two ordering choices matter here. The balance is checked before the
     *      allowance, so a spender holding a sufficient allowance on an empty
     *      account gets "Insufficient balance". The allowance is then consumed
     *      before the balances move, so it can never be replayed.
     * @param sender Address the tokens are taken from.
     * @param recipient Address credited with the tokens.
     * @param amount Amount to move, in the smallest unit.
     * @return True on success, as required by the standard.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(balanceOf[sender] >= amount, "Insufficient balance");
        require(allowance[sender][msg.sender] >= amount, "Insufficient allowance");

        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }

    /**
     * @notice Creates `amount` new units and credits them to `to`.
     * @dev Restricted to the owner, and emitted as a `Transfer` from the zero
     *      address like the initial supply. See the README for the rationale
     *      behind the supply policy and the powers this grants the owner.
     * @param to Address credited with the newly created tokens.
     * @param amount Amount to create, in the smallest unit.
     * @return True on success.
     */
    function mint(address to, uint256 amount) public returns (bool) {
        require(msg.sender == owner, "Only owner can mint");
        require(to != address(0), "Mint to zero address");

        totalSupply += amount;
        balanceOf[to] += amount;

        emit Transfer(address(0), to, amount);
        return true;
    }
}
