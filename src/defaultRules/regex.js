export default {
    name: 'regex',
    parameter: null,
    message: 'Valor inválido',
    async: false,
    fn: (value, parameter) => {
        if(!parameter) {
            return true
        }
        let allValid = true;
        var exp =  new RegExp(parameter);
        value.forEach(value => {
            if(!exp.test(value)) {
                allValid = false
            }
        })
        return allValid
    }
}
