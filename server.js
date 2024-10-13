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

let userCount = 0; // Contador de usuarios conectados

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    userCount++; // Aumentar el contador de usuarios
    console.log('Un usuario se ha conectado. Usuarios conectados: ' + userCount);

    // Enviar el estado actual del lienzo al nuevo usuario
    socket.emit('canvasData', canvasData);
    
    // Enviar el conteo de usuarios a todos los clientes
    io.emit('userCount', userCount);

    // Manejar cambios de píxeles
    socket.on('pixelChange', (data) => {
        const { x, y, color } = data;

        // Actualizar el lienzo
        canvasData[x][y] = color;

        // Emitir el cambio a todos los demás usuarios
        socket.broadcast.emit('pixelChange', data);
    });

    socket.on('disconnect', () => {
        userCount--; // Disminuir el contador de usuarios
        console.log('Un usuario se ha desconectado. Usuarios conectados: ' + userCount);
        
        // Enviar el conteo de usuarios a todos los clientes
        io.emit('userCount', userCount);
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});