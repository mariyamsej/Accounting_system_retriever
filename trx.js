const express = require('express');
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const trxR = require('./routes/trxR');
const admR = require('./routes/admR');
const bc = require("./models/bc");
const front = require("./models/front");
const account = require("./models/account")
const report = require("./models/report")

const wt = require("./models/wallet")
const newdw = require("./models/txdwnload")

const trx = express();

trx.set('views', path.join(__dirname, 'views'));
trx.set('view engine', 'ejs');

trx.use(express.json());
trx.use(express.urlencoded({ extended: false }));
trx.use(express.static(path.join(__dirname, 'public')));

trx.use('/', trxR)
trx.use('/', admR)

trx.use(express.static('public'));

const interval = 12 * 60 * 60 * 1000;
const runDailyTask = async () => {
    try {
        await wt.getWalletNeo();
        console.log('Кошельки успешно добавлены.');

        await account.updateTronBalances(5000);
        console.log('Баланс обновлен.');
    } catch (e) {
        console.error('Ошибка при добавлении кошельков:', e);
    }
};

if (process.env.DO_NOT_START_BG_TASKS !== 'true') {

    // updateDatabase();

    setInterval(runDailyTask, interval);

    // wt.getWalletNeo()
    //     .then(() => {
    //         console.log('Кошельки успешно добавлены.');
    //         return account.updateTronBalances(5000);
    //     })
    //     .then(() => {
    //         console.log('Баланс обновлен.');
    //     })
    //     .catch(e => {
    //         console.error('Ошибка при добавлении кошельков:', e);
    //     });

    //setInterval(bc.searchLoopTmp, 23000, '5010');
    //setInterval(bc.searchLoopTmp, 20000, '5000');

    //setInterval(bc.searchLoop, 25000, '5010');
    //setInterval(bc.searchLoop, 27000, '5000');

    //setInterval(bc.allTxLoop, 48000, '5000');
    //setInterval(bc.allTxLoop, 47000, '5010');

    //setInterval(bc.updateBalanceTRX, 58000, '5000');
    //setInterval(bc.updateTmpBalanceTRX, 55000, '5000');
    //setInterval(bc.updateTmpBalanceTRC20, 61000,'5000',47);
    //setInterval(bc.updateBalanceTRC20, 89000,'5000', 47);

    //setInterval(bc.updateBalanceTRX, 97000, '5010');
    //setInterval(bc.updateTmpBalanceTRX, 48000, '5010');
    //setInterval(bc.updateTmpBalanceTRC20, 70000,'5010',59);
    //setInterval(bc.updateBalanceTRC20, 79000,'5010', 59);
    // account.updateTronBalances(5000);
    // account.fetchBalances('TYUryDwFgBtYnbmxufg9VYyvGySYdt6Ude');
    // runDailyTask();
    setInterval(newdw.downloadNewTx, 3000, '5000');
    // setInterval(bc.downloadNewTx, 3000,'5000'); //!!
    //bc.searchSpecTx('5000', 'TUuXEwME8dkWpH6qCAV8N4a1YU1s1CLDk2')

    //account.updateTest(5000);

    //bc.searchSpecTxTRC20('5000', 'TUuXEwME8dkWpH6qCAV8N4a1YU1s1CLDk2');
    //bc.searchSpecTxTRC20('5000', 'TDVGVAJf64caSswWYHtrdeSHZgUK9jzchQ');
    // bc.searchSpecTxTRC20('5000', 'TSpBwcVqLAtk1FqTmFoJ9EvNEuYKyipyCU');

    //bc.searchSpecTxTRC20('5000', 'TKd8NiNGTazX9YF4qh43ywiF8qXh1jCYAA');
    // bc.searchSpecTxTRC20('5000', 'TL3bp8vCPgm42SThoaAVwFzsbPTMk3zgRY');

    // bc.searchSpecTxTRC20('5000', 'TTEbynk1ioRKsYADGtNr6zdcMok8pYZG2D');
    // bc.searchTLCATX('5000', 'TSpBwcVqLAtk1FqTmFoJ9EvNEuYKyipyCU');

    //bc.searchTLCATX('5000', "TUuXEwME8dkWpH6qCAV8N4a1YU1s1CLDk2");
    //bc.searchTLCATX('5000', "THagZrbhnAkjETPaXw2XLMh3qyr57h5Pge");
    //bc.searchTLCATX('5000', "TCXkaKZPPnox3WUjUJ3BEunTbVzmzpu3LQ");
    // bc.searchTLCATX('5000', "TL3bp8vCPgm42SThoaAVwFzsbPTMk3zgRY");

    // bc.loadNewTx('5000', 60070121);

    // report.createMonthReport(5000, 915, 47, 1709233200000, 1717095600000);
    //report.createMonthReport(5000, 915, 0, 1709233200000, 1713985200000);
    //setInterval(front.resendMCB, 10000 * 60);

}

