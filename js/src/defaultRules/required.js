export default {

    name: 'required',
    parameter: null,
    message: "Campo obrigatório",
    async: false,
    fn: (value, parameter) => {
        return (value && value.length > 0)
    }

}