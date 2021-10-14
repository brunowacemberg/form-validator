import FormValidatorRule from './FormValidatorRule';
import DEFAULT_RULES from './defaultRules';
import Debugger from './Debugger';

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


    constructor(fieldObject, debug=false) {

        this.debugger = new Debugger(debug);

        if(!document.getElementsByName(fieldObject.name).length) {
            return;
        }
    
        this.name = fieldObject.name;
        this.group = fieldObject.group;
        this.fields = Array.from(document.getElementsByName(fieldObject.name));
        this.$wrapper = this.fields[0].closest('.'+fieldObject.fieldRenderPreferences.wrapperClass)
        
        this.events = fieldObject.events;
        this.helpText = fieldObject.helpText;
        this.fieldRenderPreferences = fieldObject.fieldRenderPreferences;
        this.validateFieldOnBlur = fieldObject.validateFieldOnBlur;
        this.resetFieldValidationOnChange = fieldObject.resetFieldValidationOnChange;
        this.dependenceRules = fieldObject.dependenceRules;
        
        // Prepare rules object
        this.useRules = true;
        this.rules = [];
        fieldObject.rules.forEach(ruleObject => {
            if(typeof ruleObject === "string") {
                ruleObject = {
                    name: ruleObject
                }
            }
            let rule = new FormValidatorRule(ruleObject);
            this.rules.push(rule)
        })

        this.init();
        
    }

    init() {
        
        this.status = undefined;
        this.message = undefined;
        this.validationElements = [];
        
        this.fields.forEach($field => {
            $field.addEventListener('input', (e) => {
                this.status = undefined;
                if(this.resetFieldValidationOnChange) {
                    this.resetValidation();
                }
                // this._validator.updateDependenceRules()
            })
        })

        if(this.validateFieldOnBlur) {
            this.fields.forEach($field => {

                let eventName = 'blur';
                if($field.getAttribute("type") === "radio" || $field.getAttribute("type") === "checkbox") {
                    eventName = 'change'
                }

                $field.addEventListener(eventName, () => {
                    if(eventName === 'change') {
                        this.resetValidation();
                    }
                    let validate = () => {
                        this.validate().then((message) => {
                        }).catch((message) => {
                        }).finally(() => {
                            this._validator.updateDependenceRules()
                        })
                    }
                    validate()
                })

            })
        }
        
    }


    getValues() {
        if(this.fields.length > 1) { // radio or checkbox
            let values = [];
            if(this.fields[0].getAttribute("type") === "radio" || this.fields[0].getAttribute("type") === "checkbox") {
                this.fields.forEach($field => {
                    if($field.checked) {
                        values.push($field.value)
                    }
                })
            }
            return values
        } else {
            return this.fields[0].value
        }
        
    }


    disableRules() {
        this.useRules = false;
    }
    enableRules() {
        this.useRules = true;
    }

    // Enable/disable field interaction
    disableInteraction() {
        this.fields.forEach($field => {
            if($field.hasAttribute("disabled")) {
                $field.setAttribute("data-originally-disabled", "")
            }
            $field.setAttribute("disabled","disabled");
        })
    }
    enableInteraction() {
        this.fields.forEach($field => {
            if(!$field.hasAttribute("data-originally-disabled")) {
                $field.removeAttribute("disabled");
            }
        })
    }

    // Set visual states
    setValidating(message) {
        this.resetValidation();
        this.status = -1;
        this.disableInteraction();
        
        if(this.fieldRenderPreferences.addValidatingClass) {
            this.fields.forEach($field => {
                $field.classList.add(this.fieldRenderPreferences.validatingClass);
            })
        }
        if(this.fieldRenderPreferences.addWrapperValidatingClass) {
            this.$wrapper.classList.add(this.fieldRenderPreferences.wrapperValidatingClass);
        }
        
        if(this.fieldRenderPreferences.showValidatingMessage && message && message.length) {
            this.message = message;
            let messageHTML = this.fieldRenderPreferences.validatingMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
    }
    setValid(message) {
        this.resetValidation();
        this.status = 1;
        this.enableInteraction();

        if(this.fieldRenderPreferences.addValidClass) {
            this.fields.forEach($field => {
                if(this.getValues().includes($field.value)) {
                    $field.classList.add(this.fieldRenderPreferences.validClass);
                }
            })
        }
        if(this.fieldRenderPreferences.addWrapperValidClass) {
            this.$wrapper.classList.add(this.fieldRenderPreferences.wrapperValidClass);
        }

        if(this.fieldRenderPreferences.showValidMessage && message && message.length) {
            this.message = message;
            let messageHTML = this.fieldRenderPreferences.validMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
    }
    setInvalid(message) {
        this.resetValidation();
        this.status = 0;
        this.enableInteraction();

        if(this.fieldRenderPreferences.addInvalidClass) {
            this.fields.forEach($field => {
                if(this.getValues().includes($field.value)) {
                    $field.classList.add(this.fieldRenderPreferences.invalidClass);
                }
            })
        }
        if(this.fieldRenderPreferences.addWrapperInvalidClass) {
            this.$wrapper.classList.add(this.fieldRenderPreferences.wrapperInvalidClass);
        }

        if(this.fieldRenderPreferences.showInvalidMessage && message && message.length) {
            this.message = message;
            let messageHTML = this.fieldRenderPreferences.invalidMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
        
    }

    resetValidation() {
        
        this.debugger.log("resetValidation(): Resetting field validation");
        this.status = undefined;
        this.message = undefined;
        
        this.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperValidatingClass);
        this.fields.forEach($field => {
            $field.classList.remove(this.fieldRenderPreferences.validatingClass);
        })
        this.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperValidClass);
        this.fields.forEach($field => {
            $field.classList.remove(this.fieldRenderPreferences.validClass);
        })
        this.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperInvalidClass);
        this.fields.forEach($field => {
            $field.classList.remove(this.fieldRenderPreferences.invalidClass);
        })

        this.validationElements.forEach(validationElement => {
            validationElement.remove()
        })
        this.validationElements = [];

        this.enableInteraction();

    }


    validate(focusBack=false) {

        if(this.status === -1) {
            this.debugger.logWarning("validate(): Field \"#"+this.name+"\" is still being validated");
            return new Promise((resolve, reject) => {
                reject()
            })
        }

        if(this.status === 1 || this.status === 0) {
            let status = this.status;
            this.debugger.logWarning("validate(): Field \"#"+this.name+"\" hasn't changed since last validation");
            return new Promise((resolve, reject) => {
                if(status === 1) {
                    resolve()
                } else {
                    reject()
                }
            })
        }

        if(!this.useRules) {
            return new Promise((resolve, reject) => {
                resolve()
            })
        }

        this.debugger.log("validate(): Field \"#"+this.name+"\" will be validated", this);

        (this.events && this.events.onBeforeValidate) && (this.events.onBeforeValidate(this));

        let validatingMessage = this.fieldRenderPreferences.validatingMessage;
        let validMessage = this.fieldRenderPreferences.validMessage;

        this.setValidating(validatingMessage);

        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            var rulesPromises = [];
            var values = this.getValues()
            
            this.rules.forEach(rule => {
                    
                if(DEFAULT_RULES[rule.name]) {
                    rule = new FormValidatorRule({...DEFAULT_RULES[rule.name], ...removeUndefinedObjectKeys(rule)})
                }

                let rulePromise = new Promise(function(resolveRulePromise, rejectRulePromise) {
                    rule.test(values, (cb) => {
                        if(cb) {
                            resolveRulePromise()
                        } else {
                            rejectRulePromise(rule.message)
                        }
                    })
                })

                rulesPromises.push(rulePromise);

            })
            
            Promise.all(rulesPromises).then(() => {
                this.debugger.log("validate(): Field \"#"+this.name+"\" is valid", this);
                this.setValid(validMessage);
                resolveValidationPromise();

            }).catch((message) => {
                this.debugger.log("validate(): Field \"#"+this.name+"\" is not valid", this);
                this.setInvalid(message);
                rejectValidationPromise();
                
            }).finally(() => {
                (this.events && this.events.onValidate) && (this.events.onValidate(this));
            });
        }

        return new Promise(handleValidationPromise);

    }


}