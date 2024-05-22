let devices;
let color = {r: 0, g: 0, b: 0};
let lastIdleState;
let settings = {
    modes: [
        { name: "Besprechung", color: {r: 255, g: 0, b: 0} },
        { name: "Verfügbar", color: {r: 0, g: 255, b: 0 }},
        { name: "Laptop Lock", color: {r: 255, g: 255, b: 0 }},
        { name: "AFK", color: {r: 0, g: 255, b: 255 }},
    ],
    monitorLaptopLock : true,
    LaptopLockMode : "Laptop Lock",
    monitorUserIdle : true,
    UserIdleMode : "AFK",
    keepAliveInterval: 5000
}

keepAliveId = setInterval(sendKeepAlive, settings.keepAliveInterval);

function isReady(device) {
    return device !== null && device !== undefined;
}

function binaryStringToUint8Array(binaryString) {
    const uint8Array = new Uint8Array(binaryString.length / 8); // Create a Uint8Array with the specified length
    for (let i = 0; i < binaryString.length; i += 8) { // Loop through the binary string in chunks of 8 bits (1 byte)
        const byte = binaryString.slice(i, i + 8); // Get the current byte (8 bits)
        uint8Array[i / 8] = parseInt(byte, 2); // Store the byte in the Uint8Array at the appropriate index
    }
    return uint8Array; // Return the Uint8Array
}

function calculateChecksum(binaryString) {
    let checksum = 0;
    for (let i = 0; i < 62; i++) {
        const byte = binaryString.slice(i * 8, (i + 1) * 8); // Extrahiere jedes Byte (8 Bit)
        const byteValue = parseInt(byte, 2); // Konvertiere das Byte von binär nach dezimal
        checksum += byteValue; // Addiere das Byte zur Checksumme hinzu
    }
    return checksum &= 0xFFFF; // Beschränke die Checksumme auf 16 Bit
}

function clampValue(variable, minValue, maxValue, valueOnError = null) {
    // Try parsing the variable as an integer
    if(valueOnError == null)
        valueOnError = minValue;

    const intValue = parseInt(variable);

    // Check if the parsed value is a valid integer
    if (!isNaN(intValue)) {
        // Clamp the parsed integer to the specified range
        return Math.min(Math.max(intValue, minValue), maxValue);
    } else {
        // Return the minimum value if parsing fails or if the variable is not a number
        return valueOnError;
    }
}

class JumpStep {
    constructor() {
        this._jump = 0;         // 60:63 JUMP_OP
        this.pad0 = 0;         // 59:59 zero
        this.target = 0;       // 56:58 Jump target: [0,7]
        this.repeat = 0;       // 48:55 Execute this step N times [1,255]
        this.red = 0;          // 40:47 8-bit PWM on time [0,100]
        this.green = 0;        // 32:39 8-bit PWM on time [0,100]
        this.blue = 0;         // 24:31 8-bit PWM on time [0,100]
        this.on_time = 0;      // 16:23 time in 0.1 sec steps [0,255]
        this.off_time = 0;     // 08:15 time in 0.1 sec steps [0,255]
        this.update = 0;       // 07:07 if clear, following audio is ignored
        this.ringtone = 0;     // 03:06
        this.volume = 0;       // 00:02 000 stops ringtone
    }

    toBinaryString() {

        //#region This Values are Constand and do not change
        //const binaryJump = this.jump.toString(2).padStart(4, 0);
        //const binaryPad0 = this.pad0.toString(2).padStart(1, 0);
        const binaryJump = 0x1.toString(2).padStart(4, 0);
        const binaryPad0 = 0x0.toString(2).padStart(1, 0);
        //#endregion

        const binaryTarged = this.target.toString(2).padStart(3, 0);
        const binaryRepeat = this.repeat.toString(2).padStart(8, 0);

        const binaryRed = this.red.toString(2).padStart(8, 0);
        const binaryGreen = this.green.toString(2).padStart(8, 0);
        const binaryBlue = this.blue.toString(2).padStart(8, 0);

        const binaryOnTime = this.on_time.toString(2).padStart(8, 0);
        const binaryOffTime = this.off_time.toString(2).padStart(8, 0);

        const binaryUpdate = this.update.toString(2).padStart(1, 0);
        const binaryRingtone = this.ringtone.toString(2).padStart(4, 0);
        const binaryVolume = this.volume.toString(2).padStart(3, 0);

        const binaryString = binaryJump + binaryPad0 + binaryTarged + binaryRepeat + binaryRed + binaryGreen + binaryBlue + binaryOnTime + binaryOffTime + binaryUpdate + binaryRingtone + binaryVolume;
        console.log("JumpStep: ");
        console.log(this);
        console.log("Binary: " + binaryString);
        // Concatenate binary strings
        return binaryString;


    }
}

class KeepAliveSteep {
    constructor(timeout = 15) {
        this.timeout = timeout;
    }

    toBinaryString() {
        let binaryString = 0x8.toString(2).padStart(4, 0);
        binaryString += this.timeout.toString(2).padStart(4, 0);
        binaryString += 0x0.toString(2).padStart(56, 0);
        return binaryString;
    }
}

