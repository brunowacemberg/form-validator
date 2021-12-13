

export default {

    name: 'hasValues',
    parameter: null,
    message: "Campo inválido",
    async: false,
    fn: (value, parameter) => {
        let hasValues = true;
        if(typeof parameter === "object") {
            if(parameter.length === 0) {
                hasValues = false;
            }
            parameter.forEach(p => {
                if(!value.includes(p)) {
                    hasValues = false;
                }
            })
        } else {
            if(value.includes(parameter)) {
                hasValues = true;
            }
        }

        return hasValues
    }

}