export default {

    name: 'maxLength',
    parameter: null,
    message: "Value is too large",
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        cb(value.length <= parameter)
    }

}