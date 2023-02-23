import MetaMaskOnboarding from '@metamask/onboarding';
const onboarding = new MetaMaskOnboarding();

$(function () {
  // Import Metamask
  $('#import-metamask').on('click', function () {
    /* TODO: Importing wallet by Metamask goes here. */
    connectWallet().then((accounts) => {
      
    })
  });

  // Handle on Source Amount Changed
  $('#swap-source-amount').on('keydown', function () {
    /* TODO: Fetching latest rate with new amount */
    /* TODO: Updating dest amount */
  });

  // Handle on click token in Token Dropdown List
  $('.dropdown__item').on('click', function () {
    $(this).parents('.dropdown').removeClass('dropdown--active');
    /* TODO: Select Token logic goes here */
  });

  // Handle on Swap Now button clicked
  $('#swap-button').on('click', function () {
    const modalId = $(this).data('modal-id');
    $(`#${modalId}`).addClass('modal--active');
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

  window.addEventListener('DOMContentLoaded', () => {
    const onboarding = new MetaMaskOnboarding();
    const onboardButton = document.getElementById('onboard');
    let accounts;

    const updateButton = () => {
      if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
        onboardButton.innerText = 'Click here to install MetaMask!';
        onboardButton.onclick = () => {
          onboardButton.innerText = 'Onboarding in progress';
          onboardButton.disabled = true;
          onboarding.startOnboarding();
        };
      } else if (accounts && accounts.length > 0) {
        onboardButton.innerText = 'Connected';
        onboardButton.disabled = true;
        onboarding.stopOnboarding();
      } else {
        onboardButton.innerText = 'Connect';
        onboardButton.onclick = async () => {
          await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
        };
      }
    };

    updateButton();
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', (newAccounts) => {
        accounts = newAccounts;
        updateButton();
      });
    }
  });

  async function connectWallet() {
    return await ethereum.request({ method: 'eth_accounts' });
  }

});


