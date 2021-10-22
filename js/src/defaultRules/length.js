export default {

    name: 'length',
    parameter: null,
    message: "Quantidade de itens inválida",
    async: false,
    fn: (values, parameter) => {
        if(!parameter) {
            return true
        }
        return (values.length === parameter)
    }

}