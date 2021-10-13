export default {

    name: 'userExists',
    parameter: null,
    message: "E-mail já cadastrado",
    fn: (value, parameter, cb) => {
        let r = () => {
            if(value === "bruno.wacemberg@liferay.com") {
                cb(false)
            } else {
                cb(true)
            }
        }
        setTimeout(r, 1500)
    }

}