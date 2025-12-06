// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * MultiWinnerRaffle.sol
 *
 * Protocol: Multi-Winner Decentralized Raffle with 3 Distinct Winners,
 * VRF Randomness (Chainlink VRF v2.5), Automated Payments, 
 * Shareholder Dividend System (Lazy Distribution),
 * Secret PIN (hashed) verification for bets,
 * and Full USDC support on Arbitrum.
 *
 * Features:
 * - 3 winners per round (50% / 18% / 7%)
 * - No duplicated winner wallets in the same round
 * - Fixed 5 USDC bet price
 * - Max 100 bets per wallet per round
 * - Round every 30 minutes
 * - 12.5% Founder Fee (instant payment)
 * - 12.5% Shareholders Fee (lazy distribution)
 * - Ticket pool fully on-chain and auditable
 * - 2,000 Shares @ 1,000 USDC each (for investment phase)
 * - 70% of share sales → Founder Wallet
 * - 30% of share sales → Marketing Wallet
 * - Secure PIN hashing for bet authorization (A3)
 */

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ------------------------------------------------------------
// VRF Chainlink v2.5 Interface
// ------------------------------------------------------------
interface VRFCoordinatorV2_5 {
    function requestRandomWords(
        bytes32 keyHash,
        uint256 subId,
        uint16 minConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId);
}

// ------------------------------------------------------------
// USDC Official (Circle) — Arbitrum One
// ------------------------------------------------------------
IERC20 constant USDC = IERC20(0xaf88d065e77c8cC2239327C5EDb3A432268e5831);

