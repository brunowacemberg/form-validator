export default class FormValidatorRule {
    
    constructor(ruleObject) {    
        this.name = ruleObject.name;
        this.parameter = ruleObject.parameter;
        this.message = ruleObject.message;
        this.fn = ruleObject.fn;

        return this
    }

    test(value, cb) {
        this.fn(value, this.parameter, function(res) {
            cb(res)
        })
    }
    


    

}
