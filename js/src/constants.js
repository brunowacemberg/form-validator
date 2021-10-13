export const DEFAULT_OPTIONS = {

    debug: false,
    validateFieldOnBlur: true,
    resetFieldValidationOnChange: true,

    fieldRenderPreferences: {
        wrapperClass: "form-group",
        wrapperHiddenClass: "d-none",
        
        // "Validating" field state
        showValidatingMessage: false,
        validatingMessage: "Validating...",
        validatingMessageHTML: "<div class=\"valid-feedback text-muted d-block\">{{message}}</div>",
        addValidatingClass: false,
        validatingClass: "is-validating",
        addWrapperValidatingClass: false,
        wrapperValidatingClass: "is-validating",
        
        // "Valid" field state
        showValidMessage: true,
        validMessage: "All set ;)",
        validMessageHTML: "<div class=\"valid-feedback text-success d-block\">{{message}}</div>",
        addValidClass: true,
        validClass: "is-valid",
        addWrapperValidClass: true,
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

        // {
        //     id: "field_name", // my be array if tyoe radio (equal names, different ids, same value)
        //     group: "personalData",
        //     helpText: "Seu nome",
        //     rules: ["required"],
            
        // },
        // {
        //     id: "field_email", // my be array if tyoe radio (equal names, different ids, same value)
        //     group: "personalData",
        //     helpText: "Seu email",
        //     rules: ["required", "email", "userExists"],
        //     events: {
        //         onBeforeFieldValidate: function(field) {
        //             console.log("onBeforeFieldValidate específico da field", field)
        //         },

        //     },
        //     fieldRenderPreferences: {
        //         showFieldValidMessage: true,
        //         showFieldValidatingMessage: false
        //     }
        // },
        // {
        //     id: "field_phoneNumber", // my be array if tyoe radio (equal names, different ids, same value)
        //     group: "personalData",
        //     helpText: "Digite aqui algum número para falarmos com você",
        //     rules: [
        //         {
        //             name: 'minLength',
        //             parameter: 1
        //         },
        //         {
        //             name: 'maxLength',
        //             parameter: 2
        //         }
        //     ]
        // }

    ],

    submit: undefined,
    // submit: function(validator, cb) {
        
    //     setTimeout(function() {
    //         cb(true)
    //     }, 3000)
    // },

    events: {   
        onBeforeSubmit: undefined,
        onSubmit: undefined,
        onBeforeFieldValidate: undefined,
        onFieldValidate: undefined,
    }

} 
