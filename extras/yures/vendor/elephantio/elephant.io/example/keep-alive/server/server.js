/**
 * This file is part of the Elephant.io package
 *
 * For the full copyright and license information, please view the LICENSE file
 * that was distributed with this source code.
 *
 * @copyright Wisembly
 * @license   http://www.opensource.org/licenses/MIT-License MIT License
 */

const server = require('http').createServer();
const io = require('socket.io')(server);

const port = 3000;

io.of('/keep-alive')
    .on('connection', socket => {
        console.log('Client connected: %s', socket.id);
        socket
            .on('disconnect', () => {
                console.log('Client disconnected: %s', socket.id);
            })
            .on('message', data => {
                console.log('Client send message: %s', data);
                socket.emit('message', {success: true});
            });
    });

server.listen(port, () => {
    console.log('Server listening at %d...', port);
});