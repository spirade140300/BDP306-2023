var Web3 = require('web3');
const reserve = require('./contracts/Reserve.json');
const exchange = require('./contracts/Exchange.json');
const web3 = new Web3('HTTP://127.0.0.1:7545/');
var reserveBTC = "";
var reserveSWA = "";
var exchangeContract = "";

var btcTokenAddress = "";
var swaTokenAddress = "";

var connectedAccount = "";

async function init() {
  // Get reserves
  reserveBTC = await new web3.eth.Contract(reserve.abi, '0xce5BE1fd39403A6e5Dce1a0021fd68feE9890348');
  reserveSWA = await new web3.eth.Contract(reserve.abi, '0x1140Be14eCa4B737238D64365C43B647c8FC6a1C');
  exchangeContract = await new web3.eth.Contract(exchange.abi, '0xAF208C0dB77Fe183569E68F4D7953E6F1C07A35c');
  // Get token address
  // ETH
  $(".select-eth").attr("data-address", connectedAccount);
  // init token BTC
  await getBTCTokenAddress();
  // init token SWA
  await getSWATokenAddress();
  //
  var supportedTokenAddresses = await exchangeContract.methods.getListOfSupportedTokens().call();
  if (!supportedTokenAddresses.includes(btcTokenAddress)) {
    try {
      await exchangeContract.methods.addReserve('0xce5BE1fd39403A6e5Dce1a0021fd68feE9890348').send({ from: connectedAccount, gas: 6721975 })
        .then(function (receipt) {
          console.log(receipt);
        }).catch(function (error) {
          // handle any errors that occurred during the execution of the promise
          throw error;
        });
    } catch (error) {
      // Handle the error
      console.error(error);
      // Skip over the function
      return;
    }
  }

  if (!supportedTokenAddresses.includes(swaTokenAddress)) {
    try {
      await exchangeContract.methods.addReserve('0x1140Be14eCa4B737238D64365C43B647c8FC6a1C').send({ from: connectedAccount, gas: 6721975 })
        .then(function (receipt) {
          console.log(receipt);
        }).catch(function (error) {
          // handle any errors that occurred during the execution of the promise
          throw error;
        });
    } catch (error) {
      // Handle the error
      console.error(error);
      // Skip over the function
      return;
    }
  }
  // init default swap
  $("#selected-swap-from").attr("data-address", connectedAccount);
  // init default transfer
  $("#selected-transfer-from").attr("data-address", connectedAccount);
  // Init UI default
  $('.eth-blances-swap').hide();
  $('.btc-blances-swap').hide();
  $('.swa-blances-swap').hide();
  $('.eth-blances-transfer').hide();
  $('.btc-blances-transfer').hide();
  $('.swa-blances-transfer').hide();
  // Update UI
  updateUIBalances();
  // Init default token
  updateTokenRateETHToToken(reserveBTC, 1).then(function (result) {
    var rate = 1 / web3.utils.fromWei(result, 'ether');
    $(".swap__rate").text("1 ETH = " + rate.toFixed() + " BTC");
  });
};

async function getBTCTokenAddress() {
  await reserveBTC.methods.getTokenAddress().call()
    .then(async function (result) {
      $(".select-btc").attr("data-address", result);
      $("#selected-swap-to").attr("data-address", result);
      btcTokenAddress = result
    }).catch(function (error) {
      // handle any errors that occurred during the execution of the promise
      console.error(error);
    });
}

async function getSWATokenAddress() {
  await reserveSWA.methods.getTokenAddress().call()
    .then(async function (result) {
      $(".select-swa").attr("data-address", result);

      swaTokenAddress = result
    }).catch(function (error) {
      // handle any errors that occurred during the execution of the promise
      console.error(error);
    });
}

async function updateAccountBalances(account) {
  await web3.eth.getBalance(account, function (error, balance) {
    if (error) {
      console.error(error);
    } else {
      var etherBalance = web3.utils.fromWei(balance, 'ether');
      console.log(balance);
      $(".eth-blances-swap").text(etherBalance);
      $(".eth-blances-transfer").text(etherBalance);
    }
  });
  await reserveBTC.methods.getBalanceOf(account).call()
    .then(function (result) {
      var btcBalace = web3.utils.fromWei(result, 'ether');
      $(".btc-blances-swap").text(btcBalace);
      $(".btc-blances-transfer").text(btcBalace);
    });

  await reserveSWA.methods.getBalanceOf(account).call()
    .then(function (result) {
      var swaBalace = web3.utils.fromWei(result, 'ether');
      $(".swa-blances-swap").text(swaBalace);
      $(".swa-blances-transfer").text(swaBalace);
    });
  updateUIBalances();
};

