export default {

    name: 'maxLength',
    parameter: null,
    message: "Valor grande demais",
    async: false,
    fn: (value, parameter) => {
        if(!parameter) {
            return true;
        }
        return (value.length <= Number(parameter))
    }

}