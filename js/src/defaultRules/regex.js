export default {
    name: 'regex',
    parameter: null,
    message: 'Valor inválido',
    async: false,
    fn: (values, parameter) => {
        if(!parameter) {
            return true
        }
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
