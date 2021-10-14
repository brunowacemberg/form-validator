export default {

    name: 'required',
    parameter: null,
    message: "This field is required",
    async: false,
    fn: (values, parameter) => {
        return (values && values.length > 0)
    }

}