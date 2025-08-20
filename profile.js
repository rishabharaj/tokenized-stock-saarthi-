// Profile Page Logic: MetaMask integration, theme toggle, mobile nav
document.addEventListener('DOMContentLoaded', () => {
	// Theme toggle removed from UI; no theme code here.

	// Mobile Nav
	const mobileToggle = document.querySelector('.mobile-toggle');
	const navbarMenu = document.querySelector('.navbar-menu');
	if (mobileToggle && navbarMenu) {
		mobileToggle.addEventListener('click', () => {
			navbarMenu.classList.toggle('active');
			const isExpanded = navbarMenu.classList.contains('active');
			mobileToggle.setAttribute('aria-expanded', isExpanded);
			const icon = mobileToggle.querySelector('i');
			icon.classList.toggle('fa-bars');
			icon.classList.toggle('fa-times');
		});
		document.addEventListener('click', (e) => {
			if (!e.target.closest('.navbar') && navbarMenu.classList.contains('active')) {
				navbarMenu.classList.remove('active');
				mobileToggle.setAttribute('aria-expanded', false);
				mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
			}
		});
		window.addEventListener('resize', () => {
			if (window.innerWidth > 768 && navbarMenu.classList.contains('active')) {
				navbarMenu.classList.remove('active');
				mobileToggle.setAttribute('aria-expanded', false);
				mobileToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
			}
		});
	}

	// MetaMask Integration
	const connectBtn = document.getElementById('connectBtn');
	const getBalanceBtn = document.getElementById('getBalanceBtn');
	const resultDiv = document.getElementById('result');
	let userAccount;

	function logResult(msg) { if (resultDiv) { resultDiv.textContent = msg; } console.log(msg); }
	function hasMetaMask() { const ok = typeof window.ethereum !== 'undefined'; logResult(ok ? 'MetaMask is installed!' : 'MetaMask not installed. Get it at https://metamask.io/'); return ok; }
	async function connectMetaMask() { if (!hasMetaMask()) return; try { const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); userAccount = accounts[0]; logResult(`Connected Account: ${userAccount}`); } catch (e) { logResult(`Failed to connect MetaMask: ${e.message}`); } }
	async function getBalance() { if (!userAccount) { logResult('No account connected. Connect MetaMask first.'); return; } try { const balanceHex = await window.ethereum.request({ method: 'eth_getBalance', params: [userAccount, 'latest'] }); const balanceWei = parseInt(balanceHex, 16); const balanceEth = balanceWei / 1e18; logResult(`ETH Balance: ${balanceEth} ETH`); } catch (e) { logResult(`Failed to retrieve balance: ${e.message}`); } }
	if (connectBtn) connectBtn.addEventListener('click', connectMetaMask);
	if (getBalanceBtn) getBalanceBtn.addEventListener('click', getBalance);
});
