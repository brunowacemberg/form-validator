import FormValidatorRule from './FormValidatorRule';
import Logger from './Logger';
import VMasker from 'vanilla-masker';

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

Promise.series = function series(arrayOfPromises) {
    var results = [];
    return arrayOfPromises.reduce(function(seriesPromise, promise) {
      return seriesPromise.then(function() {
        return promise
        .then(function(result) {
          results.push(result);
        });
      });
    }, Promise.resolve())
    .then(function() {
      return results;
    });
};

export default class FormValidatorField {

    constructor(fieldObject, debug=false) {

        this.logger = new Logger(debug);

        if(!document.getElementsByName(fieldObject.name).length) {
            return;
        }

        this._validator = fieldObject._validator;

        this.name = fieldObject.name;
        this.group = fieldObject.group;
        this.fields = Array.from(document.getElementsByName(fieldObject.name));
        
        this.interactive = fieldObject.interactive;
        this.mask = fieldObject.mask;
        this.dependenceRules = fieldObject.dependenceRules;
        this.useRules = true;
        
        this.rules = fieldObject.rules || [];
        this.events = fieldObject.events;
        this.fieldRenderPreferences = fieldObject.fieldRenderPreferences;
        this.resetFieldValidationOnChange = fieldObject.resetFieldValidationOnChange;
        this.validateFieldOnInput = fieldObject.validateFieldOnInput;
        this.validateFieldOnBlur = fieldObject.validateFieldOnBlur;
        
        this.init();
        
    }


    getFieldRenderPreferences() {
        let fieldRenderPreferences
        if(this.fieldRenderPreferences !== undefined) {
            fieldRenderPreferences = {...this._validator.fieldRenderPreferences, ...removeUndefinedObjectKeys(this.fieldRenderPreferences)}
        } else {
            fieldRenderPreferences = this._validator.fieldRenderPreferences
        }
        return fieldRenderPreferences
    }

    getEvents() {
        let events
        if(this.events !== undefined) {
            events = {...this._validator.events, ...removeUndefinedObjectKeys(this.events)}
        } else {
            events = this._validator.events
        }
        
        return events
    }


    getValidateFieldOnBlur() {
        if(this.validateFieldOnBlur === undefined) {
            return this._validator.validateFieldOnBlur
        } else {
            return this.validateFieldOnBlur
        }
    }

    getResetFieldValidationOnChange() {
        if(this.resetFieldValidationOnChange === undefined) {
            return this._validator.resetFieldValidationOnChange
        } else {
            return this.resetFieldValidationOnChange
        }
    }

    getValidateFieldOnInput() {
        if(this.validateFieldOnInput === undefined) {
            return this._validator.validateFieldOnInput
        } else {
            return this.validateFieldOnInput
        }
    }


    destroy() {


    }


    init() {
        
        this.status = undefined;
        this.message = undefined;
        this.validationElements = [];

        var fieldRenderPreferences = this.getFieldRenderPreferences()
        if(fieldRenderPreferences.wrapperClass && fieldRenderPreferences.wrapperClass.length) {
            this.$wrapper = this.fields[0].closest('.'+fieldRenderPreferences.wrapperClass)
        } else {
            this.$wrapper = undefined
        }
        
        let events = this.getEvents()
        this.fields.forEach($field => {
            $field.addEventListener('input', (e) => {
                this.status = undefined;
                (events && events.onFieldInput) && (events.onFieldInput(this));

                if(this.getResetFieldValidationOnChange()) {
                    this.resetValidation();
                    $field.focus()
                }
            
            })
        })
        

        this.fields.forEach($field => {

            if($field.hasAttribute("readonly")) {
                $field.setAttribute("data-originally-readonly", "")
            }


            let eventName = 'blur';
            if($field.getAttribute("type") === "radio" || $field.getAttribute("type") === "checkbox") {
                eventName = 'change'
            }

            var timeout;
            $field.addEventListener(eventName, () => {

                if(this.getValidateFieldOnBlur()) {

                    if(eventName === 'change') {
                        this.resetValidation();
                        $field.focus()
                    }
                    let validate = () => {
                        this._validate().then((message) => {
                        }).catch((message) => {
                        }).finally(() => {
                            this._validator.updateDependenceRules()
                            if(eventName === 'change') {
                                $field.focus()
                            }
                        })
                    }

                    clearTimeout(timeout);
                    timeout = setTimeout(validate, 1)

                }
            })


            $field.addEventListener("input", () => {
                
                if(this.getValidateFieldOnInput()) {
                    let validate = () => {
                        this._validate().then((message) => {
                        }).catch((message) => {
                        }).finally(() => {
                            $field.focus()
                        })
                    }
                    validate()
                }
            })

        })


        if(this.mask) {
            this.setMask(this.mask)
        }

    }

