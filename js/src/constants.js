const GROUP_WRAPPER_DATA_ATTRIBUTE = 'data-form-validator-group-wrapper';

const DEFAULT_OPTIONS = {

    debug: false,
    enableDataRestore: false, // will be deleted on form submission or reset
    resetFieldValidationOnChange: true,
    validateFieldOnInput: false,
    validateFieldOnBlur: false,

    groupWrapperHiddenClass: "d-none",
    groupWrapperVisibleClass: "d-block",

    fieldRenderPreferences: {
        wrapperClass: "form-group",
        wrapperHiddenClass: "d-none",
        wrapperVisibleClass: "d-block",
        
        // "Validating" field state
        showValidatingMessage: false,
        validatingMessage: "Validating...",
        validatingMessageHTML: "<div class=\"valid-feedback text-muted d-block\">{{message}}</div>",
        addValidatingClass: false,
        validatingClass: "is-validating",
        addWrapperValidatingClass: false,
        wrapperValidatingClass: "is-validating",
        
        // "Valid" field state
        showValidMessage: false,
        validMessage: "Field is valid",
        validMessageHTML: "<div class=\"valid-feedback text-success d-block\">{{message}}</div>",
        addValidClass: false,
        validClass: "is-valid",
        addWrapperValidClass: false,
        wrapperValidClass: "is-valid",
        
        // "Invalid" field state (message will come from first unmatched rule)
        showInvalidMessage: true,
        invalidMessageHTML: "<div class=\"invalid-feedback text-danger d-block\">{{message}}</div>",
        addInvalidClass: true,
        invalidClass: "is-invalid",
        addWrapperInvalidClass: true,
        wrapperInvalidClass: "is-invalid"
        
    },
    
    fields: [
    ],


    showLoadingFn: undefined, // returns instance
    hideLoadingFn: undefined, // returns instance
    submitFn: undefined, // returns instance

    events: {   
        onInit: undefined,
        onBeforeReset: undefined,
        onReset: undefined,
        onBeforeSubmit: undefined,
        onSubmitFail: undefined,
        onSubmit: undefined,
        onBeforeValidate: undefined,
        onValidate: undefined,
        onBeforeValidateField: undefined,
        onValidateField: undefined,
        onFieldInput: undefined,
        onBeforeShowDependentFields: undefined,
        onShowDependentFields: undefined,
        onBeforeHideDependentFields: undefined,
        onHideDependentFields: undefined
    }

} 



export default {
    GROUP_WRAPPER_DATA_ATTRIBUTE,
    DEFAULT_OPTIONS
}