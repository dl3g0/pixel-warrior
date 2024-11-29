const express = require('express');
require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Reemplazar saltos de línea
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

// Configuración de Firebase Admin (usa tu archivo de clave de servicio)

// Inicializar Firebase con las credenciales
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pixel-warrior-13fcc-default-rtdb.firebaseio.com"
  });

const database = admin.database();

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const canvasWidth = 100;
const canvasHeight = 100;

// Rutas
app.use(express.static(__dirname)); // Sirve archivos estáticos como index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Contador de usuarios conectados
let userCount = 0;

io.on('connection', (socket) => {
    let userNickname = ''; // Inicializar el nickname vacío

    userCount++;
    console.log('Un usuario se ha conectado. Usuarios conectados:', userCount);

    // Enviar el estado inicial del lienzo desde Firebase
    database.ref('canvas').once('value', (snapshot) => {
        const data = snapshot.val() || {};
        const canvasData = Array(canvasWidth).fill().map(() => Array(canvasHeight).fill('#FFFFFF'));  // Inicializamos el lienzo con color blanco
    
        // Iterar sobre los datos de Firebase para asignar colores y usuarios a cada píxel
        Object.keys(data).forEach((x) => {
            Object.keys(data[x]).forEach((y) => {
                // Verificar si el píxel tiene datos en Firebase
                if (data[x][y] && data[x][y].color) {
                    canvasData[x][y] = data[x][y].color;  // Asignar el color desde Firebase
                }
            });
        });
    
        socket.emit('canvasData', canvasData);  // Enviar los datos del lienzo al cliente
    });
    

    // Enviar el número de usuarios conectados
    io.emit('userCount', userCount);

    // Escuchar el cambio de nickname
    socket.on('setNickname', (nickname) => {
        userNickname = nickname; // Guardar el nickname del usuario
    });

    // Escuchar cambios de píxeles
    socket.on('pixelChange', (data) => {
        const { x, y, color } = data;

        // Guardar el cambio en Firebase, junto con el nombre de usuario
        database.ref(`canvas/${x}/${y}`).set({
            color: color,
            user: userNickname  // Guardar el nickname del usuario que hizo el cambio
        });

        // Enviar el cambio a los demás clientes junto con el nickname
        socket.broadcast.emit('pixelChange', { x, y, color, user: userNickname });
    });

    // Escuchar la solicitud de datos de un píxel
    socket.on('fetchPixelData', (data) => {
        const { x, y } = data;

        // Obtener los datos del píxel desde Firebase
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

        // Actualizar el número de usuarios conectados
        io.emit('userCount', userCount);
    });
});

// Iniciar servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});