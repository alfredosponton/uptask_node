const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const enviarEmail = require('../handlers/email')


exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
});

// funcion para revisar si el usuario esta logueado o no
exports.usuarioAutenticado = (req, res, next) => {

    //si esta autenticado, adelante
    if(req.isAuthenticated()) {
        return next();
    }
    // si no esta autentic, redirige al form
    return res.redirect('/iniciar-sesion')
}

//funcoin para cerrar sesion
exports.cerrarSesion = (req, res) => {
    req.session.destroy(()=> {
        res.redirect('iniciar-sesion');
    })
}

// genera un token si el usuario es valido
exports.enviarToken = async(req, res) => {
    
    // verificar si el usuario existe
    const usuario = await Usuarios.findOne({where: { email: req.body.email}});

    //si no existe el usuario
    if (!usuario) {
        req.flash('error', 'No existe esa cuenta')
        res.redirect('/reestablecer')
    }

    //usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expiracion = Date.now() + 3600000;

    //guardar en la base de datos
    await usuario.save()

    //url de reset
    const resetUrl = `http://${req.headers.host}/reestablecer/${usuario.token}`;

    //enviar el correo con el token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reestablecer-password'
    })

    
      //terminar la accion
      req.flash('correcto', 'Se envió un mensaje a tu correo');
      res.redirect('/iniciar-sesion');
}

exports.validarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: { 
            token: req.params.token
    }});

    // si no encuentra el usuario
    if(!usuario){
        req.flash('error', 'No válido');
        res.redirect('/reestablecer');
    }

    // formulario para generar password
    res.render('resetPassword', {
        nombrePagina : 'Reestablecer Contraseña'
    })
}


// cambiaa el password por uno nuevo
exports.actualizarPassword = async (req, res) =>{

    //verifica token valido y fecha de expiracion
    const usuario = await Usuarios.findOne({
        where: { 
            token: req.params.token,
            expiracion: {
                [Op.gte]:  Date.now()
            }
        }
    })

    //verificamos si existe el usario
    if(!usuario){
        req.flash('error', 'No válido');
        res.redirect('/reestablecer');
    }

    //hashear el password
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10) );

    usuario.token = null;
    usuario.expiracion = null;

    //guardamos nuevo password
    await usuario.save();

    req.flash('correcto', 'Tu contraseña se modifico correctamente');
    res.redirect('/iniciar-sesion');
}
