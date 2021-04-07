'use strict';

createState('rotel.onState'); //Status On/Off
createState('rotel.inputState'); //Input
createState('rotel.turnOff');
createState('rotel.turnOn');
createState('rotel.volume');
createState('rotel.powerToggle');


// JavaScript source code

var util = require('util'),
    net = require('net'),
    events = require('events');

var TRACE = true;

var options = {
    port: 9590,
    host: "192.168.178.7",
    log: true
};

var VSX = function (options) {
    events.EventEmitter.call(this); // inherit from EventEmitter

    this.client = this.connect(options);

    this.inputNames = {};

    TRACE = options.log;
};

/**
 * Turn unit power on or off
 */
VSX.prototype.power = function (on) {
    if (TRACE) {
        console.log("turning power: " + on);
    }
    console.log("My_Power: " + on);
    if (on) {
        this.client.write("power_on!");
    } else {
        this.client.write("power_off!");
    }
};

util.inherits(VSX, events.EventEmitter);

VSX.prototype.connect = function (options) {
    var self = this;
    var client = net.connect(options);

    client.on("connect", function (socket) {
        handleConnection(self, socket);
    });

    client.on("data", function (data) {
        handleData(self, data);
    });

    client.on("end", function () {
        handleEnd(self);
    });

    client.on("error", function (err) {
        handleError(self, err);
    });

    return client;
};

function handleData(self, d) {
    var input;
    var data = d.toString(); // make sure it's a string

    // TODO implement a message to handler mapping instead of this big if-then statement

    if (data.startsWith("power=on")) { // power status
        var pwr = (data.startsWith("power=on$")) // PWR0 = on, PWR1 = off
        if (TRACE) {
            console.log("Power On: " + pwr);
        }
        
        setState('rotel.onState', pwr);
        self.emit("power", pwr);
    }
    else if (data.startsWith("power=standby")) { // power status Zone2
        //pwr = (data == "power=on$"); // APR0 = on, APR1 = off
        var on =false;

        if (TRACE) {
            console.log("Power on: " + on);
        }

        setState('rotel.onState', on);
        self.emit("power", on);
    }

    else if (data.startsWith("source=")) { // volume status zone2
        var input = data.replace("source=", "").replace("$", "");

        // translate to dB.
        //input = (parseInt(vol) - 81);

        if (TRACE) {
            console.log("got input: " + input);
        }

        setState('rotel.inputState', input);
        var tst = getState('rotel.inputState');
        console.log('value read: ' + tst.val);
        self.emit("input", input);
    }
    
    else if (data.startsWith("volume=")) { // volume status
        var vol = data.replace("volume=", "").replace("$", "");
        console.log("volume level: " + vol);
        
        var db = (parseInt(vol));

        if (TRACE) {
            console.log("got volume: " + db);
        }

        setState('rotel.volume', db);
        self.emit("volume", db);
    }
    /*
    else if (data.startsWith("MUT")) { // mute status
        var mute = data.endsWith("0"); // MUT0 = muted, MUT1 = not muted
        if (TRACE) {
            console.log("got mute: " + mute);
        }
        self.emit("mute", mute);
    }
    else if (data.startsWith("Z2MUT")) { // mute status
        var mute = data.endsWith("0"); // MUT0 = muted, MUT1 = not muted
        if (TRACE) {
            console.log("got zmute: " + mute);
        }
        self.emit("zmute", mute);
    }
    else if (data.startsWith("FN")) {
        input = data.substr(2, 2);
        if (TRACE) {
            console.log("got input: " + input + " : " + self.inputNames[input]);
        }
        self.emit("input", input, self.inputNames[input]);
    }
    else if (data.startsWith("Z2F")) {
        input = data.substr(3, 2);
        if (TRACE) {
            console.log("got input: " + input + " : " + self.inputNames[input]);
        }
        self.emit("zinput", input, self.inputNames[input]);
    }
    else if (data.startsWith("SSA")) {
        if (TRACE && DETAIL) {
            console.log("got SSA: " + data);
        }
    } else if (data.startsWith("APR")) {
        if (TRACE && DETAIL) {
            console.log("got APR: " + data);
        }
    } else if (data.startsWith("BPR")) {
        if (TRACE && DETAIL) {
            console.log("got BPR: " + data);
        }
    } else if (data.startsWith("LM")) { // listening mode
        var mode = data.substring(2);
        if (TRACE) {
            console.log("got listening mode: " + mode);
        }
    } else if (data.startsWith("FL")) { // FL display information
        if (TRACE && DETAIL) {
            console.log("got FL: " + data);
        }
    } else if (data.startsWith("source=")) { // input name information. informs on input names
        // handle input info
        var inputId = data.substr(3, 2);
        for (input in Inputs) {
            if (Inputs[input] == inputId) {
                // if (data.substr(5, 1) == "0") {
                // console.log("default input name")
                // }
                self.inputNames[inputId] = data.substr(6);
                if (TRACE && DETAIL) {
                    console.log("set input " + input + " to " + self.inputNames[inputId]);
                }
                self.emit("inputName", inputId, self.inputNames[inputId]);
                break;
            }
        }
    } else if (data.startsWith("RGC")) {
        if (TRACE && DETAIL) {
            console.log("got RGC: " + data);
        }
    } else if (data.startsWith("RGF")) {
        if (TRACE && DETAIL) {
            console.log("got RGF: " + data);
        }
    } else if (data.length > 0) {
        if (TRACE) {
            console.log("got data: " + data);
        }
    }*/
}


