// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RationSystem {
    // The government or agency deploying the contract
    address public admin;

    // Defines what a ration card holder looks like in the system
    struct Beneficiary {
        bool isVerified;
        uint256 monthlyQuota; // Total allowed per month (e.g., in kg)
        uint256 currentBalance; // What they have left to claim
    }

    // Maps a user's digital wallet address to their ration card details
    mapping(address => Beneficiary) public beneficiaries;

    // Ensures only the admin can run specific functions
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Runs once when the contract is deployed
    constructor() {
        admin = msg.sender;
    }

    // Admin registers a new citizen with their specific quota
    function registerBeneficiary(address _citizen, uint256 _quota) public onlyAdmin {
        require(!beneficiaries[_citizen].isVerified, "Citizen is already registered");
        
        beneficiaries[_citizen] = Beneficiary({
            isVerified: true,
            monthlyQuota: _quota,
            currentBalance: _quota
        });
    }

    // Citizen claims a specific amount of their ration
    function claimRation(uint256 _amount) public {
        require(beneficiaries[msg.sender].isVerified, "You are not a registered beneficiary");
        require(beneficiaries[msg.sender].currentBalance >= _amount, "Insufficient ration balance");

        // Deduct the claimed amount from their balance
        beneficiaries[msg.sender].currentBalance -= _amount;
    }

    // Admin resets balances for the new month
    function resetMonthlyQuota(address _citizen) public onlyAdmin {
        require(beneficiaries[_citizen].isVerified, "Citizen is not registered");
        beneficiaries[_citizen].currentBalance = beneficiaries[_citizen].monthlyQuota;
    }
}