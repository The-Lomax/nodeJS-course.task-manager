const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

const apiDisabled = false;

app.use((req, res, next) => {
    if (apiDisabled) {
        res.status(503).send('Service is under maintenance');
    } else {
        next();
    }
})

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

module.exports = app;