function handleConnection(self, socket) {
    if (TRACE) {
        console.log("got connection.");
    }

    //self.client.write("power?"); // wake

    setTimeout(function () {
        self.queryPower();
        self.queryInput();
        self.queryVolume();


        self.emit("power");
    }, 100);

    self.socket = socket;
}
/*
var Inputs = {
    cd: "cd!",
    coax1: "coax1!",
    coax2: "coax2!",
    opt1: "opt1!",
    aux1: "aux1!",
    aux2: "aux2!",
    tuner: "tuner!",
    phono: "phono!",
    usb: "usb!",
    bt: "bluetooth!",
    pcusb: "pcusb!"
};
*/

VSX.prototype.queryPower = function () {
    var self = this;
    self.client.write("power?"); // query power state
}

VSX.prototype.end = function () {
    var self = this;
    self.client.end(); // query power state
    console.log("socket closed.");
}

VSX.prototype.queryInput = function () {
    var self = this;
    self.client.write("source?"); // query power state
}

/*
VSX.prototype.query = function () {
    var self = this;

    self.client.write("power?"); // query power state
    self.client.write("/r"); // query power state
    self.client.write("volume?"); // query volume state
    self.client.write("/r"); // query power state
    self.client.write("source?"); // query selected input
    self.client.write("/r"); // query power state

    
    self.client.write("?AP\r"); // query power state
    self.client.write("?M\r"); // query mute state
    self.client.write("?Z2M\r"); // query mute state
    self.client.write("?F\r"); // query selected input
    
    // get input names
    var timeout = 100;
    for (var i in Inputs) {
        var inputId = Inputs[i];
        var getInputName = function (inputId, timeout) {
            setTimeout(function () {
                self.client.write("source?");
            }, timeout);
        }
        getInputName(inputId, timeout);
        timeout += 100;
    }

}*/

/**
 * Set the input
 */
VSX.prototype.selectInput = function (input) {
    input = input + "!";
    console.log("setting input to: " + input);
    this.client.write(input + "!");
};

/**
 * Set the input
 */
VSX.prototype.selectVolume = function (vol) {
    var db = parseInt(vol);
    if (db < 50)
    {
        var s  = "vol_" + db + "!";
        console.log("setting volume to: " + db.toString());
        this.client.write(s);
    }
};

//selectPowerToggle
VSX.prototype.selectPowerToggle = function (vol) {
    var s  = "power_toggle!";
    this.client.write(s);
};

/**
 * Query the input name
 */
VSX.prototype.queryInputName = function(inputId) {
    this.client.write("source?");
}

/**
 * Query volume level
 */
VSX.prototype.queryVolume = function(inputId) {
    this.client.write("volume?");
}

function handleEnd(self) {
    if (TRACE) {
        console.log("connection ended");
    }

    self.emit("end");
}

function handleError(self, err) {
    if (TRACE) {
        console.log("connection error: " + err.message);
    }

    self.emit("error", err);
}


try {
    console.log("Starting Rotel Connection");

    var receiver = new VSX(options);
}
catch (e) {
    console.log(e);
}

on({ id: 'javascript.1.rotel.turnOff', val: true }, function (obj) {
    console.log("turnOff triggered.")
    receiver.power(false);

});

on({ id: 'javascript.1.rotel.turnOn', val: true }, function (obj) {
    console.log("turnOff triggered.")
    receiver.power(true);

});

//Set Input
on({ id: 'javascript.1.rotel.inputState', change: "ne" }, function (obj) {
    var value = obj.state.val;
    console.log("Input received: " + value);
    receiver.selectInput(value);
});

//Set Input
on({ id: 'javascript.1.rotel.volume', change: "ne" }, function (obj) {
    var value = obj.state.val;
    console.log("volume received: " + value);
    receiver.selectVolume(value);
});

//
on({ id: 'javascript.1.rotel.powerToggle'}, function (obj) {
    var value = obj.state.val;
    console.log("power toggled: " + value);
    receiver.selectPowerToggle(value);
});

onStop(() => { 
    console.log("closing socket");
    receiver.end();
});

