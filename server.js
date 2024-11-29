const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
        "type": "service_account",
        "project_id": "pixel-warrior-13fcc",
        "private_key_id": "4086e13d23dcf5545c9aaadf1b6734dee2258621",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDYHwQzPtiRsc3Y\nr45WdzrbmmCnl4cd7c0CA6AULy9NJUEroRQscuXaZp5glNTkkIvtFesaXd33JPaW\ngSy53ZPA4OOQDXFmAINZs8XcFfvizlVlCr+IkkBb9ch6Tk8IjJbTxcmIYqhTg/Mt\nbhQJW8807Xa3eJUzKr0quFD/b+SpkqcY8DSBvX8mztTo5n/clLDnofvDmQzPIpGK\nib8TKm6Ip5u454cuxHxST4COSctYUXSeqgx+VndZBnnwLbnnSDom7mvGLJxM6OCL\nKkV5SYE7t9lMxpbXyV0iuLmOZJH9DjUOd1qYSjKsUj94s+5FPi0PUF45z2nAcqgE\n9xvMHdmtAgMBAAECggEAFNjjFRVkGyO5XURL+OO96faJickIV9b7Pk0+uQu3Jpwo\nHe8HDOWVbfyVnO/mXFjkIn3JhKzWzzMB1VFHEPPCf6nB0cC2NlZo1TON67W0KzPn\nkVxYzvH6otRB3yhkH8k9+FYdI1qO7aVuBO0YIjH4uhyI5dhMHhgqkK8gYw92UXP+\nXvGWIvk0fYf1QYesIi2Z6yrWSMqSuArzH8b3m5bDaBg6tUiL5yoLhMGxKmDaABMp\noiydolwP55l2Dds04Mmg2vw1xQC9LYxvKuqPc5Wdm4d/vMS/dErRzlNR9hWiZQ3k\nbluQaLCah603WUsfvE04/etxyxnCdbsr7ltqYQ00+QKBgQD1HVKlF7XLhEsEGp3T\npL48WiB4MWHItYgZKL5JI0F1sn8uI0cHnAJLB4+izM16b0BtuRjwiLkhbXPwsyHW\nMLOzC+LBQQJzTFxoRkv8VytPORmWfBKQbtuxWzu2bm03zT/QV/jjVFp6wjL9hTWd\nljrrB2VwMidmEQRJpgzkCZFKxQKBgQDhuBJDjeUZn1FgooL1dad078wl/esdUj02\nnm64rlLEBDSa1laELmImplncuGdlJpzMKkl9wZIG22kAi2JBj5VH/+F9gFCnUKS8\n5OAiMPywIFuI1KHAsicZZ145bCyVfowndDGOCzEuE/vssssfg/U+ry9y9Atd4N7O\nj7KOzjfhyQKBgQCRcOfEDDCT5Ri6A60Ykw1KNFRF3U9fT8/E1fcq4J+L3fE3CDmy\nWzDFImRpPkrCVlcNhCI3P3lSS2bbMP9n35gRKoFPGGsCzRGb0fJuda6+IGx9bXt6\ndj0nnLHuytFFpiUyU7Db+waBBtBIvA0XR7gIE2huTWQxXPGFXeESQlcS3QKBgA4U\nZU9BcqD+hxz4BiM5i5CHxLw58oiJsLfPeiia9x6zBHUEGbF1EzpF9iUGe6ybk/xI\nRv1JLcqvtQULrL1aL32mQHKLpnxJU31U6YY4eAqkehE28kAK3NWA1SfPz5gjpKpx\nXQX3PMIbDQPewzzcBlg6pUMOZgcdF8javdCanHHBAoGBAJZ4pvAM7CnUs9sNXXcE\nKwmgS5r60jy/vYMUBWDjGEb73DK7Y9HWY3SSiyEUGCytWk0ctQ01NsiJerj8zML5\nW5tJ0dmldIzBsbwucFHei6IMo/3/q/JIDIr+eLpbMqqw6aBKgxGcP3bv1Jt0iKKY\nCGKPhA0F10ispwVJlRyp/ol3\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-iomhh@pixel-warrior-13fcc.iam.gserviceaccount.com",
        "client_id": "112670580549194435454",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-iomhh%40pixel-warrior-13fcc.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
      }),
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