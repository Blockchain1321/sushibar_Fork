require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks:{
    kovan:{
      url:"https://kovan.infura.io/v3/f5e8965459f1491c9cc7f698a617290d",
      accounts:["64c139422c1e9ead4c976e43075bfd998536f54bb4820ead54f34343ff127aea"],
    },
  },
  
};