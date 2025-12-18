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
    // let conn = null;

    /*
    * I tried to use a transaction for this database setup, but the CREATE TABLE and ALTER TABLE commands seem to implicitly
    * force a commit, and even disabling autocommit did not seem to do the trick.
    */
    
    try{
        // conn = await connPool.getConnection();
        // conn.execute('SET autocommit = 0');
        // await conn.beginTransaction();

        const tableCreated = await connPool.execute(
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
            await connPool.execute(
                `ALTER TABLE cdrs
                ADD PRIMARY KEY (cust_id, id, seq),
                ADD KEY seq (seq),
                ADD KEY id (id),
                ADD KEY cust_id (cust_id),
                ADD KEY start_time (start_time)`
            );
        }

        //await conn.commit();
    }catch(error){
        console.log(error);
        console.log('Database not properly initialized, please check the RDBMS and make the necessary adjustments there before continuing.');

        // if(conn !== null){
        //     await conn.rollback();
        // }
    }
    // finally{
    //     if(conn !== null){
    //         conn.release();
    //     }
    // }
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

export async function getCDRDetails(id, custID, callerID){
    let records = [];

    if(!(id === null && custID === null && callerID === null)){
        try{
            const queryParams = {};
            /*
            * The WHERE 1=1 here avoids the need to include logic to figure out which WHERE clause will be first
            * and then stick the WHERE in front. Also, the query only runs if one of the search parameters
            * is provided, so it will never run just WHERE 1=1.
            */
            let query = 'SELECT * FROM cdrs WHERE 1=1';

            if(id !== null){
                query = query + ' AND id = :id';
                queryParams.id = id;
            }

            if(custID !== null){
                query = query + ' AND cust_id = :cust_id';
                queryParams.cust_id = custID;
            }

            if(callerID !== null){
                query = query + ' AND caller_id = :caller_id';
                queryParams.caller_id = callerID;
            }

            const [results] = await connPool.execute(query, queryParams);
            records = results;
        }catch(error){
            console.log(error);
        }
    }

    return records;
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