class Packet {
    constructor() {
        this.steps = Array.from({ length: 7 });
        this.sensitivity = 0; // Not Used by UC Alpha and UC Omega
        this.timeout = 0;     // Not Used by UC Alpha and UC Omega
        this.trigger = 0;     // Not Used by UC Alpha and UC Omega  
    }

    // Turns a packet into a byte array with can be send with Web HID
    toBinaryString() {
        let binaryString;
        this.steps.forEach(step => {
            if (step !== null && binaryString == null && step !== undefined)
                binaryString = step.toBinaryString();
            else if (step !== null && step !== undefined)
                binaryString += step.toBinaryString();
            else
                binaryString += 0x0.toString(2).padStart(64, 0);
        });

        binaryString += this.sensitivity.toString(2).padStart(8, 0);
        binaryString += this.timeout.toString(2).padStart(8, 0);
        binaryString += this.trigger.toString(2).padStart(8, 0);
        binaryString += 0xFFFFFF.toString(2).padStart(24, 0);

        // Calculate and set checksum
        let checksum = calculateChecksum(binaryString)
        binaryString += checksum.toString(2).padStart(16, 0);

        return binaryString;
    }
}


chrome.runtime.onInstalled.addListener(async () => {
    // Hier können Initialisierungsaktionen durchgeführt werden
});

//extension://jlmiohfdolkdmgmfokapicdmegehijic/popup.html
//https://developer.chrome.com/docs/extensions/how-to/web-platform/webhid?hl=de
chrome.runtime.onMessage.addListener(async (message) => {

});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request === "newDevice") {
            getDevices();
        }
        if (request.action === "setColor") {
            changeColor(request.data, false);
        }
        if (request.action === "setColorDirect") {
            changeColor(request.data, true);
          }
        if (request.action === "setAudio") {
            setAudio(request.data);
          }
        if (request.action == "getInitData")
        {
            const data = {
                setting : settings,
                currentColor: color
            }
            sendResponse(data);
        }
    }
);



async function changeColor(newColor, setDirect = false) {
    // Überprüfen Sie, ob die Werte zwischen 0 und 255 liegen
    color.r = clampValue(newColor.r, 0, 255);
    color.g = clampValue(newColor.g, 0, 255);
    color.b = clampValue(newColor.b, 0, 255);

    // Usage example:
    const packet = new Packet();
    const stepTransion = new JumpStep();
    const stepStatic = new JumpStep();
    packet.steps[0] = stepTransion;
    packet.steps[1] = stepStatic;

    stepTransion.target = 1;
    stepTransion.on_time = 5;
    stepTransion.off_time = 5;
    stepTransion.repeat = 3;
    stepTransion.red = color.r;
    stepTransion.green = color.g;
    stepTransion.blue = color.b;

    stepStatic.target = 1;
    stepStatic.repeat = 0;
    stepStatic.red = color.r;
    stepStatic.green = color.g
    stepStatic.blue = color.b;

    if(setDirect)
    {
        packet.steps[0] = stepStatic;
        stepStatic.target = 0;
    }

    if (sendPacket(packet));
    console.log("Set Status Color: R=" + color.r + ", G=" + color.g + ", B=" + color.b);

}

async function setAudio(mode)
{
    const packet = new Packet();
    const audio = new JumpStep();
    packet.steps[0] = audio;

    audio.update = clampValue(mode.update, 0, 1, 1);
    audio.volume = clampValue(mode.volume, 0, 7);
    audio.ringtone = clampValue(mode.ringtone, 0, 10);

    sendPacket(packet);
}
async function sendKeepAlive() {
    const packet = new Packet();
    const step = new KeepAliveSteep();
    packet.steps[0] = step;

    if (sendPacket(packet))
        console.log("SendKeepAlive");
}

async function sendPacket(packet)
{
    let succes = false;
    if(devices == null || devices == undefined)
    {
        console.warn("Device is not set, can not send Packet: " + packet);
        return succes;
    }
    for (const device of devices) {
    if (device !== null && device !== undefined){

        if (!device.opened)
            await device.open();
        
        const binaryString = packet.toBinaryString();    
        const byteUArray = binaryStringToUint8Array(binaryString)

        await device.sendReport(0, byteUArray);
        await device.close();
        succes = true;
    }
    else
    {
        console.warn("Device is not set, can not send Packet: " + packet);
    }}
    return succes;
}

async function getDevices() {
    devices = await navigator.hid.getDevices();
    
}

// Message Sender

function idleStateChanged(toState) {
    const state = {
        action: "idleStateChanged",
        data: toState
    };
    chrome.runtime.sendMessage(state);

    switch(toState)
    {
        case "locked":
            if(settings.monitorLaptopLock)
                changeColor(settings.modes.find(x => x.name == settings.LaptopLockMode).color);
            break;
        default:
            if(lastIdleState == "locked")
                changeColor({r: 0, g: 255, b: 0});
            
    }
    lastIdleState = toState;
}
chrome.idle.setDetectionInterval(
    15
);
chrome.idle.onStateChanged.addListener(idleStateChanged);
