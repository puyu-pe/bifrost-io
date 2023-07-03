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

const port = 1337;

// Stored tokens
const tokens = {};

// Stored users
const users = {};

// set up initialization and authorization method
io.use((socket, next) => {
    const auth = socket.request.headers.authorization;
    const user = socket.request.headers.user;
    if(auth && user) {
        const token = auth.replace('Bearer ', '');
        console.log('auth token', token);
        // do some security check with token
        // ...
        // store token and bind with specific socket id
        if (!tokens[token] && !users[token]) {
            tokens[token] = socket.id;
            users[token] = user;
        }
        return next();
    } else{
        return next(new Error('no authorization header'));
    }
});

io.on('connection', socket => {
    let nb = 0;

    console.log('SocketIO > Connected socket ' + socket.id);
    console.log("X-My-Header", socket.handshake.headers['x-my-header']);

    socket.on('private_chat_message', message => {
        ++nb;
        let reply;
        console.log('ElephantIO private_chat_message < %s', message);
        if (!message['token']) {
            reply = 'Token is missed';
        }
        if (!tokens[message['token']]) {
            reply = 'Token is invalid';
        }
        let user = users[message['token']];
        if (!user) {
            reply = 'Sorry. I don\'t remember you.';
        } else if (message['message'].indexOf('remember') !== -1) {
            reply = 'I remember you, ' + user;
        } else {
            reply = 'I am fine, ' + user;
        }
        console.log('ElephantIO private_chat_message > %s', reply);
        socket.emit('private_chat_message', reply);
    });
    socket.on('disconnect', () => {
        console.log('SocketIO : Received ' + nb + ' messages');
        console.log('SocketIO > Disconnected socket ' + socket.id);
    });
});

server.listen(port, () => {
    console.log('Server listening at %d...', port);
});