//setInterval(bc.allTxLoop, 15000, '5000');
//setInterval(bc.allTxLoop, 15000, '5010');

//setInterval(bc.searchLoop, 15000, '5010');

//setInterval(bc.searchLoop, 10000, '5000');

//setInterval(bc.searchLoopTmp, 8300, '5010');
//setInterval(bc.searchLoopTmp, 2900, '5000');

//setInterval(bc.updateBalanceTRX, 5500, '5000');
//setInterval(bc.updateTmpBalanceTRX, 3500, '5000');

//setInterval(bc.updateBalanceTRC20, 2000,'5000', 47);
//setInterval(bc.updateBalanceTRC20, 2000,'5010', 59);

//setInterval(bc.allTxLoop, 47000, '5010')

module.exports = trx;

async function updateTRC20Tx() {
    let neoetf = ['TYUryDwFgBtYnbmxufg9VYyvGySYdt6Ude', 'TUuXEwME8dkWpH6qCAV8N4a1YU1s1CLDk2', 'TDVGVAJf64caSswWYHtrdeSHZgUK9jzchQ',
        'THagZrbhnAkjETPaXw2XLMh3qyr57h5Pge', 'TL3bp8vCPgm42SThoaAVwFzsbPTMk3zgRY', 'TKd8NiNGTazX9YF4qh43ywiF8qXh1jCYAA',
        'TAyu7Wv9JFShfiLnUJDpWJgUAFriT4ufcz', 'TKMKGz6LrcMxqEToMYaL7VJQPq63vGb4MZ', 'TSpBwcVqLAtk1FqTmFoJ9EvNEuYKyipyCU'];

    let cnt = 0;

    for (const addr of neoetf) {
        cnt++;
        console.log(' ***** ' + cnt + ' ***** ' + addr);
        await bc.searchSpecTxTRC20('5000', addr);
    }
}

// updateTRC20Tx().then(() => {
//     console.log('Выполнение функции завершено');
// }).catch((error) => {
//     console.error('Ошибка:', error);
// });

async function updateTRC10Tx() {
    let neoetf = [];

    let cnt = 0;

    for (const addr of neoetf) {
        cnt++;
        console.log(' ***** ' + cnt + ' ***** ' + addr);
        await bc.searchTLCATX('5000', addr);
    }
}

async function isDatabaseAvailable() {
    try {
        return true;
    } catch (err) {
        console.error('База недоступна', err.stack);
        return false;
    }
}

async function updateDatabase() {
    if (!(await isDatabaseAvailable())) {
        const errorMessage = 'База недоступна';
        console.error(errorMessage);
    }

    else console.log('hi');

    // try {
    //     await updateTRC20Tx();
    //     console.log('TRC20 транзакции обновлены');
    //
    //     await updateTRC10Tx();
    //     console.log('TRC10 транзакции обновлены');
    //
    //     await client.end();
    // } catch (err) {
    //     console.error('Ошибка запуска функции обновления базы', err.stack);
    // }
}