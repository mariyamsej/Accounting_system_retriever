const { pool } = require('./db')
const { allToHEX, fromHEX, toBNtext } = require('./math')
const Web3 = require("web3")
const {toBigInt} = require("ethers");
const front = require("./front");
const account = require("./account");


async function addTRXTx(req, res, next){
    console.log('transactions N: ',req.transactions.data.length)
    for (const tx of req.transactions.data) {
        console.log("tx:\n",JSON.stringify(tx,null,4))
        //if (tx.ret[0].contractRet === 'SUCCESS') {
            let amount = tx.raw_data.contract[0].parameter.value.amount
            if (amount === undefined) {amount = 0}
            req.r = await pool.query(
                "SELECT * FROM f_add_custom_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
                [
                    tx.txID,
                    tx.block_timestamp,
                    +req.network_id,
                    fromHEX(tx.raw_data.contract[0].parameter.value.owner_address),
                    fromHEX(tx.raw_data.contract[0].parameter.value.to_address),
                    '0', // базовый токен сети не имеет адреса контракта
                    amount,
                    allToHEX(amount),
                    tx.blockNumber,
                    tx.ret[0].fee,
                    allToHEX(tx.ret[0].fee),
                    6, // decimals для базового токена трона - TRX
                    '{"contractRet":"'+tx.ret[0].contractRet+'","type":"'+tx.raw_data.contract[0].type+'"}'
                ]
            )
        //}
    }
    next()
}
exports.addTRXTx = addTRXTx

async function addTRC20Tx(req, res, next){
    console.log('TRC20 transactions N: ',req.transactions.data.length)
    if (req.transactions.success === true) {
        for (const tx of req.transactions.data) {
            console.log("tx:\n",tx)
            req.r = await pool.query(
                "SELECT f_add_trc20_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.transaction_id,
                    tx.block_timestamp,
                    +req.network_id,
                    tx.from,
                    tx.to,
                    tx.token_info.address,
                    tx.value,
                    allToHEX(toBigInt(tx.value)),
                    tx.token_info.symbol,
                    tx.token_info.name,
                    tx.token_info.decimals,
                    tx.type
                ]
            )
        }
    }
    next()
}
exports.addTRC20Tx = addTRC20Tx

/* Устарело
async function addTRXCustomTx(req, res, next){
    console.log('transactions N: ',req.transactions.data.length)
    for (const tx of req.transactions.data) {
        //console.log("tx:\n",tx)
        if (tx.ret[0].contractRet === 'SUCCESS') {
            if (tx.raw_data.contract[0].type === 'TriggerSmartContract') {
                const contract_addr = fromHEX(tx.raw_data.contract[0].parameter.value.contract_address)

                //const abi_req = await pool.query(
                //    'SELECT abi FROM tokens WHERE contract = $1',
                //    [contract_addr])
                //const abi = abi_req.rows[0].abi

                const data = tx.raw_data.contract[0].parameter.value.data
                console.log('tx.txID: ',tx.txID)
                const fn_hex = `0x${data.substring(0,8)}`
                if (fn_hex === '0xa9059cbb') {
                    //const _to_txt = `0x${data.substring(8,72)}`
                    const _to_txt = '41'+data.substring(32,72)
                    console.log('to_txt:', _to_txt)
                    const _value_txt = `0x${data.substring(72)}`

                    //const to = Web3.eth.abi.decodeParameter('address',_to_txt)
                    const to = fromHEX(_to_txt)
                    const value_txt = Web3.eth.abi.decodeParameter('uint256',_value_txt)
                    console.log('to:', to)
                    req.r = await pool.query(
                        "SELECT * FROM f_add_custom_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
                        [
                            tx.txID,
                            tx.block_timestamp,
                            +req.network_id,
                            fromHEX(tx.raw_data.contract[0].parameter.value.owner_address),
                            fromHEX(to),
                            contract_addr,
                            toBNtext(value_txt),
                            allToHEX(value_txt),
                            tx.blockNumber,
                            tx.ret[0].fee,
                            allToHEX(tx.ret[0].fee)
                        ]
                    )
                }
            }
        }
    }
    next()
}
exports.addTRXCustomTx = addTRXCustomTx
*/

