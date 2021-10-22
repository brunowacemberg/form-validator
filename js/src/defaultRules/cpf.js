
export default {
    name: 'cpf',
    parameter: null,
    message: 'CPF inválido',
    async: false,
    fn: (values, parameter) => {
        
        var exp =  /^((\d{3}).(\d{3}).(\d{3})-(\d{2}))*$/;
        return exp.test(values)
    }
}
