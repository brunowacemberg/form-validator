export default {

    name: 'maxLength',
    parameter: null,
    message: "Value is too large",
    async: false,
    fn: (values, parameter) => {
        !parameter && (cb(true));
        return (values.length <= parameter)
    }

}