async function updateUIBalances() {
  var swapFrom = $('#selected-swap-from').text();
  if (swapFrom == "ETH") {
    $('.eth-blances-swap').show();
    $('.btc-blances-swap').hide();
    $('.swa-blances-swap').hide();
  } else if (swapFrom == "BTC") {
    $('.eth-blances-swap').hide();
    $('.btc-blances-swap').show();
    $('.swa-blances-swap').hide();
  } else if (swapFrom == "SWA") {
    $('.eth-blances-swap').hide();
    $('.btc-blances-swap').hide();
    $('.swa-blances-swap').show();
  }

  var swapFrom = $('#selected-transfer-from').text();
  if (swapFrom == "ETH") {
    $('.eth-blances-transfer').show();
    $('.btc-blances-transfer').hide();
    $('.swa-blances-transfer').hide();
  } else if (swapFrom == "BTC") {
    $('.eth-blances-transfer').hide();
    $('.btc-blances-transfer').show();
    $('.swa-blances-transfer').hide();
  } else if (swapFrom == "SWA") {
    $('.eth-blances-transfer').hide();
    $('.btc-blances-transfer').hide();
    $('.swa-blances-transfer').show();
  }
}

async function updateTokenRateTokenAndToken(tokenA, tokenB, value) {
  return exchangeContract.methods.getExchangeRate(tokenA, tokenB, value).call();
}

async function updateTokenRateETHToToken(reserve, amount) {
  return reserve.methods.getExchangeRate(true, amount).call();
}

async function updateTokenRateTokenToETH(reserve, amount) {
  return reserve.methods.getExchangeRate(false, amount).call();
}

