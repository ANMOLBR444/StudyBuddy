const express = require('express');
const flash = require('connect-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ejsMate = require('ejs-mate');
const multer = require('multer');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const { isLoggedIn } = require('./middleware');
const session = require('express-session');
const methodOverride = require('method-override'); 
const app = express();
const Todo = require('./models/todos')
const Personal = require('./models/personal');
const User = require('./models/user');
const Note = require('./models/notes');


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/collegeproject';
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';
mongoose.connect('mongodb://127.0.0.1:27017/collegeproject', {
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate)

const sessionConfig = {
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: Date.now() + 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(flash());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

// Register and Login 
app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Study Buddy');
            res.redirect('/todos')
        })

    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register')
    }
}))

app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'Welcome Back!');
    res.redirect('/todos')
})

//logout
app.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/home');
    });
});

//HOME PAGE

app.get('/home', (req, res) => {
    res.render('home')
})





// display todos
app.get('/todos', isLoggedIn, async (req, res) => {
    const todos = await Todo.find({});
    const personal = await Personal.find({});
    const user = req.user;
    if (user) {
        currentUser = await user.populate('personaltodos');
        res.render('list', { todos, personal, currentUser })
    }
})


//manipulate todos (admin)
app.get('/todos/show', async (req, res) => {
    const todos = await Todo.find({});
    res.render('show', { todos })
})
app.delete('/todos/show/:id', async (req, res) => {
    const { id } = req.params;
    await Todo.findByIdAndDelete(id);
    res.redirect('/todos')
})

//new todo(admin)
app.get('/todos/new', async (req, res) => {
    res.render('new')
})
app.post('/todos', async (req, res) => {
    const todo = new Todo(req.body.todo);
    await todo.save();
    res.redirect('/todos')
})


//delete personal todo
app.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await Personal.findByIdAndDelete(id);
    res.redirect('/todos')
})

//post personal todos
app.post('/:id/personaltodo', async (req, res) => {
    const user = await User.findById(req.params.id);
    const personal = new Personal(req.body.personal);
    user.personaltodos.push(personal);
    await personal.save();
    await user.save();
    res.redirect('/todos')
})

//NOTES Section

app.get('/notes', isLoggedIn, async (req, res) => {
    const notes = await Note.find({});
    res.render('notes', { notes })
})

app.get('/notes/new', async (req, res) => {
    res.render('newnote')
})
app.post('/notes', async (req, res) => {
    const note= new Note(req.body.note);
    await note.save();
    res.redirect('/notes')
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err });
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})