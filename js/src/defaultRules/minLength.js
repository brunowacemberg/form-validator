export default {

    name: 'minLength',
    parameter: null,
    message: "Tamanho menor que o permitido",
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        cb(value.length >= parameter)
    }

}