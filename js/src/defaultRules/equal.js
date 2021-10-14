

export default {

    name: 'email',
    parameter: null,
    message: "Invalid email address",
    async: false,
    fn: (values, parameter) => {
        let isEqual = true;
        if(typeof parameter === "object") {
            parameter.forEach(p => {
                if(!values.includes(p)) {
                    isEqual = false;
                }
                if(parameter.length !== values.length) {
                    isEqual = false;
                }
            })
            
        } else {
            if(!values.includes(parameter)) {
                isEqual = false;
            }
        }

        return isEqual;
    }

}