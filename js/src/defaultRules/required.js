export default {

    name: 'required',
    parameter: null,
    message: "Campo obrigatório",
    async: false,
    fn: (values, parameter) => {
        return (values && values.length > 0)
    }

}