const ERC20 = artifacts.require("../contracts/ERC20.sol");

async function doDeploy(deployer) {
  await deployer.deploy(ERC20, "ERC20 Token", "ERT", 100000);
}

module.exports = (deployer) => {
  deployer.then(async () => {
      await doDeploy(deployer);
  });
};
