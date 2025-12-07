const username = 'andrew';
const password = 'Password123!';
const encodedCreds = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

export async function authenticate(){
    const response = await fetch('https://api.atscall.me/auth', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedCreds}`
        }
    });

    console.log(response);
};