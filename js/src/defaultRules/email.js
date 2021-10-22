export default {

    name: 'email',
    parameter: null,
    message: "Invalid email address",
    async: false,
    fn: (values, parameter) => {
        var emailRegex = /[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        return emailRegex.test(values) || !values.length
    }

}