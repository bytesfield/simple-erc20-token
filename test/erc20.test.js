let token

const ERC20 = artifacts.require("../contracts/ERC20.sol");

contract('ERC20', (accounts) => {
  const tokenName = 'My ERC20 Coin';
  const tokenSymbol = 'ERT';
  const tokenTotalSupply = 10000;
  const tokenDecimals = 18;


  beforeEach(async () => {
    token = await ERC20.new(tokenName, tokenSymbol, tokenTotalSupply);
  })

  it('creation: should create an initial balance of 10000 for the creator', async () => {
    const balance = await token.balanceOf.call(accounts[0]);

    assert.strictEqual(balance.toNumber(), 10000);
  });

  it('creation: test correct setting of vanity information', async () => {
    const name = await token.name.call();
    assert.strictEqual(name, tokenName);

    const decimals = await token.decimals.call();
    assert.strictEqual(decimals.toNumber(), tokenDecimals)

    const symbol = await token.symbol.call();
    assert.strictEqual(symbol, tokenSymbol);
  });

  it('creation: should succeed in creating over 2^256 - 1 (max) tokens', async () => {
    // 2^256 - 1
    const token2 = await ERC20.new('Max Coin', 'MXC', '115792089237316195423570985008687907853269984665640564039457584007913129639935')
    
    const totalSupply = await token2.totalSupply();

    assert.strictEqual(totalSupply.toString(), '115792089237316195423570985008687907853269984665640564039457584007913129639935')
  });

  // TRANSFERS Testing
  it('transfers: should transfer 1000 to accounts[1]', async () => {
    await token.transfer(accounts[1], 100,  {from: accounts[0] });

    const balance = await token.balanceOf.call(accounts[1]);

    assert.strictEqual(balance.toNumber(), 0);
  });

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', async () => {
    let threw = false

    try {
      await token.transfer.call(accounts[1], 10001);
    } catch (e) {
      threw = true
    }
    
    assert.equal(threw, true);
  });

  it('transfers: should handle zero-transfers normally', async () => {
    assert(await token.transfer.call(accounts[1], 0), 'zero-transfer has failed')
  })

  // APPROVALS TESTING
  it('approvals: msg.sender should approve 100 to accounts[1]', async () => {
    await token.approve(accounts[1], 100);

    const allowance = await token.allowance.call(accounts[0], accounts[1]);

    assert.strictEqual(allowance.toNumber(), 100)
  })

  it('approvals: attempt withdrawal from account with no allowance (should fail)', async () => {
    let threw = false

    try {
      await token.transferFrom.call(accounts[0], accounts[ 2 ], 60);
    } catch (e) {
      threw = true;
    }
    assert.equal(threw, true);
  })

  it('approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.', async () => {
    await token.approve(accounts[1], 100, { from: accounts[0] });

    await token.transferFrom(accounts[0], accounts[ 2 ], 60, { from: accounts[1] });

    await token.approve(accounts[1], 0);

    let threw = false

    try {
      await token.transferFrom.call(accounts[0], accounts[ 2 ], 10);
    } catch (e) {
      threw = true
    }
    assert.equal(threw, true)
  });

  it('approvals: should approve max (2^256 - 1)', async () => {
    await token.approve(accounts[1], '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[0] })
    
    const allowance = await token.allowance(accounts[0], accounts[1]);

    assert.strictEqual(allowance.toString(), '115792089237316195423570985008687907853269984665640564039457584007913129639935')
  });

//   /* eslint-disable no-underscore-dangle */
  it('events: should fire Transfer event successfully', async () => {
    const res = await token.transfer(accounts[1], '2000', { from: accounts[0] });

    const transferLog = res.logs.find(
      element => element.event.match('Transfer') &&
        element.address.match(token.address)
    );

    assert.strictEqual(transferLog.args.from, accounts[0]);

    assert.strictEqual(transferLog.args.to, accounts[1]);

    assert.strictEqual(transferLog.args.value.toString(), '2000');
  });

  it('events: should fire Transfer event successfully on a zero transfer', async () => {
    const res = await token.transfer(accounts[1], '0', { from: accounts[0] });

    const transferLog = res.logs.find(
      element => element.event.match('Transfer') &&
        element.address.match(token.address)
    );

    assert.strictEqual(transferLog.args.from, accounts[0]);

    assert.strictEqual(transferLog.args.to, accounts[1]);

    assert.strictEqual(transferLog.args.value.toString(), '0');
  });

  it('events: should fire Approval event successfully', async () => {
    const res = await token.approve(accounts[1], '2000', { from: accounts[0] });

    const approvalLog = res.logs.find(element => element.event.match('Approval'));

    assert.strictEqual(approvalLog.args.owner, accounts[0]);

    assert.strictEqual(approvalLog.args.spender, accounts[1]);

    assert.strictEqual(approvalLog.args.value.toString(), '2000');
  });
});