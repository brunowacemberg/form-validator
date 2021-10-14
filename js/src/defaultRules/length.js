export default {

    name: 'maxLength',
    parameter: null,
    message: "Value is too large",
    async: false,
    fn: (values, parameter) => {
        if(!parameter) {
            return true
        }
        return (values.length === parameter)
    }

}