    getValue() {
        if(this.fields.length > 1) { // radio or checkbox
            let value = [];
            if(this.fields[0].getAttribute("type") === "radio" || this.fields[0].getAttribute("type") === "checkbox") {
                this.fields.forEach($field => {
                    if($field.checked) {
                        value.push($field.value)
                    }
                })
            }
            return value
        } else {
            return this.fields[0].value
        }
        
    }

    setValue(value) {

        if(typeof value === "object") {
            this.fields.forEach(($field, i) => {
                if($field.hasAttribute('readonly') || $field.hasAttribute('disabled')) {
                    return;
                }
                if($field.getAttribute("type") === "radio" || $field.getAttribute("type") === "checkbox") {
                    if(value.includes($field.value)) {
                        $field.checked = true
                    } else {
                        $field.checked = false
                    }
                } else {
                    $field.value = value[i]
                }
            })
        } else {
            this.fields.forEach(($field, i) => {
                if($field.hasAttribute('readonly') || $field.hasAttribute('disabled')) {
                    return;
                }
                if($field.getAttribute("type") === "radio" || $field.getAttribute("type") === "checkbox") {
                    if(value === $field.value) {
                        $field.checked = true
                    } else {
                        $field.checked = false
                    }
                } else {
                    $field.value = value
                }
            })
        }

        this._validator.updateDependenceRules();
        
    }

    
    disableRules() {
        this.useRules = false;
    }
    enableRules() {
        this.useRules = true;
    }

    getRules() {
        let rules = []
        this.rules.forEach(ruleObject => {
            if(typeof ruleObject === "string") {
                ruleObject = {
                    name: ruleObject
                }
            }
            if(this._validator.defaultRules[ruleObject.name]) {
                ruleObject = {...this._validator.defaultRules[ruleObject.name], ...removeUndefinedObjectKeys(ruleObject)}
            }
            let rule = new FormValidatorRule(ruleObject);
            rules.push(rule)
        })
        return rules
    }

    setMask(pattern) {
        if(VMasker(this.fields)) {
            VMasker(this.fields).unMask(); 
        }
        VMasker(this.fields).maskPattern(pattern);
    }

    handlePreventingDefault(e) {
        e.preventDefault();
    }

    // Enable/disable field interaction
    disableInteraction() {
        this.fields.forEach($field => {
        
            $field.setAttribute("readonly","readonly");
            $field.addEventListener("input", this.handlePreventingDefault)
            $field.addEventListener("click", this.handlePreventingDefault)

        })
        this.interactive = false;
    }
    enableInteraction() {
        this.fields.forEach($field => {
            if(!$field.hasAttribute("data-originally-readonly")) {
                $field.removeAttribute("readonly");
            }
            $field.removeEventListener("input", this.handlePreventingDefault)
            $field.removeEventListener("click", this.handlePreventingDefault)

        })
        this.interactive = true;

    }

