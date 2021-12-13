
export default {
    name: 'phone',
    parameter: null,
    message: 'Telefone inválido',
    async: false,
    fn: (value, parameter) => {
        if(!value.length) {
            return true
        } else {
            var exp =  /^((\d{3}).(\d{3}).(\d{3})-(\d{2}))*$/;
            return exp.test(value)
        }
        
    }
}