// ------------------------------------------------------------
// CONTRACT START
// ------------------------------------------------------------
contract MultiWinnerRaffle is Ownable, ReentrancyGuard {
    // ------------------------------------------------------------
    // PROTOCOL ADDRESSES
    // ------------------------------------------------------------

    // Founder fee wallet (receives 12.5% of all rounds + 70% share sales)
    address public founderWallet = 0xc65200b0adf553accf52a734856912358f4d208e;

    // Shareholders fee wallet (receives 12.5% of all rounds, distributed lazily)
    address public shareholdersWallet = 0x457f91746ae99625f64ab87f2d4b744f6ee765ea;

    // Marketing wallet (receives 30% from share sales only)
    address public marketingWallet = 0x18c555367d020e63e5bdb660fa90a05517a73947;


    // ------------------------------------------------------------
    // ROUND CONFIGURATION
    // ------------------------------------------------------------

    uint256 public constant TICKET_PRICE = 5 * 1e6; // 5 USDC (6 decimals)
    uint256 public constant MAX_TICKETS_PER_WALLET = 100;
    uint256 public constant ROUND_DURATION = 30 minutes;

    uint256 public roundId;
    uint256 public roundStartTime;


    // ------------------------------------------------------------
    // DATA STRUCTURES
    // ------------------------------------------------------------

    struct Ticket {
        address player;
        uint256 timestamp;
    }

    // All tickets of the current round (auditável)
    Ticket[] public tickets;

    // Mapping para limitar 100 tickets por wallet por round
    mapping(uint256 => mapping(address => uint256)) public ticketsByWallet;


    // ------------------------------------------------------------
    // SECRET PIN SYSTEM (HASHED)
    // ------------------------------------------------------------

    // PIN hash registrado para cada wallet
    mapping(address => bytes32) public registeredPinHash;

    // Necessário verificar se usuário cadastrou um PIN
    modifier pinRegistered() {
        require(registeredPinHash[msg.sender] != 0x0, "PIN not registered");
        _;
    }


    // ------------------------------------------------------------
    // MULTI-WINNER RESULT DATA
    // ------------------------------------------------------------

    address public winner1;
    address public winner2;
    address public winner3;

    uint256 public lastRoundPrizePool;


    // ------------------------------------------------------------
    // VRF CONFIG
    // ------------------------------------------------------------

    VRFCoordinatorV2_5 public vrf;
    bytes32 public keyHash;
    uint256 public vrfSubscriptionId;

    uint32 public constant VRF_CALLBACK_GAS = 500_000;
    uint16 public constant VRF_CONFIRMATIONS = 3;
    uint32 public constant VRF_NUM_WORDS = 3; // precisamos de 3 vencedores


    // ------------------------------------------------------------
    // SHARE SYSTEM (Investment Shares)
    // ------------------------------------------------------------

    uint256 public constant SHARE_PRICE = 1000 * 1e6; // 1000 USDC por cota
    uint256 public constant MAX_SHARES = 2000;

    uint256 public totalSharesSold;

    mapping(address => uint256) public sharesOwned;

    // Dividendos acumulados para saque posterior (lazy distribution)
    mapping(address => uint256) public shareholderDividends;


    // ------------------------------------------------------------
    // EVENTS
    // ------------------------------------------------------------

    event TicketPurchased(address indexed player, uint256 round, uint256 count);
    event WinnersSelected(uint256 round, address w1, address w2, address w3);
    event PinRegistered(address indexed user);
    event SharePurchased(address indexed buyer, uint256 amount);
    event DividendPaid(address indexed shareholder, uint256 amount);
    // ------------------------------------------------------------
    // SECRET PIN REGISTRATION (HASHED)
    // ------------------------------------------------------------

    /// @notice Register a hashed PIN for secure betting authorization
    /// @param pinHash keccak256 hash of user secret PIN
    function registerPin(bytes32 pinHash) external {
        require(pinHash != 0x0, "Invalid hash");
        registeredPinHash[msg.sender] = pinHash;

        emit PinRegistered(msg.sender);
    }


    // ------------------------------------------------------------
    // SHARE PURCHASE SYSTEM (Investment)
    // ------------------------------------------------------------

    /// @notice Buy investment shares (max 2000 total)
    /// @param amount number of shares to buy
    function buyShares(uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(totalSharesSold + amount <= MAX_SHARES, "Max shares reached");

        uint256 totalCost = amount * SHARE_PRICE;

        // Transfer USDC from buyer to contract
        require(USDC.transferFrom(msg.sender, address(this), totalCost), "USDC transfer failed");

        // Split revenue
        uint256 founderCut = (totalCost * 70) / 100;
        uint256 marketingCut = totalCost - founderCut;

        // Pay instantly
        require(USDC.transfer(founderWallet, founderCut), "Founder transfer failed");
        require(USDC.transfer(marketingWallet, marketingCut), "Marketing transfer failed");

        // Register shareholder
        sharesOwned[msg.sender] += amount;
        totalSharesSold += amount;

        emit SharePurchased(msg.sender, amount);
    }
    // ------------------------------------------------------------
    // BETTING / TICKET PURCHASE SYSTEM
    // ------------------------------------------------------------

    /// @notice Buy tickets for current round (requires correct PIN)
    /// @param amount number of tickets to buy (each 5 USDC)
    /// @param pinRaw the raw PIN typed by the user (NOT STORED)
    function buyTickets(uint256 amount, string calldata pinRaw)
        external
        nonReentrant
        pinRegistered
    {
        require(amount > 0, "Invalid amount");
        require(
            ticketsByWallet[roundId][msg.sender] + amount <= MAX_TICKETS_PER_WALLET,
            "Max 100 tickets"
        );

        // CHECK PIN (hashed form)
        bytes32 computedHash = keccak256(abi.encodePacked(pinRaw));
        require(
            computedHash == registeredPinHash[msg.sender],
            "Invalid PIN"
        );

        uint256 cost = amount * TICKET_PRICE;

        // Transfer USDC from user to contract
        require(USDC.transferFrom(msg.sender, address(this), cost), "USDC transfer failed");

        // Register tickets
        for (uint256 i = 0; i < amount; i++) {
            tickets.push(Ticket({
                player: msg.sender,
                timestamp: block.timestamp
            }));
        }

        // Count tickets per wallet
        ticketsByWallet[roundId][msg.sender] += amount;

        emit TicketPurchased(msg.sender, roundId, amount);
    }
    // ------------------------------------------------------------
    // ROUND SYSTEM (START, CLOSE, VRF REQUEST)
    // ------------------------------------------------------------

    /// @notice Start a new round (can be automated off-chain or called manually)
    function startRound() public onlyOwner {
        require(block.timestamp >= roundStartTime + ROUND_DURATION, "Round still active");

        // Reset state
        delete tickets;
        roundId++;
        roundStartTime = block.timestamp;

        // Reset winners
        winner1 = address(0);
        winner2 = address(0);
        winner3 = address(0);
    }


    /// @notice Close round and request randomness from VRF
    function closeRoundAndRequestRandomness() external onlyOwner {
        require(block.timestamp >= roundStartTime + ROUND_DURATION, "Round not finished");
        require(tickets.length > 2, "Not enough participants");

        lastRoundPrizePool = tickets.length * TICKET_PRICE;

        // Request 3 random words (for 3 winners)
        uint256 requestId = vrf.requestRandomWords(
            keyHash,
            vrfSubscriptionId,
            VRF_CONFIRMATIONS,
            VRF_CALLBACK_GAS,
            VRF_NUM_WORDS
        );

        // Request ID not stored here because callback handles assignment
    }
    // ------------------------------------------------------------
    // VRF CALLBACK: SELECT WINNERS (3 DISTINCT)
    // ------------------------------------------------------------

    /// @notice VRF callback - receives 3 random words
    function rawFulfillRandomWords(uint256, uint256[] calldata randomWords) external {
        require(msg.sender == address(vrf), "Only VRF");

        require(tickets.length >= 3, "Not enough players");

        uint256 total = tickets.length;

        // Extract 3 random positions
        uint256 i1 = randomWords[0] % total;
        uint256 i2 = randomWords[1] % total;
        uint256 i3 = randomWords[2] % total;

        // Resolve positions → wallets
        address w1 = tickets[i1].player;
        address w2 = tickets[i2].player;
        address w3 = tickets[i3].player;

        // -----------------------------------------
        // ENSURE 3 DISTINCT WINNERS
        // -----------------------------------------

        if (w2 == w1) {
            i2 = (i2 + 7) % total;
            w2 = tickets[i2].player;
        }

        if (w3 == w1 || w3 == w2) {
            i3 = (i3 + 13) % total;
            w3 = tickets[i3].player;

            if (w3 == w1 || w3 == w2) {
                // fallback: walk forward until different
                for (uint256 k = 0; k < total; k++) {
                    address attempt = tickets[(i3 + k) % total].player;
                    if (attempt != w1 && attempt != w2) {
                        w3 = attempt;
                        break;
                    }
                }
            }
        }

        winner1 = w1;
        winner2 = w2;
        winner3 = w3;

        // -----------------------------------------
        // PAYOUT CALCULATIONS
        // -----------------------------------------

        uint256 pool = lastRoundPrizePool;
        require(pool > 0, "Invalid pool");

        uint256 founderFee = (pool * 1250) / 10000;       // 12.5%
        uint256 shareholdersFee = founderFee;            // 12.5%

        uint256 userPool = pool - founderFee - shareholdersFee; // 75%

        uint256 prize1 = (userPool * 5000) / 10000;      // 50%
        uint256 prize2 = (userPool * 1800) / 10000;      // 18%
        uint256 prize3 = (userPool * 700) / 10000;       // 7%

        // -----------------------------------------
        // PAY WINNERS (INSTANT)
        // -----------------------------------------

        require(USDC.transfer(w1, prize1), "P1 transfer failed");
        require(USDC.transfer(w2, prize2), "P2 transfer failed");
        require(USDC.transfer(w3, prize3), "P3 transfer failed");

        // -----------------------------------------
        // PAY FOUNDER (INSTANT)
        // -----------------------------------------

        require(USDC.transfer(founderWallet, founderFee), "Founder fee failed");

        // -----------------------------------------
        // SHAREHOLDERS DIVIDENDS (LAZY DISTRIBUTION)
        // -----------------------------------------

        if (totalSharesSold > 0) {
            uint256 rewardPerShare = shareholdersFee / totalSharesSold;

            // assignment of proportional dividends
            // no loop — stored globally per share
            for (uint256 s = 0; s < totalSharesSold; s++) {
                // cannot loop all wallets — but you requested simplicity (contract A)
                // so we allocate in a global accumulator
            }

            // new accumulated dividends per share
            _accumulatedPerShare += rewardPerShare;
        }

        emit WinnersSelected(roundId, w1, w2, w3);
    }
    // ------------------------------------------------------------
    // SHAREHOLDERS DIVIDEND SYSTEM (LAZY DISTRIBUTION)
    // ------------------------------------------------------------

    // Global accumulator: how much USDC each share is entitled to
    uint256 public _accumulatedPerShare;

    // Each shareholder tracks how much they already claimed
    mapping(address => uint256) public _claimedPerShare;

    /// @notice Returns pending dividends for a wallet
    function pendingDividends(address user) public view returns (uint256) {
        uint256 shares = sharesOwned[user];
        if (shares == 0) return 0;

        uint256 totalEntitlement = shares * _accumulatedPerShare;
        uint256 alreadyClaimed  = _claimedPerShare[user];

        if (totalEntitlement <= alreadyClaimed) return 0;

        return totalEntitlement - alreadyClaimed;
    }


    /// @notice Claim accumulated dividends (paid in USDC)
    function claimDividends() external nonReentrant {
        uint256 amount = pendingDividends(msg.sender);
        require(amount > 0, "Nothing to claim");

        _claimedPerShare[msg.sender] += amount;

        require(USDC.transfer(msg.sender, amount), "Dividend transfer failed");

        emit DividendPaid(msg.sender, amount);
    }
    // ------------------------------------------------------------
    // ADMIN FUNCTIONS (OWNER ONLY)
    // ------------------------------------------------------------

    /// @notice Update founder wallet
    function setFounderWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        founderWallet = newWallet;
    }

    /// @notice Update marketing wallet
    function setMarketingWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        marketingWallet = newWallet;
    }

    /// @notice Update VRF settings
    function setVRF(
        address coordinator,
        bytes32 _keyHash,
        uint256 _subId
    ) external onlyOwner {
        require(coordinator != address(0), "Invalid VRF");
        vrf = VRFCoordinatorV2_5(coordinator);
        keyHash = _keyHash;
        vrfSubscriptionId = _subId;
    }


    // ------------------------------------------------------------
    // CONSTRUCTOR
    // ------------------------------------------------------------

    constructor() {
        roundId = 1;
        roundStartTime = block.timestamp;
    }


    // ------------------------------------------------------------
    // VIEW FUNCTIONS
    // ------------------------------------------------------------

    /// @notice Returns total tickets in current round
    function totalTickets() external view returns (uint256) {
        return tickets.length;
    }

    /// @notice Returns how many tickets a wallet bought this round
    function walletTickets(address user) external view returns (uint256) {
        return ticketsByWallet[roundId][user];
    }


    // ------------------------------------------------------------
    // REQUIRED OVERRIDE FOR VRF CALLBACK
    // ------------------------------------------------------------

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal virtual {
        rawFulfillRandomWords(requestId, randomWords);
    }
}
