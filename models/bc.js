const Web3 = require("web3")
const TronWeb = require('tronweb')
const TronGrid = require('trongrid');
const tx = require("./tx");
const {pool} = require("./db");
const account = require("./account");
const {allToHEX, toBNtext, toBN} = require("./math");
const axios = require('axios');

const running = {}

running['5000'] = false
running['5010'] = true
running['6000'] = false
running['6010'] = false

let wallet_dump = new Set();

wallet_dump.add("410b199bea38c797390bc8ae13930a0b08990bee44")

wallet_dump.add("412697c3d2e87a818db1e610aa211d425a23930510")

wallet_dump.add("41cfb7f3916d865b682738202e3ec30867a1447c85")

// One SELECT to get list of all wallets, save it in set, and check all transactions
//wallets from this set

/*
running.updateBalanceTRC20 = {}
running.updateBalanceTRC20['5000'] = false
running.updateBalanceTRC20['5010'] = false
running.updateBalanceTRC20['6000'] = false
running.updateBalanceTRC20['6010'] = false

running.updateTmpBalanceTRC20 = {}
running.updateTmpBalanceTRC20['5000'] = false
running.updateTmpBalanceTRC20['5010'] = false
running.updateTmpBalanceTRC20['6000'] = false
running.updateTmpBalanceTRC20['6010'] = false

running.updateBalanceTRX = {}
running.updateBalanceTRX['5000'] = false
running.updateBalanceTRX['5010'] = false
running.updateBalanceTRX['6000'] = false
running.updateBalanceTRX['6010'] = false

running.updateTmpBalanceTRX = {}
running.updateTmpBalanceTRX['5000'] = false
running.updateTmpBalanceTRX['5010'] = false
running.updateTmpBalanceTRX['6000'] = false
running.updateTmpBalanceTRX['6010'] = false

running.searchLoop = {}
running.searchLoop['5000'] = false
running.searchLoop['5010'] = false
running.searchLoop['6000'] = false
running.searchLoop['6010'] = false

running.searchLoopTmp = {}
running.searchLoopTmp['5000'] = false
running.searchLoopTmp['5010'] = false
running.searchLoopTmp['6000'] = false
running.searchLoopTmp['6010'] = false
*/


/*
ETH_NODE_ADDRESS = https://sepolia.infura.io/v3/5cdd76a8b93d4210aa9b63d1654e448b
TRX_FULL_NODE = https://nile.trongrid.io
TRX_SOLIDITY_NODE = https://nile.trongrid.io
TRX_EVENT_SERVER = https://nile.trongrid.io
 */


// async function insertTransactionData(transactionData) {
//     // Example using a hypothetical PostgreSQL setup
//     const query = 'INSERT INTO tx_test (tx_id, block_number, from_address, to_address, amount, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;';
//     const values = [
//         transactionData.txID,
//         transactionData.blockNumber,
//         transactionData.fromAddress,
//         transactionData.toAddress,
//         transactionData.amount,
//         transactionData.timestamp
//     ];
//
//     try {
//         const res = await pool.query(query, values);
//         console.log('Inserted transaction:', res.rows[0]);
//     } catch (err) {
//         console.error('Error inserting transaction data:', err);
//     }
// }

/*
async function loadAndSaveAddressTransactions(network_id, address) {
    pool.query('SELECT address_b FROM addresses', (error, results, fields) => {
        if (error) throw error;

        // Iterate over the results and add each one to the Set
        results.forEach(row => {
            wallet_dump.add(row.address_b);
        });
    const tronWeb = new TronWeb({
        fullHost: process.env[network_id + '_TRX_FULL_NODE'], // Ensure you have the correct full node address here
        headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY }
    });

    const tronGrid = new TronGrid(tronWeb);
    const options = {
        only_to: true,
        only_from: true,
        only_confirmed: true,
        limit: 200, // Adjust based on your needs
        order_by: 'timestamp,desc',
    };

    try {
        const transactionsResponse = await tronGrid.account.getTransactions(address, options);
        const transactions = transactionsResponse.data;

        for (const transaction of transactions) {
            const transactionData = {
                txID: transaction.txID,
                blockNumber: transaction.blockNumber, // You might need to adjust these property names based on the actual structure of the response
                fromAddress: transaction.raw_data.contract[0].parameter.value.owner_address, // Adjust according to actual data structure
                toAddress: transaction.raw_data.contract[0].parameter.value.to_address, // Adjust according to actual data structure
                amount: transaction.raw_data.contract[0].parameter.value.amount, // Adjust according to actual data structure
                timestamp: transaction.raw_data.timestamp, // Adjust according to actual data structure
            };
            await insertTransactionData(transactionData);
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
    }
}
*/
async function getBalanceTRX(network_id, address) {

    /*
    let tronWeb
    const TRX_FULL_NODE_MY = process.env[network_id+'_TRX_FULL_NODE_MY']

    try {
        if (TRX_FULL_NODE_MY.includes("trongrid.io")) {
            tronWeb = new TronWeb(
                {
                    fullHost: TRX_FULL_NODE_MY,
                    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY },
                    privateKey: process.env.ACCOUNTING_PK
                }
            );
        } else {
            tronWeb = new TronWeb(
                TRX_FULL_NODE_MY,
                process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
                process.env[network_id+'_TRX_EVENT_SERVER_MY']
                );
        }
        /*
        const tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        */
    try {
        const tronWeb = getTronWeb(network_id, 'auto')
        return await tronWeb.trx.getBalance(address)
    } catch (err) {
        console.log('getBalanceTRX ' + err.name + ": " + err.message)
        return ({err: err.message})
    }

}

exports.getBalanceTRX = getBalanceTRX

async function updateBalanceTRX(network_id) {
    if (running[network_id] !== true) {
        running[network_id] = true
        console.log(network_id + ' Balance TRX')
        const start_0 = Date.now()
        let bal
        let b
        const decimals = 6
        const addresses = await account.getAllAccountAddresses(network_id)
        for (const a of addresses) {
            bal = (await getBalanceTRX(network_id, a.address))
            if (bal >> 0) {
                b = await pool.query(
                    "SELECT * FROM f_update_balance($1,$2,$3,$4,$5,$6)",
                    [0, network_id, a.id, bal, allToHEX(bal), decimals]
                )
                if (b.rows[0].id !== null) {
                    console.log('updated balance TRX:\n', JSON.stringify(b.rows[0]))
                }
            }
        }
        console.log(network_id + ' Balance TRX [' + Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addresses.length + ' addrs]')
        running[network_id] = false
    }
}

exports.updateBalanceTRX = updateBalanceTRX


