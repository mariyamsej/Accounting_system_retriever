const {pool} = require("./db");
const account = require("./account");
const TronWeb = require('tronweb')
const axios = require("axios");

async function addAccount(req, res, next) {
    for (const account of req.accounts) {
        if (account.reg_date < Date.now() / 1000) { // нужен epoch с миллисекундами
            account.reg_date = account.reg_date * 1000
        }
        //console.log(account.network === 5000 || account.network === 5010 ? '\\x' + TronWeb.address.toHex(account.addr) : account.addr)
        if (account.network === 5000 || account.network === 5010) {
            console.log(TronWeb.address.toHex(account.addr) + ' : ' + account.addr)
        }
        req.r = await pool.query(
            "SELECT * FROM f_add_address($1,$2,$3,$4,$5,$6,$7,$8)",
            [
                account.uuid,
                account.reg_date,
                account.network,
                account.name,
                account.wallet_type,
                account.addr,
                account.info,
                account.network === 5000 || account.network === 5010 ? '\\x' + TronWeb.address.toHex(account.addr) : null
            ]
        )
    }
    next()
}

exports.addAccount = addAccount

async function getAccount(uuid) {
    const r = await pool.query(
        "SELECT a.id, w.network_id as network, w.name as wallet, addr.address as addr, w.type as wallet_type FROM accounts a, wallets w, addresses addr \
         WHERE a.uuid = $1 \
            AND w.account_id = a.id \
            AND addr.wallet_id = w.id",
        [uuid]
    ).catch(e => {
        console.log(e);
        return null
    });
    return r.rows
}

exports.getAccount = getAccount

async function addTmpWallets(req, res, next) {
    for (const tmpWallet of req.tmpWallets) {
        if (tmpWallet.network === '5000' || tmpWallet.network === '5010') {
            console.log(TronWeb.address.toHex(tmpWallet.addr) + ' : ' + tmpWallet.addr)
        }
        req.r = await pool.query(
            "SELECT * FROM f_add_tmp_wallets($1,$2,$3,$4)",
            [
                tmpWallet.walletName,
                tmpWallet.network,
                tmpWallet.addr,
                tmpWallet.network === '5000' || tmpWallet.network === '5010' ? '\\x' + TronWeb.address.toHex(tmpWallet.addr) : null
            ]
        )
    }
    next()
}

exports.addTmpWallets = addTmpWallets

async function getTmpAddress(req, res, next) {
    try {
        const a = await pool.query(
            "SELECT * FROM f_get_tmp_address($1,$2,$3,$4,$5,$6,$7,$8,$9)",
            [
                req.network,
                req.mGroup,
                Date.now(),
                req.mOrder,
                req.merchant_id,
                req.summ,
                req.m_type,
                req.token_id,
                req.mProduct
            ]
        )
        req.r = a.rows
    } catch (error) {
        if (error.detail === undefined) {
            console.log('err: ', error)
            req.r = {err: error}
        } else {
            console.log('err: ', error.detail)
            req.r = {err: error.detail}
        }
    }
    next()
}

exports.getTmpAddress = getTmpAddress

async function releaseTmpAddress(m_type, mOrder, merchantID) {
    return await pool.query(
        "SELECT * FROM f_release_tmp_address($1,$2,$3,$4)",
        [
            Date.now(),
            mOrder,
            m_type,
            merchantID
        ]
    )
}

exports.releaseTmpAddress = releaseTmpAddress

async function releaseAllTmpAddress(m_minut) {
    const d_do = Date.now() - m_minut * 60 * 1000
    const a = await pool.query(
        "SELECT m_type, m_order, merchant_id from m_orders o, m_address_link l WHERE o.id = l.m_order_id AND l.ts < $1;",
        [
            d_do
        ]
    )
    console.log('do release orders:\n', a.rows)
    for (const m of a.rows) {
        await account.releaseTmpAddress(m.m_type, m.m_order, m.merchant_id)
    }
}

exports.releaseAllTmpAddress = releaseAllTmpAddress

async function activeMAddresses(network_id) {
    const r = await pool.query(
        "SELECT address, address_b FROM m_address a, m_address_link l\
        WHERE a.id = l.m_address_id AND a.active AND a.network_id = $1;", [network_id]
    )
    return r.rows
}

exports.activeMAddresses = activeMAddresses

async function allTmpAddresses(network_id) {
    const r = await pool.query(
        "SELECT id, address FROM m_address WHERE active AND network_id = $1;",
        [network_id]
    )
    return r.rows
}

exports.allTmpAddresses = allTmpAddresses

async function getAllAccountAddresses(network_id) {
    const r = await pool.query(
        "SELECT id, address, address_b FROM addresses \
        where network_id = $1 and account_id is not null",
        [network_id]
    )
    return r.rows
}

