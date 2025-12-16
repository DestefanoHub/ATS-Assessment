import apiCreds from './api-creds.json' with {type: 'json'};

const encodedCreds = Buffer.from(`${apiCreds.username}:${apiCreds.password}`, 'utf8').toString('base64');

export async function authenticate(){
    let authToken = null;
    
    const response = await fetch('https://api.atscall.me:3102/auth', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedCreds}`
        }
    });

    // console.log(response);

    if(response.ok){
        const responseBody = await response.json();
        authToken = responseBody.token;
    }

    return authToken;
};