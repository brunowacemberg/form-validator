export default {

    name: 'maxLength',
    parameter: null,
    message: "Valor grande demais",
    async: false,
    fn: (values, parameter) => {
        !parameter && (cb(true));
        return (values.length <= parameter)
    }

}