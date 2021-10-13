export default {
    name: 'regex',
    parameter: null,
    message: 'Invalid value',
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        let exp =  new RegExp(parameter);
        cb(exp.test(value))
    }
}
