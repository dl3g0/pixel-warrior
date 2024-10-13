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

// Objeto para contar píxeles por usuario
const pixelCount = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    // Inicializar contador de píxeles para el nuevo usuario
    pixelCount[socket.id] = { nickname: '', count: 0 };

    // Enviar el estado actual del lienzo y la clasificación al nuevo usuario
    socket.emit('canvasData', canvasData);
    socket.emit('updateRanking', pixelCount);

    // Manejar cambios de píxeles
    socket.on('pixelChange', (data) => {
        const { x, y, color, nickname } = data;

        // Actualizar el lienzo
        canvasData[x][y] = color;

        // Guardar el nickname y contar píxeles para el usuario
        pixelCount[socket.id].nickname = nickname; // Guardar el nickname
        pixelCount[socket.id].count += 1; // Incrementar contador

        // Emitir el cambio a todos los demás usuarios
        socket.broadcast.emit('pixelChange', data);

        // Emitir la clasificación actualizada a todos los usuarios
        io.emit('updateRanking', pixelCount);
    });

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado');
        delete pixelCount[socket.id]; // Opcional: elimina al usuario de la clasificación
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
