require("dotenv").config();

console.log("Sepolia API Key:", process.env.SEPOLIA_QUICKNODE_KEY);
console.log("Private Key:", process.env.PRIVATE_KEY);
console.log("Private Key Length:", process.env.PRIVATE_KEY.length);
