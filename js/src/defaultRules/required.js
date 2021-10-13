export default {

    name: 'required',
    parameter: null,
    message: "This field is required",
    fn: (value, parameter, cb) => {
        cb((value && value.length > 0))
    }

}