const _tty = require('tty');
const _fs = require('fs-magic');
const _EventEmitter = require('events');

class TTYStream
    extends _EventEmitter{
    
    constructor(devicePath){
        super();

        // valid device ?
        if (devicePath === null){
            throw new Error('device path not set');
        }

        this.devicePath = devicePath;
    }

    // establish connection
    async connect(emitDataEvent=true){
        // path exists ?
        if (!(await _fs.exists(this.devicePath))){
            throw new Error(`device [${this.devicePath}] not exists`);
        }

        // try to open device
        this.handle = await _fs.open(this.devicePath, 'r+');

        // create r/w streams
        this.inputStream = new _tty.ReadStream(this.handle);
        this.inputStream.setRawMode(true);
        this.outputStream = new _tty.WriteStream(this.handle);

        // listen on error events => fwd
        this.inputStream.on('error', function(err){
            this.emit('error', err);
        }.bind(this));

        this.outputStream.on('error', function(err){
            this.emit('error', err);
        }.bind(this));

        // listen on data events
        if (emitDataEvent){
            this.inputStream.on('data', function(data){
                this.emit('data', data);
            }.bind(this));
        }
    }

    // disconnect
    async disconnect(){
        // destroy sockets
        this.inputStream.destroy();
        this.outputStream.destroy();

        // close handle
        await _fs.close(this.handle);
    }

    // async write
    write(data){
        return new Promise(function(resolve, reject){
            this.outputStream.write(data, err => {
                if (err){
                    reject(err);
                }else{
                    resolve(true);
                }
            })
        }.bind(this));
    }

    isConnected(){
        return (
            this.inputStream !== null &&
            this.inputStream.readable &&
            this.outputStream !== null &&
            this.outputStream.writable
        );
    }

    // sync read
    read(size=1){
        if (this.inputStream.readableLength >= size){
            return this.inputStream.read(size);
        }else{
            return null;
        }
    }
}


module.exports = TTYStream;