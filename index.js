//importaciones
const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser')
const expressValidator = require('express-validator'); 
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport')
//helpers con algunas funcioes
const helpers = require('./helpers')
// extraer valores de variables.env
require('dotenv').config({path: 'variables.env'})

//crear una coneccion a la bd
const db = require('./config/db');

// importar el modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');

db.sync()
    .then(() => console.log('conectado al servidor'))
    .catch(error => console.log(error));

// crear una app de express     
const app = express();

// habilitar bodyParser para leer datos de formularios
app.use(bodyParser.urlencoded({extenden: true}));

// donde cargar los archivos estaticos
app.use(express.static('public'));

// habilitar pug - es para agregar cierto valor
app.set('view engine', 'pug')

//añadir la carpeta de las vistas
app.set('views', path.join(__dirname, './views'))

// agregar flash messages
app.use(flash());

app.use(cookieParser())

//nos permiten navegar entre varias paginas sin volver a identificarnos
app.use(session({
    secret: 'supersecreto',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// pasar var dump a la app
app.use((req, res, next) => {
    res.locals.vardump = helpers.vardump;
    res.locals.mensajes = req.flash();
    res.locals.usuario = {...req.user} || null;
    next();
});

// use es para cuando haces un request
app.use('/', routes());

// servidor y puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, ()=>{
    console.log('El servidor esta funcionando')
})



