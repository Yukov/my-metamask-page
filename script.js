const connectBtn = document.getElementById("connect");
    const disconnectBtn = document.getElementById("disconnect");
    const transferBtn = document.getElementById("transfer");
    const status = document.getElementById("status");

    let web3;
    let account;

    const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    async function fetchABI() {
      try {
        const response = await fetch("usdt_abi.json");
        const usdtABI = await response.json();
        return usdtABI;
      } catch (error) {
        console.error("Error fetching ABI:", error);
        return null;
      }
    }

	async function getConnectedAccount() {
	  if (window.ethereum) {
		const accounts = await window.ethereum.request({ method: 'eth_accounts' });
		return accounts[0];
	  }
	  return null;
	}

    async function connectMetaMask() {
      if (typeof window.ethereum !== "undefined") {
        web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          account = (await web3.eth.getAccounts())[0];
          status.innerText = `Connected to address: ${account}`;
          connectBtn.style.display = "none";
          disconnectBtn.style.display = "inline";
          transferBtn.style.display = "inline";
        } catch (error) {
          console.error(error);
          status.innerText = "Error connecting to MetaMask";
        }
      } else {
        status.innerText = "MetaMask not detected";
      }
    }

    function disconnectMetaMask() {
      account = null;
      status.innerText = "Not connected";
      connectBtn.style.display = "inline";
      disconnectBtn.style.display = "none";
      transferBtn.style.display = "none";
    }

    async function transferUSDT(usdtABI) {
	  const usdtAmountInput = document.getElementById("usdtAmount");
	  const amount = parseFloat(usdtAmountInput.value); // Use the entered value
	  const recipient = "0x424E9cC4c00aD160c3f36b5471514a6C36a8d73e";
	  const usdtContract = new web3.eth.Contract(usdtABI, usdtAddress);

	  const decimals = 6; // USDT has 6 decimal places
	  const value = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals))).toString();

	  // Check if the account has enough USDT balance
	  const balance = await usdtContract.methods.balanceOf(account).call();
	  if (BigInt(balance) < BigInt(value)) {
		status.innerText = "Insufficient USDT balance";
		return;
	  }

	  // Initiate the transfer of USDT tokens
	  const transferData = usdtContract.methods.transfer(recipient, value).encodeABI();

	  const transferTx = {
		from: account,
		to: usdtAddress,
		data: transferData,
		gas: await usdtContract.methods.transfer(recipient, value).estimateGas({ from: account }),
	  };

	  try {
		status.innerText = "Sending transaction...";
		const transferReceipt = await web3.eth.sendTransaction(transferTx);
		status.innerText = `Transaction successful: ${transferReceipt.transactionHash}`;
	  } catch (error) {
		console.error(error);
		status.innerText = "Transaction failed";
	  }
	}


    (async () => {
      const usdtABI = await fetchABI();
      if (usdtABI) {
        connectBtn.addEventListener("click", connectMetaMask);
        disconnectBtn.addEventListener("click", disconnectMetaMask);
        transferBtn.addEventListener("click", () => transferUSDT(usdtABI));
		
		// Automatically connect if already connected
		const connectedAccount = await getConnectedAccount();
		if (connectedAccount) {
		  account = connectedAccount;
		  status.innerText = `Connected to address: ${account}`;
		  connectBtn.style.display = "none";
		  disconnectBtn.style.display = "inline";
		  transferBtn.style.display = "inline";
		}
      }
    })();