    // Set visual states
    setValidating(message) {
        this.resetValidation();
        this.status = -1;
        this.disableInteraction();

        let fieldRenderPreferences = this.getFieldRenderPreferences()

        if(fieldRenderPreferences.addValidatingClass) {
            this.fields.forEach($field => {
                if(typeof this.getValue() === "object" && this.getValue().length > 0) {
                    if(this.getValue().includes($field.value)) {
                        $field.classList.add(fieldRenderPreferences.validatingClass);
                    }
                } else {
                    $field.classList.add(fieldRenderPreferences.validatingClass);
                }
                
            })
        }
        if(fieldRenderPreferences.addWrapperValidatingClass) {
            this.$wrapper.classList.add(fieldRenderPreferences.wrapperValidatingClass);
        }

        if(fieldRenderPreferences.showValidatingMessage && message && message.length) {
            this.message = message;
            let messageHTML = fieldRenderPreferences.validatingMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
    }
    setValid(message) {
        this.resetValidation();
        this.status = 1;
        this.enableInteraction();

        let fieldRenderPreferences = this.getFieldRenderPreferences()

        if(fieldRenderPreferences.addValidClass) {
            this.fields.forEach($field => {
                if(typeof this.getValue() === "object" && this.getValue().length > 0) {
                    if(this.getValue().includes($field.value)) {
                        $field.classList.add(fieldRenderPreferences.validClass);
                    }
                } else {
                    $field.classList.add(fieldRenderPreferences.validClass);
                }
                
            })
        }
        if(fieldRenderPreferences.addWrapperValidClass) {
            this.$wrapper.classList.add(fieldRenderPreferences.wrapperValidClass);
        }

        if(fieldRenderPreferences.showValidMessage && message && message.length) {
            this.message = message;
            let messageHTML = fieldRenderPreferences.validMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
    }
    setInvalid(message) {
        this.resetValidation();
        this.status = 0;
        this.enableInteraction();

        let fieldRenderPreferences = this.getFieldRenderPreferences()

        if(fieldRenderPreferences.addInvalidClass) {
            this.fields.forEach($field => {
                if(typeof this.getValue() === "object" && this.getValue().length > 0) {
                    if(this.getValue().includes($field.value)) {
                        $field.classList.add(fieldRenderPreferences.invalidClass);
                    }
                } else {
                    $field.classList.add(fieldRenderPreferences.invalidClass);
                }
                
            })
        }
        if(fieldRenderPreferences.addWrapperInvalidClass) {
            this.$wrapper.classList.add(fieldRenderPreferences.wrapperInvalidClass);
        }

        if(fieldRenderPreferences.showInvalidMessage && message && message.length) {
            this.message = message;
            let messageHTML = fieldRenderPreferences.invalidMessageHTML.replace("{{message}}", message);
            let $message = parseHTML(messageHTML);
            this.$wrapper.appendChild($message);
            this.validationElements.push($message);
        }
        
    }

    resetValidation() {
        
        this.logger.log("resetValidation(): Resetting field validation");
        this.status = undefined;
        this.message = undefined;

        let fieldRenderPreferences = this.getFieldRenderPreferences()
        
        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperValidatingClass);
        this.fields.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.validatingClass);
        })
        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperValidClass);
        this.fields.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.validClass);
        })
        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperInvalidClass);
        this.fields.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.invalidClass);
        })

        this.validationElements.forEach(validationElement => {
            validationElement.remove()
        })
        this.validationElements = [];

        this.enableInteraction();

    }


    validate(cb=()=>{}) {
        
        let v = () => {
            // this.resetValidation()
            this._validate().then((x) => {cb(true)}).catch((x) => {cb(false)})
        }
        setTimeout(v,1);
    }

    _validate(resultOnly=false) {

        if(this.status === -1) {
            this.logger.logWarning("validate(): Field \"#"+this.name+"\" is still being validated");
            return new Promise((resolve, reject) => {
                reject()
            })
        }

        if(this.status === 1 || this.status === 0) {
            let status = this.status;
            this.logger.logWarning("validate(): Field \"#"+this.name+"\" hasn't changed since last validation");
            return new Promise((resolve, reject) => {
                if(status === 1) {
                    resolve()
                } else {
                    reject()
                }
            })
        }

        if(!this.useRules && !this.interactive) {
            return new Promise((resolve, reject) => {
                resolve()
            })
        }

        this.logger.log("validate(): Field \"#"+this.name+"\" will be validated", this);

        var events = this.getEvents();

        (events && events.onBeforeValidateField) && (events.onBeforeValidateField(this));

        var fieldRenderPreferences = this.getFieldRenderPreferences()

        let validatingMessage = fieldRenderPreferences.validatingMessage;
        let validMessage = fieldRenderPreferences.validMessage;

        if(!resultOnly) {
            this.setValidating(validatingMessage);
        }

        let handleValidationPromise = async (resolveValidationPromise, rejectValidationPromise) => {
            var value = this.getValue()
            var rules = this.getRules();
            
            var isValid = true;
            
            for(const rule of rules) {
                
                if(!isValid) {
                    break;
                }

                await rule.test(value, (cb) => {
                    if(!cb) {
                        isValid = false;
                        this.logger.log("validate(): Field \"#"+this.name+"\" is not valid", this);
                        if(!resultOnly) {
                            this.setInvalid(rule.message);
                        }
                        rejectValidationPromise();
                        (events && events.onValidateField) && (events.onValidateField(this));
                    }
                })

            }

            if(isValid) {
                this.logger.log("validate(): Field \"#"+this.name+"\" is valid", this);
                if(!resultOnly) {
                    this.setValid(validMessage);
                }
                resolveValidationPromise();
                (events && events.onValidateField) && (events.onValidateField(this));
            }
    
        }

        return new Promise(handleValidationPromise);

    }


}