async function updateTmpBalanceTRX(network_id) {
    if (running[network_id] !== true) {
        running[network_id] = true
        console.log(network_id + ' TMP Balance TRX')
        const start_0 = Date.now()
        let bal
        let b
        const decimals = 6
        const addresses = await account.allTmpAddresses(network_id)
        for (const a of addresses) {
            bal = (await getBalanceTRX(network_id, a.address))
            if (bal >> 0) {
                b = await pool.query(
                    "SELECT * FROM f_update_tmp_balance($1,$2,$3,$4,$5,$6)",
                    [0, network_id, a.id, bal, allToHEX(bal), decimals]
                )
                if (b.rows[0].id !== null) {
                    console.log('updated TMP Balance TRX:\n', JSON.stringify(b.rows[0]))
                }
            }
        }
        running[network_id] = false
        console.log(network_id + ' TMP Balance TRX [' + Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addresses.length + ' addrs]')
    } else {
        //console.log ('updateTmpBalanceTRX - ' + network_id + 'is running')
    }
}

exports.updateTmpBalanceTRX = updateTmpBalanceTRX


async function getAccountTRXTx(req, res, next) {
    console.log('TRX_FULL_NODE', process.env[req.network_id + '_TRX_FULL_NODE'])
    try {
        const tronWeb = new TronWeb(
            /*
            process.env.TRX_FULL_NODE,
            process.env.TRX_SOLIDITY_NODE,
            process.env.TRX_EVENT_SERVER,
             */

            {
                fullHost: process.env[req.network_id + '_TRX_FULL_NODE'],
                headers: {"TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY},
                privateKey: process.env.TRX_TMP_PRIVATE_KEY
            }
        );
        const tronGrid = new TronGrid(tronWeb)
        //tronGrid.setExperimental(process.env.TRON_GRID_API_KEY);
        const address = req.address;

        const options = {
            only_to: false,
            only_from: false,
            only_confirmed: true,
            limit: 100,
            order_by: 'timestamp,asc',
            //min_timestamp: Date.now() - 600000000 // from a 10000 minute ago to go on
            min_timestamp: 1592384889,
            max_timestamp: Date.now()
        };

        req.transactions = await tronGrid.account.getTransactions(address, options)
        next()
    } catch (err) {
        console.log(err.name + ": " + err.message)
        res.send('{"err":"' + err.message + '"}')
    }
    next()
}

exports.getAccountTRXTx = getAccountTRXTx

async function getAccountTrc20Tx(network_id, address) {
    console.log(process.env[network_id + '_TRX_FULL_NODE'])
    try {
        const tronWeb = new TronWeb(
            {
                fullHost: process.env[network_id + '_TRX_FULL_NODE'],
                headers: {"TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY},
                privateKey: process.env.TRX_TMP_PRIVATE_KEY
            }
        );
        const tronGrid = new TronGrid(tronWeb)
        //tronGrid.setExperimental(process.env.TRON_GRID_API_KEY);

        const options = {
            only_to: false,
            only_from: false,
            only_confirmed: true,
            limit: 100,
            order_by: 'timestamp,asc',
            min_timestamp: Date.now() - 6000000000,// from a 100000 minute ago to go on
            //min_timestamp: 1592384889,
            max_timestamp: Date.now()
        };

        return await tronGrid.account.getTrc20Transactions(address, options)

    } catch (err) {
        console.log(err.name + ": " + err.message)
        return {err: err.message}
    }
}

exports.getAccountTrc20Tx = getAccountTrc20Tx

async function searchTrc20TxM(network_id, all = false) {

    let addresses
    if (all) {
        addresses = await pool.query(
            "SELECT address FROM m_address a, m_address_link l, m_address_link_history lh \
            WHERE (a.id = l.m_address_id or a.id = lh.m_address_id) AND a.network_id = $1 group by address",
            [network_id]
        )
    } else {
        addresses = await pool.query(
            "SELECT address FROM m_address a, m_address_link l\
            WHERE a.id = l.m_address_id and a.network_id = $1;",
            [network_id]
        )
    }
    console.log("addresses " + addresses.rows.length)
    for (const a of addresses.rows) {
        const txs = await getAccountTrc20Tx(network_id, a.address)

        for (const tx of txs.data) {
            const t = await pool.query(
                "SELECT * FROM f_add_m_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.transaction_id,
                    tx.block_timestamp,
                    +network_id,
                    tx.from,
                    tx.to,
                    tx.token_info.address,
                    tx.value,
                    allToHEX(tx.value),
                    null,
                    toBNtext(0),
                    allToHEX(0),
                    '0'
                ]
            )
            console.log("m_order_id: ", t.rows[0].m_order_id + "")
        }
    }
}

exports.searchTrc20TxM = searchTrc20TxM

async function getTxByBlock(req, res, next) {
    try {
        /*const tronWeb = new TronWeb(
            process.env[req.network_id+'_TRX_FULL_NODE_MY'],
            process.env[req.network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[req.network_id+'_TRX_EVENT_SERVER_MY']
        );
        */
        const tronWeb = getTronWeb(req.network_id, 'auto')
        req.transactions = await tronWeb.trx.getTransactionFromBlock(req.blockNumber)
        next()
    } catch (err) {
        console.log(err)
        res.send({err: err})
    }
}

exports.getTxByBlock = getTxByBlock


async function getTxByHash(req, res, next) {
    try {
        /*
        const tronWeb = new TronWeb(
            process.env[req.network_id+'_TRX_FULL_NODE_MY'],
            process.env[req.network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[req.network_id+'_TRX_EVENT_SERVER_MY']
        );
        */
        const tronWeb = getTronWeb(req.network_id, 'auto')
        req.transactions = await tronWeb.trx.getTransaction(req.hash)
        next()
    } catch (err) {
        console.log(err)
        res.send({err: err})
    }
}

exports.getTxByHash = getTxByHash

async function searchMTx(network_id, addresses, q = 1000, blockNumber = 0) {
    let blocks = 0
    let currentBlock
    const rescan = blockNumber !== 0
    /*
    let tronWeb
    try {
        tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        currentBlock = await tronWeb.trx.getCurrentBlock()
    } catch (err){
        try {
            tronWeb = new TronWeb(
                {
                    fullHost: process.env[network_id+'_TRX_FULL_NODE'],
                    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY },
                    privateKey: process.env.TRX_TMP_PRIVATE_KEY
                })
            currentBlock = await tronWeb.trx.getCurrentBlock()
            //const tronGrid = new TronGrid(tronWeb)
            console.log('*** use tronGrid ***')
        } catch (err){
            console.log(err.message)
            return
        }
    }
    */
    const tronWeb = getTronWeb(network_id, 'auto').catch(
        err => {
            console.log(err)
            return err
        }
    )
    if (tronWeb.errno) return

    currentBlock = await tronWeb.trx.getCurrentBlock().catch(
        err => {
            console.log(err)
            return err
        }
    )
    if (currentBlock.errno) return

    let start = Date.now()
    let block = {}
    let TXs = 0
    const r = await pool.query(
        "SELECT value FROM params WHERE param = 'bc_m_tx_lastblock' AND network_id = $1;",
        [network_id]
    )
    const last_block = blockNumber === 0 ? r.rows[0].value * 1 : blockNumber - q - 15
    for (let i = 0; i < q; i++) {
        try {
            if (blockNumber !== 0) {
                if (blockNumber % 100 > 0) {
                    block = await tronWeb.trx.getBlock(blockNumber)
                } else {
                    block = await tronWeb.trx.getBlock(blockNumber)
                    //console.log(network_id + " ["+ Math.floor((Date.now()-start)/1000)+' sec] checked #', blockNumber)
                    start = Date.now() // время начала обработки следующей десятки блоков
                }
            } else {
                blockNumber = currentBlock.block_header.raw_data.number - 3
                block = await tronWeb.trx.getBlock(blockNumber)
                await pool.query(
                    "UPDATE params SET value = $1 WHERE param = 'bc_m_tx_lastblock' AND network_id = $2;",
                    [blockNumber, network_id]
                )
            }
            if (block.transactions) {
                TXs = TXs + block.transactions.length
                //console.log(blockNumber)
                block.transactions.forEach(t => {
                    if (t.ret[0].contractRet === 'SUCCESS') {
                        addresses.forEach(a => {
                            //const aHex = tronWeb.address.toHex(a.address)
                            const aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                            const subHex = aHex.substring(2)
                            let fn_hex;
                            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                                } else {
                                    fn_hex = '0'
                                }
                                if (fn_hex === 'a9059cbb') {
                                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                    if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.slice(8, 72).indexOf(subHex) !== -1) {
                                        console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        tx.addMTx(t, network_id, rescan)
                                    }
                                }
                            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                                if (t.raw_data.contract[0].parameter.value.to_address === aHex) {
                                    console.log('addMTx addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                    t.blockNumber = blockNumber
                                    tx.addMTx(t, network_id, rescan)
                                }
                            }
                        })
                    } else {
                        //    console.log ('contractRet ',t.ret[0].contractRet + '\n' + t.txID)
                    }
                })
            }
        } catch (err) {
            console.log('searchMTx ' + err.message)
        }
        blockNumber = blockNumber - 1
        blocks = blocks + 1
        if (last_block > blockNumber) i = q // -2 на случай если 3 последних блока поменялись
    }
    return blockNumber + ') ' + blocks + ':' + TXs
}

