<!-- common.js -->
<script type="module">
    import { createDataItemSigner, message, dryrun } from "https://unpkg.com/@permaweb/aoconnect@0.0.52";

    const PROCESS_ID = "51tMVLxBazWMBT9NhfaCuDP3HjQfZOggIcT7l9mRrbw";
    window.PROCESS_ID = PROCESS_ID;
    window.signer = createDataItemSigner(window.arweaveWallet);

    let walletAddress = null;
    window.walletAddress = null;

    // 连接钱包公共函数
    async function connectWallet() {
        if (!window.arweaveWallet) {
            alert("请安装 ArConnect 钱包扩展");
            return false;
        }
        try {
            await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION']);
            walletAddress = await window.arweaveWallet.getActiveAddress();
            window.walletAddress = walletAddress;
            return true;
        } catch (err) {
            alert("钱包连接失败");
            return false;
        }
    }

    // 自动尝试连接（如果已授权）
    if (window.arweaveWallet) {
        window.arweaveWallet.getActiveAddress().then(addr => {
            if (addr) {
                walletAddress = addr;
                window.walletAddress = addr;
                document.querySelectorAll('.wallet-address').forEach(el => {
                    el.textContent = addr.slice(0,6) + '...' + addr.slice(-4);
                });
            }
        }).catch(() => {});
    }

    // 公共 dryrun 和 message 函数
    window.aoDryrun = async (tags, owner = walletAddress) => {
        return await dryrun({ process: PROCESS_ID, tags, owner });
    };

    window.aoMessage = async (tags, data = null) => {
        return await message({
            process: PROCESS_ID,
            signer: window.signer,
            tags,
            data
        });
    };
</script>
