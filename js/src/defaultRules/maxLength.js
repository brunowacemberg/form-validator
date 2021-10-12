export default {

    name: 'maxLength',
    parameter: null,
    message: "Tamanho maior que o permitido",
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        cb(value.length <= parameter)
    }

}