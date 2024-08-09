const axios = require('axios');
const { Web3 } = require('web3');
const {pool} = require("./db");
const path = require("path");

async function getWalletNeo() {
    const web3 = new Web3();
    const privateKey = process.env.H2K_KEY;
    const dataToSign = JSON.stringify({});
    const sign = web3.eth.accounts.sign(dataToSign, privateKey);

    const headers = {
        'x-app-ec-from': process.env.H2K_FROM,
        'x-app-ec-sign-r': sign.r,
        'x-app-ec-sign-s': sign.s,
        'x-app-ec-sign-v': sign.v
    };
    let url = 'https://my.h2k.me/get-neoetf-wallets';

    try {
        const response = await axios.post(url, {}, {headers: headers});

        let data = response.data;
        // console.log(data);

        if (data) {
            const wallets = data.sort(function (a, b) {
                return a.wallet_id - b.wallet_id
            });
            // console.log('IM HERE 1');
            // console.log(wallets);

            for (const w of wallets) {
                // console.log(w);
                await addWallet(w);
            }
        }

    } catch (e) {
        console.error("Ошибка при получении кошельков:", e.stack);
        throw e;
    }

}

exports.getWalletNeo = getWalletNeo;

async function addWallet(w){
    try {
        const t = await pool.query(
            "SELECT * FROM f_add_wallet($1, $2, $3, $4, $5)",
            [
                w.addr,
                w.wallet_id,
                w.info,
                w.name,
                w.network
            ]
        );
        console.log(t.rows[0]);
    } catch (e) {
        console.error("Ошибка при запросе", e.stack);
    }
}

// async function main() {
//     try {
//         await getWalletNeo();
//         console.log('Wallets processed successfully.');
//     } catch (error) {
//         console.error('Error processing wallets:', error);
//     }
// }
//
// main();