
let device;
keepAliveId = setInterval(sendKeepAlive, 5000);

function isReady() {
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

    toBinaryString()
    {

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
        
        const binaryString = binaryJump + binaryPad0 + binaryTarged + binaryRepeat + binaryRed + binaryGreen + binaryBlue + binaryOnTime + binaryOffTime + binaryUpdate + binaryRingtone +binaryVolume;
        console.log("JumpStep: ");
        console.log(this);
        console.log("Binary: " + binaryString);
        // Concatenate binary strings
        return binaryString;


    }
}

class KeepAliveSteep
{
    constructor(timeout = 15)
    {
        this.timeout = timeout;
    }

    toBinaryString()
    {
        let binaryString = 0x8.toString(2).padStart(4, 0);
        binaryString += this.timeout.toString(2).padStart(4, 0);
        binaryString += 0x0.toString(2).padStart(56, 0);
        return binaryString;
    }
}

class Packet {
    constructor() {
        this.steps =  Array.from({ length: 7 });
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
            else if(step !== null && step !== undefined)
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
    if (message === "newDevice") {
      const devices = await navigator.hid.getDevices();
      for (const dev of devices) {
        device = dev;
        changeColor(0, 255, 0);
      }
    }
    if (message.action === "setColor") {
        changeColor(message.data);
      }
  });


async function changeColor(color)
{
    if (typeof(color.r) !== "number")
        color.r = 0;
    if (typeof(color.g) !== "number")
        color.g = 0;
    if (typeof(color.b) !== "number")
        color.b = 0;

    // Überprüfen Sie, ob die Werte zwischen 0 und 255 liegen
    color.r = Math.min(255, Math.max(0, parseInt(color.r)));
    color.g = Math.min(255, Math.max(0, parseInt(color.g)));
    color.b = Math.min(255, Math.max(0, parseInt(color.b)));

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
    
    if(sendPacket(packet));
        console.log("Set Status Color: R="+ color.r + ", G="+color.g+", B="+color.b);

}
async function sendKeepAlive()
{
    const packet = new Packet();
    const step = new KeepAliveSteep();
    packet.steps[0] = step;

    if(sendPacket(packet))
        console.log("SendKeepAlive");
}
async function sendPacket(packet)
{
    if (isReady()){
        if (!device.opened)
            await device.open();
        
        const binaryString = packet.toBinaryString();    
        const byteUArray = binaryStringToUint8Array(binaryString)

        await device.sendReport(0, byteUArray);
        await device.close();
        return true;
    }
    else
    {
        console.warn("Device is not set, can not send Packet: " + packet);
        return false;
    }
}

// Message Sender

function idleStateChanged(toState){
    const state = {
        action: "idleStateChanged",
        data: toState
    };
    chrome.runtime.sendMessage(state);
}
chrome.idle.setDetectionInterval(
    15
  );
chrome.idle.onStateChanged.addListener(idleStateChanged);
