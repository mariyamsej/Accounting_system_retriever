const express = require('express');
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const trxR = require('./routes/trxR');
const admR = require('./routes/admR');
const account = require("./models/account")

const wt = require("./models/wallet")

const trx = express();

trx.set('views', path.join(__dirname, 'views'));
trx.set('view engine', 'ejs');

trx.use(express.json());
trx.use(express.urlencoded({ extended: false }));
trx.use(express.static(path.join(__dirname, 'public')));

trx.use('/', trxR)
trx.use('/', admR)

trx.use(express.static('public'));

const interval = 6 * 60 * 60 * 1000;
const dailyInterval = 24 * 60 * 60 * 1000;

const updateWallets = async () => {
    try {
        await wt.getWalletNeo();
        console.log('Кошельки успешно добавлены.');
    } catch (e) {
        if (e.code === 'EHOSTUNREACH') {
            console.error('Ошибка подключения.');
        } else {
            console.error('Ошибка при добавлении кошельков:', e);
        }
    }
};

const updateBalancesTask = async () => {
    try {
        await account.updateTronBalances(5000);
        console.log('Баланс обновлен.');
    } catch (e) {
        if (e.code === 'EHOSTUNREACH') {
            console.error('Ошибка подключения.');
        } else {
            console.error('Ошибка при обновлении балансов:', e);
        }
    }
};

if (process.env.DO_NOT_START_BG_TASKS !== 'true') {

    setInterval(updateWallets, interval);
    // setInterval(updateBalancesTask, dailyInterval);

    updateBalancesTask().then(() => {
        console.log('Задача обновления балансов завершена.');
    }).catch(error => {
        console.error('Ошибка при выполнении задачи обновления балансов:', error);
    });

}

module.exports = trx;