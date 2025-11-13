const io = require('socket.io-client');
const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'], reconnection: false });

socket.on('connect', () => {
  console.log('connected to ws, id=', socket.id);
  socket.emit('request-initial-logs', { timeRange: '15m', size: 5 });
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message);
  process.exit(1);
});

socket.on('initial-logs', (data) => {
  console.log('initial-logs received, count=', data.logs.length);
  console.log(JSON.stringify(data.logs.slice(0,3), null, 2));
  socket.disconnect();
  process.exit(0);
});

socket.on('new-logs', (data) => {
  console.log('new-logs:', data.count);
});

setTimeout(() => {
  console.log('timeout, no initial logs, exiting');
  socket.disconnect();
  process.exit(0);
}, 10000);
