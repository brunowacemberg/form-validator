import { DEFAULT_OPTIONS } from './constants';
import FormValidatorField from './FormValidatorField';
import Debugger from './Debugger';

const removeUndefinedObjectKeys = (obj) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj
};


export default class FormValidator {
    
    constructor(formId, options) {
            
        this.debugger = new Debugger(options.debug || false);

        this.debugger.log("constructor(): New validator instance");
        this.formId = formId;
        this.options = {...DEFAULT_OPTIONS, ...options};
        
        if(!document.getElementById(formId)) {
            this.debugger.logError("constructor(): Couldn't find form element \"#"+formId+"\"");
            return;
        } else {
            this.debugger.log("constructor(): Validator will be initialized to \"#"+formId+"\"");

                // Register instance
            if(!window.formValidator_instances) {
                window.formValidator_instances = {}
            }
            if(!window.formValidator_instances[this.formId]) {
                window.formValidator_instances[this.formId] = this;
                
                return this.init();
                
            } else {
                this.debugger.logError("init(): A FormValidator instance has already been initialized for the form \"#"+this.formId+"\"");   
            }
            
        }
        
    }


    // triggerFormChange() {
    //     var _changeEvent;
    //     if(typeof(Event) === 'function') {
    //         _changeEvent = new Event('change');
    //     }else{
    //         _changeEvent = document.createEvent('Event');
    //         _changeEvent.initEvent('change', true, true);
    //     }
    //     this.$form.dispatchEvent(_changeEvent);
    // }

    
    eachField(fn) {

        Object.keys(this.fields).forEach(k => {
            return fn(this.fields[k])
        })
        
    }
    
    allFieldsValid() {
        let hasInvalidField = false;
        this.eachField(field => {
            if(field.status !== 1) {
                hasInvalidField = true;
            }
        })
        return !hasInvalidField
    }
    
    
    destroy() {
        this.debugger.log("destroy(): Destroying validator...");    
    }

