import constants from './constants';
import DEFAULT_RULES from './defaultRules'
import FormValidatorRule from './FormValidatorRule';
import FormValidatorField from './FormValidatorField';
import Logger from './Logger';

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
            
        this.logger = new Logger(options.debug);

        this.logger.log("constructor(): New validator instance");
        this.formId = formId;
        this.options = {...constants.DEFAULT_OPTIONS, ...options};
        
        if(!document.getElementById(formId)) {
            this.logger.logError("constructor(): Couldn't find form element \"#"+formId+"\"");
            return;
        } else {
            this.logger.log("constructor(): Validator will be initialized to \"#"+formId+"\"");

                // Register instance
            if(!window.formValidator_instances) {
                window.formValidator_instances = {}
            }
            if(!window.formValidator_instances[this.formId]) {
                window.formValidator_instances[this.formId] = this;
                
                return this.init();
                
            } else {
                this.logger.logError("init(): A FormValidator instance has already been initialized for the form \"#"+this.formId+"\"");   
            }
            
        }
        
    }

    destroy() {
        this.logger.log("destroy(): Destroying validator...");    
        
    }

    init() {
        this.logger.log("init(): Initializing validator...");   

        this.$form = document.getElementById(this.formId);
        this.fieldRenderPreferences = this.options.fieldRenderPreferences;
        this.events = this.options.events;
        this.validateFieldOnBlur = this.options.validateFieldOnBlur;
        this.validateFieldOnInput = this.options.validateFieldOnInput;
        this.resetFieldValidationOnChange = this.options.resetFieldValidationOnChange;
        this.submitFn = this.options.submitFn;
        this.showLoadingFn = this.options.showLoadingFn;
        this.hideLoadingFn = this.options.hideLoadingFn;
        this.groupWrapperHiddenClass = this.options.groupWrapperHiddenClass;
        this.groupWrapperVisibleClass = this.options.groupWrapperVisibleClass;
        this.enableDataRestore = this.options.enableDataRestore;
        this.submitting = false;
        this.fields = {};
        this.defaultRules = DEFAULT_RULES;
        
        this.logger.log("initField(): Initializing fields..."); 

        this.options.fields.forEach(_fieldObject => {

            var _validator = this;

            var initField = (fieldObject) => {

                fieldObject._validator = _validator;
                this.fields[fieldObject.name] = new FormValidatorField(fieldObject, this.logger.showLogs);
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

        this.$form.addEventListener('change', (e) => {
            
            if(this.enableDataRestore) {
                this.updateFormState();
                
            }
            
            this.updateDependenceRules(true)
        })

        
        this._options = this.options;
        delete this.options
        delete this.formId
        
        this.updateDependenceRules()
        
        if(this.enableDataRestore) {
            this.applyFormState();
            
            this._validate([], true).then(() => {}).catch(() => {}).finally(() => {
                this.updateDependenceRules();

            })

        }
        
        this.events.onInit && (this.events.onInit(this));

        this.logger.log("init(): Validator has been initialized", this);   

    }
    

    eachField(fn) {

        Object.keys(this.fields).forEach(k => {
            return fn(this.fields[k])
        })
        
    }
    
    allFieldsValid(fieldsNames=[]) {
        let hasInvalidField = false;

        if(!fieldsNames.length) {
            this.eachField((field) => {
                if(field.status !== 1) {
                    hasInvalidField = true;
                }
            }) 
        } else {
            fieldsNames.forEach(fieldName => {
                if(this.fields[fieldName].status !== 1) {
                    hasInvalidField = true;
                }
            })
        }

        return !hasInvalidField

    }

    getFirstInvalidField() {
        let firstInvalidField = undefined;
        Object.keys(this.fields).every((k) => {
            let field = this.fields[k];
            if(field.status === 0) {
                firstInvalidField = field;
                return false;
            }
            return true
        })
        return firstInvalidField
    }


    someFieldsValidating() {
        let someFieldsValidating = false;
        this.eachField(field => {
            if(field.status === -1) {
                someFieldsValidating = true;
            }
        })
        return someFieldsValidating
    }
    
    
    
    getGroupWrapper(groupName) {
        let $wrapper = this.$form.querySelector('['+constants.GROUP_WRAPPER_DATA_ATTRIBUTE+'="' + groupName + '"]');
        return $wrapper
    }

    getGroupFields(groupName) {
        var fields = [];
        this.eachField(field => {
            if(field.group == groupName) {
                fields.push(field)
            }
        })
        return fields
    }
    

    validate(fieldsNames=[], cb=()=>{}) {
        let v = () => {
            // this.resetValidation(fieldsNames)
            this._validate(fieldsNames).then((x) => {cb(true)}).catch((x) => {cb(false)})
        }
        setTimeout(v,1);

    }

    _validate(fieldsNames=[], resultOnly=false) {

        this.logger.log("validate(): Form will be validated");
        this.events.onBeforeValidate && (this.events.onBeforeValidate(this));
        
        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            let fieldsValidationPromises = [];


            if(!fieldsNames.length) {
                this.eachField((field) => {
                    fieldsValidationPromises.push(field._validate(resultOnly))
                }) 
            } else {
                fieldsNames.forEach(fieldName => {
                    fieldsValidationPromises.push(this.fields[fieldName]._validate(resultOnly))
                })
            }
            


            Promise.all(fieldsValidationPromises).then(() => {
                resolveValidationPromise()
            }).catch(() => {
                rejectValidationPromise()
            }).finally(() => {
                this.events.onValidate && (this.events.onValidate(this));
            })
        }
        return new Promise(handleValidationPromise);
        
    }
    
    resetValidation(fieldsNames=[]) {

        if(this.submitting || this.someFieldsValidating()) {
            return;
        }
        
        if(!fieldsNames.length) {
            this.eachField((field) => {
                field.resetValidation();
            }) 
        } else {
            fieldsNames.forEach(fieldName => {
                this.fields[fieldName].resetValidation();
            })
        }

        this.updateDependenceRules()
        this.logger.log("resetForm(): Form validation has been reset");
    }

    resetForm() {

        if(this.submitting || this.someFieldsValidating()) {
            return;
        }

        this.events.onBeforeReset && (this.events.onBeforeReset(this));

        this.$form.reset();
        this.resetValidation()
        this.deleteFormState()
        
        this.logger.log("resetForm(): Form has been reset");
        this.events.onReset && (this.events.onReset(this));

    }

    deleteFormState() {
        if(window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')]) {
            delete window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')]
        }
        
    }

    updateFormState() {
        window.localStorage.setItem('FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id'), JSON.stringify(this.getSerializedFormData()));
    }

    applyFormState() {
        let storage = window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')];
        if(storage) {
            let serializedForm = JSON.parse(storage);
            Object.keys(serializedForm).forEach(key => {
                let value = serializedForm[key]
                if(this.fields[key]) {
                    this.fields[key].setValue(value)
                }
            })
        }
    }

    handlePreventingDefault(e) {
        e.preventDefault();
    }
    
    disableForm() {
        this.eachField(field => {
            field.disableInteraction()
        })
        this.$form.style.opacity = "0.7"
        this.logger.log("disableForm(): Form has been disabled");
    }
    
    enableForm() {
        this.eachField(field => {
            field.enableInteraction()
        })
        this.$form.style.opacity = "1"
        this.logger.log("enableForm(): Form has been enabled");
    }

    getDependenceRuleTargetFields(depRuleObject) {

        let fields = []
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

    updateDependenceRules(resetValueOnToggle=false) {

        this.logger.log("updateDependenceRules(): Updating...", this);   

        Object.keys(this.fields).forEach(k => {

            var field = this.fields[k];
            
            if(field.dependenceRules !== undefined) {

                field.dependenceRules.forEach(depRuleObject => {

                    if(!depRuleObject.fields){
                        depRuleObject.fields = [];
                    }
                    if(!depRuleObject.groups){
                        depRuleObject.groups = [];
                    }

                    let targetFields = this.getDependenceRuleTargetFields(depRuleObject)

                    let hide = () => {

                            depRuleObject.groups.forEach(groupName => {
                                let $groupWrapper = this.getGroupWrapper(groupName);
                                if($groupWrapper) {
                                    $groupWrapper.classList.add(this.groupWrapperHiddenClass);
                                    $groupWrapper.classList.remove(this.groupWrapperVisibleClass);
                                }
                            })
                            
                            targetFields.forEach(targetField => {
                                let renderPrefs = targetField.getFieldRenderPreferences();
                                if(!Array.from(targetField.$wrapper.classList).includes(renderPrefs.wrapperHiddenClass)) {

                                    targetField.$wrapper.classList.add(renderPrefs.wrapperHiddenClass);
                                    targetField.$wrapper.classList.remove(renderPrefs.wrapperVisibleClass);
                                    targetField.disableRules()
                                    targetField.status = 1;
                                    if(resetValueOnToggle) {
                                        targetField.setValue('')
                                    }
                                }
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
    
                            targetFields.forEach(targetField => {
                                let renderPrefs = targetField.getFieldRenderPreferences();

                                if(Array.from(targetField.$wrapper.classList).includes(renderPrefs.wrapperHiddenClass)) {

                                    targetField.$wrapper.classList.remove(renderPrefs.wrapperHiddenClass)
                                    targetField.$wrapper.classList.add(renderPrefs.wrapperVisibleClass)
                                    targetField.enableRules()
                                    targetField.status = undefined
                                    if(resetValueOnToggle) {
                                        targetField.setValue('')
                                    }
                                }
                            })
                        
                    }

                    
                    if(this.defaultRules[depRuleObject.name]) {
                        depRuleObject = {...this.defaultRules[depRuleObject.name], ...removeUndefinedObjectKeys(depRuleObject)}
                    }

                    var rule = new FormValidatorRule(depRuleObject)

                    let dependenceRulePromise = new Promise(function(resolve, reject) {
                        rule.test(field.getValue(), (cb) => {
                            if(cb === true) {
                                resolve()
                            } else {
                                reject()
                            }
                        })
                    })


                    dependenceRulePromise.then(() => {
                        this.events.onBeforeShowDependentFields && (this.events.onBeforeShowDependentFields(targetFields));
                        show()
                        this.events.onShowDependentFields && (this.events.onShowDependentFields(targetFields));
                    }).catch(() => {
                        this.events.onBeforeHideDependentFields && (this.events.onBeforeHideDependentFields(targetFields));
                        hide()
                        this.events.onHideDependentFields && (this.events.onHideDependentFields(targetFields));
                    })

                })
            }
        })
    }


    showLoading() {
        if(this.showLoadingFn !== undefined) {
            this.showLoadingFn(this)
        }
    }

    hideLoading() {
        if(this.hideLoadingFn !== undefined) {
            this.hideLoadingFn(this)
        }
    }

    getFormData() {
        return new FormData(this.$form);
    }

    getSerializedFormData() {
        let obj = {};
        for (let [key, value] of this.getFormData()) {
            if (obj[key] !== undefined) {
                if (!Array.isArray(obj[key])) {
                    obj[key] = [obj[key]];
                }
                obj[key].push(value);
            } else {
                obj[key] = value;
            }
        }
        return obj;

    }

    submit(e) {

        this.events.onBeforeSubmit && (this.events.onBeforeSubmit(this));

        let _dontSubmit = () => {
            this.submitting = false
            this.logger.log("initField(): Form can't be submitted", this); 
            this.events.onSubmitFail && (this.events.onSubmitFail(this));

        }
        let _submit = () => {
            this.logger.log("initField(): Submitting form", this); 

            if(this.submitFn) {
                this.showLoading();
                this.disableForm();

                let handleSubmissionResult = result => {
                    let formData = new FormData(this.$form);
                    this.submitting = false
                    this.hideLoading();
                    this.enableForm();
                    this.resetForm();
                    if(result) {
                        this.events.onSubmit && (this.events.onSubmit(this));
                    } else {
                        _dontSubmit()
                    }
                }
                this.submitFn(this, handleSubmissionResult)
            } else {
                this.submitting = false;
                this.hideLoading();
                this.events.onBeforeSubmit && (this.events.onBeforeSubmit(this));
                this.$form.submit()
                deleteFormState()
                this.events.onSubmit && (this.events.onSubmit(this));
            }
        }

        // Process

        if(this.getFirstInvalidField()) {
            this.getFirstInvalidField().fields[0].focus()
        }

        if(this.submitting === true || this.someFieldsValidating()) {
            return;
        } else {
            this.submitting = true

            if(this.allFieldsValid()) {
                _submit()
            } else {

                this._validate().then(() => {
                    if(this.allFieldsValid()) {
                        _submit()
                    } else {
                        _dontSubmit()
                    }
                }).catch(() => {
                    if(this.getFirstInvalidField()) {
                        this.getFirstInvalidField().fields[0].focus()
                    }
                    _dontSubmit()
                })
            }

        }
        
    }
    
}