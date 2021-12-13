// Each step is a form
// option: allowGoingBack
// option: onlyAllowForwardingWhenStepIsValid
// option autoStartOnFirstStep
// fazer metodos avançar e voltar
// cada passo tera uma classe pra dizer que o step está ativo/inativo, se é o proximo ou o anterior, se é o primeiro ou o último e idenficar o numero via html mesmo
// Cada passo tb terá classe pra dizer se a step ta ativa ou inativa
// eventos onStepActivate / inactivate


/// Will suppress each validator's submit method???? 

class FormValidatorStepsHandler {

    constructor(options) {

        this.steps = options.steps;
        this.currentStepIndex = undefined;

    }

    init() {

        if(this.steps.length <= 1) { // Duh!
            return;
        }

        for(let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let $stepForm = step.formValidatorInstance.$form;

            let handleStepFormChange = (e) => {
                this.update()
            }

            if(step.formValidatorInstance && step.formValidatorInstance.$form) {
                $stepForm.addEventListener("change", handleStepFormChange)

                step.formValidatorInstance.submitFn = (validator => {
                    console.log('enviando o step ', validator)
                })
            }

        }

        this.update();
        this.start(); // TODO: if config says it auto starts
        
    }


    update() {

        console.log("update")

        for(let i = 0; i < this.steps.length; i++) {
            let step = this.steps[i];
            
            console.log("updating step " + i)

            let status;
            let enabled;

            let stepValidator = step.formValidatorInstance;

            if(stepValidator.isValid()) {
                status = 1
            } else if(stepValidator.isValidating()) {
                status = -1
            } else {
                status = 0
            }
            
            if(typeof step.enabled === "function" && !step.enabled()) {
                enabled = true;
            } else {
                enabled = false
            }

            step._state = {
                active: (this.currentStepIndex === i),
                status: status,
                enabled: enabled
            };



            
        }
        
    }

    setStep(stepIndex) {

        if(stepIndex < 0 || stepIndex >= this.steps.length) {
            return;
        }

        if(this.steps[stepIndex-1]) {
            this.steps[stepIndex-1].formValidatorInstance.validate()
        }
        if(stepIndex === 0 || this.steps[stepIndex-1].formValidatorInstance.isValid()) {
          
            for(let i = 0; i < this.steps.length; i++) {
                let step = this.steps[i];
                step.formValidatorInstance.$form.classList.add('d-none');
            }
            
            this.steps[stepIndex].formValidatorInstance.$form.classList.remove('d-none');
            this.currentStepIndex = stepIndex;
    
        }   

    }

    next() {
        this.setStep(this.currentStepIndex + 1);
    }
    previous() {
        this.setStep(this.currentStepIndex - 1);
    }

    forEachStep(fn, i) {
        
    }


    start() {
        this.setStep(0);
    }


}

export default FormValidatorStepsHandler