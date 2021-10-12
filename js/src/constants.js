export const DEFAULT_OPTIONS = {

    validateOnBlur: true,

    breakOnFirstError: true,
    fields: [],
    events: {   
        onBeforeSubmit: () => {
            // runs before  is submitted
        },
        onSubmit: () => {
            // runs when form is submitted
        }
    },
    fieldWrapperClassname: "form-group",
    fieldWrapperValidClassname: "is-valid",
    fieldWrapperInvalidClassname: "is-invalid",
    fieldValidClassname: "is-valid",
    fieldInvalidClassname: "is-invalid",
    showFieldMessage: true,
    fieldMessageHTML: "<div class=\"invalid-feedback\">{{message}}</div>"

}
