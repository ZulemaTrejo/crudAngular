const express = require('express'); //permite crear el servidor web
const morgan = require('morgan');  //permite visualizar las peticiones del usuario
const cors = require('cors');     //permite la comunicacion desde fuera del servidor
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const authorization =require('auth-header');

const Users = require('./models/Users');
const { moongose } = require('./database');
const { request } = require('express');

const app = express();

//Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('secret', 'my_secret_1357');

//Middleware = son capas intermedias que permiten interconectar nuestra aplicacion
app.use(express.json());   //permite interpretar respuestas json dentro del servidor
app.use(express.urlencoded({ extended: true })); //Para recibir los datos del formulario en texto
app.use(morgan('dev'));     //solo se carga en desarrollo
app.use(cors());



//Iniciar el servidor
app.listen(app.get('port'), () => {
    console.log('Servidor corriendo en http://localhost:' + app.get('port'));
});

//Ruta para iniciar sesión en el api
app.post('/api/login', async (req, res) => {
    const email = req.body.email;
    const passwd = req.body.password;
    return new Promise( (resolve, reject) => {
        Users.findOne({ email: email })
            .then( (user) => {
                if (!user) { //Si la consulta no regresa ningun usuario
                    res.json({ success: false, message: 'Usuario no encontrado' })
                } else { //Si se encontro el usuario
                    //Comprobar que el password corresponda al del usuario
                    if (bcrypt.compareSync(passwd, user.password)) {
                        const expire = 3600; //1 hora | expire = 24* 60 * 60 //1 dia
                        const token = jwt.sign(
                                                {user},
                                                app.get('secret'),
                                                {expiresIn: expire}
                                      );
                        res.json({ 
                            success: true, 
                            token: token 
                            })
                    } else {
                        res.json({ success: false, message: 'Password no coincide' })
                    } //else bcrypt
                } //else !user
            }) //.then
    }) //new Promise
}); // Fin de /api/login

//El token se envía a través de req.body (en un json)
//req.query.token (en la url)
//req.headers (contiene las cabeceras de authorization)

app.use((req, res, next) => {
    var tokenauth='';
    if (req.get('authorization')){
        auth=authorization.parse(req.get('authorization'));
        if (auth.scheme=='token-auth')
        tokenauth=auth.token;
    }
    const token = req.body.token ||  //json
        req.query.token || //url
        tokenauth;
        /*req.headers['authorization']; //headers*/
    if (token) {
        jwt.verify(token, app.get('secret'), (err, decoded) => {
            if (err) {
                return res.json({ success: false, message: 'Fallo en la autenticación' })
            } else {
                req.decoded = decoded; //Almacenamos en req el token descodificado
                next(); //Permite ejecutar las siguientes funciones de las rutas
            }
        })
    } else { //Si no existe el token o no se ha enviado en el request
        return res.status(403).send({
            success: false,
            message: 'El token no existe'
        })
    }
}); // Fin de app.use*/

//Las rutas que están de aqui para abajo solo se accesarám si el usuario envía un token y ha iniciado sesión

//Rutas del servidor
app.use('/api/empleadosAng', require('./routes/empleados.routes')); //http://localhost:3000/api/empleados
app.use('/api/users', require('./routes/users.routes'));