exports.searchMTx = searchMTx


async function searchTx(network_id, addresses, q = 1000, blockNumber = 0) {
    let blocks = 0
    let currentBlock
    /*
    let tronWeb
    try {
        tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        currentBlock = await tronWeb.trx.getCurrentBlock()
    } catch (err){
        try {
            tronWeb = new TronWeb(
                {
                    fullHost: process.env[network_id+'_TRX_FULL_NODE'],
                    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY },
                    privateKey: process.env.TRX_TMP_PRIVATE_KEY
                })
            currentBlock = await tronWeb.trx.getCurrentBlock()
            //const tronGrid = new TronGrid(tronWeb)
            console.log('*** use tronGrid ***')
        } catch (err){
            console.log(err.message)
            return
        }
    }
    */
    const tronWeb = getTronWeb(network_id, 'auto')
    currentBlock = await tronWeb.trx.getCurrentBlock()
    let start = Date.now()
    let block = {}
    let TXs = 0
    let last_block
    let fn_hex
    let contractRet
    let tType
    let cValue
    let cData
    let aHex
    let subHex
    const r = await pool.query(
        "SELECT value FROM params WHERE param = 'bc_tx_lastblock' AND network_id = $1;",
        [network_id]
    )

    if (blockNumber === 0) {
        last_block = r.rows[0].value * 1
    } else {
        last_block = blockNumber - q - 15
    }

    for (let i = 0; i < q; i++) {

        try {
            if (blockNumber !== 0) {
                if (blockNumber % 100 > 0) {
                    block = await tronWeb.trx.getBlock(blockNumber)
                } else {
                    block = await tronWeb.trx.getBlock(blockNumber)
                    console.log(network_id + " [" + Math.floor((Date.now() - start) / 1000) + ' sec] checked #', blockNumber)
                    start = Date.now() // время начала обработки следующей десятки блоков
                }
            } else {
                blockNumber = currentBlock.block_header.raw_data.number - 3
                block = await tronWeb.trx.getBlock(blockNumber)
                await pool.query(
                    "UPDATE params SET value = $1 WHERE param = 'bc_tx_lastblock' AND network_id = $2;",
                    [blockNumber, network_id]
                )
            }
            if (block.transactions) {
                TXs = TXs + block.transactions.length

                for (const t of block.transactions) {
                    contractRet = t.ret[0].contractRet
                    if (contractRet === 'SUCCESS' || contractRet === 'OUT_OF_ENERGY' || contractRet === 'REVERT') {
                        tType = t.raw_data.contract[0].type
                        cValue = t.raw_data.contract[0].parameter.value
                        cData = cValue.data
                        switch (tType) {
                            case 'TriggerSmartContract' :
                                fn_hex = cData !== undefined ? cData.substring(0, 8) : '0'
                                if (fn_hex === 'a9059cbb') {
                                    for (const a of addresses) {
                                        //subHex = TronWeb.address.toHex(a.address).substring(2)
                                        subHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex').substring(2) : TronWeb.address.toHex(a.address).substring(2)
                                        //if (subHex !== '' && cData.slice(8, 72).indexOf(subHex) !== -1) {
                                        if (subHex !== '' && cData.indexOf(subHex, 8) !== -1) {
                                            console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                            t.blockNumber = blockNumber
                                            await tx.addTx(t, network_id)
                                        }
                                    }
                                }
                                break;
                            case 'TransferContract' :
                                for (const a of addresses) {
                                    //aHex = TronWeb.address.toHex(a.address)
                                    aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                                    if (cValue.to_address === aHex) {
                                        console.log('addr ', a.address + ' = ' + aHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        await tx.addTx(t, network_id)
                                    }
                                }
                                break;
                        }
                    }
                }
            }
        } catch (err) {
            console.log('searchTx ' + err.message)
        }
        blockNumber = blockNumber - 1
        blocks = blocks + 1

        if (last_block > blockNumber) i = q // -2 на случай если 3 последних блока поменялись
    }
    return blockNumber + ') ' + blocks + ':' + TXs
}

exports.searchTx = searchTx

// async function searchSpecTx(network_id) {
//     network_id = 5000;
//     const walletAddress = 'TAyu7Wv9JFShfiLnUJDpWJgUAFriT4ufcz'
//     try {
//         const config = {
//             headers: {
//                 'TRON-PRO-API-KEY': 'b7545730-2d3b-4cab-988c-9ce7c03de12c'
//             }
//         };
//         // Construct the URL with the wallet address parameter
//         const url = `https://api.trongrid.io/v1/accounts/${walletAddress}/transactions`;
//         const response = await axios.get(url, config);
//         console.log(response.data);
//         for (const t of response.data.data) {
//             let fn_hex;
//             if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
//                 if (t.raw_data.contract[0].parameter.value.data !== undefined) {
//                     fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
//                 } else {
//                     fn_hex = '0'
//                 }
//                 if (fn_hex === 'a9059cbb') {
//                     //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
//                     //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
//                     console.log('tx.txID: ' + t.txID)
//                     await tx.addTxTest(t, 5000)
//                 }
//             } else if (t.raw_data.contract[0].type === 'TransferContract') {
//                 console.log('tx.txID: ' + t.txID)
//                 await tx.addTxTest(t, 5000)
//             }
//         }
//     } catch (err) {
//         console.error('Error executing query', err.stack);
//     }
// }
// exports.searchSpecTx = searchSpecTx;

async function searchSpecTx(network_id, walletAddressTemp) {
    let error_cnt = 0;
    network_id = 5000; // This seems to be a hardcoded value. Ensure it's being used as intended.
    const walletAddress = walletAddressTemp;
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': 'b9ec3834-31b3-4a98-a795-4fe7ccbd7398'
            }
        };
        const limit = 200; // Adjust based on what you find optimal
        let transactions = [];
        let moreTransactions = true;
        let url = `https://api.trongrid.io/v1/accounts/` + walletAddress + `/transactions?&only_confirmed=true&limit=200`;
        console.log(moreTransactions)

        while (moreTransactions) {

            const response = await axios.get(url, config);
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log(response.data.meta.links);
            if (response.data && response.data.data && response.data.data.length > 0) {
                console.log(response.data.data.length, " ", response.data.meta.at, " ", transactions.length)
                console.log(url)
                console.log(transactions.slice(-1))
                transactions = transactions.concat(response.data.data);
                url = response.data.meta.links.next
            } else {
                moreTransactions = false; // No more transactions to fetch
            }
        }

        for (const t of transactions) {
            console.log(t)
            let fn_hex;
            try {
                if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                    if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                        fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8);
                    } else {
                        fn_hex = '0';
                    }
                    if (fn_hex === 'a9059cbb') {
                        console.log('tx.txID: ' + t.txID);
                        await tx.addTx(t, network_id);
                    }
                } else if (t.raw_data.contract[0].type === 'TransferContract') {
                    console.log('tx.txID: ' + t.txID);
                    await tx.addTx(t, network_id);
                }
            } catch (e) {
                error_cnt++;
                console.log("PARSE ERROR ", error_cnt)
            }
        }
        console.log("PARSE ERROR ", error_cnt);
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
    console.log("PARSE ERROR ", error_cnt);
}

