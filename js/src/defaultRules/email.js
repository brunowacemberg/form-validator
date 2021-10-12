export default {

    name: 'emailz z s cd',
    parameter: null,
    message: "Email inválido",
    fn: (value, parameter, cb) => {
        var emailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        cb(emailRegex.test(value))
    }

}