exports.getAllAccountAddresses = getAllAccountAddresses

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBalances(address) {
    const url = `https://api.trongrid.io/v1/accounts/${address}`;
    const config = {
        headers: {'TRON-PRO-API-KEY': process.env.TRONGRID_KEY}
    };
    let usdtBalance = 0, trxBalance = 0, tlcaBalance = 0, ldftBalance = 0;

    try {
        console.log("I'M HERE 1");
        const response = await axios.get(url, config);
        const data = response.data.data;
        console.log(response.data.data[0]);

        if (!Array.isArray(data) || data.addr_length === 0) {
            console.warn(`Empty balances for ${address}`);
            return { usdtBalance, trxBalance, tlcaBalance, ldftBalance };
        }

        const trc20Tokens = data[0]?.trc20 ?? null;
        const usdtTokenAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT token address on Tron

        if (trc20Tokens) {
            for (const token of trc20Tokens) {
                if (token[usdtTokenAddress]) {
                    usdtBalance = token[usdtTokenAddress];
                }
            }
        }

        console.log("I'M HERE 2");
        const trc10Tokens = data[0]?.assetV2 ?? null;

        if (trc10Tokens) {
            for (const token of trc10Tokens) {
                if (token.key === "1005031") {
                    ldftBalance = token.value;
                } else if (token.key === "1005032") {
                    tlcaBalance = token.value;
                }
            }
        }

        console.log("I'M HERE 3");
        trxBalance = data[0]?.balance ?? 0;
        return { usdtBalance, trxBalance, tlcaBalance, ldftBalance };

    } catch (error) {
        console.error(`Error fetching balances for ${address}: ${error}`);
        return null;
    }
}
exports.fetchBalances = fetchBalances;


// Function to update USDT balances in the database
async function updateTronBalances(network_id) {
    try {
        const rows = await pool.query(
            "SELECT address, wallet_id FROM test_wallet WHERE network = $1", [network_id]
        );

        console.log("******")

        for (const row of rows.rows) {
            //await delay(10);

            if (!row.address){
                console.warn(`Skipping empty address for wallet_id ${row.wallet_id}`);
                continue;
            }

            const balances = await fetchBalances(row.address);

            await pool.query(
                "UPDATE test_wallet SET usdt_amount = $1, trx_amount = $2, ldft_amount = $3, tlca_amount = $4 WHERE address = $5",
                [balances.usdtBalance / 1000000.0, balances.trxBalance / 1000000.0, balances.ldftBalance / 1000000.0, balances.tlcaBalance / 1000000.0, row.address]
            );

            console.log("!!!!!!");

            const query =`
                INSERT INTO balances_history (ts, usdt_balance, trx_balance, ldft_balance, tlca_balance, neo_id)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;

            const now = new Date();
            const localDate = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // Adds 5 hours in milliseconds to the current UTC time
            localDate.toISOString()
            const values = [
                localDate.toISOString(),
                balances.usdtBalance / 1000000.0,   // Adjusting balances as per your example if needed
                balances.trxBalance / 1000000.0,
                balances.ldftBalance / 1000000.0,
                balances.tlcaBalance / 1000000.0,
                row.wallet_id
            ];

            try {
                await pool.query(query, values);
                //console.log('Insertion successful');
            } catch (err) {
                console.error('Error during the database insertion', err.stack);
            }
            //console.log(Updated balances for ${row.address}.);
        }
        console.log('Finished updating balances.');
    } catch (err) {
        console.error('Error updating balances', err);
    }
}
exports.updateTronBalances = updateTronBalances;

async function updateTest(network_id) {

    const rows = await pool.query(
        "SELECT address, neo_id FROM wallets_neo WHERE  neo_id = 9230",
    );

    console.log("???????")

    for (const row of rows.rows) {
        //await delay(10);
        const balances = await fetchBalances(row.address);
        if (balances === null) {
            //console.log(`Error updating balances of ${row.address}`);
            continue;
        }
        await pool.query(
            "UPDATE wallets_neo SET usdt_amount = $1, trx_amount = $2, ldft_amount = $3, tlca_amount = $4 WHERE address = $5",
            [balances.usdtBalance / 1000000.0, balances.trxBalance / 1000000.0, balances.ldftBalance / 1000000.0, balances.tlcaBalance / 1000000.0, row.address]
        );
        console.log("!!!!!!");
        const query = `
            INSERT INTO balances_history (ts, usdt_balance, trx_balance, ldft_balance, tlca_balance, neo_id)
            VALUES ($1, $2, $3, $4, $5, $6);
        `;
        const now = new Date();
        const localDate = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // Adds 5 hours in milliseconds to the current UTC time
        localDate.toISOString()
        const values = [
            localDate.toISOString(),
            balances.usdtBalance / 1000000.0,   // Adjusting balances as per your example if needed
            balances.trxBalance / 1000000.0,
            balances.ldftBalance / 1000000.0,
            balances.tlcaBalance / 1000000.0,
            row.neo_id
        ];
        try {
            await pool.query(query, values);
            //console.log('Insertion successful');
        } catch (err) {
            //console.error('Error during the database insertion', err.stack);
        }
        //console.log(`Updated balances for ${row.address}.`);
    }
    console.log(`Finished updating balances.`);
}

exports.updateTest = updateTest;