exports.searchSpecTx = searchSpecTx;


async function searchTLCATX(network_id, walletAddressTemp) {
    let error_cnt = 0;
    network_id = 5000; // This seems to be a hardcoded value. Ensure it's being used as intended.
    const walletAddress = walletAddressTemp;
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': '6551207c-23e5-435d-a947-4aecd029444a'
            }
        };
        const limit = 200; // Adjust based on what you find optimal
        let transactions = [];
        let moreTransactions = true;
        let url = `https://api.trongrid.io/v1/accounts/` + walletAddress + `/transactions?&only_confirmed=true&limit=200&min_block_timestamp=1722932196000`;

        while (moreTransactions) {
            const response = await axios.get(url, config);
            await new Promise(resolve => setTimeout(resolve, 100));
            if (response.data && response.data.data && response.data.data.length > 0) {
                //console.log(response.data.data.length, " ", response.data.meta.at, " ", transactions.length)
                //console.log(url)
                //console.log(transactions.slice(-1))
                transactions = transactions.concat(response.data.data);
                if (response.data.meta.links) {
                    url = response.data.meta.links.next
                } else {
                    moreTransactions = false;
                }
                console.log("urled2")
            } else {
                moreTransactions = false; // No more transactions to fetch
            }
        }


        for (const t of transactions) {
            let fn_hex;
            try {
                //console.log(t)
                if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                    if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                        fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8);
                    } else {
                        fn_hex = '0';
                    }
                    if (fn_hex === 'a9059cbb') {
                        //console.log('tx.txID: ' + t.txID);
                        await tx.addTxTest(t, network_id, undefined);
                    }
                } else if (t.raw_data.contract[0].type === 'TransferContract') {
                    //console.log('tx.txID: ' + t.txID);
                    await tx.addTxTest(t, network_id, undefined);
                } else if (t.raw_data.contract[0].type === 'TransferAssetContract') {
                    if (t.raw_data.contract[0].parameter.value.amount == undefined) {
                        continue;
                    }
                    if (t.raw_data.contract[0].parameter.value.asset_name === "1005032") {
                        console.log('tx.txID: ' + t.txID);
                        await tx.addAssetTx(t, network_id);
                    } else if (t.raw_data.contract[0].parameter.value.asset_name === "1005031") {
                        console.log('tx.txID: ' + t.txID);
                        await tx.addAssetTx(t, network_id);
                    }
                }
            } catch (e) {
                error_cnt++;
                console.log("PARSE ERROR ", error_cnt)
                console.log(e)
                console.log(t)
            }
        }
        console.log("PARSE ERROR ", error_cnt);
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
    console.log("PARSE ERROR ", error_cnt);
}

exports.searchTLCATX = searchTLCATX;


async function searchSpecTxTRC20(network_id, walletAddressTemp) {
    network_id = 5000;
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': process.env.TRONGRID_KEY
            }
        };
        const limit = 200; // Adjust based on what you find optimal
        let transactions = [];
        let moreTransactions = true;
        let url = `https://api.trongrid.io/v1/accounts/${walletAddressTemp}/transactions/trc20?&only_confirmed=true&limit=200&only_to=true`;

        while (moreTransactions) {
            try {
                const response = await axios.get(url, config);
                await new Promise(resolve => setTimeout(resolve, 100));

//            console.log('***** API:', response.data);

                if (response.data && response.data.data && response.data.data.length > 0) {
                    transactions = response.data.data

                    // console.log('IM HERE')
                    console.log(response.data.data.length, " ", response.data.meta.at, " ", transactions.length)
                    console.log(url)
                    // console.log(transactions.slice(-1))

                    for (const t of transactions) {
                        await tx.addTxTestTRC20(t, network_id);
                        console.log('!!!!! added');
                    }

                    if (response.data.meta.links && response.data.meta.links.next) {
                        url = response.data.meta.links.next;
                    } else {
                        console.log('***** No more next link available');
                        moreTransactions = false; // No more transactions to fetch
                    }

                } else {
                    console.log('***** No more transactions to fetch');
                    moreTransactions = false; // No more transactions to fetch
                }
            } catch (err) {
                console.error('Error fetching data from API', err.message);
                moreTransactions = false;
            }
        }
        console.log(`Finished download.`);
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}

