/* eslint-disable */
const mysql = require('mysql');
const datasource = require('./datasources.json').db;

const pool = mysql.createPool({
    connectionLimit: 248,
    host: datasource.host,
    user: datasource.user,
    database: datasource.database,
    password: datasource.password,
    port: datasource.port,
    multipleStatements: true,
});

console.log("MySQL Pool Connected...");

exports.pool = pool;
