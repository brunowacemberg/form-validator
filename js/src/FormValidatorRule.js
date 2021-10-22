
const removeUndefinedObjectKeys = (obj) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj
};
export default class FormValidatorRule {
    
    constructor(ruleObject) { 
        this.name = ruleObject.name;
        this.parameter = ruleObject.parameter;
        this.message = ruleObject.message;
        this.async = ruleObject.async || false;
        this.fn = ruleObject.fn;

        return this
    }

    test(values, cb) {
        if(this.fn === undefined) {
            cb(true)
        } else {
            if(this.async === true) {
                this.fn(values, this.parameter, function(res) {
                    cb(res)
                })
            } else {
                cb(this.fn(values, this.parameter))
            }
        }
        
    }
    

}
