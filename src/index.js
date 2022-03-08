const server = require('./server');

const port = process.env.PORT;

server.listen(port, () => {
    console.log('Node web server started on port', port)
})