

export default {
    name: 'fullName',
    parameter: null,
    message: 'Please type your full name',
    fn: (value, parameter, cb) => {
        let exp =  new RegExp(/^([\w]{3,})+\s+([\w\s]{3,})+$/i);
        cb(exp.test(value))
    }
}
