import { insertCDR } from './database.js';
import { authenticate } from './authentication.js';

const authToken = await authenticate();

if(authToken !== null){
    const response = await fetch('https://api.atscall.me:3102/cdrs', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Connection': 'keep-alive'
        }
    });

    if(response.ok){
        console.log('Started reading chunks.');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let result = await reader.read();

        while (!result.done) {
            const chunk = decoder.decode(result.value, { stream: true });
            const cdrsArray = JSON.parse(chunk);

            cdrsArray.forEach((record) => {
                insertCDR(record.id, record.cust_id, record.caller_id, record.seq, record.added_dt, record.start_time, record.end_time);
            });

            result = await reader.read();
        }

        console.log('Finished reading all chunks.');
    }
}