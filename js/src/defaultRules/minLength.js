export default {

    name: 'minLength',
    parameter: null,
    message: "Valor pequeno demais",
    async: false,
    fn: (values, parameter) => {
        !parameter && (cb(true));
        return (values.length >= parameter)
    }

}