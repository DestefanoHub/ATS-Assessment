import mysql from 'mysql2/promise';

import mysqlCreds from './mysql-creds.json' with {type: 'json'};

const connPool = mysql.createPool({
    host: 'localhost',
    user: mysqlCreds.username,
    password: mysqlCreds.password,
    database: 'ats',
    namedPlaceholders: true,
    dateStrings: true
});

export async function initializeDB(){
    let conn = null;
    
    try{
        conn = await connPool.getConnection();

        await conn.beginTransaction();

        const tableCreated = await conn.execute(
            `CREATE TABLE IF NOT EXISTS cdrs (
            cust_id int(4) NOT NULL,
            id varchar(10) COLLATE utf8_unicode_ci NOT NULL,
            seq int(6) NOT NULL,
            added_dt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            start_time datetime NOT NULL,
            end_time datetime NOT NULL,
            caller_id varchar(15) COLLATE utf8_unicode_ci DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci`
        );

        if(!tableCreated[0].warningStatus){
            await conn.execute(
                `ALTER TABLE cdrs
                ADD PRIMARY KEY (cust_id, id, seq),
                ADD KEY seq (seq),
                ADD KEY id (id),
                ADD KEY cust_id (cust_id),
                ADD KEY start_time (start_time)`
            );
        }

        await conn.commit();
    }catch(error){
        console.log('Database NOT initialized!');
        console.log(error);

        if(conn !== null){
            await conn.rollback();
        }
    }finally{
        if(conn !== null){
            conn.release();
        }
    }
}

export async function insertCDR(ID, custID, callerID, seq, addedDT, startDT, endDT){
    try{
        const queryParams = {
            id: ID,
            cust_id: custID,
            caller_id: callerID,
            seq,
            added_dt: addedDT,
            start_time: startDT,
            end_time: endDT
        }

        await connPool.execute(
            `INSERT INTO cdrs
            (id, cust_id, caller_id, seq, added_dt, start_time, end_time)
            VALUES (:id, :cust_id, :caller_id, :seq, :added_dt, :start_time, :end_time)`,
            queryParams
        );
    }catch(error){
        //This doesn't log by default because the data stream contains a number of primary key violations.
        // console.log(error);
    }
}

export async function getDailyCallCountByCust(custID){
    let records = [];

    if(custID === null){
        return records;
    }
    
    try{
        const queryParams = {
            cust_id: custID
        };

        const [results] = await connPool.execute(
            `SELECT DATE(start_time) AS call_date, COUNT(id) AS call_count
            FROM cdrs
            WHERE cust_id = :cust_id
            GROUP BY call_date
            ORDER BY call_date DESC`,
            queryParams
        );

        if(results.length){
            records = results;
        }
    }catch(error){
        console.log(error);
    }

    return records;
}

export async function activityLog(){
    let records = [];
    
    try{
        const [results] = await connPool.execute(
            `SELECT cust_id, DATE(start_time) AS call_date, COUNT(id) AS call_count
            FROM cdrs
            GROUP BY cust_id, call_date
            ORDER BY call_date DESC`
        );

        if(results.length){
            let dateObject = {
                call_date: null,
                call_log: []
            };

            results.forEach((record) => {
                //Should only be called once when the iteration starts.
                if(dateObject.call_date === null){
                    dateObject.call_date = record.call_date;
                }

                //Should be called each time a new date is encountered.
                if(dateObject.call_date !== record.call_date){
                    //All records for the previous date are complete, add the existing dateObject to the return data.
                    records.push(dateObject);

                    //Reset the dateObject for the new date.
                    dateObject = {
                        call_date: record.call_date,
                        call_log: []
                    };
                }

                //Push the call data to the call log for the current date.
                dateObject.call_log.push({
                    cust_id: record.cust_id,
                    call_count: record.call_count
                });
            });

            //Add the final dateObject to the return data.
            records.push(dateObject);
        }
    }catch(error){
        console.log(error);
    }

    return records;
}