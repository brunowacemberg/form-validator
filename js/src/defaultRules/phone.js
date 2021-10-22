
export default {
    name: 'phone',
    parameter: null,
    message: 'Telefone inválido',
    async: false,
    fn: (values, parameter) => {
        
        var exp =  /^((\d{3}).(\d{3}).(\d{3})-(\d{2}))*$/;
        return exp.test(values)
    }
}