// добавить запись в основную таблицу транзакций tx
const addTx = async function(tx,network_id){
    if (tx.raw_data.contract[0].type === 'TriggerSmartContract') {
        const data = tx.raw_data.contract[0].parameter.value.data
        const fn_hex = data.substring(0,8)
        if (fn_hex === 'a9059cbb') {
            //console.log('tx.txID: ',tx.txID)
            //console.log('data\n',tx.raw_data.contract[0].parameter)
            const contract_addr = fromHEX(tx.raw_data.contract[0].parameter.value.contract_address)
            const _to_txt = '41'+data.substring(32,72)
            const _value_txt = '0x'+data.substring(72)
            const to = fromHEX(_to_txt)
            const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
            const value_txt = Web3.eth.abi.decodeParameter('uint256',_value_txt)
            const value = toBNtext(value_txt)
            const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

            const t = await pool.query(
                "SELECT * FROM f_add_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +tx.raw_data.timestamp,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    allToHEX(value_txt),
                    tx.blockNumber,
                    toBNtext(fee),
                    allToHEX(fee),
                    {contractRet:tx.ret[0].contractRet,type:tx.raw_data.contract[0].type,data:tx.raw_data.contract[0].parameter.value.data}
                ]
            )
            console.log('tx_id is :',t.rows[0].id)
        }
    } else if (tx.raw_data.contract[0].type === 'TransferContract' || tx.raw_data.contract[0].type === 'TransferAssetContract') {

        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address

        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const contract_addr = null
        const value = tx.raw_data.contract[0].parameter.value.amount
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0
        try {
            const t = await pool.query(
                "SELECT * FROM f_add_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +tx.raw_data.timestamp,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    allToHEX(value_txt),
                    tx.blockNumber,
                    toBNtext(fee),
                    allToHEX(fee),
                    {contractRet:tx.ret[0].contractRet,type:tx.raw_data.contract[0].type,data:tx.raw_data.contract[0].parameter.value.data}
                ]
            )
            console.log('tx is :',JSON.stringify(t.rows[0]))
        } catch (e) {
            console.log('!!!e :',e)
        }
    }
}
exports.addTx = addTx

const addAssetTx = async function(tx,network_id){

    console.log(tx.raw_data.contract[0]);

    if (tx.raw_data.contract[0].type === 'TransferAssetContract') {

        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address

        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const contract_addr = tx.raw_data.contract[0].parameter.value.asset_name
        const value = tx.raw_data.contract[0].parameter.value.amount
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

        console.log('---------------------------')
        console.log({
            txID: tx.txID,
            timestamp: +tx.raw_data.timestamp,
            network_id: network_id,
            from: from,
            to: to,
            contract_addr: contract_addr,
            value: value,
            value_txt: value_txt,
            blockNumber: tx.blockNumber,
            fee: fee,
            fee_txt: allToHEX(fee),
            info: {
                contractRet: tx.ret[0].contractRet,
                type: tx.raw_data.contract[0].type,
                data: tx.raw_data.contract[0].parameter.value.data
            }
        });

        try {
            const t = await pool.query(
                "SELECT * FROM f_add_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +tx.raw_data.timestamp,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    allToHEX(value_txt),
                    tx.blockNumber,
                    toBNtext(fee),
                    allToHEX(fee),
                    {contractRet:tx.ret[0].contractRet,type:tx.raw_data.contract[0].type,data:tx.raw_data.contract[0].parameter.value.data}
                ]
            )
            console.log('tx is :',JSON.stringify(t.rows[0]))
        } catch (e) {
            console.log('!!!e :',e)
        }
    }
}
exports.addAssetTx = addAssetTx
/////

