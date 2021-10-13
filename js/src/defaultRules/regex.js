export default {
    name: 'regex',
    parameter: null,
    message: 'Field is not valid',
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        let exp =  new RegExp(parameter);
        cb(exp.test(value))
    }
}
