const express = require('express')
const cors = require('cors')
const app = express()
const fs = require('fs')
require('dotenv').config()
const compression = require('compression')

const { Client, LocalAuth, LegacySessionAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(compression());
app.use(cors());

const dir = './public';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// delete directory recursively
// fs.rm('./datas', { recursive: true }, (err) => {
//     if (err) {
//         if (err.errno != -2) {
//             throw err;
//         }
//     }
    
    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: "./datas" }),
        // authStrategy: new LegacySessionAuth({
        //     session: sessionData
        // }),
        // authTimeoutMs: 60000,
        puppeteer: {
            headless: true,
            // executablePath: CHROME_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        },
        // qrMaxRetries: 5,
        //session:sessionDatas, 
        // qrRefreshIntervalMs: 20000,
        // qrTimeoutMs: 0,
    });
    client.initialize();


    // Save session values to the file upon successful auth
    client.on('authenticated', (session) => {
        console.log('authenticated')
    });

    // client.resetState()

    client.on('state_changed', (reason) => {
        console.log('Client was logged out.', reason)
    })
      
    client.on('disconnected', (reason) => {
        console.log("Reason for disconnected: ", reason)
        // client.resetState()
        client.destroy();
        client.initialize()
    })
      


    client.on('qr', qr => {
        console.log('QR RECEIVED', qr);
        // res.send(qr);
        QRCode.toFile('./public/qrcode-data.png', qr, function (err) {
            if (err) throw err
        })
    });

    client.on('message', async msg => {
        let chat = await msg.getChat()
        if (!chat.isGroup) {
            msg.reply('Ini adalah *Bukan Ayang* , sebuah layanan WhatsApp automatis. Jika anda ingin berbicara dengan CS kami silahkan WhatsApp ke: \n\n +62-823-6221-6649 untuk MasbroWeb \n atau \n +62-812-8080-3301 untuk SkillFactory.id \n \n Terima Kasih');
        }
    }); 

    app.get('/', async (req, res, next) => {
        res.send('homepage'); 
    });

    // app.get('/getqr', async (req, res, next) => {
    //     await client.on('qr', async qr => {
    //         console.log('QR RECEIVED', qr);
    //         res.send({ qr }); 
    //     });
    //     // try {
    //     //     const msg = await client.sendMessage('6282362216649@c.us' , 'ponog'); // Send the message
    //     //     res.send({ msg }); // Send the response
    //     // } catch (error) {
    //     //     next(error);
    //     // }

    // })


    app.post('/send-message', async (req, res, next) => {
        try {
            const { number, message } = req.body;
            await client.sendMessage(`${number}@c.us`, message); // Send the message
            // res.send({ msg }); // Send the response
            res.json('success'); // Send the response
        } catch (error) {
            next(error);
        }

    })

    app.listen(PORT, () => {
        console.log(`Whatsapp app listening on port ${PORT}`)
    })
// });