async function updateTokenRate() {
  var readOnly = true;
  var from = $("#selected-swap-from").attr('data-address');
  var to = $("#selected-swap-to").attr('data-address');
  var value = $("#swap-source-amount").val();
  var fromToken = $("#selected-swap-from").text();
  var toToken = $("#selected-swap-to").text();

  if (from == "" || to == "") {
    return;
  }
  if (from == to) {
    if (value == "") {
      $(".input-placeholder").text(0);
      $("#swap-source-amount").val(0);
      return;
    } else {
      $(".input-placeholder").text(value);
      return;
    }
  }

  // ETH => BTC
  if (from == connectedAccount && to == btcTokenAddress) {
    var rate = 0;
    updateTokenRateETHToToken(reserveBTC, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken, 1 / rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(value / rate);
        }
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
  // BTC -> ETH
  if (from == btcTokenAddress && to == connectedAccount) {
    updateTokenRateTokenToETH(reserveBTC, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken, rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(rate * value);
        }
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
  // ETH -> SWA
  if (from == connectedAccount && to == swaTokenAddress) {
    updateTokenRateETHToToken(reserveSWA, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken, 1 / rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(value / rate);
        }
        return;
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
  // SWA -> ETH
  if (from == swaTokenAddress && to == connectedAccount) {
    updateTokenRateTokenToETH(reserveSWA, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken, rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(rate * value);
        }
        return;
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
  // BTC -> SWA
  if (from == btcTokenAddress && to == swaTokenAddress) {
    updateTokenRateTokenAndToken(btcTokenAddress, swaTokenAddress, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken, rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(rate * value);
        }
        return;
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
  if (from == swaTokenAddress && to == btcTokenAddress) {
    updateTokenRateTokenAndToken(swaTokenAddress, btcTokenAddress, 1)
      .then(function (result) {
        rate = web3.utils.fromWei(result, 'ether');
        updateExchangeRate(fromToken, toToken,  rate);
        if (value == 0 || value == "") {
          updateDestAmount(0);
        } else {
          updateDestAmount(rate * value);
        }
        return;
      }).catch(function (error) {
        // handle any errors that occurred during the execution of the promise
        console.error(error);
      });
  }
}

async function updateDestAmount(rate) {
  $("#dest-amount").text(rate);
  if ($("#dest-amount").text() == "") {
    $("#dest-amount").text(0);
  }
}

async function updateExchangeRate(from, to, rate) {
  $(".swap__rate").text("1 " + from + "= " + rate + " " + to);
}

function isNum(str) {
  str = str.trim();
  if (!str) {
    return false;
  }
  str = str.replace(/^0+/, "") || "0";
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

async function swap() {
  var mode = -1;
  var from = $("#selected-swap-from").attr('data-address');
  var to = $("#selected-swap-to").attr('data-address');
  var value = $("#swap-source-amount").val();
  if (from == connectedAccount && from != to) {
    mode = 1;
  }
  else if (to == connectedAccount && to != from) {
    mode = 2;
  }
  else if (from != connectedAccount && to != connectedAccount && from != to) {
    mode = 3;
  }

  switch (mode) {
    case 1:
      if (to == btcTokenAddress) {
        exchangeContract.methods.buyToken(btcTokenAddress, value).send({
          from: connectedAccount, // the address of the user sending the transaction
          value: web3.utils.toWei(value, 'ether'), // the amount of ETH to send with the transaction
          gas: 6721975 // the maximum gas allowed for the transaction
        })
          .then((receipt) => {
            // the transaction was successful
            console.log("Successful: " + receipt);
            updateAccountBalances(connectedAccount);
          })
          .catch((error) => {
            // there was an error with the transaction
            alert("Error: " + error);
          });
      }
      else if (to == swaTokenAddress) {
        exchangeContract.methods.buyToken(swaTokenAddress, value).send({
          from: connectedAccount, // the address of the user sending the transaction
          value: web3.utils.toWei(value, 'ether'), // the amount of ETH to send with the transaction
          gas: 6721975 // the maximum gas allowed for the transaction
        })
          .then((receipt) => {
            // the transaction was successful
            alert("Successful: " + receipt);
            updateAccountBalances(connectedAccount);
          })
          .catch((error) => {
            // there was an error with the transaction
            alert("Error: " + error);
          });
      }
      break;
    case 2:
      if (from == btcTokenAddress) {
        exchangeContract.methods.sellToken(btcTokenAddress, value).send({
          from: connectedAccount, // the address of the user sending the transaction
          value: value, // the amount of ETH to send with the transaction
          gas: 6721975 // the maximum gas allowed for the transaction
        })
          .then((receipt) => {
            // the transaction was successful
            alert("Successful: " + receipt);
            updateAccountBalances(connectedAccount);
          })
          .catch((error) => {
            // there was an error with the transaction
            alert("Error: " + error);
          });
      }
      else if (from == swaTokenAddress) {
        exchangeContract.methods.sellToken(swaTokenAddress, value).send({
          from: connectedAccount, // the address of the user sending the transaction
          value: value, // the amount of ETH to send with the transaction
          gas: 6721975 // the maximum gas allowed for the transaction
        })
          .then((receipt) => {
            // the transaction was successful
            alert("Successful: " + receipt);
            updateAccountBalances(connectedAccount);
          })
          .catch((error) => {
            // there was an error with the transaction
            alert("Error: " + error);
          });
      }
      break;
    case 3:
      exchangeContract.methods.exchange(from, to, value).send({
        from: connectedAccount, // the address of the user sending the transaction
        value: value, // the amount of ETH to send with the transaction
        gas: 6721975 // the maximum gas allowed for the transaction
      })
        .then((receipt) => {
          // the transaction was successful
          alert("Successful: " + receipt);
          updateAccountBalances(connectedAccount);
        })
        .catch((error) => {
          // there was an error with the transaction
          alert("Error: " + error);
        });
      break;
    default:
      console.log("There was an error happened")
      break;

  }
}

async function transfer() {
  var from = $("#selected-transfer-from").attr('data-address');
  var value = $("#transfer-source-amount").val();
  var receiver = $("#transfer-address").val();
  var mode = -1;
  if (from == connectedAccount) {
    mode = 1;
  } else if (from == btcTokenAddress) {
    mode = 2;
  } else if (from == swaTokenAddress) {
    mode = 3;
  }
  switch (mode) {
    case 1:
      web3.eth.sendTransaction({
        from: connectedAccount,
        to: receiver,
        value: web3.utils.toWei(value, 'ether'),
        gas: 6721975,
        gasPrice: 20000000000
      })
      .on('transactionHash', function(hash){
        console.log('Transaction Hash:', hash);
      })
      .on('receipt', function(receipt){
        alert("Successful: " + receipt);
        updateAccountBalances(connectedAccount);
      })
      .on('error', function(error) {
        console.error('Transaction Error:', error);
      });
      break;
    case 2:
      exchangeContract.methods.transferToken(btcTokenAddress, connectedAccount, receiver, value).send({ from: connectedAccount })
        .on('transactionHash', function (hash) {
          console.log('Transaction hash:', hash);
        })
        .on('receipt', function (receipt) {
          alert("Successful: " + receipt);
          updateAccountBalances(connectedAccount);
        })
        .on('error', function (error) {
          alert("Error: " + error);
        });
      break;
    case 3:
      exchangeContract.methods.transferToken(swaTokenAddress, connectedAccount, receiver, value).send({ from: connectedAccount })
        .on('transactionHash', function (hash) {
          console.log('Transaction hash:', hash);
        })
        .on('receipt', function (receipt) {
          alert("Successful: " + receipt);
          
          updateAccountBalances(connectedAccount);
        })
        .on('error', function (error) {
          alert("Error: " + error);
        });
      break;
    default:
      break;
  }
}

$(function () {
  // Import Metamask
  $('#import-metamask').on('click', async function () {
    /* TODO: Importing wallet by Metamask goes here. */

    // Check if metamask is installed
    if (typeof window.ethereum !== 'undefined') {
      console.log('MetaMask is installed!');
    }

    // Request account 
    // Get account array from metamask
    var accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    // Check account array length
    if (accounts.length > 0) {
      // Take account hash
      var account = accounts[0];
      // Set UI
      $('#accoount-hash').text(account);
      $('.conected-account').attr('style', 'visibility: visible');
      // Assign account hash
      connectedAccount = account;
      init();
      updateAccountBalances(account);
    } else {
      // Set UI
      $('#accoount-hash').text("!temp!");
      $('.conected-account').attr('style', 'visibility: hidden');
    }
  });

  // Handle on Source Amount Changed
  $('#swap-source-amount').on('change', async function () {
    /* TODO: Fetching latest rate with new amount */
    /* TODO: Updating dest amount */
    await updateTokenRate();
    await updateAccountBalances(connectedAccount);
  });

  // Handle on click token in Token Dropdown List
  $('.dropdown__item').on('click', async function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
    /* TODO: Select Token logic goes here */
    if ($(this).parent().closest("#swap-from").length) {
      $("#selected-swap-from").text($(this).text());
      $("#selected-swap-from").attr("data-address", $(this).data('address'));
      await updateTokenRate();
      await updateAccountBalances(connectedAccount);
    }

    if ($(this).parent().closest("#swap-to").length) {
      $("#selected-swap-to").text($(this).text());
      $("#selected-swap-to").attr("data-address", $(this).data('address'));
      await updateTokenRate();
      await updateAccountBalances(connectedAccount);
    }

    if ($(this).parent().closest("#transfer-from").length) {
      $("#selected-transfer-from").text($(this).text());
      $("#selected-transfer-from").attr("data-address", $(this).data('address'));

      await updateTokenRate();
      await updateAccountBalances(connectedAccount);
    }
    updateUIBalances();
  });

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', async function () {
    var fromToken = $("#selected-swap-from").text();
    var toToken = $("#selected-swap-to").text();
    var value = $("#swap-source-amount").val();
    var dest = $("#dest-amount").text();
    var result = confirm(
      `Do you want to trade:
${value} ${fromToken}   >   ${dest} ${toToken}
This action cannot be undone.`
    );
    if (result == true) {
      await swap();
      await updateAccountBalances(connectedAccount);
      await updateUIBalances();
    } else {
      // user clicked "Cancel"
      // do something else here...
    }
  });

  $('#button-transfer').on('click', async function () {
    var fromToken = $("#selected-transfer-from").text();
    var value = $("#transfer-source-amount").val();
    var receiver = $("#transfer-address").val();
    var result = confirm(
      `Do you want to transfer:
${value} ${fromToken} to address: ${receiver}
This action cannot be undone.`
    );
    if (result == true) {
      await transfer();
      await updateAccountBalances(connectedAccount);
      await updateUIBalances();
    } else {
      // user clicked "Cancel"
      // do something else here...
    }
  });

  // Tab Processing
  $('.tab__item').on('click', function () {
    const contentId = $(this).data('content-id');
    $('.tab__item').removeClass('tab__item--active');
    $(this).addClass('tab__item--active');

    if (contentId === 'swap') {
      $('#swap').addClass('active');
      $('#transfer').removeClass('active');
    } else {
      $('#transfer').addClass('active');
      $('#swap').removeClass('active');
    }
  });

  // Dropdown Processing
  $('.dropdown__trigger').on('click', function () {
    $(this).parent().toggleClass('dropdown--active');
  });

  // Close Modal
  $('.modal').on('click', function (e) {
    if (e.target !== this) return;
    $(this).removeClass('modal--active');
  });

  $(".swap__icon").on('click', async function (e) {
    var dataAddressFromTemp = $("#selected-swap-from").attr("data-address");
    var textFromTemp = $("#selected-swap-from").text();

    $("#selected-swap-from").attr("data-address", $("#selected-swap-to").attr("data-address"));
    $("#selected-swap-from").text($("#selected-swap-to").text());

    $("#selected-swap-to").attr("data-address", dataAddressFromTemp);
    $("#selected-swap-to").text(textFromTemp);

    await updateTokenRate();
    await updateAccountBalances(connectedAccount);
    await updateUIBalances();
  })
});


