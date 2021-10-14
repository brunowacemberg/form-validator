export default {

    name: 'minLength',
    parameter: null,
    message: "Value is too small",
    async: false,
    fn: (values, parameter) => {
        !parameter && (cb(true));
        return (values.length >= parameter)
    }

}