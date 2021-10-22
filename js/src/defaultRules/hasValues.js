

export default {

    name: 'hasValues',
    parameter: null,
    message: "Campo inválido",
    async: false,
    fn: (values, parameter) => {
        let hasValues = true;
        if(typeof parameter === "object") {
            if(parameter.length === 0) {
                hasValues = false;
            }
            parameter.forEach(p => {
                if(!values.includes(p)) {
                    hasValues = false;
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