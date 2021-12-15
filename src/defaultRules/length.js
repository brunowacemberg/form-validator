export default {

    name: 'length',
    parameter: null,
    message: "Quantidade de itens inválida",
    async: false,
    fn: (value, parameter) => {
        if(!parameter) {
            return true
        }
        return (value.length === parameter)
    }

}