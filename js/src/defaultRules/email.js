export default {

    name: 'email',
    parameter: null,
    message: "Invalid email address",
    fn: (value, parameter, cb) => {
        var emailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        cb(emailRegex.test(value))
    }

}