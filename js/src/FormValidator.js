import { DEFAULT_OPTIONS } from './constants';
import FormValidatorField from './FormValidatorField';

export default class FormValidator {
    
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


    constructor(formId, options) {
        this.log("constructor(): New validator instance", this);
        this.formId = formId;
        this.options = {...DEFAULT_OPTIONS, ...options};

        if(!document.getElementById(formId)) {
            this.logError("constructor(): Couldn't find form element \"#"+formId+"\"", this);
            return;
        } else {
            this.log("constructor(): Validator will be initialized to \"#"+formId+"\"", this);
            return this.init();
        }

    }

    destroy() {
        this.log("destroy(): Destroying validator...", this);    
    }

    initField(formValidatorField) {

        this.log("initField(): Initializing field", formValidatorField); 

        if(this.options.validateOnBlur) { 

            formValidatorField.element.addEventListener('blur', () => {
                formValidatorField.validate().then(() => {
                    if(this.allFieldsValid()) {
                        this.status = 1;
                    }
                }).catch(() => {
                    this.status = 0;
                })
            })
        }
    }

    init() {
        this.log("init(): Initializing validator...", this);   

        this.$form = document.getElementById(this.formId)
        this.events = this.options.events;
        this.fields = {};
        this.status = null;
        this.submitted = false;

        //  Field validation state rendering-related variables (Global, because you can declare exactly it on each field obj)
        this.fieldWrapperClassname = this.options.fieldWrapperClassname;
        this.fieldWrapperValidClassname = this.options.fieldWrapperValidClassname;
        this.fieldWrapperInvalidClassname = this.options.fieldWrapperInvalidClassname;
        this.fieldValidClassname = this.options.fieldValidClassname;
        this.fieldInvalidClassname = this.options.fieldInvalidClassname;
        this.showFieldMessage = this.options.showFieldMessage;
        this.fieldMessageHTML = this.options.fieldMessageHTML;

        // Register instance
        if(!window.formValidator_instances) {
            window.formValidator_instances = {}
        }
        if(!window.formValidator_instances[this.formId]) {
            window.formValidator_instances[this.formId] = this;

            this.options.fields.forEach(fieldObject => {
                
                if(!fieldObject.fieldWrapperClassname) {
                    fieldObject.fieldWrapperClassname = this.fieldWrapperClassname;
                }
                if(!fieldObject.fieldWrapperValidClassname) {
                    fieldObject.fieldWrapperValidClassname = this.fieldWrapperValidClassname;
                }
                if(!fieldObject.fieldWrapperInvalidClassname) {
                    fieldObject.fieldWrapperInvalidClassname = this.fieldWrapperInvalidClassname;
                }
                if(!fieldObject.fieldValidClassname) {
                    fieldObject.fieldValidClassname = this.fieldValidClassname;
                }
                if(!fieldObject.fieldInvalidClassname) {
                    fieldObject.fieldInvalidClassname = this.fieldInvalidClassname;
                }
                if(!fieldObject.showFieldMessage) {
                    fieldObject.showFieldMessage = this.showFieldMessage;
                }
                if(!fieldObject.fieldMessageHTML) {
                    fieldObject.fieldMessageHTML = this.fieldMessageHTML;
                }

                this.fields[fieldObject.id] = new FormValidatorField(fieldObject);
                let field = this.fields[fieldObject.id];
                this.initField(field)
                
            })


            this.$form.addEventListener('change', (e) => {
                this.status = null;
            })

            this.$form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submit(e)
            })

            this.log("init(): Validator has been initialized", this);   

        } else {
            this.logError("init(): A FormValidator instance has already been initialized for the form \"#"+this.formId+"\"", this);   
        }

    }

    eachField(fn) {
        Object.keys(this.fields).forEach(k => {
            fn(this.fields[k])
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

    validate() {
        this.log("validate(): Form will be validated", this);
        this.events.onBeforeValidate && (this.events.onBeforeValidate(this));
        this.status = -1;
        
        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            
            let fieldsValidationPromises = [];
    
            this.eachField((field) => {
                fieldsValidationPromises.push(field.validate())
            }) 
    
            Promise.all(fieldsValidationPromises).then(() => {
                this.log("validate(): Form is valid", this);
                this.status = 1;
                resolveValidationPromise()
            }).catch(() => {
                this.log("validate(): Form is not valid", this);
                this.status = 0;
                rejectValidationPromise()
            }).finally(() => {
                this.log("validate(): Form validation has been finished", this);
                this.events.onValidate && (this.events.onValidate(this));
            });
                
        }

        return new Promise(handleValidationPromise);

    }

    resetForm() {
        this.log("resetForm(): Form will be reset", this);
        this.$form.reset();

        var _changeEvent;
        if(typeof(Event) === 'function') {
            _changeEvent = new Event('change');
        }else{
            _changeEvent = document.createEvent('Event');
            _changeEvent.initEvent('change', true, true);
        }
        this.$form.dispatchEvent(_changeEvent);
        
        this.eachField(field => {
            field.status = null
        })
        this.log("resetForm(): Form has been reset", this);
    }

    handleDisabledFormClick = (e) => {
        e.preventDefault();
    }

    disableForm() {
        this.log("disableForm(): Form will be disabled", this);
        this.$form.style.pointerEvents = "none";
        this.$form.style.opacity = "0.7"
        this.$form.addEventListener("click", this.handleDisabledFormClick)
        this.log("disableForm(): Form has been disabled", this);
    }

    enableForm() {
        this.log("enableForm(): Form will be enabled", this);
        this.$form.style.pointerEvents = "all"
        this.$form.style.opacity = "1"
        this.$form.removeEventListener("click", this.handleDisabledFormClick)
        this.log("enableForm(): Form has been enabled", this);
    }

    showFormFail() {
        alert('Submission has failed! Try again in a few minutes.');
    }

    showFormSuccess() {
        alert('Submission has succeeded!')
    }
    
    submit(e) {

        this.log("submit(): Form submission attempt occurred", this);
        this.disableForm();

        let submit = () => {
            this.log("submit(): Trying to submit form...", this);   
            this.events.onBeforeSubmit && (this.events.onBeforeSubmit(this));

            this.submitted = 1;

            let handleSubmissionResult = (succeeded) => {
                if(succeeded) {
                    this.log("submit(): Form submission has succeeded", this);
                    this.showFormSuccess();
                    this.status = null;
                    this.submitted = false;
                    this.resetForm();
                    this.enableForm();
                    
                } else {
                    this.logError("submit(): Form submission has failed", this);
                    this.showFormFail();
                    this.status = null;
                    this.submitted = false;
                    this.enableForm();
                }
            }

            this.log("submit(): Form will be submitted", this);
            if(this.options.submit) {
                this.options.submit(this, handleSubmissionResult);
            } else {
                this.$form.submit();
                this.log("submit(): Form has been submitted", this);
            }

        }

        if(this.submitted === 1) {
            return;
        }

        if(this.status === 1) {
            submit();
        } else {
            if(this.allFieldsValid()) {
                this.status = 1;
                submit();
            } else {
                this.validate().then(() => {
                    submit();
                }).catch(() => {
                    this.status = 0;
                    this.enableForm();
                })
            }
        }
        
        

    
    }

}