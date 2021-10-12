import FormValidatorRule from './FormValidatorRule';
import DEFAULT_RULES from './defaultRules';

const parseHTML = (htmlString) => {
    const parser = new DOMParser();
    return parser.parseFromString(htmlString.trim(), 'text/html').body.firstChild;

} 

const removeUndefinedObjectKeys = (obj) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj
};

export default class FormValidatorField {
    
    logError(message, _context) {
        let context = _context;
        console.error(message, context);
    }
    logWarning(message, _context) {
        let context = _context;
        console.warn(message, context);
    }
    log(message, _context) {
        let context = _context;
        console.log(message, context);
    }

    constructor(fieldObject) {
        
        this.element = document.getElementById(fieldObject.id);
        this.id = fieldObject.id;
        this.events = fieldObject.events;
        this.message = null;
        
        this.status = null;
        this.helpText = fieldObject.helpText;

        // Prepare rules object
        this.rules = [];
        fieldObject.rules.forEach(ruleObject => {
            let rule = new FormValidatorRule(ruleObject);
            this.rules.push(rule)
        })

        // Field validation  state rendering-related variables 
        this.fieldWrapperClassname = fieldObject.fieldWrapperClassname;
        this.fieldWrapperValidClassname = fieldObject.fieldWrapperValidClassname;
        this.fieldWrapperInvalidClassname = fieldObject.fieldWrapperInvalidClassname;
        this.fieldValidClassname = fieldObject.fieldValidClassname;
        this.fieldInvalidClassname = fieldObject.fieldInvalidClassname;
        this.showFieldMessage = fieldObject.showFieldMessage;
        this.fieldMessageHTML = fieldObject.fieldMessageHTML;
        
        this.$fieldMessage = null;
        this.validationElements = [];

        this.element.addEventListener('change', () => {
            this.status = null;
        })

        this.$elementWrapper = this.element.closest('.'+this.fieldWrapperClassname)
        

    }


    showMessage() {
        if(this.showFieldMessage) {
            let messageHTML = this.fieldMessageHTML.replace("{{message}}", this.message);
            let $message = parseHTML(messageHTML);
            this.$elementWrapper.classList.add(this.fieldWrapperInvalidClassname);
            this.element.classList.add(this.fieldInvalidClassname);
            this.validationElements.push($message);
            this.$elementWrapper.appendChild($message);
        }
    }

    resetValidation() {
        // remove all validation relements
        if(this.validationElements.length) {
            this.validationElements.forEach(element => {
                element.remove()
                let i = this.validationElements.indexOf(element);
                if (i > -1) {
                    this.validationElements.splice(i, 1);
                }
            })
        }

        this.$elementWrapper.classList.remove(this.fieldWrapperInvalidClassname); 
        this.element.classList.remove(this.fieldInvalidClassname);
    }



    async validate() {
        
        this.resetValidation()

        if(this.status === -1) {
            this.logError("validate(): Field \"#"+this.id+"\" is still being validated", this);
            return;
        }
        if(this.status === 1) {
            this.log("validate(): Field \"#"+this.id+"\" has been validated before and kept unchanged", this);
            return;
        }

        this.log("validate(): Field \"#"+this.id+"\" will be validated", this);

        this.events.onBeforeFieldValidate && (this.events.onBeforeFieldValidate(this));

        this.status = -1;
        this.message = null;

        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            let rulesPromises = [];
            let value = this.element.value;
            
            this.rules.forEach(rule => {

                if(DEFAULT_RULES[rule.name]) {
                    rule = new FormValidatorRule({...DEFAULT_RULES[rule.name], ...removeUndefinedObjectKeys(rule)})
                }

                let rulePromise = new Promise(function(resolveRulePromise, rejectRulePromise) {
                    rule.test(value, (result) => {
                        if(result) {
                            resolveRulePromise()
                        } else {
                            rejectRulePromise(rule.message)
                        }
                    })

                })
    
                rulesPromises.push(rulePromise);
            })
            
            Promise.all(rulesPromises).then(() => {
                this.status = 1;
                this.log("validate(): Field \"#"+this.id+"\" is valid", this);
                resolveValidationPromise();
            }).catch((message) => {
                this.status = 0;
                this.message = message;
                this.showMessage();
                this.log("validate(): Field \"#"+this.id+"\" is not valid", this);
                rejectValidationPromise();
            }).finally(() => {
                this.events.onFieldValidate && (this.events.onFieldValidate(this));
            });
        }

        return new Promise(handleValidationPromise);

    }


}