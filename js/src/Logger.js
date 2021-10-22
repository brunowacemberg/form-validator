class Logger {

    constructor(debug=false) {
        
        if(debug) {
            this.showLogs = true;
        } else {
            this.showLogs = false;
        }

    }

    log(message, _context) {
        if(!this.showLogs) { return; }
        let context = _context || "";
        console.log(message, context);
    }
    logWarning(message, _context) {
        if(!this.showLogs) { return; }
        let context = _context || "";
        console.warn(message, context);
    }
    logError(message, _context) {
        if(!this.showLogs) { return; }
        let context = _context || "";
        console.error(message, context);
    }


}


export default Logger