const addTxTest = async function(tx,network_id, block_num_input = -1){

    if (tx.raw_data.contract[0].type === 'TriggerSmartContract') {
        const data = tx.raw_data.contract[0].parameter.value.data
        const fn_hex = data.substring(0,8)
        if (fn_hex === 'a9059cbb') {
            //console.log('tx.txID: ',tx.txID)
            //console.log('data\n',tx.raw_data.contract[0].parameter)
            const contract_addr = fromHEX(tx.raw_data.contract[0].parameter.value.contract_address)
            const _to_txt = '41'+data.substring(32,72)
            const _value_txt = '0x'+data.substring(72)
            const to = fromHEX(_to_txt)
            const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
            const value_txt = Web3.eth.abi.decodeParameter('uint256',_value_txt)
            const value = toBNtext(value_txt)
            const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

            const t = await pool.query(
                    "SELECT * FROM f_add_tx_test($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                    [
                        tx.txID,
                        +tx.raw_data.timestamp,
                        +network_id,
                        from,
                        to,
                        contract_addr,
                        value,
                        allToHEX(value_txt),
                        (tx.blockNumber !== undefined) ? tx.blockNumber : block_num_input,
                        toBNtext(fee),
                        allToHEX(fee),
                        {contractRet:tx.ret[0].contractRet,type:tx.raw_data.contract[0].type,data:tx.raw_data.contract[0].parameter.value.data}
                    ]
                )
            }
            //console.log('tx_id is :',t.rows[0].id)
        }
    else if (tx.raw_data.contract[0].type === 'TransferContract') {

        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address

        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const contract_addr = null
        const value = tx.raw_data.contract[0].parameter.value.amount
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

        try {
                const t = await pool.query(
                    "SELECT * FROM f_add_tx_test($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                    [
                        tx.txID,
                        +tx.raw_data.timestamp,
                        +network_id,
                        from,
                        to,
                        contract_addr,
                        value,
                        value_txt,
                        (tx.blockNumber !== undefined) ? tx.blockNumber : block_num_input,
                        toBNtext(fee),
                        allToHEX(fee),
                        '{"contractRet":"'+tx.ret[0].contractRet+'","type":"'+tx.raw_data.contract[0].type+'"}'
                    ]
                )
                //console.log('tx is :',JSON.stringify(t.rows[0]))
            } catch (e) {
                console.log('!!!e :',e)
            }
        }
    else if (tx.raw_data.contract[0].type === 'TransferAssetContract') {

        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address

        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const contract_addr = null
        const value = tx.raw_data.contract[0].parameter.value.amount
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0
        try {
            const t = await pool.query(
                "SELECT * FROM f_add_tx_test($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +tx.raw_data.timestamp,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    value_txt,
                    (tx.blockNumber !== undefined) ? tx.blockNumber : block_num_input,
                    toBNtext(fee),
                    allToHEX(fee),
                    '{"contractRet":"'+tx.ret[0].contractRet+'","type":"'+tx.raw_data.contract[0].type+'"}'
                ]
            )
            //console.log('tx is :',JSON.stringify(t.rows[0]))
        } catch (e) {
            console.log('!!!e :',e)
        }
    }
}
exports.addTxTest = addTxTest

////



addTxTestTRC20 = async function(tx,network_id, block_num_input = -1){
    const contract_addr = fromHEX(tx.token_info.address)
    const to = fromHEX(tx.to)
    const from = fromHEX(tx.from)
    try {
        const t = await pool.query(
            "SELECT * FROM f_add_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
            [
                tx.transaction_id,
                +tx.block_timestamp,
                +network_id,
                from,
                to,
                contract_addr,
                parseInt(tx.value),
                allToHEX(tx.value),
                (tx.blockNumber !== undefined) ? tx.blockNumber : -1,
                0,
                '',
                tx.type
            ]
        )
        console.log('tx_id is :',t.rows[0].id)
    } catch (e) {
        console.log('!!!e :',e)
    }

}
exports.addTxTestTRC20 = addTxTestTRC20

const addTxTestRT = async function(tx,network_id, block_num_input = -1){
    //console.log("Saving ", tx.txID);
    if (tx.raw_data.contract[0].type === 'TriggerSmartContract') {
        const data = tx.raw_data.contract[0].parameter.value.data
        const fn_hex = data.substring(0,8)
        if (fn_hex === 'a9059cbb') {
            //console.log('tx.txID: ',tx.txID)
            //console.log('data\n',tx.raw_data.contract[0].parameter)
            const contract_addr = fromHEX(tx.raw_data.contract[0].parameter.value.contract_address)
            const _to_txt = '41'+data.substring(32,72)
            const _value_txt = '0x'+data.substring(72)
            const to = fromHEX(_to_txt)
            const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
            const value_txt = Web3.eth.abi.decodeParameter('uint256',_value_txt)
            const value = toBNtext(value_txt)
            const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

            const t = await pool.query(
                "SELECT * FROM f_add_tx_test($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +(tx.raw_data.timestamp !== undefined) ? tx.raw_data.timestamp : 0,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    allToHEX(value_txt),
                    (tx.blockNumber !== undefined) ? tx.blockNumber : block_num_input,
                    0,
                    0,
                    {contractRet:tx.ret[0].contractRet,type:tx.raw_data.contract[0].type,data:tx.raw_data.contract[0].parameter.value.data}
                ]
            )
            console.log("Saved transaction: ", tx.txID);
            //console.log('tx_id is :',t.rows[0].id)
        }
    } else if (tx.raw_data.contract[0].type === 'TransferContract') {

        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address

        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const contract_addr = null
        const value = tx.raw_data.contract[0].parameter.value.amount
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0
        try {
            const t = await pool.query(
                "SELECT * FROM f_add_tx_test($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +(tx.raw_data.timestamp !== undefined) ? tx.raw_data.timestamp : 0,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    value_txt,
                    (tx.blockNumber !== undefined) ? tx.blockNumber : block_num_input,
                    0,
                    0,
                    '{"contractRet":"'+tx.ret[0].contractRet+'","type":"'+tx.raw_data.contract[0].type+'"}'
                ]
            )
            console.log("Saved transaction: ", tx.txID);
        } catch (e) {
            console.log('!!!e :',e)
        }
    }
}
exports.addTxTestRT = addTxTestRT


