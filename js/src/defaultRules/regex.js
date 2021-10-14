export default {
    name: 'regex',
    parameter: null,
    message: 'Invalid value',
    async: false,
    fn: (values, parameter) => {
        !parameter && (cb(true));
        let allValid = true;
        var exp =  new RegExp(parameter);
        values.forEach(value => {
            if(!exp.test(value)) {
                allValid = false
            }
        })
        return allValid
    }
}
