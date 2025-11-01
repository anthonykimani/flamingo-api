export const flamingoEscrowABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_usdc",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_treasury",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_backendSigner",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableInvalidOwner"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "OwnableUnauthorizedAccount"
    },
    {
        "inputs": [],
        "type": "error",
        "name": "ReentrancyGuardReentrantCall"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "type": "error",
        "name": "SafeERC20FailedOperation"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "oldSigner",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "newSigner",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "BackendSignerUpdated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "DepositRefunded",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "EmergencyWithdraw",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "GameSessionCancelled",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "totalPrizePool",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "address[]",
                "name": "players",
                "type": "address[]",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "GameSessionCreated",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "previousOwner",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address",
                "indexed": true
            }
        ],
        "type": "event",
        "name": "OwnershipTransferred",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "PlayerDeposited",
        "anonymous": false
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "firstPlace",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "secondPlace",
                "type": "address",
                "indexed": true
            },
            {
                "internalType": "address",
                "name": "thirdPlace",
                "type": "address",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "firstPrize",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "secondPrize",
                "type": "uint256",
                "indexed": false
            },
            {
                "internalType": "uint256",
                "name": "thirdPrize",
                "type": "uint256",
                "indexed": false
            }
        ],
        "type": "event",
        "name": "PrizesDistributed",
        "anonymous": false
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "FIRST_PLACE_BP",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "PLATFORM_FEE_PERCENT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "PLATFORM_TREASURY",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "SECOND_PLACE_BP",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "THIRD_PLACE_BP",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "USDC",
        "outputs": [
            {
                "internalType": "contract IERC20",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "backendSigner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "cancelGameSession"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "address[]",
                "name": "players",
                "type": "address[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "createGameSession"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "deposit"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "address[3]",
                "name": "winners",
                "type": "address[3]"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "distributePrizes"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "emergencyWithdraw"
    },
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "emergencyWithdrawETH"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "gameExists",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "games",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "prizePool",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "paidOut",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "cancelled",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "createdAt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "paidOutAt",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getGameInfo",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "prizePool",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "platformFee",
                "type": "uint256"
            },
            {
                "internalType": "address[]",
                "name": "players",
                "type": "address[]"
            },
            {
                "internalType": "bool",
                "name": "paidOut",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "cancelled",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getPendingDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "getPlayerDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "source",
                "type": "string"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "name": "hashToBytes32",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "player",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "isPlayerInGame",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ]
    },
    {
        "inputs": [],
        "stateMutability": "view",
        "type": "function",
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "name": "pendingDeposits",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "gameSessionId",
                "type": "bytes32"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "refundDeposit"
    },
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "renounceOwnership"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "source",
                "type": "string"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "name": "stringToBytes32",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "result",
                "type": "bytes32"
            }
        ]
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "transferOwnership"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newSigner",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function",
        "name": "updateBackendSigner"
    }
]