    init() {
        this.debugger.log("init(): Initializing validator...");   
        
        this.$form = document.getElementById(this.formId);
        this.fieldRenderPreferences = this.options.fieldRenderPreferences;
        this.events = this.options.events;
        this.validateFieldOnBlur = this.options.validateFieldOnBlur;
        this.resetFieldValidationOnChange = this.options.resetFieldValidationOnChange;
        this.submitFn = this.options.submit;
        this.submitted = false;
        this.fields = {};
        this.options.fields.forEach(fieldObject => {

            if(fieldObject.fieldRenderPreferences !== undefined) {
                fieldObject.fieldRenderPreferences = {...this.fieldRenderPreferences, ...removeUndefinedObjectKeys(fieldObject.fieldRenderPreferences)}
            } else {
                fieldObject.fieldRenderPreferences = this.fieldRenderPreferences
            }
            
            if(fieldObject.validateFieldOnBlur === undefined) {
                fieldObject.validateFieldOnBlur = this.validateFieldOnBlur
            }
            if(fieldObject.resetFieldValidationOnChange === undefined) {
                fieldObject.resetFieldValidationOnChange = this.resetFieldValidationOnChange
            }
            
            if(fieldObject.events !== undefined) {
                if(fieldObject.events.onBeforeFieldValidate === undefined && this.events.onBeforeFieldValidate) {
                    fieldObject.events.onBeforeFieldValidate = this.events.onBeforeFieldValidate
                }
                if(fieldObject.events.onFieldValidate === undefined && this.events.onFieldValidate) {
                    fieldObject.events.onFieldValidate = this.events.onFieldValidate
                }
            }

            this.fields[fieldObject.name] = new FormValidatorField(fieldObject, this.debugger.showLogs);
            this.debugger.log("initField(): Initializing field", this.fields[fieldObject.name]); 

        }) 


        this.$form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit(e)
        })
        
        this._options = this.options;
        delete this.options
        delete this.formId

        Object.keys(this.fields).forEach(k => {
            let field = this.fields[k];
            field._validator = this;
        })

        this.updateDependentFields()

        this.debugger.log("init(): Validator has been initialized", this);   
    }
    
    validate() {
        this.debugger.log("validate(): Form will be validated");
        this.events.onBeforeValidate && (this.events.onBeforeValidate(this));
          
        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            
            let fieldsValidationPromises = [];
            
            this.eachField((field) => {
                fieldsValidationPromises.push(field.validate())
            }) 
            
            Promise.all(fieldsValidationPromises).then(() => {
                resolveValidationPromise()
            }).catch(() => {
                rejectValidationPromise()
            })
            
        }
        
        return new Promise(handleValidationPromise);
        
    }
    
    resetValidation() {
        this.eachField(field => {
            field.resetValidation();
        })
        this.updateDependentFields()
        this.debugger.log("resetForm(): Form validation has been reset");
    }

    resetForm() {
        this.$form.reset();
        this.resetValidation()
        this.debugger.log("resetForm(): Form has been reset");
    }


    handleDisabledFormClick = (e) => {
        e.preventDefault();
    }
    
    disableForm() {
        this.$form.style.pointerEvents = "none";
        this.$form.style.opacity = "0.7"
        this.$form.addEventListener("click", this.handleDisabledFormClick)
        this.debugger.log("disableForm(): Form has been disabled");
    }
    
    enableForm() {
        this.$form.style.pointerEvents = "all"
        this.$form.style.opacity = "1"
        this.$form.removeEventListener("click", this.handleDisabledFormClick)
        this.debugger.log("enableForm(): Form has been enabled");
    }
    
    showFormFail() {
        alert('Submission has failed! Try again in a few minutes.');
    }
    
    showFormSuccess() {
        alert('Submission has succeeded!')
    }
    
    updateDependentFields() {
        Object.keys(this.fields).forEach(k => {

            let field = this.fields[k]
            if(field.dependents !== undefined) {
                
                // field.fields.forEach(_field => {
                //     _field.
                // })

                field.dependents.forEach(dependent => {
                    
                    let hideFields = () => {
                        dependent.fields.forEach(dependentFieldName => {
                            let dependentField = this.fields[dependentFieldName];
                            dependentField.$wrapper.classList.add(this.fieldRenderPreferences.wrapperHiddenClass)
                            dependentField.disableRules()
                            dependentField.status = 1;
                        })
                    }
                    let showFields = () => {
                        dependent.fields.forEach(dependentFieldName => {
                            let dependentField = this.fields[dependentFieldName];
                            dependentField.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperHiddenClass)
                            dependentField.enableRules()
                            dependentField.status = undefined;
                        })
                    }

                    let conditions = {
                        equal: (a,b) => {
                            return (a === b)
                        },
                        notEqual: (a,b) => {
                            return (a != b)
                        },
                        empty: (a) => {
                            return (!a || a === "")
                        },
                        notEmpty: (a) => {
                            return (a && a != "")
                        },
                    }

                    if(dependent.condition && conditions[dependent.condition](field.getValue(),dependent.value)) {
                        showFields()
                    } else {
                        hideFields()
                    }

                })
            }
        })
    }

    submit(e) {
        
        this.debugger.log("submit(): Form submission attempt occurred", this);
        
        let submit = () => {
            this.disableForm();
            this.debugger.log("submit(): Trying to submit form...");   
            this.events.onBeforeSubmit && (this.events.onBeforeSubmit(this));
            
            this.submitted = 1;
            
            let handleSubmissionResult = (succeeded) => {
                if(succeeded) {
                    this.debugger.log("submit(): Form submission has succeeded");
                    this.showFormSuccess();
                    this.submitted = false;
                    this.resetForm();
                    this.enableForm();
                    
                } else {
                    this.debugger.logError("submit(): Form submission has failed");
                    this.showFormFail();
                    this.submitted = false;
                    this.enableForm();
                }
            }
            
            this.debugger.log("submit(): Form will be submitted");
            if(this.submitFn) {
                this.submitFn(this, handleSubmissionResult);
            } else {
                this.$form.submit();
                this.debugger.log("submit(): Form has been submitted", this);
            }
            
        }
        
        if(this.submitted === 1) {
            return;
        }
        
        if(this.allFieldsValid()) {
            submit();
        } else {
            this.disableForm();
            this.validate().then(() => {
                submit();
            }).catch(() => {
                let firstInvalidField = undefined;
                Object.keys(this.fields).every((k) => {
                    let field = this.fields[k];
                    if(field.status === 0) {
                        firstInvalidField = field;
                        return false;
                    }
                })

                this.debugger.log("submit(): Form can't be submitted because one or more fields are invalid", this);
                this.enableForm();

                if(firstInvalidField !== undefined) {
                    firstInvalidField.fields[0].focus();
                }

            })
        }
        
        
    }
    
}