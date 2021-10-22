

export default {
    name: 'fullName',
    parameter: null,
    message: 'Digite seu nome completo',
    async: false,
    fn: (values, parameter) => {
        let exp =  new RegExp(/^([\w]{3,})+\s+([\w\s]{3,})+$/i);
        return exp.test(values)
    }
}
