import mysql from 'mysql2/promise';

import mysqlCreds from './mysql-creds.json' with {type: 'json'};

const connPool = mysql.createPool({
    host: 'localhost',
    user: mysqlCreds.username,
    password: mysqlCreds.password,
    database: 'ats'
});

export async function getDailyCallCountByCust(custID){
    const conn = await connPool.getConnection();
    const [ results, fields ] = await connPool.execute(
        'SELECT DATE(added_dt) AS call_date, COUNT(id) AS call_count ' +
        'FROM cdrs ' +
        'WHERE cust_id = ? ' +
        'GROUP BY call_date ' +
        'ORDER BY call_date DESC ',
        [custID]
    );
    conn.release();

    console.log(results);
    console.log(fields);
}
