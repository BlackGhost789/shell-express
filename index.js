const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const socket = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

let currentDir = process.cwd();

app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
    res.send('Server running');
});

socket.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('msg', (data) => {
        let command = data;
        
        if (command.startsWith('cd ')) {
            // Handle 'cd' command
            const targetDir = command.slice(3).trim(); // Get the directory to change to
            const newDir = path.resolve(currentDir, targetDir); // Resolve the full path
    
            try {
                process.chdir(newDir); // Change directory
                currentDir = process.cwd(); // Update the current directory
                console.log(`Directory changed to: ${currentDir}`);
                socket.emit('message', { message: `Directory changed to: ${currentDir}` });
            } catch (error) {
                console.error(`Error changing directory: ${error.message}`);
                socket.emit('message', { message: `Error changing directory: ${error.message}` });
            }
        } else {
            // Execute other commands
            exec(command, { cwd: currentDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    socket.emit('message', { message: `Error: ${error.message}` });
                } else if (stderr) {
                    console.error(`stderr: ${stderr}`);
                    socket.emit('message', { message: `stderr: ${stderr}` });
                } else {
                    console.log(`stdout: ${stdout}`);
                    socket.emit('message', { message: stdout });
                }
            });
        }
    });
});

httpServer.listen(3001, () => {
    console.log('Server connected on port 3001');
});
