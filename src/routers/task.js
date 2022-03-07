const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = express.Router();


// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt&order=desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    if (req.query.sortBy) {
        sort[req.query.sortBy] = req.query.order === 'desc' ? -1 : 1;
    }

    try {
        // const tasks = await Task.find({});
        // const tasks = await Task.find({ user: req.user._id });
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });
        const tasks = req.user.tasks;
        if (!tasks) return res.status(404).send({message: 'No tasks found'});
        res.send(tasks);
    } catch (err) {
        res.status(500).send();
    }

    // Task.find({}).then((tasks) => {
    //     if (!tasks) return res.status(204).send();
    //     res.send(tasks);
    // }).catch((err) => {
    //     res.status(500).send();
    // })
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, user: req.user._id })
        if (!task) return res.status(404).send({message: 'Task not found'});
        res.send(task);
    } catch (err) {
        res.status(500).send(err.message);
    }

    // Task.findById(_id).then((task) => {
    //     if (!task) return res.status(204).send();
    //     res.send(task);
    // }).catch((err) => {
    //     res.status(500).send(err.message);
    // })
})

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body);

    const task = new Task({
        ...req.body,
        user: req.user._id
    })

    try {
        const newTask = await task.save();
        res.status(201).send(newTask);
    } catch (err) {
        res.status(400).send(err.message);
    }

    // task.save().then(() => {
    //     res.status(201).send(task);
    // }).catch((err) => {
    //     res.status(400).send(err.message);
    // })
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['user', 'description', 'completed'];
    const updates = Object.keys(req.body);
    const _id = req.params.id;

    // check if every element of provided values to be updated is present in the allowed list
    // if using shorthand can skip the return word
    const isValid = updates.every((el) => allowedUpdates.includes(el));

    // If not using shorthand, need to use return keyword, otherwise result will always be false
    // const isValid = updates.every((el) => {
    //     return allowedUpdates.includes(el);
    // })

    // terminate execution if user attempts to update invalid document property
    if (!isValid) return res.status(403).send({error: {message: "Attempted invalid update operation"}});

    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({_id, user: req.user._id})

        //const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        if (!task) return res.status(404).send({ "message": "Task not found." });

        updates.forEach((update) => task[update] = req.body[update]);

        await task.save();

        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;

    try {
        // const task = await Task.findByIdAndDelete(_id);
        const task = await Task.findOneAndDelete({_id, user: req.user._id});

        if (!task) return res.status(404).send({ "message": "Task not found." });
        res.send(task);
    } catch (err) {
        res.status(500).send(err.message);
    }
})

module.exports = router;