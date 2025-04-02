require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
        "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

console.log(process.env.FIREBASE_TYPE)

const database = admin.database();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const canvasWidth = 100;
const canvasHeight = 100;

app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//cantidad de usuarios
let userCount = 0;

io.on('connection', (socket) => {
    let userNickname = ''

    userCount++;
    console.log('Un usuario se ha conectado. Usuarios conectados:', userCount);

    //obtiene datos de firebase
    database.ref('canvas').once('value', (snapshot) => {
        const data = snapshot.val() || {};
        const canvasData = Array(canvasWidth).fill().map(() => Array(canvasHeight).fill('#FFFFFF')); //datos en blanco por defecto
    
        //recorre los datos obtenido de firebase y los reenvia a los usuarios conectados
        Object.keys(data).forEach((x) => {
            Object.keys(data[x]).forEach((y) => {
                if (data[x][y] && data[x][y].color) {
                    canvasData[x][y] = data[x][y].color;
                }
            });
        });
    
        socket.emit('canvasData', canvasData);
    });
    

    //enviar usuarios conectados a los otros usuarios
    io.emit('userCount', userCount);

    //escucha el cambio del nickname y lo guarda
    socket.on('setNickname', (nickname) => {
        userNickname = nickname; //
    });

    socket.on('pixelChange', (data) => {
        const { x, y, color } = data;

        // guarda el nombre, color posicion del pixel en firebase
        database.ref(`canvas/${x}/${y}`).set({
            color: color,
            user: userNickname
        });

        //enviar actualizacion a usuarios
        socket.broadcast.emit('pixelChange', { x, y, color, user: userNickname });
    });

    // esuchar evento para cuando el usuario haga hover se muestre el cambio de quien lo hizo
    socket.on('fetchPixelData', (data) => {
        const { x, y } = data;

        //obtener datos desde firebase
        database.ref(`canvas/${x}/${y}`).once('value', (snapshot) => {
            const pixelData = snapshot.val();

            if (pixelData) {
                // Enviar los datos del píxel (color y usuario) al cliente
                socket.emit('pixelData', { color: pixelData.color, user: pixelData.user });
            }else{
                socket.emit('pixelData', null);
            }
        });
    });

    socket.on('disconnect', () => {
        userCount--;
        console.log('Un usuario se ha desconectado. Usuarios conectados:', userCount);

        //en caso de desconeccion actualiza el numero de usuarios
        io.emit('userCount', userCount);
    });
});

server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});