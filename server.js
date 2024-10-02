const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración del tamaño del lienzo
const canvasWidth = 100; // Ancho en píxeles
const canvasHeight = 100; // Alto en píxeles
const canvasData = Array(canvasWidth).fill().map(() => Array(canvasHeight).fill('#FFFFFF')); // Lienzo blanco

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    // Enviar el estado actual del lienzo al nuevo usuario
    socket.emit('canvasData', canvasData);

    // Manejar cambios de píxeles
    socket.on('pixelChange', (data) => {
        const { x, y, color } = data;

        // Actualizar el lienzo
        canvasData[x][y] = color;

        // Emitir el cambio a todos los demás usuarios
        socket.broadcast.emit('pixelChange', data);
    });

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
