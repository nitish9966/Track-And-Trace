// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Identeefi {
    address public owner;

    struct ProductHistory {
        uint id;
        string actor;
        string role; // Added role field
        string location;
        string timestamp;
        bool isSold;
    }

    struct Product {
        string name;
        string serialNumber;
        string description;
        string brand;
        string image;
        uint historySize;
    }

    mapping(string => Product) private products;
    mapping(string => ProductHistory[]) private productHistories;

    event ProductRegistered(string serialNumber, string name, string brand);
    event ProductHistoryUpdated(
        string serialNumber,
        string actor,
        string role, // Added role to event
        string location,
        string timestamp,
        bool isSold
    );

    constructor() {
        owner = msg.sender;
    }

    function registerProduct(
        string memory _name,
        string memory _brand,
        string memory _serialNumber,
        string memory _description,
        string memory _image,
        string memory _actor,
        string memory _location,
        string memory _timestamp
    ) public {
        require(
            bytes(products[_serialNumber].serialNumber).length == 0,
            unicode"Product already registered!"
        );

        products[_serialNumber] = Product({
            name: _name,
            brand: _brand,
            serialNumber: _serialNumber,
            description: _description,
            image: _image,
            historySize: 0
        });

        // Add initial history with a default "manufacturer" role
        // You can modify this to accept a role parameter if needed
        addProductHistory(
            _serialNumber,
            _actor,
            "manufacturer",
            _location,
            _timestamp,
            false
        );

        emit ProductRegistered(_serialNumber, _name, _brand);
    }

    function addProductHistory(
        string memory _serialNumber,
        string memory _actor,
        string memory _role, // Added role parameter
        string memory _location,
        string memory _timestamp,
        bool _isSold
    ) public {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            "Product does not exist!"
        );

        uint historyId = products[_serialNumber].historySize + 1;
        productHistories[_serialNumber].push(
            ProductHistory(
                historyId,
                _actor,
                _role,
                _location,
                _timestamp,
                _isSold
            )
        );

        products[_serialNumber].historySize++;

        emit ProductHistoryUpdated(
            _serialNumber,
            _actor,
            _role,
            _location,
            _timestamp,
            _isSold
        );

        console.log(
            unicode"✅ Product History added by: %s (Role: %s)",
            _actor,
            _role
        );
        console.log(unicode"🛒 Product: %s", products[_serialNumber].name);
    }

    function getProductDetails(
        string memory _serialNumber
    )
        public
        view
        returns (
            string memory name,
            string memory serialNumber,
            string memory brand,
            string memory description,
            string memory image,
            uint historySize
        )
    {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            unicode"❌ Product does not exist!"
        );

        Product memory p = products[_serialNumber];

        return (
            p.name,
            p.serialNumber,
            p.brand,
            p.description,
            p.image,
            p.historySize
        );
    }

    function getProductHistory(
        string memory _serialNumber
    ) public view returns (ProductHistory[] memory) {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            unicode"❌ Product does not exist!"
        );

        return productHistories[_serialNumber];
    }
}
