// Pack binary string into bytes
function binaryStringToByteArray(binaryString) {
    const byteArray = []; // Array to store the bytes
    for (let i = 0; i < binaryString.length; i += 8) { // Loop through the binary string in chunks of 8 bits (1 byte)
        const byte = binaryString.slice(i, i + 8); // Get the current byte (8 bits)
        byteArray.push(byte); // Push the byte into the byte array
    }
    return byteArray; // Return the array of bytes
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

    //#region Properties Get/Setter
    

    //#endregion

    toByteArray() {
        let byteArray = new Uint8Array(8);
        byteArray[0] = (this._jump << 4) | this.pad0;
        byteArray[1] = (this.target << 5) | (this.repeat >> 3);
        byteArray[2] = (this.repeat << 5) | (this.red >> 3);
        byteArray[3] = (this.red << 5) | (this.green >> 3);
        byteArray[4] = (this.green << 5) | (this.blue >> 3);
        byteArray[5] = (this.blue << 5) | (this.on_time >> 3);
        byteArray[6] = (this.on_time << 5) | (this.off_time >> 3);
        byteArray[7] = (this.off_time << 5) | (this.update << 4) | this.ringtone;
        return byteArray;
    }

    toArray()
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
        
        // Concatenate binary strings
        const binaryString = binaryJump + binaryPad0 + binaryTarged + binaryRepeat + binaryRed + binaryGreen + binaryBlue + binaryOnTime + binaryOffTime + binaryUpdate + binaryRingtone +binaryVolume;

        // Pack binary string into bytes
        const byteArray = [];
        for (let i = 0; i < binaryString.length; i += 8) {
            const byte = binaryString.slice(i, i + 8);
            byteArray.push(parseInt(byte, 2));
        }

        return byteArray;

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
        
        // Concatenate binary strings
        return binaryJump + binaryPad0 + binaryTarged + binaryRepeat + binaryRed + binaryGreen + binaryBlue + binaryOnTime + binaryOffTime + binaryUpdate + binaryRingtone +binaryVolume;


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
        this.steps =  Array.from({ length: 7 }, () => new JumpStep());
        this.sensitivity = 0; // Not Used by UC Alpha and UC Omega
        this.timeout = 0;     // Not Used by UC Alpha and UC Omega
        this.trigger = 0;     // Not Used by UC Alpha and UC Omega  
    }

    // Turns a packet into a byte array with can be send with Web HID
    toBinaryString() {
        let binaryString;
        this.steps.forEach(step => {
            if (step !== null && binaryString == null)
                binaryString = step.toBinaryString();
            else if(step !== null)
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


function TestArray()
{
    const packet = new Packet();
    const step = new JumpStep();
    packet.steps[0] = step;
    step._jump = 1; // Set JUMP_OP
    step.target = 0;
    step.repeat = 0;
    step.red = 50;
    step.green = 0;
    step.blue = 0;
    
    const byteArray = packet.toByteArray();
    console.log(byteArray);

}

async function Connect()
{
    // Request BusyLight device
    const devices = await navigator.hid.requestDevice({ 
        filters: [{ vendorId: 0x27bb }] 
    });
    // Assume only one device is connected
    device = devices[0];
}

async function triggerCode(red = 0, green = 0, blue = 0)
{
    // Parse red, green, and blue as numbers
    red = parseInt(red);
    green = parseInt(green);
    blue = parseInt(blue);


    // Usage example:
    const packet = new Packet();
    const step = new JumpStep();
    packet.steps[0] = step;
    step.jump = 1; // Set JUMP_OP
    step.target = 0;
    step.repeat = 0;
    step.red = red;
    step.green = green;
    step.blue = blue;
    
    const binaryString = packet.toBinaryString();
    
    const byteUArray = binaryStringToUint8Array(binaryString)

    console.log(byteUArray);
    sendPacket(byteUArray);
    console.log("Set Status Color: R="+ red + ", G="+green+", B="+blue);
    console.debug(
        `    // Parse red, green, and blue as numbers
    red = parseInt(red);
    green = parseInt(green);
    blue = parseInt(blue);


    // Usage example:
    const packet = new JumpStepPacket();
    const step = packet.steps[0];
    step.jump = 1; // Set JUMP_OP
    step.target = 0;
    step.repeat = 0;
    step.red = ${red};
    step.green = ${green};
    step.blue = ${blue};
    
    const byteArray = packet.toByteArray();
    console.log(byteArray);
    
    await device.open();
    await device.sendReport(0, byteArray);
    await device.close();`
    )
}

async function triggerSendKeepAlive()
{
    if (keepAliveId !== null)
    {
        clearInterval(keepAliveId);
        console.log("KeepAlive is off");
        keepAliveId = null;
    }
    else
    {
        keepAliveId = setInterval(sendKeepAlive, 5000);
        console.log("KeepAlive is on");
    }
}

var keepAliveId;
async function sendKeepAlive()
{
    const packet = new Packet();
    const step = new KeepAliveSteep();
    packet.steps[0] = step;
    const binaryString = packet.toBinaryString();
    
    const byteUArray = binaryStringToUint8Array(binaryString)
    sendPacket(byteUArray)
    console.log("SendKeepAlive:" + byteUArray);
}

async function sendPacket(packet)
{
    if (!device.opened)
        await device.open();
    await device.sendReport(0, packet);
    await device.close();
}