exports.searchSpecTxTRC20 = searchSpecTxTRC20;


// Подгружает транзакции
async function loadNewTx(network_id = 5000, blockNumber) {
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': 'b7545730-2d3b-4cab-988c-9ce7c03de12c'
            }
        };
        // Construct the URL with the wallet address parameter
        const url = `https://api.trongrid.io/wallet/getblockbynum`;
        //blockNumber = 58854606; // Example block number


        // Use async/await instead of .then()
        const response = await axios.post(url, {
            num: blockNumber
        }, config);
        console.log(response.data);
        for (const t of response.data.transactions) {
            let fn_hex;
            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                } else {
                    fn_hex = '0'
                }
                if (fn_hex === 'a9059cbb') {
                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                    console.log('tx.txID: ' + t.txID)
                    await tx.addTxTest(t, network_id, blockNumber)
                }
            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                console.log('tx.txID: ' + t.txID)
                await tx.addTxTest(t, network_id, blockNumber)
            }
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}

exports.loadNewTx = loadNewTx;

async function processBlocksFromNtoM() {
    for (let blockNumber = 5800000; blockNumber <= 5800005; blockNumber++) {
        await loadNewTx(blockNumber);
    }
}

async function loadPrototype(network_id = 5000) {
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': 'b7545730-2d3b-4cab-988c-9ce7c03de12c'
            }
        };
        // Construct the URL with the wallet address parameter
        const url = `https://api.trongrid.io/wallet/getblockbylimitnext`;


        // Use async/await instead of .then()
        const response = await axios.post(url, {
            startNum: 58854600,
            endNum: 58854700
        }, config);

        const response2 = await axios.post(url, {
            startNum: 58854700,
            endNum: 58854800
        }, config);

        const response3 = await axios.post(url, {
            startNum: 58854800,
            endNum: 58854900
        }, config);

        const response4 = await axios.post(url, {
            startNum: 58854900,
            endNum: 58855000
        }, config);

        const response5 = await axios.post(url, {
            startNum: 58855000,
            endNum: 58855100
        }, config);

        const response6 = await axios.post(url, {
            startNum: 58855100,
            endNum: 58855200
        }, config);

        const response7 = await axios.post(url, {
            startNum: 58855200,
            endNum: 58855300
        }, config);

        const response8 = await axios.post(url, {
            startNum: 58855300,
            endNum: 58855400
        }, config);

        const response9 = await axios.post(url, {
            startNum: 58855400,
            endNum: 58855500
        }, config);
        const response10 = await axios.post(url, {
            startNum: 58855500,
            endNum: 58855600
        }, config);

        console.log(response.data);
        console.log(response2.data);
        console.log(response3.data);
        console.log(response4.data);
        console.log(response5.data);
        console.log(response6.data);
        console.log(response7.data);
        console.log(response8.data);
        console.log(response9.data);
        console.log(response10.data);
        console.log("----end-----")
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}

exports.loadPrototype = loadPrototype;


async function downloadNewTx(network_id = 5000) {
    // console.log(wallet_dump);
    // console.log(!wallet_dump.has("412697c3d2e87a818db1e610aa211d425a23930510"))
    try {
        const config = {
            headers: {
                'TRON-PRO-API-KEY': '0d361ec4-edb7-48e1-bb5b-55eaf52095d8' //b7545730-2d3b-4cab-988c-9ce7c03de12c
            }
        };

        const urlTempBlock = `https://api.trongrid.io/wallet/getblockbynum`;
        const urlNowBlock = `https://api.trongrid.io/wallet/getnowblock`;

        const result = await pool.query(
            "SELECT MAX(num) AS max_num FROM blocks_scanned"
        )
        maxNum = result.rows[0].max_num;

        const blockNumber = Number(maxNum) + 1; // Start block number

        const responseNowBlock = await axios.post(urlNowBlock, {}, config);
        let nowBlockNumber = responseNowBlock.data.block_header.raw_data.number;

        for (let tempBlockNumber = blockNumber; tempBlockNumber <= nowBlockNumber; tempBlockNumber++) {


            const tempBlock = await axios.post(urlTempBlock, {
                num: tempBlockNumber
            }, config);
            console.log("\nReceived block: ", tempBlockNumber);
            if (tempBlock.data.transactions) {

                for (const t of tempBlock.data.transactions) {

                    try {
                        let fn_hex;
                        if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                            // console.log("\n    TriggerSmartContract TxId " + t.txID + " : USDT_to '" + "41" + t.raw_data.contract[0].parameter.value.data.substring(32, 72) +
                            //     "', USDT_from '" + t.raw_data.contract[0].parameter.value.owner_address + "'")
                            if (!wallet_dump.has("41" + t.raw_data.contract[0].parameter.value.data.substring(32, 72)) &&
                                !wallet_dump.has(t.raw_data.contract[0].parameter.value.owner_address)) {
                                // console.log("CONTINUE\n")
                                continue;
                            }
                            // console.log("RECORDING\n")
                            if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                            } else {
                                fn_hex = '0'
                            }


                            if (fn_hex === 'a9059cbb') {
                                //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                console.log('\nReceived transaction: ' + t.txID)
                                // await tx.addTxTestRT(t, network_id, tempBlockNumber)
                            }
                        } else if (t.raw_data.contract[0].type === 'TransferContract') {
                            // console.log("\n    Transfer contract " + t.txID + " : TRX_to '" + "41" + t.raw_data.contract[0].parameter.value.to_address +
                            //     "', TRXfrom '" + t.raw_data.contract[0].parameter.value.owner_address + "'")
                            if (!wallet_dump.has(t.raw_data.contract[0].parameter.value.to_address) &&
                                !wallet_dump.has(t.raw_data.contract[0].parameter.value.owner_address)) {
                                // console.log("CONTINUE\n")
                                continue;
                            }
                            // console.log("RECORDING\n")

                            console.log('\nReceived transaction: ' + t.txID)
                            // await tx.addTxTestRT(t, network_id, tempBlockNumber)
                        }
                    } catch (e) {
                        console.error("Error download tx:", e);
                    }
                }
            }
            const res = await pool.query("INSERT INTO blocks_scanned(num, hash) VALUES($1, $2)", [tempBlockNumber, tempBlock.data.blockID]);
            console.log("Recorded block: ", tempBlockNumber, " ", res.rowCount);
        }
        // Use async/await instead of .then()
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}

exports.downloadNewTx = downloadNewTx;


