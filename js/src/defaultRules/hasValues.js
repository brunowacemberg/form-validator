

export default {

    name: 'hasValues',
    parameter: null,
    message: "Field doesn't have needed values",
    async: false,
    fn: (values, parameter) => {
        let hasValues = false;
        if(typeof parameter === "object") {
            parameter.forEach(p => {
                if(values.includes(p)) {
                    hasValues = true;
                }
            })
        } else {
            if(values.includes(parameter)) {
                hasValues = true;
            }
        }

        return hasValues
    }

}