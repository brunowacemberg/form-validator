export default {

    name: 'required',
    parameter: null,
    message: "Campo obrigatório",
    fn: (value, parameter, cb) => {
        cb((value && value.length > 0))
    }

}