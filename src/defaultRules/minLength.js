export default {

    name: 'minLength',
    parameter: null,
    message: "Valor pequeno demais",
    async: false,
    fn: (value, parameter) => {
        if(!parameter) {
            return true;
        } 
        return (value.length >= parameter)
    }

}