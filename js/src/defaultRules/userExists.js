export default {

    name: 'userExists',
    parameter: null,
    message: "Campo obrigatório",
    fn: (value, parameter, cb) => {
        let r = () => {
            if(value === "test") {
                cb(true)
            } else {
                cb(false)
            }
        }
        setTimeout(r, 1500)
    }

}