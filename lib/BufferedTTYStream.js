const _TTYStream = require('./TTYStream');

class BufferedTTYStream
    extends _TTYStream{

    constructor(devicePath){
        super(devicePath);

        // rx buffer
        this.rxBuffer = Buffer.from([]);
    }

    async connect(){
        // don't emit data events - async read is used!
        await super.connect(false);

        // listen on new data
        this.inputStream.on('data', function(data){
            // append data
            this.rxBuffer = Buffer.concat([this.rxBuffer, data]);
        }.bind(this));
    }

    // read a delimitered byte sequence
    readDelimiteredSequence(delimiter='\r\n', timeout=200){
        return new Promise(function(resolve, reject){

            // on data listener
            let onDataHandler = null;

            // timeout
            const timeoutHandler = setTimeout(function(){
                // remove listener
                this.inputStream.removeListener('data', onDataHandler);
                
                reject(new Error('Response Timeout'));
            }.bind(this), timeout);
    
            // handle data
            onDataHandler = function(){
                // search for delimiter sequence
                const termination = this.rxBuffer.indexOf(delimiter);
                
                // delimiter sequence found ?
                if (termination > 0){
                    // stop timeout
                    clearTimeout(timeoutHandler);

                    // remove listener
                    this.inputStream.removeListener('data', onDataHandler);
    
                    // convert to string
                    resolve(this.rxBuffer.slice(0, termination).toString('utf8'));
                }
            }.bind(this);
    
            // add "listener"
            this.inputStream.on('data', onDataHandler);

        }.bind(this));
    }

    clearRxBuffer(){
        this.rxBuffer = Buffer.from([]);
    }
}

module.exports = BufferedTTYStream;