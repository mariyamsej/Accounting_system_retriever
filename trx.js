const express = require('express');
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const trxR = require('./routes/trxR');
const admR = require('./routes/admR');
const account = require("./models/account")

const wt = require("./models/wallet");
const cron = require('node-cron');

const trx = express();

trx.set('views', path.join(__dirname, 'views'));
trx.set('view engine', 'ejs');

trx.use(express.json());
trx.use(express.urlencoded({ extended: false }));
trx.use(express.static(path.join(__dirname, 'public')));

trx.use('/', trxR)
trx.use('/', admR)

trx.use(express.static('public'));

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

let isTaskRunning = false;

const updateBalancesTask = async () => {
    if (isTaskRunning) {
        console.log('Задача уже выполняется. Пропуск...');
        return;
    }

    isTaskRunning = true;

    try {
        console.log('Запуск задачи обновления баланса...');
        await account.updateTronBalances(5000);
        console.log('Баланс обновлен.');
    } catch (e) {
        if (e.code === 'EHOSTUNREACH') {
            console.error('Ошибка подключения.');
        } else {
            console.error('Ошибка при обновлении балансов:', e);
        }
    } finally {
        isTaskRunning = false;
    }
};

if (process.env.DO_NOT_START_BG_TASKS !== 'true') {

    cron.schedule('0 7 * * *', () => {
        console.log('Запуск задачи обновления баланса...');
        updateBalancesTask().then().catch(error => {
            console.error('Ошибка при выполнении задачи обновления балансов:', error);
        });
    });

    cron.schedule('0 */6 * * *', () => {
        console.log('Запуск задачи добавления кошельков...');
        updateWallets().then().catch(error => {
            console.error('Ошибка при выполнении задачи добавления кошельков:', error);
        });
    });

}

module.exports = trx;