const addMTx = async function(tx,network_id, rescan = false){
    if (tx.raw_data.contract[0].type === 'TriggerSmartContract') {
        const data = tx.raw_data.contract[0].parameter.value.data
        const fn_hex = data.substring(0,8)
        if (fn_hex === 'a9059cbb') {
            //console.log('tx.txID: ',tx.txID)
            //console.log('data\n',tx.raw_data.contract[0].parameter)
            const contract_addr = fromHEX(tx.raw_data.contract[0].parameter.value.contract_address)
            const _to_txt = '41'+data.substring(32,72)
            const _value_txt = '0x'+data.substring(72)
            const to = fromHEX(_to_txt)
            const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
            const value_txt = Web3.eth.abi.decodeParameter('uint256',_value_txt)
            const value = toBNtext(value_txt)
            const fee = tx.ret[0].fee ? tx.ret[0].fee : 0

            const t = await pool.query(
                "SELECT * FROM f_add_m_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
                [
                    tx.txID,
                    +tx.raw_data.timestamp,
                    +network_id,
                    from,
                    to,
                    contract_addr,
                    value,
                    allToHEX(value_txt),
                    tx.blockNumber,
                    toBNtext(fee),
                    allToHEX(fee),
                    tx.raw_data.contract[0].parameter.value.data
                ]
            )
            console.log('tx is :',JSON.stringify(t.rows[0]))
            if (t.rows[0].id !== null && t.rows[0].m_order_id !== null) {
                const order_debit = await pool.query(
                    "SELECT m_order, m_type, merchant_id, summ, txs_summ, txs_summ - summ debit from m_orders WHERE id  = $1",
                    [t.rows[0].m_order_id]
                )
                console.log('order_debit :', order_debit.rows[0])
                t.rows[0].from = from
                t.rows[0].to = to
                t.rows[0].order = order_debit.rows[0].m_order
                t.rows[0].type = order_debit.rows[0].m_type + ''
                console.log('order \n', t.rows[0])
                if (!rescan) {
                    if (t.rows[0].cb_sended !== true){
                        await front.sendMTxCallback(t.rows[0])
                    }
                    if (order_debit.rows[0].debit >= 0) {
                        await account.releaseTmpAddress(order_debit.rows[0].m_type, order_debit.rows[0].m_order, order_debit.rows[0].merchant_id)
                    }
                }
            }
        }
    } else if (tx.raw_data.contract[0].type === 'TransferContract') {
        const contract_addr = null
        const _to_txt = tx.raw_data.contract[0].parameter.value.to_address
        const value = tx.raw_data.contract[0].parameter.value.amount
        const to = fromHEX(_to_txt)
        const from = fromHEX(tx.raw_data.contract[0].parameter.value.owner_address)
        const value_txt = allToHEX(value)
        const fee = tx.ret[0].fee ? tx.ret[0].fee : 0
        const t = await pool.query(
            "SELECT * FROM f_add_m_tx($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
            [
                tx.txID,
                +tx.raw_data.timestamp,
                +network_id,
                from,
                to,
                contract_addr,
                value,
                allToHEX(value_txt),
                tx.blockNumber,
                toBNtext(fee),
                allToHEX(fee),
                tx.raw_data.contract[0].parameter.value.data
            ]
        )
        console.log('order is :',t.rows[0])
        if (t.rows[0].id !== null) {
            const order_debit = await pool.query(
                "SELECT m_order, m_type, merchant_id, summ, txs_summ, txs_summ - summ debit from m_orders WHERE id  = $1",
                [t.rows[0].m_order_id]
            )
            console.log('order_debit :', order_debit.rows[0])
            t.rows[0].from = from
            t.rows[0].to = to
            t.rows[0].order = order_debit.rows[0].m_order
            t.rows[0].type = order_debit.rows[0].m_type + ''
            console.log('order \n', t.rows[0])
            await front.sendMTxCallback(t.rows[0])
        }
    }
}
exports.addMTx = addMTx
