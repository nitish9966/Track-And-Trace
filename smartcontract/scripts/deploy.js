const hre = require("hardhat");

const main = async () => {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const productContractFactory = await hre.ethers.getContractFactory("Identeefi");
  const productContract = await productContractFactory.deploy();
  await productContract.deployed();

  console.log("Identeefi Contract deployed at:", productContract.address);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
};

runMain();
