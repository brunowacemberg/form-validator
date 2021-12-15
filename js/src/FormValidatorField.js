import constants from './constants';
import FormValidatorRule from './FormValidatorRule';
import Logger from './Logger';
import VMasker from 'vanilla-masker';
import { deepSpread } from 'deep-spread';


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

        if(!fieldObject._validator.$form.querySelectorAll('[name="'+fieldObject.name+'"]').length) {
            return;
        }

        this._validator = fieldObject._validator;

        this.name = fieldObject.name;
        this.group = fieldObject.group;
        this.elements = Array.from(fieldObject._validator.$form.querySelectorAll('[name="'+fieldObject.name+'"]'));
        
        this.interactive = fieldObject.interactive;
        this.mask = fieldObject.mask;
        this.dependencyRules = fieldObject.dependencyRules;
        this.useRules = true;
        
        this.rules = fieldObject.rules || [];
        this.events = fieldObject.events;
        this.fieldRenderPreferences = fieldObject.fieldRenderPreferences;
        this.resetFieldValidationOnChange = fieldObject.resetFieldValidationOnChange;
        this.validateFieldOnInput = fieldObject.validateFieldOnInput;
        this.validateFieldOnBlur = fieldObject.validateFieldOnBlur;
        
        this.register();
        
    }


    getFieldRenderPreferences() {
        let fieldRenderPreferences = this._validator.fieldRenderPreferences;
        
        if(this.fieldRenderPreferences !== undefined) {
            fieldRenderPreferences = deepSpread(this.fieldRenderPreferences, this._validator.fieldRenderPreferences);
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


    register() {
        
        if(this.registered) {
            return
        }

        var unregisterFns = [];

        this.registered = true;
        this.status = undefined;
        this._status = undefined;
        this.message = undefined;
        this.validationElements = [];

        var fieldRenderPreferences = this.getFieldRenderPreferences()
        if(fieldRenderPreferences.wrapperClass && fieldRenderPreferences.wrapperClass.length) {
            this.$wrapper = this.elements[0].closest('.'+fieldRenderPreferences.wrapperClass)
        } else {
            this.$wrapper = undefined
        }
        
        let events = this.getEvents()
        this.elements.forEach($field => {

            $field.setAttribute(constants.INITIALIZED_FIELD_DATA_ATTRIBUTE, "true");
            
            if($field.hasAttribute("readonly")) {
                $field.setAttribute("data-originally-readonly", "")
            }

            let handleFieldInput = (e) => {
                this._validator.events.onChange && (this._validator.events.onChange(this._validator));

                this.status = undefined;
                this._status = undefined;

                if(this.getResetFieldValidationOnChange()) {
                    this.resetValidation();
                    $field.focus()
                }
            
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

                (events && events.onFieldInput) && (events.onFieldInput(this));

            }

            $field.addEventListener('input', handleFieldInput);        

            let eventName = 'blur';
            if($field.getAttribute("type") === "radio" || $field.getAttribute("type") === "checkbox") {
                eventName = 'change'
            }

            var timeout;
            let handleFieldValidationOnBlur = () => {

                if(this.getValidateFieldOnBlur()) {

                    if(eventName === 'change') {
                        this.resetValidation();
                        $field.focus()
                    }
                    let validate = () => {
                        this._validate().then((message) => {
                        }).catch((message) => {
                        }).finally(() => {
                            if(eventName === 'change') {
                                $field.focus()
                            }
                        })
                    }

                    clearTimeout(timeout);
                    timeout = setTimeout(validate, 1)

                }
            }

            $field.addEventListener(eventName, handleFieldValidationOnBlur)

            unregisterFns.push(() => {
                $field.removeEventListener('input', handleFieldInput);
                $field.removeEventListener(eventName, handleFieldValidationOnBlur);
                $field.removeAttribute(constants.INITIALIZED_FIELD_DATA_ATTRIBUTE);
            })


        })

        if(this.mask) {
            this.setMask(this.mask)
        }

        this.unregister = () => {
            this.resetValidation();
            unregisterFns.forEach(fn => {
                fn()
            })
            this.unsetMask()
            this.registered = false;

            delete this._validator.fields[this.name]
        }

        return this
    
    }

    getValue() {
        if(this.elements.length > 1) { // radio or checkbox
            let value = [];
            if(this.elements[0].getAttribute("type") === "radio" || this.elements[0].getAttribute("type") === "checkbox") {
                this.elements.forEach($field => {
                    if($field.checked) {
                        value.push($field.value)
                    }
                })
            }
            return value
        } else {
            return this.elements[0].value
        }
        
    }

    setValue(value) {

        if(typeof value === "object") {
            this.elements.forEach(($field, i) => {
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
            this.elements.forEach(($field, i) => {
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

        this._validator.updateDependencyRules();
        
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
                if(ruleObject.indexOf(":") !== -1) {
                    ruleObject = {
                        name: ruleObject.split(":")[0],
                        parameter: ruleObject.split(":")[1]
                    }
                } else {
                    ruleObject = {
                        name: ruleObject
                    }
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
        this.unsetMask()
        VMasker(this.elements).maskPattern(pattern);
    }

    unsetMask() {
        if(VMasker(this.elements)) {
            VMasker(this.elements).unMask(); 
        }
    }

    handlePreventingDefault(e) {
        e.preventDefault();
    }

    // Enable/disable field interaction
    disableInteraction() {
        this.elements.forEach($field => {
        
            $field.setAttribute("readonly","readonly");
            $field.addEventListener("input", this.handlePreventingDefault)
            $field.addEventListener("click", this.handlePreventingDefault)

        })
        this.interactive = false;
    }

    enableInteraction() {
        this.elements.forEach($field => {
            if(!$field.hasAttribute("data-originally-readonly")) {
                $field.removeAttribute("readonly");
            }
            $field.removeEventListener("input", this.handlePreventingDefault)
            $field.removeEventListener("click", this.handlePreventingDefault)

        })
        this.interactive = true;

    }

    _setFieldValidationStatus(statusName, message, silentMode=false) {

        var capitalizedStatusName = statusName.charAt(0).toUpperCase() + statusName.slice(1);
        
        if(statusName === "validating") {
            this.resetValidation();

            this._status = -1;
            this.disableInteraction();
            if(!silentMode) {
                this.status = -1;
            }
        } else if(statusName === "valid") {
            this.resetValidation();

            this._status = 1;
            this.enableInteraction();
            if(!silentMode) {
                this.status = 1;
            }
        } else if(statusName === "invalid") {
            this.resetValidation();

            this._status = 0; //invalid 
            this.enableInteraction();
            if(!silentMode) {
                this.status = 0; //invalid 
            }
        } else {
            this._status = undefined; //unvalidated 
            this.enableInteraction();
            if(!silentMode) {
                this.status = undefined; //unvalidated 
            }
        }

        this.message = message;

        if(!silentMode) {

            var fieldRenderPreferences = this.getFieldRenderPreferences()

            if(fieldRenderPreferences["add"+capitalizedStatusName+"Class"]) {
                this.elements.forEach($field => {
                    if(typeof this.getValue() === "object" && this.getValue().length > 0) {
                        if(this.getValue().includes($field.value)) {
                            $field.classList.add(fieldRenderPreferences[statusName+"Class"]);
                        }
                    } else {
                        $field.classList.add(fieldRenderPreferences[statusName+"Class"]);
                    }
                    
                })
            }
            if(fieldRenderPreferences["addWrapper"+capitalizedStatusName+"Class"]) {
                this.$wrapper.classList.add(fieldRenderPreferences["wrapper"+capitalizedStatusName+"Class"]);
            }

            if(fieldRenderPreferences["show"+capitalizedStatusName+"Message"] && message && message.length) {
                this.message = message;
                let messageHTML = fieldRenderPreferences[statusName+"MessageHTML"].replace("{{message}}", message);
                let $message = parseHTML(messageHTML);
                this.$wrapper.appendChild($message);
                this.validationElements.push($message);
            }
        }

        this._validator.events.onChange && (this._validator.events.onChange(this._validator));
    }

    // Set visual states
    setUnvalidated(message, silentMode) {
        this._setFieldValidationStatus("unvalidated", message, silentMode); 
    }
    setValidating(message, silentMode) {
        this._setFieldValidationStatus("validating", message, silentMode); 
    }
    setValid(message, silentMode) {
        this._setFieldValidationStatus("valid", message, silentMode) 
    }
    setInvalid(message, silentMode) {
        this._setFieldValidationStatus("invalid", message, silentMode) 
    }

    
    removeValidationElements() {
        
        let fieldRenderPreferences = this.getFieldRenderPreferences()

        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperValidatingClass);
        this.elements.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.validatingClass);
        })
        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperValidClass);
        this.elements.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.validClass);
        })
        this.$wrapper.classList.remove(fieldRenderPreferences.wrapperInvalidClass);
        this.elements.forEach($field => {
            $field.classList.remove(fieldRenderPreferences.invalidClass);
        })

        this.validationElements.forEach(validationElement => {
            validationElement.remove()
        })
        this.validationElements = [];
    }

    resetValidation() {
        
        this.logger.log("resetValidation(): Resetting field validation");

        this.removeValidationElements();
        this.setUnvalidated(undefined)

    }
    
    isValid() {
        return this._status === 1
    }


    validate(cb=()=>{}) {
    
        this._validate().then((x) => {cb(true)}).catch((x) => {cb(false)})

    }

    _validate(silentMode=false) {

        var fieldRenderPreferences = this.getFieldRenderPreferences()

        let validatingMessage = fieldRenderPreferences.validatingMessage;
        let validMessage = fieldRenderPreferences.validMessage;



        if(this._status === -1) {
            this.logger.logWarning("validate(): Field \"#"+this.name+"\" is still being validated");
            return new Promise((resolve, reject) => {
                this.setValidating(validatingMessage, silentMode);
                reject()
            })
        }

        if(this._status === 1 || this._status === 0) {
            let status = this._status;
            this.logger.logWarning("validate(): Field \"#"+this.name+"\" hasn't changed since last validation");
            return new Promise((resolve, reject) => {
                if(status === 1) {
                    this.setValid(validMessage, silentMode);
                    resolve()
                } else {
                    this.setInvalid(this.message, silentMode);
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

        this.setValidating(validatingMessage, silentMode);

        let handleValidationPromise = async (resolveValidationPromise, rejectValidationPromise) => {
            
            var value = this.getValue()
            var rules = this.getRules();
  
            var isValid = true;

            function runRuleTest(rule, value) {
                return rule.test(value);
            } 

            for (const rule of rules) {

                if(!isValid) {
                    break;
                }

                await runRuleTest(rule, value).then(() => {}).catch((message) => {
                    
                    isValid = false;
                    this.logger.log("validate(): Field \"#"+this.name+"\" is not valid", this);
                    this.setInvalid(message, silentMode);
                    rejectValidationPromise();
                    
                    (events && events.onValidateField) && (events.onValidateField(this));
                    this._validator.updateDependencyRules()

                });

            }

            if(isValid) {
                this.logger.log("validate(): Field \"#"+this.name+"\" is valid", this);
                this.setValid(validMessage, silentMode);
                resolveValidationPromise();
                
                (events && events.onValidateField) && (events.onValidateField(this));
                this._validator.updateDependencyRules()

            }



        }


        return new Promise(handleValidationPromise);

    }


}