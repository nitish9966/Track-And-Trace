// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Identeefi {
    address public owner;

    struct ProductHistory {
        uint id;
        string actor;
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

    mapping(string => Product) public products;
    mapping(string => ProductHistory[]) public productHistories; // Store history separately

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
            "Product already registered"
        );

        products[_serialNumber] = Product({
            name: _name,
            brand: _brand,
            serialNumber: _serialNumber,
            description: _description,
            image: _image,
            historySize: 0
        });

        addProductHistory(_serialNumber, _actor, _location, _timestamp, false);
    }

    function addProductHistory(
        string memory _serialNumber,
        string memory _actor,
        string memory _location,
        string memory _timestamp,
        bool _isSold
    ) public {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            "Product does not exist"
        );

        uint historyId = products[_serialNumber].historySize + 1;
        productHistories[_serialNumber].push(
            ProductHistory(historyId, _actor, _location, _timestamp, _isSold)
        );

        products[_serialNumber].historySize++;

        console.log("Product History added: %s", _actor);
        console.log("Product : %s", products[_serialNumber].name);
    }

    function getProductDetails(
        string memory _serialNumber
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            uint
        )
    {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            "Product does not exist"
        );

        return (
            products[_serialNumber].serialNumber,
            products[_serialNumber].name,
            products[_serialNumber].brand,
            products[_serialNumber].description,
            products[_serialNumber].image,
            products[_serialNumber].historySize
        );
    }

    function getProductHistory(
        string memory _serialNumber
    ) public view returns (ProductHistory[] memory) {
        require(
            bytes(products[_serialNumber].serialNumber).length != 0,
            "Product does not exist"
        );

        return productHistories[_serialNumber];
    }
}