async function getBlockByNum(blockNumber = 58854605) {
    const config = {
        headers: {
            'TRON-PRO-API-KEY': 'b7545730-2d3b-4cab-988c-9ce7c03de12c'
        }
    };
    // Construct the URL with the wallet address parameter
    const urlTempBlock = `https://api.trongrid.io/wallet/getblockbynum`;
    const urlNowBlock = `https://api.trongrid.io/wallet/getnowblock`;

    // Use async/await instead of .then()
    const response = await axios.post(urlTempBlock, {
        num: blockNumber
    }, config);
}

async function searchAllTx(network_id, addresses, m_addresses, q = 1000, blockNumber = 0) {
    let blocks = 0
    let currentBlock
    const rescan = blockNumber !== 0
    /*
    let tronWeb
    try {
        tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        currentBlock = await tronWeb.trx.getCurrentBlock()
    } catch (err){
        try {
            tronWeb = new TronWeb(
                {
                    fullHost: process.env[network_id+'_TRX_FULL_NODE'],
                    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY },
                    privateKey: process.env.TRX_TMP_PRIVATE_KEY
                })
            currentBlock = await tronWeb.trx.getCurrentBlock()
            //const tronGrid = new TronGrid(tronWeb)
            console.log('*** use tronGrid ***')
        } catch (err){
            console.log(err.message)
            return
        }
    }
    */

    currentBlock = await tronWeb.trx.getCurrentBlock().catch(
        err => {
            console.log(err)
            return err
        }
    )
    if (currentBlock.errno) {
        return currentBlock
    }
    let start = Date.now()
    let block = {}
    let TXs = 0
    let last_block
    let newLastBlockNumber = 0
    const r = await pool.query(
        "SELECT value FROM params WHERE param = 'bc_tx_lastblock' AND network_id = $1;",
        [network_id]
    )

    if (blockNumber === 0) {
        last_block = r.rows[0].value * 1
        if (currentBlock.block_header.raw_data.number - 1000 > last_block) {
            await pool.query(
                "INSERT INTO lost_blocks(network_id, start, stop) VALUES ($1, $2, $3);",
                [network_id, r.rows[0].value, currentBlock.block_header.raw_data.number - 1000]
            )
        }
    } else {
        last_block = blockNumber - q - 15
    }

    for (let i = 0; i < q; i++) {
        try {
            if (blockNumber !== 0) {
                if (blockNumber % 100 > 0 || i < 100) {
                    block = await tronWeb.trx.getBlock(blockNumber)
                } else {
                    block = await tronWeb.trx.getBlock(blockNumber)
                    console.log(network_id + " [" + Math.floor((Date.now() - start) / 1000) + ' sec] checked #', blockNumber)
                    start = Date.now() // время начала обработки следующей сотни блоков
                }
            } else {
                blockNumber = currentBlock.block_header.raw_data.number - 3
                newLastBlockNumber = blockNumber
                block = await tronWeb.trx.getBlock(blockNumber)
            }
            if (block.transactions) {
                TXs = TXs + block.transactions.length

                for (const t of block.transactions) {
                    if (t.ret[0].contractRet === 'SUCCESS' || t.ret[0].contractRet === 'OUT_OF_ENERGY' || t.ret[0].contractRet === 'REVERT') {
                        for (const a of addresses) {
                            //const aHex = tronWeb.address.toHex(a.address)
                            const aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                            const subHex = aHex.substring(2)
                            let fn_hex;
                            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                                } else {
                                    fn_hex = '0'
                                }
                                if (fn_hex === 'a9059cbb') {
                                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                    if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.slice(8, 72).indexOf(subHex) !== -1) {
                                        console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        await tx.addTx(t, network_id)
                                    }
                                }
                            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                                if (t.raw_data.contract[0].parameter.value.to_address === aHex) {
                                    console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                    t.blockNumber = blockNumber
                                    await tx.addTx(t, network_id)
                                }
                            }
                        }


                        for (const a of m_addresses) {
                            const aHex = tronWeb.address.toHex(a.address)
                            //const aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                            const subHex = aHex.substring(2)
                            let fn_hex;
                            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                                } else {
                                    fn_hex = '0'
                                }
                                if (fn_hex === 'a9059cbb') {
                                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                    if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.slice(8, 72).indexOf(subHex) !== -1) {
                                        console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        await tx.addMTx(t, network_id, rescan)
                                    }
                                }
                            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                                if (t.raw_data.contract[0].parameter.value.to_address === aHex) {
                                    console.log('addMTx addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                    t.blockNumber = blockNumber
                                    await tx.addMTx(t, network_id, rescan)
                                }
                            }
                        }


                    } else {
                        //console.log ('contractRet ',t.ret[0].contractRet + '\n' + t.txID)
                    }
                }
            }
        } catch (err) {
            console.log('searchTx ' + err.message)
        }
        blockNumber = blockNumber - 1
        blocks = blocks + 1

        if (last_block > blockNumber) i = q // -2 на случай если 3 последних блока поменялись
    }
    if (newLastBlockNumber > 0) {
        await pool.query(
            "UPDATE params SET value = $1 WHERE param = 'bc_tx_lastblock' AND network_id = $2;",
            [newLastBlockNumber, network_id]
        )
    }
    return blockNumber + ') ' + blocks + ':' + TXs
}

exports.searchAllTx = searchAllTx


async function searchTxByAddress(network_id, address, q = 1000) {

    return "done"
}

exports.searchAllTx = searchAllTx


