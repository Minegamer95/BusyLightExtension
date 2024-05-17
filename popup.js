function updateColor() {
    // Holen Sie sich die Werte der roten, grünen und blauen Farbkomponenten
    color.r = document.getElementById('input1').value;
    color.g = document.getElementById('input2').value;
    color.b = document.getElementById('input3').value;

    // Setzen Sie die Hintergrundfarbe des Vorschaubereichs entsprechend den eingegebenen Farbwerten
    document.getElementById('colorDiff').style.backgroundColor = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
    
    chrome.runtime.sendMessage({action: "setColor", data: color});
}
function setColor(r, g, b){
    document.getElementById('input1').value = r;
    document.getElementById('input2').value = g;
    document.getElementById('input3').value = b;
    updateColor();
}
function showColorPicker() {
    // Zeige den Farbwähler an
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.addEventListener('change', function() {
        const selectedColor = colorPicker.value;
        const hex = selectedColor.substring(1); // Entferne das '#'-Zeichen
        const r = parseInt(hex.substring(0, 2), 16); // R-Wert
        const g = parseInt(hex.substring(2, 4), 16); // G-Wert
        const b = parseInt(hex.substring(4, 6), 16); // B-Wert

        //document.getElementById('ColorPickerBtn').style.color = selectedColor;
        document.getElementById('input1').value = r;
        document.getElementById('input2').value = g;
        document.getElementById('input3').value = b;
        updateColor();
    });
    colorPicker.click();
}
//#region Regier Variables
let color = {
    r: 0,
    g: 0,
    b: 0,
}
//#endregion

//#region Register Listeners
// Button Click Listernes
document.getElementById('ColorPickerBtn').addEventListener('click', showColorPicker);
document.getElementById('SetRedBtn').addEventListener('click', function(){setColor(255, 0, 0);});
document.getElementById('SetGreenBtn').addEventListener('click', function(){setColor(0, 255, 0);});
document.getElementById('SetYellowBtn').addEventListener('click', function(){setColor(255, 255, 0);});
let connectBtn = document.getElementById('ConnectBackgroundBtn');
connectBtn.addEventListener("click", async () => {
    const currentUrl = window.location.href;
    console.log("Aktuelle URL:", currentUrl);
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
          console.log("Text erfolgreich in die Zwischenablage kopiert:", currentUrl);
        })
        .catch(err => {
          console.error("Fehler beim Kopieren des Textes in die Zwischenablage:", err);
        });

    await navigator.hid.requestDevice({ 
        filters: [{ vendorId: 0x27bb }] 
    });
    chrome.runtime.sendMessage("newDevice");
    updateColor();
  });

// Color Input Listern
document.getElementById('input1').addEventListener('input', updateColor());
document.getElementById('input2').addEventListener('input', updateColor());
document.getElementById('input3').addEventListener('input', updateColor());
//#endregion

// Turn of the Light at Startup;
setColor(0, 0, 0);