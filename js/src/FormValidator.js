import constants from './constants';
import DEFAULT_RULES from './defaultRules'
import FormValidatorRule from './FormValidatorRule';
import FormValidatorField from './FormValidatorField';
import Logger from './Logger';
import { deepSpread } from 'deep-spread';


const removeUndefinedObjectKeys = (obj) => {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        }
    });
    return obj
};

export default class FormValidator {
    
    constructor(formId, options={}) {
            
        this.logger = new Logger(options.debug);

        this.logger.log("constructor(): New validator instance");
        this.formId = formId;

        this.options = deepSpread(options, constants.DEFAULT_OPTIONS);;
        
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
        this._repeatables = {};
        
        this.logger.log("init(): Registering fields..."); 

        this.options.fields.forEach(fieldObject => {
            this.registerField(fieldObject);
        }) 

        var handleFormSubmit = (e) => {
            e.preventDefault();
            this.submit(e)
        }
        this.$form.addEventListener('submit', handleFormSubmit)

        var handleFormChange = (e) => {
            if(this.enableDataRestore) {
                this.updateFormState();
            }
            this.updateDependencyRules(true)
        }
        this.$form.addEventListener('change', handleFormChange)

        
        this._options = this.options;
        delete this.options
        delete this.formId
        
        
        if(this.enableDataRestore) {
            this.applyFormState();
            this._validate([], true).then(() => {}).catch(() => {})
        }

        this.updateDependencyRules()

        
        this.events.onInit && (this.events.onInit(this));
  

        this.logger.log("init(): Validator has been initialized", this);   


        this.destroy = () => {
            this.logger.log("destroy(): Destroying validator...");    
            this.deleteFormState();
            this.resetValidation();
            this.eachField((field) => {
                field.unregister()
            })            
            this.$form.removeEventListener('submit', handleFormSubmit)
            this.$form.removeEventListener('change', handleFormChange)

        }

    }
    
    registerField(fieldObject) {

        if(this.fields[fieldObject.name]) {
            this.unregisterField(fieldObject.name)
        }

        var _validator = this;

        var _registerField = (obj) => {
            obj._validator = _validator;
            this.fields[obj.name] = new FormValidatorField(obj, this.logger.showLogs);
        }

        if(typeof fieldObject.name === "object") {
            fieldObject.name.forEach(fieldName => {
                let obj = fieldObject;
                obj.name = fieldName;
                _registerField(obj);
            })
        } else {
            let obj = fieldObject;
            _registerField(obj);
        }
    }

    unregisterField(fieldName) {
        this.fields[fieldName].unregister()
    }

    eachField(fn) {

        Object.keys(this.fields).forEach(k => {
            return fn(this.fields[k])
        })
        
    }
    
