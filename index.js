import * as ethers from 'ethers'
import fs from 'fs';
import fetch from 'node-fetch';

async function getSignMessage(address){
    const result = await fetch("https://api.lens.dev/", {
        method: "POST",
	    headers: {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9,id;q=0.8",
                "cache-control": "no-cache",
                "content-type": "application/json",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
                "Referer": "https://lenster.xyz/",
                "Referrer-Policy": "strict-origin"
		},
        body:JSON.stringify({
            "operationName": "Challenge",
            "variables": {
                "request": {
                    "address": address
                }
            },
            "query": "query Challenge($request: ChallengeRequest!) {\n  challenge(request: $request) {\n    text\n    __typename\n  }\n}"
        })  
    })
    return result.json()
}

async function getToken(address, signature){
    const result = await fetch("https://api.lens.dev/", {
        method:"POST",
        headers:{
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,id;q=0.8",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "Referer": "https://lenster.xyz/",
            "Referrer-Policy": "strict-origin"
        },
        body:JSON.stringify({
            "operationName": "Authenticate",
            "variables": {
                "request": {
                    "address": address,
                    "signature": signature
                }
            },
            "query": "mutation Authenticate($request: SignedAuthChallenge!) {\n  authenticate(request: $request) {\n    accessToken\n    refreshToken\n    __typename\n  }\n}"
        })
    })
    return result.json()
}

async function checkEligible(token){
    const response = await fetch('https://api.lens.dev/',{
        method:"POST",
        headers:{
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,id;q=0.8",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "x-access-token": `Bearer ${token}`,
            "Referer": "https://claim.lens.xyz/",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        body:JSON.stringify({
            "variables": {},
            "query": "{\n  claimableHandles {\n    canClaimFreeTextHandle\n    reservedHandles {\n      id\n      expiry\n      handle\n      source\n      __typename\n    }\n    __typename\n  }\n}"
        })
    })
    return response.json()
}

const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

(async()=>{
    try {
        const privatekey = fs.readFileSync('privatekey.txt', 'utf-8');
        const privatekeyarray = privatekey.split('\n');
        const jumlah = privatekeyarray.length;
        const provider = new ethers.providers.JsonRpcBatchProvider('https://rpc.ankr.com/polygon')

        for (var i = 0; i < jumlah; i++) {
            const pkey = privatekeyarray[i].replace(/\r/g, '');
            const wallet = new ethers.Wallet(pkey, provider)
            const address = wallet.address

            const challenge = await getSignMessage(address)
            const message = challenge.data.challenge.text
            const signatureHex = await wallet.signMessage(message);

            const getoken = await getToken(address,signatureHex)
            const token = getoken.data.authenticate.accessToken

            const check = await checkEligible(token)
            const result = check.data.claimableHandles.canClaimFreeTextHandle
            console.log(`Wallet ${address} claimable handle: ${result}`)
            await sleep(100)
        }
    } catch (error) {
        console.log(error)
    }
    
})()