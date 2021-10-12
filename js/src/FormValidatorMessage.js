export default class FormValidatorMessage {
    construct(messageObject={}) {

        if(!messageObject.content || !messageObject.content.length) {
            return;
        }

        if(!messageObject.type || !messageObject.type.length) {
            messageObject.type = "invalid"
        }

        this.type = messageObject.type;
        this.content = messageObject.content;
        this.display = messageObject.display;

        return this

    }
 
}