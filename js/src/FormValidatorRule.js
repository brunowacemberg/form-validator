export default class FormValidatorRule {
    
    constructor(ruleObject) { 
        this.name = ruleObject.name;
        this.parameter = ruleObject.parameter;
        this.message = ruleObject.message;
        this.async = ruleObject.async;
        this.fn = ruleObject.fn;

        return this
    }

    test(value) {

        var message = this.message
        let handleRulePromise = (resolve, reject) => {
            if(this.fn === undefined) {
                resolve()
            } else {
                if(this.async === true) {
                    this.fn(value, this.parameter, function(res) {
                        if(res) {
                            resolve()
                        } else {
                            reject(message)
                        }
                    })
                } else {
                    if(this.fn(value, this.parameter)) {
                        resolve()
                    } else {
                        reject(message)
                    }
                }
            }
        }
        
        return new Promise(handleRulePromise)
        
    }
    

}