async function searchTest(network_id, addresses, m_addresses, q = 1000, blockNumber = 0) {
    let blocks = 0
    let currentBlock
    const rescan = blockNumber !== 0
    /*
    let tronWeb
    try {
        tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        currentBlock = await tronWeb.trx.getCurrentBlock()
    } catch (err){
        try {
            tronWeb = new TronWeb(
                {
                    fullHost: process.env[network_id+'_TRX_FULL_NODE'],
                    headers: { "TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY },
                    privateKey: process.env.TRX_TMP_PRIVATE_KEY
                })
            currentBlock = await tronWeb.trx.getCurrentBlock()
            //const tronGrid = new TronGrid(tronWeb)
            console.log('*** use tronGrid ***')
        } catch (err){
            console.log(err.message)
            return
        }
    }
    */

    currentBlock = await tronWeb.trx.getCurrentBlock().catch(
        err => {
            console.log(err)
            return err
        }
    )
    if (currentBlock.errno) {
        return currentBlock
    }
    let start = Date.now()
    let block = {}
    let TXs = 0
    let last_block
    let newLastBlockNumber = 0
    const r = await pool.query(
        "SELECT value FROM params WHERE param = 'bc_tx_lastblock' AND network_id = $1;",
        [network_id]
    )

    if (blockNumber === 0) {
        last_block = r.rows[0].value * 1
        if (currentBlock.block_header.raw_data.number - 1000 > last_block) {
            await pool.query(
                "INSERT INTO lost_blocks(network_id, start, stop) VALUES ($1, $2, $3);",
                [network_id, r.rows[0].value, currentBlock.block_header.raw_data.number - 1000]
            )
        }
    } else {
        last_block = blockNumber - q - 15
    }

    for (let i = 0; i < q; i++) {
        try {
            if (blockNumber !== 0) {
                if (blockNumber % 100 > 0 || i < 100) {
                    block = await tronWeb.trx.getBlock(blockNumber)
                } else {
                    block = await tronWeb.trx.getBlock(blockNumber)
                    console.log(network_id + " [" + Math.floor((Date.now() - start) / 1000) + ' sec] checked #', blockNumber)
                    start = Date.now() // время начала обработки следующей сотни блоков
                }
            } else {
                blockNumber = currentBlock.block_header.raw_data.number - 3
                newLastBlockNumber = blockNumber
                block = await tronWeb.trx.getBlock(blockNumber)
            }
            if (block.transactions) {
                TXs = TXs + block.transactions.length

                for (const t of block.transactions) {
                    if (t.ret[0].contractRet === 'SUCCESS' || t.ret[0].contractRet === 'OUT_OF_ENERGY' || t.ret[0].contractRet === 'REVERT') {
                        for (const a of addresses) {
                            //const aHex = tronWeb.address.toHex(a.address)
                            const aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                            const subHex = aHex.substring(2)
                            let fn_hex;
                            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                                } else {
                                    fn_hex = '0'
                                }
                                if (fn_hex === 'a9059cbb') {
                                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                    if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.slice(8, 72).indexOf(subHex) !== -1) {
                                        console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        await tx.addTx(t, network_id)
                                    }
                                }
                            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                                if (t.raw_data.contract[0].parameter.value.to_address === aHex) {
                                    console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                    t.blockNumber = blockNumber
                                    await tx.addTx(t, network_id)
                                }
                            }
                        }


                        for (const a of m_addresses) {
                            const aHex = tronWeb.address.toHex(a.address)
                            //const aHex = a.address_b !== null ? Buffer.from(a.address_b).toString('hex') : TronWeb.address.toHex(a.address)
                            const subHex = aHex.substring(2)
                            let fn_hex;
                            if (t.raw_data.contract[0].type === 'TriggerSmartContract') {
                                if (t.raw_data.contract[0].parameter.value.data !== undefined) {
                                    fn_hex = t.raw_data.contract[0].parameter.value.data.substring(0, 8)
                                } else {
                                    fn_hex = '0'
                                }
                                if (fn_hex === 'a9059cbb') {
                                    //if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.indexOf(subHex, 8) !== -1) {
                                    //console.log(subHex + " === " + t.raw_data.contract[0].parameter.value.data.slice(8, 72))
                                    if (subHex !== '' && t.raw_data.contract[0].parameter.value.data.slice(8, 72).indexOf(subHex) !== -1) {
                                        console.log('addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                        t.blockNumber = blockNumber
                                        await tx.addMTx(t, network_id, rescan)
                                    }
                                }
                            } else if (t.raw_data.contract[0].type === 'TransferContract') {
                                if (t.raw_data.contract[0].parameter.value.to_address === aHex) {
                                    console.log('addMTx addr ', a.address + ' = ' + subHex + 'tx.txID: ' + t.txID)
                                    t.blockNumber = blockNumber
                                    await tx.addMTx(t, network_id, rescan)
                                }
                            }
                        }


                    } else {
                        //console.log ('contractRet ',t.ret[0].contractRet + '\n' + t.txID)
                    }
                }
            }
        } catch (err) {
            console.log('searchTx ' + err.message)
        }
        blockNumber = blockNumber - 1
        blocks = blocks + 1

        if (last_block > blockNumber) i = q // -2 на случай если 3 последних блока поменялись
    }
    if (newLastBlockNumber > 0) {
        await pool.query(
            "UPDATE params SET value = $1 WHERE param = 'bc_tx_lastblock' AND network_id = $2;",
            [newLastBlockNumber, network_id]
        )
    }
    return blockNumber + ') ' + blocks + ':' + TXs
}

exports.searchTest = searchTest

async function balanceERC20(req, res) {
    try {
        const web3 = new Web3(process.env.ETH_NODE_ADDRESS); // http адрес ноды
        const contract = new web3.eth.Contract(req.body.abi, req.body.contract_address, {from: req.body.from})
        const balance = await contract.methods['balanceOf'](req.body.address).call()
        console.log(balance)
        res.send(balance)
    } catch (err) {
        console.log('balanceERC20 \n' + err)
        res.send({err: err})
    }
}

exports.balanceERC20 = balanceERC20


async function updateTmpBalanceTRC20(network_id, token_id) {
    if (running[network_id] !== true) {
        running[network_id] = true
        console.log(network_id + ' TMP Balance TRC20')
        /*
                const tronWeb = new TronWeb(
                    process.env[network_id+'_TRX_FULL_NODE_MY'],
                    process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
                    process.env[network_id+'_TRX_EVENT_SERVER_MY']
                );
        */
        const tronWeb = getTronWeb(network_id, 'auto')
        const start_0 = Date.now()
        let b

        const t = await pool.query(
            "SELECT id, contract, decimals, contract_detail FROM tokens WHERE network_id = $1 AND id = $2;",
            [network_id, token_id]
        )
        if (t.rows[0].id === null) {
            console.log('#14574 add contract ', network_id + ':' + token_id)
            return null
        }
        const contractAddr = t.rows[0].contract
        const decimals = t.rows[0].decimals
        let contractDetail
        if (t.rows[0].contract_detail !== null) {
            contractDetail = t.rows[0].contract_detail
        } else {
            contractDetail = await tronWeb.trx.getContract(contractAddr)
            await pool.query(
                "UPDATE tokens SET contract_detail = $1 WHERE id = $2;",
                [contractDetail, t.rows[0].id]
            )
        }

        const addresses = await account.allTmpAddresses(network_id)

        for (const a of addresses) {
            const balObj = await getBalanceTRC20(network_id, contractDetail, a.address).catch(
                err => {
                    console.log(err)
                    return err
                }
            )
            if (balObj.errno) {
                running[network_id] = false
                return
            }

            const summa_txt = balObj._hex
            const summa_int = toBN(summa_txt)
            if (summa_int >> 0n) {
                b = await pool.query(
                    "SELECT * FROM f_update_tmp_balance($1,$2,$3,$4,$5,$6)",
                    [token_id, network_id, a.id, summa_int, summa_txt, decimals]
                )
                if (b.rows[0].id !== null) {
                    console.log('update TMP Balance TRC20:\n', JSON.stringify(b.rows[0]))
                }
            }
        }
        console.log(network_id + ' TMP Balance TRC20 [', Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addresses.length + ' addrs]')
        running[network_id] = false
    } else {
        //console.log ('updateTmpBalanceTRC20 - ' + network_id + 'is running')
    }
}

exports.updateTmpBalanceTRC20 = updateTmpBalanceTRC20


