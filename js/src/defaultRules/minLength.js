export default {

    name: 'minLength',
    parameter: null,
    message: "Value is too small",
    fn: (value, parameter, cb) => {
        !parameter && (cb(true));
        cb(value.length >= parameter)
    }

}