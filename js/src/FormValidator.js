import constants from './constants';
import DEFAULT_RULES from './defaultRules';
import FormValidatorRule from './FormValidatorRule';
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
        this.options = {...constants.DEFAULT_OPTIONS, ...options};
        
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
        this.resetFormOnSubmit = this.options.resetFormOnSubmit;
        this.submitFn = this.options.submit;
        this.groupWrapperHiddenClass = this.options.groupWrapperHiddenClass;
        this.groupWrapperVisibleClass = this.options.groupWrapperVisibleClass;
        this.submitted = false;
        this.fields = {};
        this.options.fields.forEach(_fieldObject => {

            var initField = (fieldObject) => {
                this.debugger.log("initField(): Initializing field", this.fields[fieldObject.name]); 

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
            }

            if(typeof _fieldObject.name === "object") {
                _fieldObject.name.forEach(fieldName => {
                    let obj = _fieldObject;
                    obj.name = fieldName;
                    initField(obj);
                })
            } else {
                let obj = _fieldObject;
                initField(obj);
            }

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

        this.updateDependenceRules()

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
        this.updateDependenceRules()
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

    getGroupWrapper(groupName) {
        let $wrapper = this.$form.querySelector('['+constants.GROUP_WRAPPER_DATA_ATTRIBUTE+'="' + groupName + '"]');
        return $wrapper
    }

    getGroupFields(groupName) {
        let fields = [];
        this.eachField(field => {
            if(field.group == groupName) {
                fields.push(field)
            }
        })
        return fields
    }


    updateDependenceRules() {

        this.debugger.log("updateDependenceRules(): Updating...", this);   

        Object.keys(this.fields).forEach(k => {

            var field = this.fields[k]
            if(field.dependenceRules !== undefined) {

                field.dependenceRules.forEach(depRuleObject => {

                    if(!depRuleObject.fields){
                        depRuleObject.fields = [];
                    }
                    if(!depRuleObject.groups){
                        depRuleObject.groups = [];
                    }

                    var getTargetFields = () => {

                        let fields = [];
                        //read groups

                        depRuleObject.groups.forEach(groupName => {
                            let groupFields = this.getGroupFields(groupName)
                            groupFields.forEach(groupField => {
                                fields.push(groupField)
                            })
                        })
                        depRuleObject.fields.forEach(dependenceRuleFieldName => {
                            let dependentField = this.fields[dependenceRuleFieldName];
                            fields.push(dependentField)
                        })
                        return fields
                    }

                    let hide = () => {

                        depRuleObject.groups.forEach(groupName => {
                            let $groupWrapper = this.getGroupWrapper(groupName);
                            if($groupWrapper) {
                                $groupWrapper.classList.add(this.groupWrapperHiddenClass);
                                $groupWrapper.classList.remove(this.groupWrapperVisibleClass);
                            }
                        })
                        
                        getTargetFields().forEach(targetField => {
                            targetField.$wrapper.classList.add(this.fieldRenderPreferences.wrapperHiddenClass);
                            targetField.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperVisibleClass);
                            targetField.disableRules()
                            targetField.status = 1;
                        })

                    }
                    let show = () => {
                        depRuleObject.groups.forEach(groupName => {
                            let $groupWrapper = this.getGroupWrapper(groupName);
                            if($groupWrapper) {
                                $groupWrapper.classList.remove(this.groupWrapperHiddenClass)
                                $groupWrapper.classList.add(this.groupWrapperVisibleClass)
                            }
                        })

                        getTargetFields().forEach(targetField => {
                            targetField.$wrapper.classList.remove(this.fieldRenderPreferences.wrapperHiddenClass)
                            targetField.$wrapper.classList.add(this.fieldRenderPreferences.wrapperVisibleClass)
                            targetField.enableRules()
                            targetField.status = undefined
                        })
                    }

                    if(DEFAULT_RULES[depRuleObject.name]) {
                        var rule = new FormValidatorRule({...DEFAULT_RULES[depRuleObject.name], ...removeUndefinedObjectKeys(depRuleObject)})
                    } else {
                        var rule = new FormValidatorRule(depRuleObject)
                    }

                    let dependenceRulePromise = new Promise(function(resolve, reject) {
                        rule.test(field.getValues(), (cb) => {
                            if(cb === true) {
                                resolve()
                            } else {
                                reject()
                            }
                        })
                    })

                    dependenceRulePromise.then(() => {
                        show()
                    }).catch(() => {
                        hide()
                    })

                    

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
                    if(this.resetFormOnSubmit) {
                        this.resetForm();
                        this.enableForm();
                    }
                   
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