    isValid(fieldsNames=[]) {
        let hasInvalidField = false;

        if(!fieldsNames.length) {
            this.eachField((field) => {
                if(field._status !== 1) {
                    hasInvalidField = true;
                }
            }) 
        } else {
            fieldsNames.forEach(fieldName => {
                if(this.fields[fieldName]._status !== 1) {
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
            if(field._status === 0) {
                firstInvalidField = field;
                return false;
            }
            return true
        })
        return firstInvalidField
    }

    isValidating() {
        let isValidating = false;
        this.eachField(field => {
            if(field._status === -1) {
                isValidating = true;
            }
        })
        return isValidating
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

    _validate(fieldsNames=[], silentMode=false) {

        this.logger.log("validate(): Form will be validated");
        this.events.onBeforeValidate && (this.events.onBeforeValidate(this));
        
        let handleValidationPromise = (resolveValidationPromise, rejectValidationPromise) => {
            let fieldsValidationPromises = [];


            if(!fieldsNames.length) {
                this.eachField((field) => {
                    fieldsValidationPromises.push(field._validate(silentMode))
                }) 
            } else {
                fieldsNames.forEach(fieldName => {
                    fieldsValidationPromises.push(this.fields[fieldName]._validate(silentMode))
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

        if(this.submitting || this.isValidating()) {
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

        this.updateDependencyRules()
        this.logger.log("resetForm(): Form validation has been reset");
    }

    resetForm() {

        if(this.submitting || this.isValidating()) {
            return;
        }

        this.events.onBeforeReset && (this.events.onBeforeReset(this));

        this.$form.reset();
        this.resetValidation()
        this.deleteFormState()

        if(this._repeatables) {
            Object.keys(this._repeatables).forEach((repeatableInstanceIdentifier) => {
                let repetitionAmount = this._repeatables[repeatableInstanceIdentifier]
                for(let i=0; i<repetitionAmount; i++) {
                    this.removeRepeatable(repeatableInstanceIdentifier)
                }
            })
        }
        
        this.logger.log("resetForm(): Form has been reset");
        this.events.onReset && (this.events.onReset(this));

    }

    deleteFormState() {
        if(window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')]) {
            delete window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')]
        }
        
    }

    updateFormState() {

        let validationStatuses = {};
        Object.keys(this.fields).forEach(fieldName => {
            if(!this.fields[fieldName]) {
                return;
            }
            let field = this.fields[fieldName];
            validationStatuses[field.name] = {
                _status: field._status,
                status: field.status,
                message: field.message
            }
        })

        window.localStorage.setItem('FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id'), JSON.stringify({
            "data": this.getSerializedFormData(),
            "repeatables": this._repeatables,
            "validation": validationStatuses
        }));
    }

    applyFormState() {
        let _storage = window.localStorage['FORMVALIDATOR_FORMDATA_'+this.$form.getAttribute('id')];

        if(_storage) {
            let storage = JSON.parse(_storage);


            if(storage.repeatables) {
                Object.keys(storage.repeatables).forEach((repeatableInstanceIdentifier) => {
                    let repetitionAmount = storage.repeatables[repeatableInstanceIdentifier]
                    for(let i=0; i<repetitionAmount; i++) {
                        this.addRepeatable(repeatableInstanceIdentifier, false)
                    }
                })
            }

            let serializedForm = storage.data;

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

    getDependencyRuleTargetFields(depRuleObject) {
        let fields = []
        depRuleObject.groups.forEach(groupName => {
            let groupFields = this.getGroupFields(groupName)
            groupFields.forEach(groupField => {
                fields.push(groupField)
            })
        })
        depRuleObject.fields.forEach(dependencyRuleFieldName => {
            let dependentField = this.fields[dependencyRuleFieldName];
            fields.push(dependentField)
        })
        return fields
    }

    updateDependencyRules(resetValueOnToggle=false) {

        this.logger.log("updateDependencyRules(): Updating...", this);   

        Object.keys(this.fields).forEach(k => {

            var field = this.fields[k];
            
            if(field.dependencyRules !== undefined) {

                field.dependencyRules.forEach(depRuleObject => {

                    if(!depRuleObject.fields){
                        depRuleObject.fields = [];
                    }
                    if(!depRuleObject.groups){
                        depRuleObject.groups = [];
                    }

                    let targetFields = this.getDependencyRuleTargetFields(depRuleObject)

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
                                    targetField._status = 1;

                                    if(resetValueOnToggle) {
                                        // targetField.setValue('')
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
                                    targetField._status = undefined

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

                    rule.test(field.getValue()).then(() => {
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


        let _submit = () => {

            this.events.onBeforeSubmit && (this.events.onBeforeSubmit(this));
            
            this.logger.log("submit(): Submitting form", this); 

            this.showLoading();

            if(this.submitFn) {
                
                this.disableForm();

                let handleSubmissionCallback = callback => {
                    this.submitting = false
                    this.hideLoading();
                    if(callback) {
                        this.events.onSubmit && (this.events.onSubmit(this));
                        this.resetForm();
                    } else {
                        this.submitting = false
                        this.logger.log("submit(): Form can't be submitted", this); 
                        this.events.onSubmitFail && (this.events.onSubmitFail(this));
                    }
                    this.enableForm();
                    
                }
                this.submitFn(this, handleSubmissionCallback)
                
            } else {
                this.submitting = false;
                this.hideLoading();
                this.$form.submit()
                this.events.onSubmit && (this.events.onSubmit(this));
                this.resetForm();
            }
        }

        // Process

        this.events.onTrySubmit && (this.events.onTrySubmit(this));

        if(this.getFirstInvalidField()) {
            this.getFirstInvalidField().elements[0].focus()
        }

        
        if(this.submitting === true || this.isValidating()) {
            return;
        } else {
            this.submitting = true

            this._validate().then(() => {
                if(this.isValid()) {
                    _submit()
                } else {
                    this.submitting = false
                }
            }).catch(() => {
                this.submitting = false
                if(this.getFirstInvalidField()) {
                    this.getFirstInvalidField().elements[0].focus()
                }
            })
        

        }
        
    }


    getNodeChildrenFieldsNames($wrapper) {
        
        let _fields = {};
        let fields = [];

        Array.from($wrapper.querySelectorAll('['+constants.INITIALIZED_FIELD_DATA_ATTRIBUTE+']')).forEach(node => {
            if(node.hasAttribute('name') && this.fields[node.getAttribute('name')]) {
                _fields[node.getAttribute('name')] = true;
            }
        })


        Object.keys(_fields).forEach((fieldName) => {
            fields.push(fieldName)
        })

        return fields

    }


    addRepeatable(repeatableIdentifier, clearValue=true) { 
        
        var $repeatableWrapper = document.querySelector('['+constants.REPEATABLE_WRAPPER_DATA_ATTRIBUTE+'="'+repeatableIdentifier+'"]');
        var $firstItem = $repeatableWrapper.querySelectorAll('['+constants.REPEATABLE_ITEM_DATA_ATTRIBUTE+']')[0];
        var itemsCount = $repeatableWrapper.querySelectorAll('['+constants.REPEATABLE_ITEM_DATA_ATTRIBUTE+']').length;
        
        var limit = Number($repeatableWrapper.getAttribute(constants.REPEATABLE_LIMIT_DATA_ATTRIBUTE));
        if(limit > 1 && itemsCount >= limit) {
            return
        }

        this._repeatables[repeatableIdentifier] = itemsCount;

        let repeatingFieldsNames = this.getNodeChildrenFieldsNames($firstItem);
        
        let revalidatingFieldsNames = [];
        repeatingFieldsNames.forEach(fieldName => {
            if(this.fields[fieldName].status === 0 || this.fields[fieldName].status === 1 || this.fields[fieldName].status === -1) {
                revalidatingFieldsNames.push(fieldName)
                this.fields[fieldName].removeValidationElements();
                this.fields[fieldName].setUnvalidated();
            }
        })

        let $clone = $firstItem.cloneNode(true);
        
        revalidatingFieldsNames.forEach(fieldName => {
            this.fields[fieldName].validate();
        })

        
        repeatingFieldsNames.forEach((fieldName) => {
            let newFieldName = fieldName+itemsCount;

            let inputs = $clone.querySelectorAll('[name="'+fieldName+'"]');
            inputs.forEach($input => {
                $input.setAttribute('id', $input.getAttribute('id')+itemsCount)
                $input.setAttribute('name', $input.getAttribute('name')+itemsCount)
            })

            let labels = $clone.querySelectorAll('label[for="'+fieldName+'"]');
            labels.forEach($label => {
                if($label.hasAttribute('for')) {
                    $label.setAttribute('for', $label.getAttribute('for')+itemsCount)
                    $label.innerHTML = $label.innerHTML + " ("+(itemsCount+1)+")"

                }
            })

            $repeatableWrapper.appendChild($clone);
            let field = this.registerField({
                ...this.fields[fieldName],
                name: newFieldName,
            });
            if(clearValue) {
                this.fields[newFieldName].setValue('');
            }
            this.fields[newFieldName].resetValidation();
            
        })
            
        if(clearValue) {
            this.updateFormState()
        }
            

    }

    removeRepeatable(repeatableIdentifier, repeatableNumber=-1) {

        var $repeatableWrapper = document.querySelector('['+constants.REPEATABLE_WRAPPER_DATA_ATTRIBUTE+'="'+repeatableIdentifier+'"]');
        var repeatableItems = $repeatableWrapper.querySelectorAll('['+constants.REPEATABLE_ITEM_DATA_ATTRIBUTE+']');

        if(repeatableItems.length <= 1) {
            return 
        }       
        let repeatingFieldsNames;

        if(repeatableNumber !== -1) {
            repeatableNumber = Number(repeatableNumber);
        } else {
            repeatableNumber = repeatableItems.length-1;
        }
        
        repeatingFieldsNames = this.getNodeChildrenFieldsNames(repeatableItems[repeatableNumber]);
        repeatingFieldsNames.forEach(fieldName => {
            this.unregisterField(fieldName)
        })

        repeatableItems[repeatableNumber].remove()
        this._repeatables[repeatableIdentifier] = this._repeatables[repeatableIdentifier]-1;
        if(this._repeatables[repeatableIdentifier] < 1) {
            delete this._repeatables[repeatableIdentifier]
        }
        this.updateFormState()

    }
    
}