async function updateBalanceTRC20(network_id, token_id) {
    if (running[network_id] !== true) {
        running[network_id] = true
        console.log(network_id + ' Balance TRC20')
        /*
                const tronWeb = new TronWeb(
                    process.env[network_id+'_TRX_FULL_NODE_MY'],
                    process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
                    process.env[network_id+'_TRX_EVENT_SERVER_MY']
                );
        */
        const tronWeb = getTronWeb(network_id, 'auto')
        const start_0 = Date.now()
        let b
        const t = await pool.query(
            "SELECT id, contract, decimals, contract_detail FROM tokens WHERE network_id = $1 AND id = $2;",
            [network_id, token_id]
        )
        if (t.rows[0].id === null) {
            console.log('#14574 add contract ', network_id + ':' + token_id)
            return null
        }
        const contractAddr = t.rows[0].contract
        const decimals = t.rows[0].decimals
        let contractDetail
        if (t.rows[0].contract_detail !== null) {
            contractDetail = t.rows[0].contract_detail
        } else {
            contractDetail = await tronWeb.trx.getContract(contractAddr)
            await pool.query(
                "UPDATE tokens SET contract_detail = $1 WHERE id = $2;",
                [contractDetail, t.rows[0].id]
            )
        }

        const addresses = await account.getAllAccountAddresses(network_id)

        for (const a of addresses) {
            const balObj = await getBalanceTRC20(network_id, contractDetail, a.address)
            if (balObj !== null) {
                const summa_txt = balObj._hex
                const summa_int = toBN(summa_txt)
                if (summa_int >> 0n) {
                    b = await pool.query(
                        "SELECT * FROM f_update_balance($1,$2,$3,$4,$5,$6)",
                        [token_id, network_id, a.id, summa_int, summa_txt, decimals]
                    )
                    if (b.rows[0].id !== null) {
                        console.log('update Balance TRC20:\n', JSON.stringify(b.rows[0]))
                    }
                }
            }
        }
        console.log(network_id + ' Balance TRC20 [', Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addresses.length + ' addrs]')
        running[network_id] = false
    } else {
        //console.log ('updateBalanceTRC20 - ' + network_id + ' update is running')
    }
}

exports.updateBalanceTRC20 = updateBalanceTRC20

async function getBalanceTRC20(network_id, contractDetail, address) {
    try {
        /*
        const tronWeb = new TronWeb(
            process.env[network_id+'_TRX_FULL_NODE_MY'],
            process.env[network_id+'_TRX_SOLIDITY_NODE_MY'],
            process.env[network_id+'_TRX_EVENT_SERVER_MY']
        );
        */
        const tronWeb = getTronWeb(network_id, 'auto')
        tronWeb.setAddress(address)
        const contract = await tronWeb.contract(contractDetail.abi.entrys, contractDetail.contract_address)
        return await contract.balanceOf(address).call()

    } catch (err) {
        console.log({err: err, function: 'getBalanceTRC20'})
        return null
    }

}

exports.getBalanceTRC20 = getBalanceTRC20

async function searchLoopTmp(network_id) {
    const addr = await account.activeMAddresses(network_id)
    const start_0 = Date.now()
    if (running[network_id]) {
        //console.log("searchLoopTmp " + network_id + " steel running")
    } else {
        running[network_id] = true
        console.log(network_id + " TMP searchLoopTmp-searchMTx")
        const TXs = await searchMTx(network_id, addr)
        console.log(network_id + " TMP searchLoopTmp-searchMTx ", TXs + " [" + Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addr.length + ' addrs]')
        running[network_id] = false
    }
}

exports.searchLoopTmp = searchLoopTmp

async function searchLoop(network_id) {
    const addr = await account.getAllAccountAddresses(network_id)
    const start_0 = Date.now()
    if (running[network_id]) {
        //console.log("searchLoop " + network_id + " steel running")
    } else {
        running[network_id] = true
        console.log(network_id + " searchLoop-searchTx")
        const TXs = await searchTx(network_id, addr)
        console.log(network_id + " searchLoop-searchTx ", TXs + " [" + Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + addr.length + ' addrs]')
        running[network_id] = false
    }
}

exports.searchLoop = searchLoop


async function allTxLoop(network_id) {
    const addr = await account.getAllAccountAddresses(network_id)
    const m_addr = await account.activeMAddresses(network_id)
    const start_0 = Date.now()
    if (running[network_id]) {
        //console.log("searchLoop " + network_id + " steel running")
    } else {
        running[network_id] = true
        console.log(network_id + " ALL TX")
        const TXs = await searchAllTx(network_id, addr, m_addr)
        const aCount = addr.length + m_addr.length
        console.log(network_id + " ALL TX ", TXs + " [" + Math.floor((Date.now() - start_0) / 1000) + ' sec, ' + aCount + ' addrs]')
        running[network_id] = false
    }
}

exports.allTxLoop = allTxLoop

function getTronWeb(network_id, my = 'auto') {
    let tronWeb
    const TRX_FULL_NODE_MY = process.env[network_id + '_TRX_FULL_NODE_MY']
    const TRX_FULL_NODE = process.env[network_id + '_TRX_FULL_NODE']
    if (my === 'my') {
        try {
            tronWeb = new TronWeb(
                TRX_FULL_NODE_MY,
                process.env[network_id + '_TRX_SOLIDITY_NODE_MY'],
                process.env[network_id + '_TRX_EVENT_SERVER_MY']
            );
        } catch (err) {
            console.log('getTronWeb ' + err.name + ": " + err.message)
            return null
        }
        return tronWeb
    } else if (my === 'trongrid') {
        try {
            tronWeb = new TronWeb(
                {
                    fullHost: TRX_FULL_NODE,
                    headers: {"TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY}//,
                    //privateKey: process.env.TRX_TMP_PRIVATE_KEY
                }
            )
        } catch (err) {
            console.log('getTronWeb for trongrid ' + err.name + ": " + err.message)
            return null
        }
        return tronWeb
    } else { // my === 'auto`
        try {
            if (TRX_FULL_NODE_MY.includes("trongrid.io")) {
                tronWeb = new TronWeb(
                    {
                        fullHost: TRX_FULL_NODE_MY,
                        headers: {"TRON-PRO-API-KEY": process.env.TRON_GRID_API_KEY}//,
                        //privateKey: process.env.TRX_TMP_PRIVATE_KEY
                    }
                );
            } else {
                tronWeb = new TronWeb(
                    TRX_FULL_NODE_MY,
                    process.env[network_id + '_TRX_SOLIDITY_NODE_MY'],
                    process.env[network_id + '_TRX_EVENT_SERVER_MY']
                );
            }
            return tronWeb
        } catch (err) {
            console.log('getTronWeb ' + err.name + ": " + err.message)
            return null
        }
    }
}

exports.getTronWeb = getTronWeb